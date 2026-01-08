import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../config/database.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get basic users list for everyone (all authenticated users)
router.get('/list', async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, name, role FROM users ORDER BY name ASC'
        );
        res.json(users);
    } catch (error) {
        console.error('Get users list error:', error);
        res.status(500).json({ error: 'Erro ao buscar lista de usuários' });
    }
});

// Get agents list for dropdowns (all authenticated users)
router.get('/agentes', async (req, res) => {
    try {
        const [users] = await db.query(
            "SELECT id, name, role, agency FROM users WHERE role IN ('AGENTE', 'ADMIN', 'SUPERVISOR') ORDER BY name ASC"
        );
        res.json(users);
    } catch (error) {
        console.error('Get agentes list error:', error);
        res.status(500).json({ error: 'Erro ao buscar lista de agentes' });
    }
});

// Get all users (Admin only)
router.get('/', isAdmin, async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, name, username, role, agency, require_password_change as requiresPasswordChange, created_at FROM users'
        );
        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
});

// Create user (Admin only)
router.post('/', isAdmin, async (req, res) => {
    try {
        const { name, username, password, role, agency, requiresPasswordChange } = req.body;

        if (!name || !username || !password) {
            return res.status(400).json({ error: 'Dados obrigatórios faltando' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const id = uuidv4();

        // Default to true (1) if not specified, matching frontend expectation
        const forceChange = requiresPasswordChange !== false ? 1 : 0;

        await db.query(
            'INSERT INTO users (id, name, username, password, role, agency, require_password_change) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, name, username, hashedPassword, role || 'AGENTE', agency, forceChange]
        );

        const [newUser] = await db.query(
            'SELECT id, name, username, role, agency, require_password_change as requiresPasswordChange FROM users WHERE id = ?',
            [id]
        );

        res.status(201).json(newUser[0]);
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Username já existe' });
        }
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Erro ao criar usuário', details: error.message, sqlMessage: error.sqlMessage });
    }
});

// Update user (Admin only)
router.put('/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, username, role, agency, password, requiresPasswordChange } = req.body;

        let query = 'UPDATE users SET name = ?, username = ?, role = ?, agency = ?, require_password_change = ?';
        let params = [name, username, role, agency, requiresPasswordChange ? 1 : 0];

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            query += ', password = ?';
            params.push(hashedPassword);
        }

        query += ' WHERE id = ?';
        params.push(id);

        const [result] = await db.query(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const [updatedUser] = await db.query(
            'SELECT id, name, username, role, agency, require_password_change as requiresPasswordChange FROM users WHERE id = ?',
            [id]
        );

        res.json(updatedUser[0]);
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
});

// Delete user (Admin only)
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json({ message: 'Usuário removido com sucesso' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Erro ao remover usuário' });
    }
});

export default router;
