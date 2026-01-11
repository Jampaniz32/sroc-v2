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

        // Apenas marca como lido se o utilizador for o destinatário (não o remetente)
        // No caso de DM, o remetente é um ID e o outro é outro.
        // Se a mensagem for na sala global, 'is_read' é mais complexo, 
        // mas por agora focamos em DMs.
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

export default router;
