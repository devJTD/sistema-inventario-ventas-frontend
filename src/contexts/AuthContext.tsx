import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';

/* Importaciones de Interfaces */
import type { User } from '../Usuarios/interfaces/User';
import type { AuthContextType } from './interfaces/AuthContextType';

/* Creación del Contexto de Autenticación */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* Proveedor de Autenticación */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  /* Estados del Componente */
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  /* Función de Logout */
  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    window.location.href = '/login';
  }, []);

  /* Función de Login */
  const login = useCallback((token: string, userData: User) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  }, []);

  /* Efecto para Verificar la Sesión al Cargar la Aplicación */
  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          const response = await axios.get('http://localhost:3001/api/verify-token', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });

          if (response.status === 200) {
            setIsAuthenticated(true);
            setUser(JSON.parse(storedUser));
          } else {
            logout();
          }
        } catch (error) {
          console.error('Error al verificar el token:', error);
          logout();
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    verifySession();
  }, [logout]);

  /* Provisión del Contexto a los Componentes Hijos */
  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

/* Hook Personalizado para Usar el Contexto de Autenticación */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
