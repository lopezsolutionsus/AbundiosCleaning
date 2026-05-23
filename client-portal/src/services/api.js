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
      localStorage.clear();
      window.location.href = '/login.html';
    }
    return Promise.reject(err);
  }
);

export const getMe = () => api.get('/auth/me');
export const getMyAppointments = () => api.get('/client/appointments');
export const getMyProperties = () => api.get('/client/properties');
export const createProperty = data => api.post('/client/properties', data);
export const deleteProperty = id => api.delete(`/client/properties/${id}`);
export const getServiceTypes = () => api.get('/client/service-types');
export const createQuote = data => api.post('/client/quotes', data);
export const getMyQuotes = () => api.get('/client/quotes');
