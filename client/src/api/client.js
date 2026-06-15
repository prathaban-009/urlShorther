import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  sendOtp: (data) => api.post('/auth/send-otp', data),
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// URLs
export const urlsAPI = {
  create: (data) => api.post('/urls', data),
  list: (params) => api.get('/urls', { params }),
  get: (id) => api.get(`/urls/${id}`),
  update: (id, data) => api.patch(`/urls/${id}`, data),
  delete: (id) => api.delete(`/urls/${id}`),
  analytics: (id) => api.get(`/urls/${id}/analytics`),
  qrUrl: (id) => `${API_URL}/urls/${id}/qr`,
  bulk: (formData) => api.post('/urls/bulk', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export default api;
