// src/components/NavbarComponent.tsx
import React from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap'; // Se eliminó NavDropdown ya que no se usa en la base
import { Link } from 'react-router-dom'; // Se mantiene Link directo
import type { UserRole } from '../App'; // Importa el tipo UserRole

// Definimos los props que este componente esperará
interface NavbarComponentProps {
  onLogout: () => void; // Una función para manejar el cierre de sesión
  userRole: UserRole; // Nuevo prop para el rol del usuario
}

const NavbarComponent: React.FC<NavbarComponentProps> = ({ onLogout, userRole }) => {
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
            {/* Al hacer clic en este Nav.Link, llamamos a la función onLogout */}
            <Nav.Link onClick={onLogout}>Cerrar Sesión</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavbarComponent;
