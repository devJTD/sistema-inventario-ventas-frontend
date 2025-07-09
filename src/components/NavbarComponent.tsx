// src/components/NavbarComponent.tsx
import React from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // ¡Importa el hook useAuth!

// Ya no necesitamos definir los props aquí, el componente obtendrá todo del contexto.
// interface NavbarComponentProps {
//   onLogout: () => void;
//   userRole: UserRole;
// }

const NavbarComponent: React.FC = () => { // Ya no recibe props
  // Obtén el usuario y la función logout del contexto de autenticación
  const { user, logout } = useAuth();

  // El userRole ahora viene directamente de user.role
  const userRole = user?.role; // Usa el encadenamiento opcional para user

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/dashboard">Sistema de Inventario</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/dashboard">Dashboard</Nav.Link>
            <Nav.Link as={Link} to="/productos">Productos</Nav.Link>
            <Nav.Link as={Link} to="/clientes">Clientes</Nav.Link>
            <Nav.Link as={Link} to="/ventas">Ventas</Nav.Link>
            <Nav.Link as={Link} to="/proveedores">Proveedores</Nav.Link>

            {/* Solo muestra el enlace a Usuarios si el rol es 'admin' */}
            {userRole === 'admin' && (
              <Nav.Link as={Link} to="/usuarios">Usuarios</Nav.Link>
            )}
          </Nav>
          <Nav>
            {/* Opcional: Muestra el nombre del usuario logueado */}
            {user && (
                <Navbar.Text className="me-2">
                    Hola, {user.username} ({user.role})
                </Navbar.Text>
            )}
            {/* Al hacer clic en este Nav.Link, llamamos a la función logout del contexto */}
            <Nav.Link onClick={logout}>Cerrar Sesión</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavbarComponent;