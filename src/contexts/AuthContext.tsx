// src/contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios'; // Importa axios

// Define la interfaz para el usuario que se guardará en el token
interface User {
  id: string;
  username: string;
  role: string;
}

// Define la interfaz para el valor que expondrá tu contexto
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (token: string, userData: User) => void; // userData ahora tiene el tipo User
  logout: () => void;
  loading: boolean; // Para saber si estamos verificando el token inicial
}

// Crea el contexto con un valor inicial undefined
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Proveedor de Autenticación
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Estado de carga inicial

  // Función de logout que limpia el localStorage y el estado
  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user'); // También remueve los datos del usuario
    setIsAuthenticated(false);
    setUser(null);
    // Opcional: Si usas React Router, podrías redirigir aquí.
    // navigate('/login'); // Necesitarías usar useNavigate hook si AuthProvider está dentro del Router
    window.location.href = '/login'; // Una forma más simple de forzar la redirección al logout
  }, []);

  // Función de login que guarda el token y los datos del usuario
  const login = useCallback((token: string, userData: User) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(userData)); // Guarda los datos del usuario también
    setIsAuthenticated(true);
    setUser(userData);
  }, []);

  // Efecto para verificar la sesión al cargar la aplicación
  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          // Intenta validar el token con el backend
          // Usa la nueva ruta /api/verify-token que creamos en el backend
          const response = await axios.get('http://localhost:3001/api/verify-token', {
            headers: {
              Authorization: `Bearer ${token}` // Envía el token en el header
            }
          });

          // Si el token es válido, response.status será 200
          if (response.status === 200) {
            setIsAuthenticated(true);
            setUser(JSON.parse(storedUser)); // Usa los datos del usuario almacenados
          } else {
            // Si el backend responde con algo que no sea 200 (aunque el interceptor ya lo manejaría)
            logout();
          }
        } catch (error) {
          console.error('Error al verificar el token:', error);
          logout(); // Si hay un error (ej. 401, 403), asume que la sesión no es válida
        } finally {
          setLoading(false); // La verificación ha terminado
        }
      } else {
        setLoading(false); // No hay token en localStorage, no se necesita verificar
      }
    };

    verifySession();
  }, [logout]); // Se ejecuta una vez al montar, y si 'logout' cambia (aunque no debería)

  // Proveer el contexto a los componentes hijos
  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto de autenticación
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};