import express from 'express';
import ExcelJS from 'exceljs';
import db from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        console.log('📊 Iniciando geração de relatório profissional com ExcelJS...');
        console.log('🔍 Filtros recebidos:', req.query);

        const { searchTerm, startDate, endDate, filterStage, filterType, filterAgent, fields, format, exportMode } = req.query;

        // Mapeamento de campos disponíveis e suas configurações
        const availableFields = {
            nuit: { header: 'NUIT', width: 15, extract: (r) => r.nuit || '' },
            cliente: { header: 'CLIENTE', width: 25, extract: (r) => r.cliente || '', alignLeft: true },
            entidade: { header: 'ENTIDADE', width: 15, extract: (r) => r.entidade || '' },
            agencia: { header: 'AGÊNCIA', width: 12, extract: (r) => r.agencia || '' },
            tipoPedido: { header: 'PEDIDO', width: 20, extract: (r) => r.tipo_pedido === 'OUTRO' ? (r.outro_tipo_pedido || 'Outro') : (r.tipo_pedido || '') },
            estagio: { header: 'ESTÁGIO', width: 15, extract: (r) => r.estagio || '' },
            data: { header: 'DATA', width: 18, extract: (r) => r.data ? new Date(r.data).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Maputo' }) : '' },
            turno: { header: 'TURNO', width: 20, extract: (r) => r.turno || '' },
            contacto: { header: 'CONTACTO', width: 15, extract: (r) => r.contacto || '' },
            agenteNome: { header: 'AGENTE', width: 18, extract: (r) => r.agente_nome || '' },
            whatsapp: { header: 'WA', width: 6, extract: (r) => r.whatsapp ? 'SIM' : 'NÃO' },
            observacoes: { header: 'OBSERVAÇÕES', width: 40, extract: (r) => r.observacoes || '', alignLeft: true }
        };

        // Se campos não forem especificados, usar todos por padrão
        const selectedFieldKeys = fields ? fields.split(',') : Object.keys(availableFields);
        const activeFields = selectedFieldKeys.map(key => availableFields[key]).filter(Boolean);

        if (activeFields.length === 0) {
            return res.status(400).json({ message: 'Nenhum campo selecionado para exportação' });
        }

        // Construir query dinâmica
        let query = 'SELECT * FROM calls WHERE 1=1';
        const params = [];

        if (searchTerm) {
            query += ' AND (cliente LIKE ? OR nuit LIKE ? OR contacto LIKE ? OR observacoes LIKE ?)';
            const likeTerm = `%${searchTerm}%`;
            params.push(likeTerm, likeTerm, likeTerm, likeTerm);
        }

        if (startDate) {
            query += ' AND DATE(data) >= ?';
            params.push(startDate);
        }

        if (endDate) {
            query += ' AND DATE(data) <= ?';
            params.push(endDate);
        }

        if (filterStage) {
            query += ' AND estagio = ?';
            params.push(filterStage);
        }

        if (filterType) {
            query += ' AND tipo_pedido = ?';
            params.push(filterType);
        }

        if (filterAgent) {
            query += ' AND agente_id = ?';
            params.push(filterAgent);
        }

        query += ' ORDER BY data DESC';

        // Obter chamadas filtradas
        const [rows] = await db.query(query, params);

        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: 'Sem dados para exportar com os filtros selecionados' });
        }

        const today = new Date();
        const isCsv = format === 'CSV';

        if (isCsv) {
            // Gerar CSV (CSV não suporta abas, então mantém o comportamento padrão consolidado)
            const csvHeaders = activeFields.map(f => f.header).join(',');
            const csvRows = rows.map(r => {
                return activeFields.map(f => {
                    let val = f.extract(r).toString();
                    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
                        val = `"${val.replace(/"/g, '""')}"`;
                    }
                    return val;
                }).join(',');
            });

            const csvContent = '\ufeff' + [csvHeaders, ...csvRows].join('\n'); // Add BOM for Excel compatibility
            const dates = rows.map(r => new Date(r.data)).sort((a, b) => a - b);
            const firstDate = dates[0].toISOString().slice(0, 10);
            const lastDate = dates[dates.length - 1].toISOString().slice(0, 10);

            const fileDateRange = firstDate === lastDate ? firstDate : `${firstDate}_a_${lastDate}`;
            const fileName = `RELATÓRIO DE CHAMADA - ${fileDateRange}.csv`;

            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            return res.send(Buffer.from(csvContent, 'utf-8'));
        }

        // --- GERAÇÃO EXCEL (XLSX) ---
        // 'consolidated' ou 'segmented'
        const currentExportMode = exportMode || 'consolidated';

        // Agrupar dados por data se for segmentado
        const dataGroups = {};
        if (currentExportMode === 'segmented') {
            rows.forEach(row => {
                const dateKey = new Date(row.data).toLocaleDateString('pt-PT', { timeZone: 'Africa/Maputo' }).replace(/\//g, '/');
                if (!dataGroups[dateKey]) dataGroups[dateKey] = [];
                dataGroups[dateKey].push(row);
            });
        } else {
            // No modo consolidado, temos apenas um grupo
            let sheetName = 'Relatório de Chamada';
            if (rows.length > 0) {
                const dates = rows.map(r => new Date(r.data)).sort((a, b) => a - b);
                const firstDate = dates[0].toLocaleDateString('pt-PT', { timeZone: 'Africa/Maputo' }).replace(/\//g, '-');
                const lastDate = dates[dates.length - 1].toLocaleDateString('pt-PT', { timeZone: 'Africa/Maputo' }).replace(/\//g, '-');
                sheetName = firstDate === lastDate ? `Chamadas ${firstDate}` : `Chamadas ${firstDate} a ${lastDate}`;
            }
            dataGroups[sheetName.substring(0, 31)] = rows;
        }

        // Obter configuração do sistema (logo e nome)
        const [configRows] = await db.query('SELECT * FROM system_config LIMIT 1');
        const logoBase64 = configRows && configRows[0] && configRows[0].report_logo ? configRows[0].report_logo : null;
        const institutionName = configRows && configRows[0] && configRows[0].institution_name ? configRows[0].institution_name : 'SROC Operacional';

        // Criar workbook
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'SROC Operacional';
        workbook.created = new Date();

        // Gerar cada aba (Sheet)
        for (const [groupName, groupRows] of Object.entries(dataGroups)) {
            // Se for segmentado, o groupName é DD/MM/AAAA. O Excel não permite / em nomes de sheets. Vamos substituir por -
            const cleanGroupName = groupName.replace(/\//g, '-');
            const sheetTitle = currentExportMode === 'segmented' ? `Chamadas ${cleanGroupName}` : cleanGroupName;

            const worksheet = workbook.addWorksheet(sheetTitle.substring(0, 31), {
                pageSetup: { paperSize: 9, orientation: 'landscape' },
                views: [{ state: 'frozen', xSplit: 0, ySplit: 4 }]
            });

            // Definir larguras das colunas
            worksheet.columns = activeFields.map(f => ({ width: f.width }));
            const lastColLetter = String.fromCharCode(64 + activeFields.length);

            // LINHA 1: Logotipo
            worksheet.getRow(1).height = 60;
            worksheet.mergeCells(`A1:${lastColLetter}1`);
            if (logoBase64) {
                try {
                    const base64Data = logoBase64.replace(/^data:image\/\w+;base64,/, '');
                    const imageId = workbook.addImage({
                        buffer: Buffer.from(base64Data, 'base64'),
                        extension: 'png',
                    });
                    worksheet.addImage(imageId, {
                        tl: { col: 0, row: 0 },
                        ext: { width: 180, height: 55 },
                        editAs: 'oneCell'
                    });
                } catch (imgError) {
                    console.error('Erro logo na aba:', groupName, imgError);
                }
            }

            // LINHA 2: Título
            worksheet.getRow(2).height = 35;
            worksheet.mergeCells(`A2:${lastColLetter}2`);

            // Usar a data do grupo para o título se for segmentado, caso contrário usa a data de hoje (extração)
            const dateToUse = (currentExportMode === 'segmented' && groupRows.length > 0) ? new Date(groupRows[0].data) : today;

            const dayMaputo = dateToUse.toLocaleString('pt-PT', { timeZone: 'Africa/Maputo', day: '2-digit' });
            const monthMaputo = dateToUse.toLocaleString('pt-PT', { timeZone: 'Africa/Maputo', month: 'long' }).toUpperCase();
            const yearMaputo = dateToUse.toLocaleString('pt-PT', { timeZone: 'Africa/Maputo', year: 'numeric' });
            const displayDate = `${dayMaputo} DE ${monthMaputo} DE ${yearMaputo}`;

            const titleCell = worksheet.getCell('A2');
            titleCell.value = `RELATÓRIO DE CHAMADA - ${displayDate}`;
            titleCell.font = { bold: true, size: 18, name: 'Calibri' };
            titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
            titleCell.border = {
                top: { style: 'medium' }, left: { style: 'medium' }, bottom: { style: 'medium' }, right: { style: 'medium' }
            };

            // LINHA 3: Info Complementar
            worksheet.getRow(3).height = 20;
            const midpoint = Math.ceil(activeFields.length / 2);
            const midLetter = String.fromCharCode(64 + midpoint);
            const nextLetter = String.fromCharCode(64 + midpoint + 1);

            worksheet.mergeCells(`A3:${midLetter}3`);
            const infoCell = worksheet.getCell('A3');
            infoCell.value = `Instituição: ${institutionName} | Modo: ${currentExportMode === 'segmented' ? 'Segmentado (Diário)' : 'Consolidado'}`;
            infoCell.font = { italic: true, size: 11, name: 'Calibri' };
            infoCell.border = { bottom: { style: 'thin' }, left: { style: 'thin' } };

            worksheet.mergeCells(`${nextLetter}3:${lastColLetter}3`);
            const extractedAt = today.toLocaleString('pt-PT', {
                timeZone: 'Africa/Maputo', day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
            const dateCell = worksheet.getCell(nextLetter + '3');
            dateCell.value = `Extraído em: ${extractedAt}`;
            dateCell.font = { italic: true, size: 10, name: 'Calibri', color: { argb: 'FF666666' } };
            dateCell.alignment = { horizontal: 'right', vertical: 'middle' };
            dateCell.border = { bottom: { style: 'thin' }, right: { style: 'thin' } };

            // LINHA 4: Cabeçalhos
            worksheet.getRow(4).height = 25;
            activeFields.forEach((field, index) => {
                const cell = worksheet.getCell(4, index + 1);
                cell.value = field.header;
                cell.font = { bold: true, size: 11, name: 'Calibri' };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            });

            // LINHAS DE DADOS
            groupRows.forEach((r, idx) => {
                const row = worksheet.getRow(idx + 5);
                row.height = 20;
                row.values = activeFields.map(f => f.extract(r));

                row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                    const field = activeFields[colNumber - 1];
                    cell.font = { size: 10, name: 'Calibri' };
                    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                    cell.alignment = {
                        horizontal: field.alignLeft ? 'left' : 'center',
                        vertical: 'middle',
                        wrapText: !!field.alignLeft
                    };
                });
            });
        }

        // Gerar buffer
        const buffer = await workbook.xlsx.writeBuffer();

        // Nome do ficheiro descritivo garantindo fuso horário correto
        const dates = rows.map(r => new Date(r.data)).sort((a, b) => a - b);

        // Formatar para YYYY-MM-DD no fuso de Maputo
        const formatDateForFile = (date) => {
            const d = new Date(date.toLocaleString('en-US', { timeZone: 'Africa/Maputo' }));
            return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        };

        const firstDateFile = formatDateForFile(dates[0]);
        const lastDateFile = formatDateForFile(dates[dates.length - 1]);
        const fileDateRange = firstDateFile === lastDateFile ? firstDateFile : `${firstDateFile}_a_${lastDateFile}`;
        const modeSuffix = currentExportMode === 'segmented' ? '_Segmentado' : '';

        const fileName = `RELATÓRIO DE CHAMADA - ${fileDateRange}${modeSuffix}.xlsx`;

        // Headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

        // Enviar
        res.send(buffer);
        console.log('✅ Relatório profissional gerado e enviado com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao gerar relatório:', error);
        res.status(500).json({ error: 'Erro ao gerar relatório', details: error.message });
    }
});

export default router;
