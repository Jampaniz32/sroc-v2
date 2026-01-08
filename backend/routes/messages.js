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
        const [messages] = await db.query(
            'SELECT id, sender_id as senderId, sender_name as senderName, content, room_id as roomId, timestamp FROM messages WHERE room_id = ? ORDER BY timestamp ASC',
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
        // Fetch last 100 messages, but return them in ASC order for chronological display
        const [rows] = await db.query(
            'SELECT * FROM (SELECT id, sender_id as senderId, sender_name as senderName, content, room_id as roomId, timestamp FROM messages ORDER BY timestamp DESC LIMIT 200) AS sub ORDER BY timestamp ASC'
        );
        res.json(rows);
    } catch (error) {
        console.error('Get all messages error:', error);
        res.status(500).json({ error: 'Erro ao buscar mensagens' });
    }
});

export default router;
