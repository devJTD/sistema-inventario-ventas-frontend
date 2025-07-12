import type { UserRole } from '../../../Usuarios/types/UserRole';

/* Define las propiedades esperadas por el componente NavbarComponent. */
export interface NavbarComponentProps {
  openNewWindow: (
    componentKey: string,
    title: string,
    allowedRoles?: UserRole[],
    initialProps?: Record<string, any>
  ) => void;
  userRole: UserRole;
}
