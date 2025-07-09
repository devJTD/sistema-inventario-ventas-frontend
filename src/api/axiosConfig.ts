// src/api/axiosConfig.ts
import axios from 'axios';

// URL base de tu backend
const API_BASE_URL = 'http://localhost:3001/api';

// Crea una instancia de Axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de REQUEST: Añade el token JWT a cada petición
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken'); // Obtiene el token del localStorage
    if (token) {
      // FIX: Asegúrate de que config.headers exista antes de intentar asignarle una propiedad
      if (!config.headers) {
        config.headers = {}; // Si no existe, inicialízalo como un objeto vacío
      }
      config.headers.Authorization = `Bearer ${token}`; // Añade el token al header de autorización
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de RESPONSE: Maneja errores de autenticación globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si la respuesta es 401 (No autorizado) o 403 (Prohibido)
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Evita un bucle de redirección si ya estamos intentando acceder al login
      // O si el error viene del propio endpoint de login
      const isLoginOrVerify = error.config.url?.endsWith('/login') || error.config.url?.endsWith('/verify-token');

      if (!isLoginOrVerify) {
        // Llama a la función de logout para limpiar la sesión
        // Esto redirigirá al usuario a la página de login
        console.warn('Sesión expirada o inválida. Redirigiendo al login.');
        // Para que funcione, necesitamos acceder al AuthContext.
        // Una forma simple es forzar la redirección si sabes que estás en una ruta protegida.
        // En una app real, esto lo manejarías dentro del AuthContext o en tu componente App.
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/login'; // Redirección fuerte
      }
    }
    return Promise.reject(error);
  }
);

export default api; // Exporta la instancia configurada de axios
