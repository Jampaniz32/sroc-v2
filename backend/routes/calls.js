import express from 'express';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Helper to convert snake_case from DB to camelCase for frontend
const convertCallToFrontend = (call) => ({
    id: call.id,
    nuit: call.nuit,
    cliente: call.cliente,
    entidade: call.entidade,
    agencia: call.agencia,
    tipoPedido: call.tipo_pedido || call.tipoPedido,
    estagio: call.estagio,
    contacto: call.contacto,
    whatsapp: Boolean(call.whatsapp),
    observacoes: call.observacoes,
    data: call.data,
    turno: call.turno,
    agenteId: call.agente_id || call.agenteId,
    agenteNome: call.agente_nome || call.agenteNome,
    createdAt: call.created_at,
    updatedAt: call.updated_at
});

// All routes require authentication
router.use(authenticateToken);

// Get all calls (supports pagination and filtering)
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 0; // If page is 0, return all (compat with Dashboard)
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const { search, stage, type, agentId, startDate, endDate } = req.query;

        let query = 'SELECT * FROM calls';
        let countQuery = 'SELECT COUNT(*) as total FROM calls';
        const params = [];
        const conditions = [];

        if (search) {
            const searchLower = search.toLowerCase();
            const searchTerm = `%${searchLower}%`;
            conditions.push('(LOWER(cliente) LIKE ? OR LOWER(contacto) LIKE ? OR LOWER(nuit) LIKE ? OR LOWER(observacoes) LIKE ?)');
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (stage) {
            conditions.push('estagio = ?');
            params.push(stage);
        }

        if (type) {
            conditions.push('tipo_pedido = ?');
            params.push(type);
        }

        if (agentId) {
            conditions.push('agente_id = ?');
            params.push(agentId);
        }

        if (startDate) {
            conditions.push('data >= ?');
            params.push(startDate);
        }

        if (endDate) {
            conditions.push('data <= ?');
            params.push(endDate + ' 23:59:59');
        }

        const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';

        if (page > 0) {
            const [countRows] = await db.query(countQuery + whereClause, params);
            const total = countRows[0].total || 0;

            const [calls] = await db.query(
                `${query}${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
                [...params, limit, offset]
            );

            res.json({
                data: calls.map(convertCallToFrontend),
                total,
                page,
                totalPages: Math.ceil(total / limit)
            });
        } else {
            // Original behavior for Dashboard (return all)
            const [calls] = await db.query(
                `${query}${whereClause} ORDER BY created_at DESC`,
                params
            );
            res.json(calls.map(convertCallToFrontend));
        }
    } catch (error) {
        console.error('Get calls error:', error);
        res.status(500).json({ error: 'Erro ao buscar chamadas' });
    }
});


// Get call by ID
router.get('/:id', async (req, res) => {
    try {
        const [calls] = await db.query(
            'SELECT * FROM calls WHERE id = ?',
            [req.params.id]
        );

        if (calls.length === 0) {
            return res.status(404).json({ error: 'Chamada não encontrada' });
        }

        res.json(convertCallToFrontend(calls[0]));
    } catch (error) {
        console.error('Get call error:', error);
        res.status(500).json({ error: 'Erro ao buscar chamada' });
    }
});

// Create new call
router.post('/', async (req, res) => {
    try {
        const {
            nuit,
            cliente,
            entidade,
            agencia,
            tipoPedido,
            estagio,
            contacto,
            whatsapp,
            observacoes,
            turno
        } = req.body;

        const id = uuidv4();
        const agenteId = req.user.id;
        const agenteNome = req.user.name;

        console.log('Criando Chamada - Debug:');
        console.log('User Auth ID:', req.user.id, typeof req.user.id);
        console.log('User Auth Name:', req.user.name);
        console.log('Body:', req.body);

        await db.query(
            `INSERT INTO calls (
        id, nuit, cliente, entidade, agencia, tipo_pedido, 
        estagio, contacto, whatsapp, observacoes, turno, 
        agente_id, agente_nome
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id, nuit, cliente, entidade, agencia, tipoPedido,
                estagio, contacto, whatsapp, observacoes, turno,
                agenteId, agenteNome
            ]
        );


        const [newCall] = await db.query('SELECT * FROM calls WHERE id = ?', [id]);
        res.status(201).json(convertCallToFrontend(newCall[0]));
    } catch (error) {
        console.error('Create call error:', error);
        res.status(500).json({ error: 'Erro ao criar chamada', details: error.message, sqlMessage: error.sqlMessage });
    }
});

// Update call
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nuit,
            cliente,
            entidade,
            agencia,
            tipoPedido,
            estagio,
            contacto,
            whatsapp,
            observacoes
        } = req.body;

        const [result] = await db.query(
            `UPDATE calls SET
        nuit = ?, cliente = ?, entidade = ?, agencia = ?,
        tipo_pedido = ?, estagio = ?, contacto = ?,
        whatsapp = ?, observacoes = ?
      WHERE id = ?`,
            [nuit, cliente, entidade, agencia, tipoPedido, estagio, contacto, whatsapp, observacoes, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Chamada não encontrada' });
        }

        const [updatedCall] = await db.query('SELECT * FROM calls WHERE id = ?', [id]);
        res.json(convertCallToFrontend(updatedCall[0]));
    } catch (error) {
        console.error('Update call error:', error);
        res.status(500).json({ error: 'Erro ao atualizar chamada' });
    }
});

// Delete call
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM calls WHERE id = ?', [req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Chamada não encontrada' });
        }

        res.json({ message: 'Chamada removida com sucesso' });
    } catch (error) {
        console.error('Delete call error:', error);
        res.status(500).json({ error: 'Erro ao remover chamada' });
    }
});

export default router;
