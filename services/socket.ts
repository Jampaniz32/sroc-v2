import { io, Socket } from 'socket.io-client';

const getSocketUrl = () => {
    const envUrl = import.meta.env.VITE_SOCKET_URL;
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    // Se temos um URL no env e não é localhost (ou se estamos de facto no localhost), usamos esse
    if (envUrl && (!envUrl.includes('localhost') || isLocal)) {
        return envUrl;
    }

    // Fallback dinâmico para produção: se estamos num .vercel.app, o backend deve estar num .railway.app
    // Muitas vezes o nome é similar. Como não sabemos, tentamos manter o localhost como último recurso
    // mas avisamos no log.
    if (!isLocal) {
        console.warn('⚠️ SOCKET_URL não configurado ou aponta para localhost em produção!');
    }

    return envUrl || 'http://localhost:3001';
};

const SOCKET_URL = getSocketUrl();

let socket: Socket | null = null;

export const initializeSocket = (userId: string, userName: string) => {
    if (socket?.connected) {
        return socket;
    }

    console.log(`🔌 Attempting to connect to socket at: ${SOCKET_URL}`);

    socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 20, // Aumentado para produção
        timeout: 20000,
    });

    socket.on('connect', () => {
        console.log('✅ Socket connected successfully:', socket?.id);
        socket?.emit('join', { userId, name: userName, roomId: 'global' });
    });

    socket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected. Reason:', reason);
    });

    socket.on('connect_error', (error) => {
        console.error('⚠️ Socket connection error:', error.message);
        console.log('Current SOCKET_URL:', SOCKET_URL);
    });

    return socket;
};

export const getSocket = () => {
    return socket;
};

export const disconnectSocket = () => {
    if (socket?.connected) {
        socket.disconnect();
        socket = null;
    }
};

export const sendMessage = (senderId: string, senderName: string, content: string, roomId: string = 'global') => {
    if (socket?.connected) {
        socket.emit('sendMessage', {
            senderId,
            senderName,
            content,
            roomId,
        });
    } else {
        console.error('Socket not connected');
    }
};

export const switchRoom = (roomId: string) => {
    if (socket?.connected) {
        socket.emit('switchRoom', roomId);
    }
};

export const startTyping = (roomId: string) => {
    if (socket?.connected) {
        socket.emit('typing', { roomId });
    }
};

export const stopTyping = (roomId: string) => {
    if (socket?.connected) {
        socket.emit('stopTyping', { roomId });
    }
};

export const onNewMessage = (callback: (message: any) => void) => {
    socket?.on('newMessage', callback);
};

export const onActiveUsers = (callback: (users: string[]) => void) => {
    socket?.on('activeUsers', callback);
};

export const onUserTyping = (callback: (data: any) => void) => {
    socket?.on('userTyping', callback);
};

export const onUserStoppedTyping = (callback: (data: any) => void) => {
    socket?.on('userStoppedTyping', callback);
};

export const offNewMessage = (callback: (message: any) => void) => {
    socket?.off('newMessage', callback);
};

export const offActiveUsers = (callback: (users: string[]) => void) => {
    socket?.off('activeUsers', callback);
};

export const offUserTyping = (callback: (data: any) => void) => {
    socket?.off('userTyping', callback);
};

export const offUserStoppedTyping = (callback: (data: any) => void) => {
    socket?.off('userStoppedTyping', callback);
};
