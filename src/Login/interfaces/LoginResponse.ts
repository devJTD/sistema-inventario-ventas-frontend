/* Define la interfaz para la respuesta exitosa del login de tu backend. */
export interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    role: 'admin' | 'vendedor' | 'almacenista';
  };
  message?: string;
}
