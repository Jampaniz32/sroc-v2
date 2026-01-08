import express from 'express';
import db from '../config/database.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get backup status and settings
router.get('/status', async (req, res) => {
    try {
        // Get table counts
        const [callsCount] = await db.query('SELECT COUNT(*) as count FROM calls');
        const [usersCount] = await db.query('SELECT COUNT(*) as count FROM users');
        const [messagesCount] = await db.query('SELECT COUNT(*) as count FROM messages');
        const [clientsCount] = await db.query('SELECT COUNT(*) as count FROM clients');

        // Get oldest and newest records
        const [oldestCall] = await db.query('SELECT MIN(created_at) as oldest FROM calls');
        const [newestCall] = await db.query('SELECT MAX(created_at) as newest FROM calls');

        // Get backup settings from system_config
        const [config] = await db.query('SELECT * FROM system_config WHERE id = 1');

        res.json({
            status: 'OK',
            database: {
                calls: callsCount[0].count,
                users: usersCount[0].count,
                messages: messagesCount[0].count,
                clients: clientsCount[0].count
            },
            dataRange: {
                oldest: oldestCall[0]?.oldest || null,
                newest: newestCall[0]?.newest || null
            },
            backupSettings: config[0]?.backup_settings ? JSON.parse(config[0].backup_settings) : {
                autoBackupEnabled: false,
                frequency: 'weekly',
                retentionMonths: 12,
                autoDeleteExpired: false,
                lastBackupDate: null
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Backup status error:', error);
        res.status(500).json({ error: 'Erro ao obter status de backup' });
    }
});

// Export all data as JSON (Admin only)
router.get('/export', isAdmin, async (req, res) => {
    try {
        const [calls] = await db.query('SELECT * FROM calls ORDER BY data DESC');
        const [users] = await db.query('SELECT id, name, username, role, agency, created_at FROM users');
        const [messages] = await db.query('SELECT * FROM messages ORDER BY timestamp DESC LIMIT 1000');
        const [clients] = await db.query('SELECT * FROM clients ORDER BY nome ASC');
        const [config] = await db.query('SELECT * FROM system_config');

        const backup = {
            exportDate: new Date().toISOString(),
            version: '2.0',
            data: {
                calls,
                users,
                messages,
                clients,
                config
            },
            meta: {
                callsCount: calls.length,
                usersCount: users.length,
                messagesCount: messages.length,
                clientsCount: clients.length
            }
        };

        // Update last backup date
        await db.query(
            `UPDATE system_config SET backup_settings = JSON_SET(
                COALESCE(backup_settings, '{}'),
                '$.lastBackupDate', ?
            ) WHERE id = 1`,
            [new Date().toISOString()]
        );

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=sroc_backup_${new Date().toISOString().split('T')[0]}.json`);
        res.json(backup);
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Erro ao exportar dados' });
    }
});

// Export data as SQL (Admin only)
router.get('/export/sql', isAdmin, async (req, res) => {
    try {
        const [calls] = await db.query('SELECT * FROM calls ORDER BY data DESC');
        const [users] = await db.query('SELECT * FROM users');
        const [messages] = await db.query('SELECT * FROM messages ORDER BY timestamp DESC LIMIT 1000');
        const [clients] = await db.query('SELECT * FROM clients ORDER BY nome ASC');

        let sql = `-- SROC Backup - ${new Date().toISOString()}\n`;
        sql += `-- Version 2.0\n\n`;

        // Clients insert
        sql += `-- CLIENTS\n`;
        for (const client of clients) {
            sql += `INSERT INTO clients (id, nuit, nome, entidade, agencia, contacto, whatsapp, created_at) VALUES (`;
            sql += `'${client.id}', '${client.nuit}', '${(client.nome || '').replace(/'/g, "''")}', `;
            sql += `'${(client.entidade || '').replace(/'/g, "''")}', '${(client.agencia || '').replace(/'/g, "''")}', `;
            sql += `'${client.contacto || ''}', ${client.whatsapp ? 1 : 0}, '${client.created_at ? new Date(client.created_at).toISOString() : new Date().toISOString()}');\n`;
        }

        sql += `\n-- CALLS\n`;
        for (const call of calls) {
            sql += `INSERT INTO calls (id, nuit, cliente, entidade, agencia, tipo_pedido, estagio, contacto, whatsapp, observacoes, data, turno, agente_id, agente_nome, created_at) VALUES (`;
            sql += `'${call.id}', '${call.nuit || ''}', '${(call.cliente || '').replace(/'/g, "''")}', `;
            sql += `'${(call.entidade || '').replace(/'/g, "''")}', '${(call.agencia || '').replace(/'/g, "''")}', `;
            sql += `'${(call.tipo_pedido || '').replace(/'/g, "''")}', '${call.estagio || ''}', `;
            sql += `'${call.contacto || ''}', ${call.whatsapp ? 1 : 0}, '${(call.observacoes || '').replace(/'/g, "''")}', `;
            sql += `'${call.data ? new Date(call.data).toISOString() : new Date().toISOString()}', '${(call.turno || '').replace(/'/g, "''")}', `;
            sql += `'${call.agente_id}', '${(call.agente_nome || '').replace(/'/g, "''")}', `;
            sql += `'${call.created_at ? new Date(call.created_at).toISOString() : new Date().toISOString()}');\n`;
        }

        res.setHeader('Content-Type', 'application/sql');
        res.setHeader('Content-Disposition', `attachment; filename=sroc_backup_${new Date().toISOString().split('T')[0]}.sql`);
        res.send(sql);
    } catch (error) {
        console.error('SQL Export error:', error);
        res.status(500).json({ error: 'Erro ao exportar SQL' });
    }
});

// Update backup settings (Admin only)
router.put('/settings', isAdmin, async (req, res) => {
    try {
        const { autoBackupEnabled, frequency, retentionMonths, autoDeleteExpired } = req.body;

        const settings = JSON.stringify({
            autoBackupEnabled: autoBackupEnabled || false,
            frequency: frequency || 'weekly',
            retentionMonths: retentionMonths || 12,
            autoDeleteExpired: autoDeleteExpired || false,
            lastBackupDate: null
        });

        await db.query(
            'UPDATE system_config SET backup_settings = ? WHERE id = 1',
            [settings]
        );

        res.json({ message: 'Configurações de backup atualizadas', settings: JSON.parse(settings) });
    } catch (error) {
        console.error('Update backup settings error:', error);
        res.status(500).json({ error: 'Erro ao atualizar configurações' });
    }
});

// Get data retention statistics (Admin only)
router.get('/retention', isAdmin, async (req, res) => {
    try {
        const now = new Date();

        // Get calls by age
        const [last30Days] = await db.query(
            'SELECT COUNT(*) as count FROM calls WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
        );
        const [last90Days] = await db.query(
            'SELECT COUNT(*) as count FROM calls WHERE created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY) AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)'
        );
        const [last1Year] = await db.query(
            'SELECT COUNT(*) as count FROM calls WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR) AND created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)'
        );
        const [older] = await db.query(
            'SELECT COUNT(*) as count FROM calls WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR)'
        );

        res.json({
            retention: {
                last30Days: last30Days[0].count,
                last90Days: last90Days[0].count,
                last1Year: last1Year[0].count,
                olderThan1Year: older[0].count
            },
            recommendations: {
                archiveOlderThan: '12 months',
                deleteOlderThan: '24 months'
            }
        });
    } catch (error) {
        console.error('Retention stats error:', error);
        res.status(500).json({ error: 'Erro ao obter estatísticas de retenção' });
    }
});

// Archive old data (Admin only) - Moves data to archive tables
router.post('/archive', isAdmin, async (req, res) => {
    try {
        const { olderThanMonths = 12 } = req.body;

        // Count records to archive
        const [toArchive] = await db.query(
            `SELECT COUNT(*) as count FROM calls WHERE created_at < DATE_SUB(NOW(), INTERVAL ? MONTH)`,
            [olderThanMonths]
        );

        // For now, just return the count. Full archive would require creating archive tables.
        res.json({
            message: 'Análise de arquivamento concluída',
            recordsToArchive: toArchive[0].count,
            olderThanMonths,
            note: 'O arquivamento real requer confirmação adicional'
        });
    } catch (error) {
        console.error('Archive error:', error);
        res.status(500).json({ error: 'Erro ao arquivar dados' });
    }
});

export default router;
