import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Mock data for development
const mockGuestStats = {
  data: {
    stats: {
      total: 25,
      today: {
        total: 8,
        pending: 2,
        approved: 3,
        checkedIn: 2,
        checkedOut: 1
      },
      currentlyInOffice: 5
    }
  }
};

const mockDashboard = {
  data: {
    dashboard: {
      recentGuests: [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          hostName: 'Alice Smith',
          company: 'Tech Corp',
          status: 'checked-in'
        },
        {
          id: 2,
          firstName: 'Jane',
          lastName: 'Wilson',
          hostName: 'Bob Johnson',
          company: 'Design LLC',
          status: 'pending'
        }
      ],
      systemStatus: {
        googleSheets: true,
        twilio: false,
        slack: false,
        jotform: true
      }
    }
  }
};

// Guest API
export const guestAPI = {
  getAll: () => Promise.resolve({ data: { guests: [] } }),
  getById: (id) => Promise.resolve({ data: { guest: null } }),
  create: (guestData) => Promise.resolve({ data: { guest: guestData } }),
  updateStatus: (id, statusData) => Promise.resolve({ data: { success: true } }),
  checkIn: (id) => Promise.resolve({ data: { success: true } }),
  checkOut: (id) => Promise.resolve({ data: { success: true } }),
  notifyHost: (id, data) => Promise.resolve({ data: { success: true } }),
  sendSms: (id, data) => Promise.resolve({ data: { success: true } }),
  getStats: () => Promise.resolve(mockGuestStats),
};

// Admin API
export const adminAPI = {
  getDashboard: () => Promise.resolve(mockDashboard),
  exportGuests: (params) => Promise.resolve({ data: { success: true } }),
  getConfig: () => Promise.resolve({ data: { config: {} } }),
  updateConfig: (config) => Promise.resolve({ data: { success: true } }),
  getIntegrationStatus: () => Promise.resolve({ data: { status: 'ok' } }),
  testIntegration: (integration) => Promise.resolve({ data: { success: true } }),
  getLogs: (params) => Promise.resolve({ data: { logs: [] } }),
  cleanupData: (data) => Promise.resolve({ data: { success: true } }),
};

// Webhook API
export const webhookAPI = {
  test: (data) => Promise.resolve({ data: { success: true } }),
};

export default api;