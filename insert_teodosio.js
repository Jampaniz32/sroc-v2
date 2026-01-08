import db from './backend/config/database.js';
import crypto from 'crypto';

async function insertData() {
    try {
        const record = {
            id: crypto.randomUUID(),
            nuit: 'S/ NUIT',
            cliente: 'Teodosio',
            entidade: 'CEDSIF', // Default assumed
            agencia: 'AgencyB Xai-xai',
            tipo_pedido: 'Pedidos de Cotação',
            estagio: 'Aberto',
            contacto: '844564630',
            whatsapp: null,
            observacoes: '',
            data: '2026-01-08 09:25:00',
            turno: '1º Turno (08:00-17:00)',
            agente_id: '492287e7-e185-4bdc-aa8e-a427d102b59f',
            agente_nome: 'Simoes Banze'
        };

        await db.query(`
            INSERT INTO calls 
            (id, nuit, cliente, entidade, agencia, tipo_pedido, estagio, contacto, whatsapp, observacoes, data, turno, agente_id, agente_nome)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            record.id, record.nuit, record.cliente, record.entidade, record.agencia, record.tipo_pedido, record.estagio, record.contacto, record.whatsapp, record.observacoes, record.data, record.turno, record.agente_id, record.agente_nome
        ]);

        console.log(`✅ Inserido: ${record.cliente}`);

    } catch (error) {
        console.error('❌ Erro ao inserir dados:', error);
    } finally {
        process.exit(0);
    }
}

insertData();
