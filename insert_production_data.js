import db from './backend/config/database.js';
import crypto from 'crypto';

function uuidv4() {
    return crypto.randomUUID();
}

async function insertData() {
    try {
        const records = [
            {
                id: uuidv4(),
                nuit: 'S/ NUIT',
                cliente: 'Eurico Machute',
                entidade: 'CEDSIF',
                agencia: 'Quelimane',
                tipo_pedido: 'Outro',
                estagio: 'Resolvido',
                contacto: '866207731',
                whatsapp: null,
                observacoes: '',
                data: '2026-01-08 08:30:00',
                turno: '1º Turno (08:00-17:00)',
                agente_id: '492287e7-e185-4bdc-aa8e-a427d102b59f',
                agente_nome: 'Simoes Banze'
            },
            {
                id: uuidv4(),
                nuit: '119461529',
                cliente: 'Nando Eliseu Bernaldo',
                entidade: 'CEDSIF',
                agencia: 'Beira',
                tipo_pedido: 'Descontos Apos Maturidade do Credito',
                estagio: 'Aberto',
                contacto: '851511274',
                whatsapp: null,
                observacoes: 'O CLIENTE CLAMA PELO REEMBOLSO PELO DESCONTO SOFRIDO NO MÊS DE DEZEMBRO 2025.',
                data: '2026-01-08 08:45:00',
                turno: '1º Turno (08:00-17:00)',
                agente_id: '6f9ccd74-2585-406d-a8e0-a14255b4a27d',
                agente_nome: 'Ibraimo J. Chirrinze'
            },
            {
                id: uuidv4(),
                nuit: 'S/ NUIT',
                cliente: 'Candida Chibelengua',
                entidade: 'CEDSIF',
                agencia: 'AgencyB Maxixe',
                tipo_pedido: 'Outro',
                estagio: 'Em Tratamento',
                contacto: '847067278',
                whatsapp: null,
                observacoes: '',
                data: '2026-01-08 09:00:00',
                turno: '1º Turno (08:00-17:00)',
                agente_id: '492287e7-e185-4bdc-aa8e-a427d102b59f',
                agente_nome: 'Simoes Banze'
            }
        ];

        for (const r of records) {
            await db.query(`
                INSERT INTO calls 
                (id, nuit, cliente, entidade, agencia, tipo_pedido, estagio, contacto, whatsapp, observacoes, data, turno, agente_id, agente_nome)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                r.id, r.nuit, r.cliente, r.entidade, r.agencia, r.tipo_pedido, r.estagio, r.contacto, r.whatsapp, r.observacoes, r.data, r.turno, r.agente_id, r.agente_nome
            ]);
            console.log(`✅ Inserido: ${r.cliente}`);
        }

        console.log('\n🚀 Todos os dados de produção foram inseridos com sucesso!');

    } catch (error) {
        console.error('❌ Erro ao inserir dados:', error);
    } finally {
        process.exit(0);
    }
}

insertData();
