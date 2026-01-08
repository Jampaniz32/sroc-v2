import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export const initializeSocket = (userId: string, userName: string) => {
    if (socket?.connected) {
        return socket;
    }

    socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
        console.log('✅ Socket connected:', socket?.id);
        socket?.emit('join', { userId, name: userName, roomId: 'global' });
    });

    socket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
    });

    socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
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
