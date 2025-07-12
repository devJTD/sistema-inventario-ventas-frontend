import type { User } from '../../Usuarios/interfaces/User';

/* Define la interfaz para el valor que expondrá el contexto de autenticación. */
export interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
  loading: boolean;
}
