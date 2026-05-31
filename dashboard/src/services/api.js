import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login.html';
    }
    return Promise.reject(err);
  }
);

export const login = (username, password) =>
  api.post('/auth/login', { username, password });

export const getClients = () => api.get('/clients');
export const createClient = data => api.post('/clients', data);
export const updateClient = (id, data) => api.put(`/clients/${id}`, data);
export const deleteClient = id => api.delete(`/clients/${id}`);

export const getUsers      = () => api.get('/auth/users');
export const deleteUser    = id => api.delete(`/auth/users/${id}`);
export const getMe         = () => api.get('/auth/me');
export const updateMe      = data => api.put('/auth/me', data);
export const changePassword = data => api.put('/auth/me/password', data);

export const getAppointments = (date) =>
  api.get('/appointments', { params: date ? { date } : {} });
export const createAppointment = data => api.post('/appointments', data);
export const updateAppointment = (id, data) => api.put(`/appointments/${id}`, data);
export const deleteAppointment = id => api.delete(`/appointments/${id}`);
