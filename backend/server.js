import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './config/database.js';

// Routes
import authRoutes from './routes/auth.js';
import callsRoutes from './routes/calls.js';
import usersRoutes from './routes/users.js';
import messagesRoutes from './routes/messages.js';
import exportRoutes from './routes/export.js';
import configRoutes from './routes/config.js';
import clientsRoutes from './routes/clients.js';
import backupRoutes from './routes/backup.js';
import observationTemplatesRoutes from './routes/observationTemplates.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// CORS configuration
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map(origin => origin.trim())
    .filter(origin => origin.length > 0);

console.log('🔒 Allowed Origins:', allowedOrigins);

const io = new Server(httpServer, {
    cors: {
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            const isAllowed = allowedOrigins.some(ao =>
                ao === '*' ||
                ao === origin ||
                (origin.endsWith('.vercel.app') && !ao.includes('localhost')) ||
                origin.endsWith('.railway.app')
            );
            if (isAllowed) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ['GET', 'POST'],
        credentials: true
    },
    allowEIO3: true
});

app.set('io', io);

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        // Permitir requests sem origin (como apps mobile ou curl)
        if (!origin) return callback(null, true);

        const isAllowed = allowedOrigins.some(ao =>
            ao === '*' ||
            ao === origin ||
            (origin.endsWith('.vercel.app') && !ao.includes('localhost')) ||
            origin.endsWith('.railway.app')
        );

        if (isAllowed) {
            callback(null, true);
        } else {
            console.warn(`⚠️ CORS blocked for origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    exposedHeaders: ['Content-Disposition']
}));
app.use(express.json({ limit: '50mb' })); // Aumentar limite para imagens base64
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/calls', callsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/config', configRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/observation-templates', observationTemplatesRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket.io - Real-time Chat
const activeUsers = new Map(); // userId -> socketId

io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    // User joins with authentication
    socket.on('join', async (userData) => {
        try {
            const { userId, name, roomId } = userData;

            socket.userId = userId;
            socket.userName = name;

            // Cada usuário entra em sua própria sala (para DMs e notificações)
            socket.join(`user_${userId}`);

            // E na sala global por padrão
            socket.currentRoom = roomId || 'global';
            socket.join(socket.currentRoom);

            activeUsers.set(userId, socket.id);

            // Enviar lista de usuários ativos
            io.emit('activeUsers', Array.from(activeUsers.keys()));

            // Notificação de mensagens offline (não lidas)
            // Busca DMs onde o utilizador é participante e tem mensagens is_read = 0 de outros
            const [unread] = await db.query(
                `SELECT sender_name, COUNT(*) as count 
                 FROM messages 
                 WHERE is_read = 0 
                   AND sender_id != ? 
                   AND (room_id LIKE ? OR room_id LIKE ?)
                 GROUP BY sender_name`,
                [userId, `${userId}_%`, `%_${userId}`]
            );

            if (unread.length > 0) {
                socket.emit('offlineMessages', unread);
            }

            console.log(`👤 ${name} (${userId}) entrou. Rooms: ${Array.from(socket.rooms).join(', ')}`);
        } catch (error) {
            console.error('Join error:', error);
        }
    });

    // Send message
    socket.on('sendMessage', async (messageData) => {
        try {
            const { senderId, senderName, content, roomId } = messageData;

            const messageId = uuidv4();
            const timestamp = new Date();

            // Save to database
            await db.query(
                'INSERT INTO messages (id, sender_id, sender_name, content, room_id, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
                [messageId, senderId, senderName, content, roomId, timestamp]
            );

            // Fetch the message back from DB to ensure format consistency
            const [rows] = await db.query(
                'SELECT id, sender_id as senderId, sender_name as senderName, content, room_id as roomId, timestamp FROM messages WHERE id = ?',
                [messageId]
            );

            if (rows.length === 0) throw new Error('Failed to retrieve message after save');

            const message = rows[0];
            message.timestamp = new Date(message.timestamp).toISOString();

            // Emit logic
            if (roomId === 'global') {
                io.emit('newMessage', message);
            } else if (roomId.includes('_')) {
                // DM: Envia para os dois envolvidos
                const participants = roomId.split('_');

                // Segurança: verifica se quem envia faz parte da sala
                if (!participants.includes(String(senderId))) {
                    console.warn(`🛑 Tentativa de intrusão: ${senderName} tentou enviar para sala privada ${roomId}`);
                    return socket.emit('error', { message: 'Não tens permissão para enviar mensagens nesta sala.' });
                }

                console.log(`📩 DM ${roomId}: Enviar para ${participants.join(' e ')}`);

                participants.forEach(pId => {
                    const isOnline = activeUsers.has(pId);
                    if (!isOnline) {
                        console.log(`⚠️ Destinatário ${pId} está offline, mas a mensagem foi gravada.`);
                    }
                    io.to(`user_${pId}`).emit('newMessage', message);
                });
            }

            console.log(`💬 ${senderName} em ${roomId}: ${content.substring(0, 50)}...`);
        } catch (error) {
            console.error('Send message error:', error);
            socket.emit('error', { message: 'Erro ao enviar mensagem' });
        }
    });

    // Switch room
    socket.on('switchRoom', (newRoomId) => {
        if (socket.currentRoom && socket.currentRoom !== 'global') {
            socket.leave(socket.currentRoom);
        }
        socket.currentRoom = newRoomId;
        socket.join(newRoomId);
        console.log(`🔄 ${socket.userName} mudou para a sala: ${newRoomId}`);
    });

    // Typing indicator
    socket.on('typing', (data) => {
        const { roomId } = data;
        if (roomId === 'global') {
            socket.broadcast.emit('userTyping', { userId: socket.userId, userName: socket.userName, roomId });
        } else {
            const participants = roomId.split('_');
            const targetId = participants.find(id => id !== socket.userId);
            if (targetId) {
                io.to(`user_${targetId}`).emit('userTyping', { userId: socket.userId, userName: socket.userName, roomId });
            }
        }
    });

    socket.on('stopTyping', (data) => {
        const { roomId } = data;
        if (roomId === 'global') {
            socket.broadcast.emit('userStoppedTyping', { userId: socket.userId, roomId });
        } else {
            const participants = roomId.split('_');
            const targetId = participants.find(id => id !== socket.userId);
            if (targetId) {
                io.to(`user_${targetId}`).emit('userStoppedTyping', { userId: socket.userId, roomId });
            }
        }
    });

    // Disconnect
    socket.on('disconnect', () => {
        if (socket.userId) {
            activeUsers.delete(socket.userId);
            io.emit('activeUsers', Array.from(activeUsers.keys()));
            console.log(`❌ ${socket.userName} desconectou`);
        }
    });
});

// Serve static files from the React frontend app
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Em produção, servir os arquivos estáticos do build do frontend
if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(__dirname, '../dist');
    app.use(express.static(distPath));

    console.log(`📂 Serving static files from: ${distPath}`);

    // Qualquer requisição que não seja API, retorna o index.html (SPA)
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(distPath, 'index.html'));
        }
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
});

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 SROC Backend Server`);
    console.log(`📡 HTTP API: http://localhost:${PORT}`);
    console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
    if (process.env.NODE_ENV === 'production') {
        console.log(`📦 Serving Frontend from ../dist`);
    }
});

export { io };
