import { useState } from 'react';
import { Container } from 'react-bootstrap';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import NavbarComponent from './components/NavbarComponent';
import LoginPage from './Login/LoginPage';
import DashboardPage from './Dashboard/DashboardPage';
import ProductTable from './Productos/ProductTable';
import ClientsPage from './Clientes/ClientsPage';
import ProvidersPage from './Proveedores/ProvidersPage';
import SalesPage from './Ventas/SalesPage';
import UsersPage from './Usuarios/UsersPage';
import "animate.css";

export type UserRole = 'admin' | 'vendedor' | 'almacenista' | null;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const navigate = useNavigate();

  const handleLogin = (role: UserRole) => {
    setIsAuthenticated(true);
    setUserRole(role);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    navigate('/');
  };

  return (
    <Container fluid className="p-0">
      {isAuthenticated && <NavbarComponent onLogout={handleLogout} userRole={userRole} />}

      <Routes>
        <Route
          path="/"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={handleLogin} />}
        />
        <Route
          path="/login"
          element={<LoginPage onLogin={handleLogin} />}
        />

        {isAuthenticated ? (
          <>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/productos" element={<ProductTable />} />
            <Route path="/clientes" element={<ClientsPage />} />
            <Route path="/proveedores" element={<ProvidersPage />} />
            <Route path="/ventas" element={<SalesPage />} />
            <Route
              path="/usuarios"
              element={userRole === 'admin' ? <UsersPage /> : <Navigate to="/dashboard" replace />}
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </Container>
  );
}

export default App;
