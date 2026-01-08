import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';

const router = express.Router();

// Get all templates (for admin management)
router.get('/', async (req, res) => {
    try {
        const [templates] = await db.query(`
            SELECT * FROM observation_templates 
            ORDER BY tipo_solicitacao, estado_pedido, prioridade ASC
        `);
        res.json(templates);
    } catch (error) {
        console.error('Error fetching observation templates:', error);
        res.status(500).json({ error: 'Erro ao buscar templates de observações' });
    }
});

// Get suggestions based on tipo_solicitacao and estado_pedido
router.get('/suggestions', async (req, res) => {
    try {
        const { tipoSolicitacao, estadoPedido } = req.query;

        if (!tipoSolicitacao || !estadoPedido) {
            return res.json({ suggestions: [] });
        }

        // Priority 1: Get active templates for this combination
        const [templates] = await db.query(`
            SELECT id, titulo, observacao, prioridade, 'template' as source
            FROM observation_templates 
            WHERE tipo_solicitacao = ? 
            AND estado_pedido = ? 
            AND ativo = true
            ORDER BY prioridade ASC
            LIMIT 5
        `, [tipoSolicitacao, estadoPedido]);

        // Priority 2: Get most frequent/recent observations from calls for the same context
        const [historicalObs] = await db.query(`
            SELECT 
                observacoes as observacao,
                COUNT(*) as frequency,
                MAX(data) as last_used,
                'historical' as source
            FROM calls 
            WHERE tipo_pedido = ? 
            AND estagio = ? 
            AND observacoes IS NOT NULL 
            AND observacoes != ''
            AND LENGTH(observacoes) > 10
            GROUP BY observacoes
            ORDER BY frequency DESC, last_used DESC
            LIMIT 5
        `, [tipoSolicitacao, estadoPedido]);

        // Combine results: templates first (priority), then historical
        const suggestions = [
            ...templates.map(t => ({
                id: t.id,
                titulo: t.titulo,
                observacao: t.observacao,
                prioridade: t.prioridade,
                source: 'template'
            })),
            ...historicalObs.map((h, index) => ({
                id: `hist-${index}`,
                titulo: null,
                observacao: h.observacao,
                prioridade: 100 + index, // Lower priority than templates
                source: 'historical',
                frequency: h.frequency
            }))
        ];

        // Remove duplicates (same observation text)
        const uniqueSuggestions = suggestions.reduce((acc, curr) => {
            const exists = acc.find(s => s.observacao.toLowerCase().trim() === curr.observacao.toLowerCase().trim());
            if (!exists) {
                acc.push(curr);
            }
            return acc;
        }, []);

        // Return top suggestions (limit to 5)
        res.json({ suggestions: uniqueSuggestions.slice(0, 5) });
    } catch (error) {
        console.error('Error fetching observation suggestions:', error);
        res.status(500).json({ error: 'Erro ao buscar sugestões de observações' });
    }
});

// Create a new template
router.post('/', async (req, res) => {
    try {
        const { tipoSolicitacao, estadoPedido, titulo, observacao, prioridade, ativo } = req.body;

        const id = uuidv4();

        await db.query(`
            INSERT INTO observation_templates 
            (id, tipo_solicitacao, estado_pedido, titulo, observacao, prioridade, ativo)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [id, tipoSolicitacao, estadoPedido, titulo, observacao, prioridade || 1, ativo !== false]);

        const [newTemplate] = await db.query('SELECT * FROM observation_templates WHERE id = ?', [id]);
        res.status(201).json(newTemplate[0]);
    } catch (error) {
        console.error('Error creating observation template:', error);
        res.status(500).json({ error: 'Erro ao criar template de observação' });
    }
});

// Update a template
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { tipoSolicitacao, estadoPedido, titulo, observacao, prioridade, ativo } = req.body;

        await db.query(`
            UPDATE observation_templates 
            SET tipo_solicitacao = ?, 
                estado_pedido = ?, 
                titulo = ?, 
                observacao = ?, 
                prioridade = ?, 
                ativo = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [tipoSolicitacao, estadoPedido, titulo, observacao, prioridade, ativo, id]);

        const [updatedTemplate] = await db.query('SELECT * FROM observation_templates WHERE id = ?', [id]);

        if (updatedTemplate.length === 0) {
            return res.status(404).json({ error: 'Template não encontrado' });
        }

        res.json(updatedTemplate[0]);
    } catch (error) {
        console.error('Error updating observation template:', error);
        res.status(500).json({ error: 'Erro ao atualizar template de observação' });
    }
});

// Delete a template
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query('DELETE FROM observation_templates WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Template não encontrado' });
        }

        res.json({ success: true, message: 'Template removido com sucesso' });
    } catch (error) {
        console.error('Error deleting observation template:', error);
        res.status(500).json({ error: 'Erro ao remover template de observação' });
    }
});

// Bulk import templates
router.post('/bulk-import', async (req, res) => {
    try {
        const { templates } = req.body;

        if (!templates || !Array.isArray(templates)) {
            return res.status(400).json({ error: 'Templates inválidos' });
        }

        const results = [];

        for (const template of templates) {
            const id = uuidv4();
            await db.query(`
                INSERT INTO observation_templates 
                (id, tipo_solicitacao, estado_pedido, titulo, observacao, prioridade, ativo)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                id,
                template.tipoSolicitacao,
                template.estadoPedido,
                template.titulo,
                template.observacao,
                template.prioridade || 1,
                template.ativo !== false
            ]);
            results.push({ id, ...template });
        }

        res.status(201).json({ success: true, imported: results.length, templates: results });
    } catch (error) {
        console.error('Error bulk importing templates:', error);
        res.status(500).json({ error: 'Erro ao importar templates' });
    }
});

export default router;
