import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// Obter configuração atual
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM system_config LIMIT 1');
        if (rows && rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.json({ report_logo: null });
        }
    } catch (error) {
        console.error('Erro ao obter config:', error);
        res.status(500).json({ error: 'Erro ao obter configuração' });
    }
});

// Atualizar logo
router.post('/logo', async (req, res) => {
    try {
        const { logoBase64 } = req.body;

        if (!logoBase64) {
            return res.status(400).json({ error: 'Logo não fornecido' });
        }

        // Verificar se já existe config
        const [existingRows] = await db.query('SELECT * FROM system_config LIMIT 1');

        if (existingRows && existingRows.length > 0) {
            // Atualizar
            await db.query('UPDATE system_config SET report_logo = ? WHERE id = ?', [logoBase64, existingRows[0].id]);
        } else {
            // Criar
            await db.query('INSERT INTO system_config (report_logo) VALUES (?)', [logoBase64]);
        }

        res.json({ success: true, message: 'Logo atualizado com sucesso' });
    } catch (error) {
        console.error('Erro ao salvar logo:', error);
        res.status(500).json({ error: 'Erro ao salvar logo' });
    }
});

export default router;
