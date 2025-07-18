import React from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';

/* Importación de Tipos */
import type { UserRole } from '../../types/UserRole';
import type { NavbarComponentProps } from './interfaces/NavbarComponentProps';

const NavbarComponent: React.FC<NavbarComponentProps> = ({ openNewWindow, userRole }) => {
  /* Obtención de Contexto de Autenticación */
  const { user, logout } = useAuth();

  /* Función de Verificación de Permisos */
  const hasPermission = (requiredRoles?: UserRole[]) => {
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    return userRole && requiredRoles.includes(userRole);
  };

  /* Renderizado del Componente Navbar */
  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="fixed-top" style={{ height: '56px', zIndex: 10000 }}>
      <Container fluid>
        <Navbar.Brand href="#home">Sistema de Inventario</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link onClick={() => openNewWindow('Dashboard', 'Dashboard')}>
              Dashboard
            </Nav.Link>

            {hasPermission(['admin', 'almacenista', 'vendedor']) && (
              <Nav.Link onClick={() => openNewWindow('Productos', 'Gestión de Productos')}>
                Productos
              </Nav.Link>
            )}

            {hasPermission(['admin', 'vendedor']) && (
              <Nav.Link onClick={() => openNewWindow('Clientes', 'Gestión de Clientes')}>
                Clientes
              </Nav.Link>
            )}

            {hasPermission(['admin', 'almacenista']) && (
              <Nav.Link onClick={() => openNewWindow('Proveedores', 'Gestión de Proveedores')}>
                Proveedores
              </Nav.Link>
            )}

            {hasPermission(['admin', 'vendedor']) && (
              <Nav.Link onClick={() => openNewWindow('Ventas', 'Registro de Ventas')}>
                Ventas
              </Nav.Link>
            )}

            {hasPermission(['admin']) && (
              <Nav.Link onClick={() => openNewWindow('Usuarios', 'Gestión de Usuarios', ['admin'])}>
                Usuarios
              </Nav.Link>
            )}
          </Nav>
          <Nav>
            {user && (
                <Navbar.Text className="me-2 text-white">
                    Hola, {user.username} ({user.role})
                </Navbar.Text>
            )}
            <Button variant="outline-light" onClick={logout}>
              Cerrar Sesión
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavbarComponent;
