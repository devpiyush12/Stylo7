import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;
    
    // Handle 401 Unauthorized
    if (response?.status === 401) {
      localStorage.removeItem('token');
      // Don't redirect if already on login/register page
      if (!window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    
    // Handle 403 Forbidden
    if (response?.status === 403) {
      console.error('Access denied');
    }
    
    // Handle 500 Server Error
    if (response?.status >= 500) {
      console.error('Server error');
    }
    
    return Promise.reject(error);
  }
);

export default api;
