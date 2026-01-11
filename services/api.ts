import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('sroc_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 errors (unauthorized)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('sroc_token');
            localStorage.removeItem('sroc_session_user');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: async (username: string, password: string) => {
        const response = await api.post('/auth/login', { username, password });
        if (response.data.token) {
            localStorage.setItem('sroc_token', response.data.token);
            localStorage.setItem('sroc_session_user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    changePassword: async (userId: string, currentPassword: string, newPassword: string) => {
        const response = await api.post('/auth/change-password', {
            userId,
            currentPassword,
            newPassword,
        });
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('sroc_token');
        localStorage.removeItem('sroc_session_user');
    },

    verify: async () => {
        const response = await api.get('/auth/verify');
        return response.data;
    },
};

// Calls API
export const callsAPI = {
    getAll: async () => {
        const response = await api.get('/calls');
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get(`/calls/${id}`);
        return response.data;
    },

    create: async (callData: any) => {
        const response = await api.post('/calls', callData);
        return response.data;
    },

    update: async (id: string, callData: any) => {
        const response = await api.put(`/calls/${id}`, callData);
        return response.data;
    },

    delete: async (id: string) => {
        const response = await api.delete(`/calls/${id}`);
        return response.data;
    },
};

// Users API
export const usersAPI = {
    getAll: async () => {
        const response = await api.get('/users');
        return response.data;
    },

    getList: async () => {
        const response = await api.get('/users/list');
        return response.data;
    },

    getAgentes: async () => {
        const response = await api.get('/users/agentes');
        return response.data;
    },

    create: async (userData: any) => {
        const response = await api.post('/users', userData);
        return response.data;
    },

    update: async (id: string, userData: any) => {
        const response = await api.put(`/users/${id}`, userData);
        return response.data;
    },

    delete: async (id: string) => {
        const response = await api.delete(`/users/${id}`);
        return response.data;
    },
};

// Messages API
export const messagesAPI = {
    getAll: async () => {
        const response = await api.get('/messages');
        return response.data;
    },

    getByRoom: async (roomId: string) => {
        const response = await api.get(`/messages/${roomId}`);
        return response.data;
    },

    markAsRead: async (roomId: string) => {
        const response = await api.post(`/messages/read/${roomId}`);
        return response.data;
    },
};

// Config API
export const configAPI = {
    get: async () => {
        const response = await api.get('/config');
        return response.data;
    },
    update: async (configData: any) => {
        const response = await api.post('/config', configData);
        return response.data;
    }
};

// Clients API
export const clientsAPI = {
    searchByNuit: async (nuit: string) => {
        const response = await api.get(`/clients/search/${nuit}`);
        return response.data;
    },

    getAll: async () => {
        const response = await api.get('/clients');
        return response.data;
    },

    create: async (clientData: any) => {
        const response = await api.post('/clients', clientData);
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get(`/clients/${id}`);
        return response.data;
    },
};

// Backup API
export const backupAPI = {
    getStatus: async () => {
        const response = await api.get('/backup/status');
        return response.data;
    },

    exportJSON: async () => {
        const response = await api.get('/backup/export', { responseType: 'blob' });
        return response;
    },

    exportSQL: async () => {
        const response = await api.get('/backup/export/sql', { responseType: 'blob' });
        return response;
    },

    updateSettings: async (settings: any) => {
        const response = await api.put('/backup/settings', settings);
        return response.data;
    },

    getRetention: async () => {
        const response = await api.get('/backup/retention');
        return response.data;
    },

    archive: async (olderThanMonths: number) => {
        const response = await api.post('/backup/archive', { olderThanMonths });
        return response.data;
    },
};

// Observation Templates API
export const observationTemplatesAPI = {
    getAll: async () => {
        const response = await api.get('/observation-templates');
        return response.data;
    },

    getSuggestions: async (tipoSolicitacao: string, estadoPedido: string) => {
        const response = await api.get('/observation-templates/suggestions', {
            params: { tipoSolicitacao, estadoPedido }
        });
        return response.data;
    },

    create: async (templateData: any) => {
        const response = await api.post('/observation-templates', templateData);
        return response.data;
    },

    update: async (id: string, templateData: any) => {
        const response = await api.put(`/observation-templates/${id}`, templateData);
        return response.data;
    },

    delete: async (id: string) => {
        const response = await api.delete(`/observation-templates/${id}`);
        return response.data;
    },

    bulkImport: async (templates: any[]) => {
        const response = await api.post('/observation-templates/bulk-import', { templates });
        return response.data;
    },
};

export default api;
