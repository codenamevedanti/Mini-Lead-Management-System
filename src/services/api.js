import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: { 'Content-Type': 'application/json' },
});

// Attach stored token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global error handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Lead endpoints ──────────────────────────────────────────
export const leadsApi = {
  list:   (params) => api.get('/api/leads', { params }),
  get:    (id)     => api.get(`/api/leads/${id}`),
  create: (data)   => api.post('/api/leads', data),
  update: (id, d)  => api.put(`/api/leads/${id}`, d),
  delete: (id)     => api.delete(`/api/leads/${id}`),
};

// ── User endpoints ──────────────────────────────────────────
export const usersApi = {
  me:     ()  => api.get('/api/auth/me'),
  agents: ()  => api.get('/api/users/agents'),
  list:   ()  => api.get('/api/users'),
};

// ── Log endpoints ───────────────────────────────────────────
export const logsApi = {
  list: (params) => api.get('/api/logs', { params }),
};

export default api;