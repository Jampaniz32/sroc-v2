import express from 'express';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get messages by room
router.get('/:roomId', async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = String(req.user.id);
        const userRole = req.user.role?.toUpperCase();

        // Se for DM, verifica se o utilizador faz parte da sala (exceto se for Admin)
        if (roomId.includes('_') && userRole !== 'ADMIN') {
            const participants = roomId.split('_');
            if (!participants.includes(userId)) {
                return res.status(403).json({ error: 'Acesso negado a esta conversa privada' });
            }
        }

        const [messages] = await db.query(
            'SELECT id, sender_id as senderId, sender_name as senderName, content, room_id as roomId, timestamp, is_read as isRead FROM messages WHERE room_id = ? ORDER BY timestamp ASC',
            [roomId]
        );
        res.json(messages);
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Erro ao buscar mensagens' });
    }
});

// Get all messages (for initial load)
router.get('/', async (req, res) => {
    try {
        const userId = String(req.user.id);
        const userRole = req.user.role?.toUpperCase();

        let query = 'SELECT * FROM (SELECT id, sender_id as senderId, sender_name as senderName, content, room_id as roomId, timestamp, is_read as isRead FROM messages ORDER BY timestamp DESC LIMIT 300) AS sub ORDER BY timestamp ASC';
        let params = [];

        // Filtro de segurança: Utilizadores normais só recebem global ou as suas próprias DMs
        if (userRole !== 'ADMIN') {
            query = `
                SELECT * FROM (
                    SELECT id, sender_id as senderId, sender_name as senderName, content, room_id as roomId, timestamp, is_read as isRead 
                    FROM messages 
                    WHERE room_id = 'global' 
                       OR room_id = 'ai'
                       OR room_id LIKE ? 
                       OR room_id LIKE ?
                    ORDER BY timestamp DESC LIMIT 300
                ) AS sub ORDER BY timestamp ASC`;
            params = [`%${userId}_%`, `%_${userId}%` || `%_${userId}`];
            // Uma forma mais segura de lidar com ID_ID:
            params = [`${userId}_%`, `%_${userId}`];
        }

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Get all messages error:', error);
        res.status(500).json({ error: 'Erro ao buscar mensagens' });
    }
});

// Mark messages as read in a room
router.post('/read/:roomId', async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user.id;

        await db.query(
            'UPDATE messages SET is_read = 1 WHERE room_id = ? AND sender_id != ?',
            [roomId, userId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ error: 'Erro ao marcar mensagens como lidas' });
    }
});

// Editar mensagem
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = String(req.user.id);
        const userRole = req.user.role?.toUpperCase();

        // Verificar se a mensagem existe e se o utilizador tem permissão
        const [rows] = await db.query('SELECT sender_id, room_id FROM messages WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Mensagem não encontrada' });

        const message = rows[0];
        if (String(message.sender_id) !== userId && userRole !== 'ADMIN') {
            return res.status(403).json({ error: 'Sem permissão para editar esta mensagem' });
        }

        await db.query('UPDATE messages SET content = ? WHERE id = ?', [content, id]);

        // Notificar via Socket.io
        const io = req.app.get('io');
        if (message.room_id === 'global') {
            io.emit('messageUpdated', { id, content, roomId: message.room_id });
        } else {
            const participants = message.room_id.split('_');
            participants.forEach(pId => {
                io.to(`user_${pId}`).emit('messageUpdated', { id, content, roomId: message.room_id });
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Edit message error:', error);
        res.status(500).json({ error: 'Erro ao editar mensagem' });
    }
});

// Eliminar mensagem
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = String(req.user.id);
        const userRole = req.user.role?.toUpperCase();

        const [rows] = await db.query('SELECT sender_id, room_id FROM messages WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Mensagem não encontrada' });

        const message = rows[0];
        if (String(message.sender_id) !== userId && userRole !== 'ADMIN') {
            return res.status(403).json({ error: 'Sem permissão para eliminar esta mensagem' });
        }

        await db.query('DELETE FROM messages WHERE id = ?', [id]);

        // Notificar via Socket.io
        const io = req.app.get('io');
        if (message.room_id === 'global') {
            io.emit('messageDeleted', { id, roomId: message.room_id });
        } else {
            const participants = message.room_id.split('_');
            participants.forEach(pId => {
                io.to(`user_${pId}`).emit('messageDeleted', { id, roomId: message.room_id });
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({ error: 'Erro ao eliminar mensagem' });
    }
});

// Eliminar histórico completo de uma sala
router.delete('/room/:roomId', async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = String(req.user.id);
        const userRole = req.user.role?.toUpperCase();

        // Verificação de permissão
        if (roomId === 'global' && userRole !== 'ADMIN') {
            return res.status(403).json({ error: 'Apenas administradores podem limpar a sala geral' });
        }

        if (roomId.includes('_')) {
            const participants = roomId.split('_');
            if (!participants.includes(userId) && userRole !== 'ADMIN') {
                return res.status(403).json({ error: 'Sem permissão para limpar esta conversa privada' });
            }
        }

        await db.query('DELETE FROM messages WHERE room_id = ?', [roomId]);

        // Notificar via Socket.io
        const io = req.app.get('io');
        if (roomId === 'global') {
            io.emit('chatCleared', { roomId });
        } else {
            const participants = roomId.split('_');
            participants.forEach(pId => {
                io.to(`user_${pId}`).emit('chatCleared', { roomId });
            });
        }

        res.json({ success: true, message: 'Histórico eliminado com sucesso' });
    } catch (error) {
        console.error('Clear room error:', error);
        res.status(500).json({ error: 'Erro ao eliminar histórico da sala' });
    }
});

export default router;
