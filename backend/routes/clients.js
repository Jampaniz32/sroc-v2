import express from 'express';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Search client by NUIT
router.get('/search/:nuit', async (req, res) => {
    try {
        const { nuit } = req.params;
        
        if (!nuit || nuit.length < 3) {
            return res.status(400).json({ error: 'NUIT deve ter pelo menos 3 caracteres' });
        }

        const [clients] = await db.query(
            'SELECT * FROM clients WHERE nuit = ? LIMIT 1',
            [nuit]
        );

        if (clients.length === 0) {
            return res.json({ found: false, client: null });
        }

        const client = clients[0];
        res.json({
            found: true,
            client: {
                id: client.id,
                nuit: client.nuit,
                nome: client.nome,
                entidade: client.entidade,
                agencia: client.agencia,
                contacto: client.contacto,
                whatsapp: Boolean(client.whatsapp)
            }
        });
    } catch (error) {
        console.error('Search client error:', error);
        res.status(500).json({ error: 'Erro ao buscar cliente' });
    }
});

// Get all clients
router.get('/', async (req, res) => {
    try {
        const [clients] = await db.query(
            'SELECT * FROM clients ORDER BY nome ASC'
        );
        res.json(clients.map(c => ({
            id: c.id,
            nuit: c.nuit,
            nome: c.nome,
            entidade: c.entidade,
            agencia: c.agencia,
            contacto: c.contacto,
            whatsapp: Boolean(c.whatsapp),
            createdAt: c.created_at,
            updatedAt: c.updated_at
        })));
    } catch (error) {
        console.error('Get clients error:', error);
        res.status(500).json({ error: 'Erro ao buscar clientes' });
    }
});

// Create or update client (upsert by NUIT)
router.post('/', async (req, res) => {
    try {
        const { nuit, nome, entidade, agencia, contacto, whatsapp } = req.body;

        if (!nuit || !nome) {
            return res.status(400).json({ error: 'NUIT e nome são obrigatórios' });
        }

        // Check if client exists
        const [existing] = await db.query('SELECT id FROM clients WHERE nuit = ?', [nuit]);

        if (existing.length > 0) {
            // Update existing client
            await db.query(
                `UPDATE clients SET 
                    nome = ?, entidade = ?, agencia = ?, contacto = ?, whatsapp = ?
                WHERE nuit = ?`,
                [nome, entidade, agencia, contacto, whatsapp, nuit]
            );
            
            const [updated] = await db.query('SELECT * FROM clients WHERE nuit = ?', [nuit]);
            res.json({ 
                action: 'updated', 
                client: {
                    id: updated[0].id,
                    nuit: updated[0].nuit,
                    nome: updated[0].nome,
                    entidade: updated[0].entidade,
                    agencia: updated[0].agencia,
                    contacto: updated[0].contacto,
                    whatsapp: Boolean(updated[0].whatsapp)
                }
            });
        } else {
            // Create new client
            const id = uuidv4();
            await db.query(
                `INSERT INTO clients (id, nuit, nome, entidade, agencia, contacto, whatsapp)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [id, nuit, nome, entidade, agencia, contacto, whatsapp]
            );
            
            res.status(201).json({ 
                action: 'created', 
                client: { id, nuit, nome, entidade, agencia, contacto, whatsapp: Boolean(whatsapp) }
            });
        }
    } catch (error) {
        console.error('Create/update client error:', error);
        res.status(500).json({ error: 'Erro ao salvar cliente' });
    }
});

// Get client by ID
router.get('/:id', async (req, res) => {
    try {
        const [clients] = await db.query(
            'SELECT * FROM clients WHERE id = ?',
            [req.params.id]
        );

        if (clients.length === 0) {
            return res.status(404).json({ error: 'Cliente não encontrado' });
        }

        const c = clients[0];
        res.json({
            id: c.id,
            nuit: c.nuit,
            nome: c.nome,
            entidade: c.entidade,
            agencia: c.agencia,
            contacto: c.contacto,
            whatsapp: Boolean(c.whatsapp)
        });
    } catch (error) {
        console.error('Get client error:', error);
        res.status(500).json({ error: 'Erro ao buscar cliente' });
    }
});

export default router;
