import axios from 'axios';

// API base URL from environment
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// WebSocket base URL (remove /api suffix)
export const WS_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log errors only in development and only if not 401/403 (auth errors are expected)
    if (process.env.NODE_ENV === 'development') {
      const status = error.response?.status;
      if (status && ![401, 403].includes(status)) {
        console.error(`API Error [${status}]:`, error.response?.data || error.message);
      }
    }
    return Promise.reject(error);
  }
);

export default api; 