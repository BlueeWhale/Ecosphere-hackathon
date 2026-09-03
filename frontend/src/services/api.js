import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Enables HTTP-only cookie support
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token from localStorage if fallback is used
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('dealpilot_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth Service Endpoints
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.patch('/auth/profile', profileData),
  changePassword: (passwordData) => api.patch('/auth/change-password', passwordData),
  forgotPassword: (emailData) => api.post('/auth/forgot-password', emailData),
};

// Deal & Memory Service Endpoints
export const dealAPI = {
  getDeals: () => api.get('/deals'),
  getDeal: (id) => api.get(`/deals/${id}`),
  createDeal: (data) => api.post('/deals', data),
  updateDeal: (id, data) => api.put(`/deals/${id}`, data),
  deleteDeal: (id) => api.delete(`/deals/${id}`),
  getDealState: (id) => api.get(`/deals/${id}/state`),
  updateDealState: (id, data) => api.patch(`/deals/${id}/state`, data),
  generateQuote: (id, data) => api.post(`/deals/${id}/pricing/quote`, data),
  analyzeMessage: (id, data) => api.post(`/deals/${id}/ai/analyze`, data),
  respondToCustomer: (id, data) => api.post(`/deals/${id}/ai/respond`, data),
};

// Voice Agent Service Endpoints
export const voiceAPI = {
  createSession: (dealId) => api.post('/voice/session', { dealId }),
  processTranscript: (data) => api.post('/voice/process', data),
  synthesizeSpeech: (text) => api.post('/voice/tts', { text }, { responseType: 'blob' }),
  endSession: (data) => api.post('/voice/end', data),
  getSession: (sessionId) => api.get(`/voice/session/${sessionId}`),
};

// Product Catalog Service Endpoints
export const productAPI = {
  getProducts: () => api.get('/products'),
  getProduct: (id) => api.get(`/products/${id}`),
};

// Calendar & Action Layer Endpoints
export const calendarAPI = {
  getAvailability: (params) => api.get('/calendar/availability', { params }),
  bookMeeting: (data) => api.post('/calendar/book', data),
  escalateDeal: (data) => api.post('/calendar/escalate', data),
  takeoverDeal: (data) => api.post('/calendar/takeover', data),
};

export default api;