import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Guest API
export const guestAPI = {
  getAll: () => api.get('/guests'),
  getById: (id) => api.get(`/guests/${id}`),
  create: (guestData) => api.post('/guests', guestData),
  updateStatus: (id, statusData) => api.put(`/guests/${id}/status`, statusData),
  checkIn: (id) => api.post(`/guests/${id}/checkin`),
  checkOut: (id) => api.post(`/guests/${id}/checkout`),
  notifyHost: (id, data) => api.post(`/guests/${id}/notify-host`, data),
  sendSms: (id, data) => api.post(`/guests/${id}/send-sms`, data),
  getStats: () => api.get('/guests/stats/summary'),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  exportGuests: (params) => api.get('/admin/export/guests', { params }),
  getConfig: () => api.get('/admin/config'),
  updateConfig: (config) => api.put('/admin/config', config),
  getIntegrationStatus: () => api.get('/admin/integrations/status'),
  testIntegration: (integration) => api.post(`/admin/integrations/test/${integration}`),
  getLogs: (params) => api.get('/admin/logs', { params }),
  cleanupData: (data) => api.delete('/admin/data/cleanup', { data }),
};

// Webhook API
export const webhookAPI = {
  test: (data) => api.post('/webhooks/test', data),
};

export default api;