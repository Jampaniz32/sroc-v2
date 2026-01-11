import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// Obter configuração atual
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM system_config LIMIT 1');
        if (rows && rows.length > 0) {
            const config = rows[0];
            // Se houver full_config, usamos ela, mas garantimos que campos individuais 
            // no banco tenham prioridade ou estejam sincronizados
            let finalConfig = {};
            if (config.full_config) {
                try {
                    finalConfig = JSON.parse(config.full_config);
                } catch (e) {
                    finalConfig = {};
                }
            }

            // Sincronizar campos específicos
            finalConfig.institutionName = config.institution_name || finalConfig.institutionName;
            finalConfig.logo = config.system_logo || finalConfig.logo;
            finalConfig.exportSettings = finalConfig.exportSettings || {};
            finalConfig.exportSettings.reportLogo = config.report_logo || finalConfig.exportSettings?.reportLogo;

            res.json(finalConfig);
        } else {
            res.json({ institutionName: 'SROC Operacional' });
        }
    } catch (error) {
        console.error('Erro ao obter config:', error);
        res.status(500).json({ error: 'Erro ao obter configuração' });
    }
});

// Atualizar configuração completa
router.post('/', async (req, res) => {
    try {
        const fullConfig = req.body;
        const { institutionName, logo, exportSettings } = fullConfig;
        const reportLogo = exportSettings?.reportLogo || null;

        const [existingRows] = await db.query('SELECT * FROM system_config LIMIT 1');
        const configJson = JSON.stringify(fullConfig);

        if (existingRows && existingRows.length > 0) {
            await db.query(
                'UPDATE system_config SET full_config = ?, institution_name = ?, system_logo = ?, report_logo = ? WHERE id = ?',
                [configJson, institutionName, logo, reportLogo, existingRows[0].id]
            );
        } else {
            await db.query(
                'INSERT INTO system_config (full_config, institution_name, system_logo, report_logo) VALUES (?, ?, ?, ?)',
                [configJson, institutionName, logo, reportLogo]
            );
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao salvar config:', error);
        res.status(500).json({ error: 'Erro ao salvar configuração' });
    }
});

// Rota legada para o logo (mantida por compatibilidade se necessário)
router.post('/logo', async (req, res) => {
    try {
        const { logoBase64 } = req.body;
        const [existingRows] = await db.query('SELECT * FROM system_config LIMIT 1');
        if (existingRows && existingRows.length > 0) {
            await db.query('UPDATE system_config SET report_logo = ? WHERE id = ?', [logoBase64, existingRows[0].id]);
        } else {
            await db.query('INSERT INTO system_config (report_logo) VALUES (?)', [logoBase64]);
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao salvar logo' });
    }
});

export default router;
