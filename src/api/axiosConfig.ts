import axios from 'axios';

/* URL base del backend. */
const API_BASE_URL = 'http://localhost:3001/api';

/* Creación de la instancia de Axios. */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/* Interceptor de REQUEST: Añade el token JWT a cada petición. */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      if (!config.headers) {
        config.headers = {};
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/* Interceptor de RESPONSE: Maneja errores de autenticación globalmente. */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      const isLoginOrVerify = error.config.url?.endsWith('/login') || error.config.url?.endsWith('/verify-token');

      if (!isLoginOrVerify) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/* Exporta la instancia configurada de axios. */
export default api;
