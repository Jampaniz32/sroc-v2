import { io, Socket } from 'socket.io-client';

const getSocketUrl = () => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    let envUrl = import.meta.env.VITE_SOCKET_URL;
    let apiUrl = import.meta.env.VITE_API_URL;

    // Se estivermos em produção mas o envUrl aponta para localhost, ignoramos
    if (!isLocal && envUrl && envUrl.includes('localhost')) {
        console.warn('⚠️ VITE_SOCKET_URL aponta para localhost em produção. Tentando detetar URL correto...');
        envUrl = '';
    }

    if (envUrl) return envUrl;

    // Fallback inteligente: basear no URL da API ou no hostname atual
    if (apiUrl && !apiUrl.includes('localhost')) {
        return apiUrl.replace('/api', '');
    }

    if (!isLocal) {
        // Se estamos num domínio .vercel.app, tentamos encontrar o backend no railway
        // Geralmente o utilizador tem ambos com nomes similares ou configurados.
        // Como último recurso, usamos o próprio host (URL relativo pode funcionar se houver proxy)
        return window.location.origin;
    }

    return 'http://localhost:3001';
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

    socket.on('error', (error) => {
        console.error('⚠️ Socket error:', error);
    });

    socket.on('reconnect_attempt', (attempt) => {
        console.log(`🔄 Socket reconnect attempt #${attempt}`);
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
        return true;
    } else {
        console.error('Socket not connected');
        return false;
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

export const onOfflineMessages = (callback: (data: any[]) => void) => {
    socket?.on('offlineMessages', callback);
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

export const offOfflineMessages = (callback: (data: any[]) => void) => {
    socket?.off('offlineMessages', callback);
};

export const onMessageUpdated = (callback: (data: any) => void) => {
    socket?.on('messageUpdated', callback);
};

export const offMessageUpdated = (callback: (data: any) => void) => {
    socket?.off('messageUpdated', callback);
};

export const onMessageDeleted = (callback: (data: any) => void) => {
    socket?.on('messageDeleted', callback);
};

export const offMessageDeleted = (callback: (data: any) => void) => {
    socket?.off('messageDeleted', callback);
};
