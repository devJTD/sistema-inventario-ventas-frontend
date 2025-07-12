/* Define la interfaz para la estructura de un usuario en el sistema. */
export interface User {
  id: string;
  username: string;
  password?: string;
  role: string;
}
