// src/App.tsx
import { useState } from 'react';
import { Container } from 'react-bootstrap';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';

// Importar todos los componentes de página y de navegación
import NavbarComponent from './components/NavbarComponent';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductTable from './components/ProductTable';
import ClientsPage from './pages/ClientsPage';
import ProvidersPage from './pages/ProvidersPage';
import SalesPage from './pages/SalesPage';
import UsersPage from './pages/UsersPage';

// Definimos los posibles roles en tu sistema
export type UserRole = 'admin' | 'vendedor' | 'almacenista' | null;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<UserRole>(null); // Nuevo estado para el rol del usuario
  const navigate = useNavigate();

  // handleLogin ahora recibirá el rol del usuario
  const handleLogin = (role: UserRole) => {
    setIsAuthenticated(true);
    setUserRole(role); // Guardar el rol del usuario
    navigate('/dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null); // Limpiar el rol al cerrar sesión
    navigate('/');
  };

  return (
    <Container fluid className="p-0">
      {/* El Navbar solo se muestra si el usuario está autenticado, y le pasamos el rol */}
      {isAuthenticated && <NavbarComponent onLogout={handleLogout} userRole={userRole} />}

      <Routes>
        {/* Ruta raíz y login */}
        <Route
          path="/"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={handleLogin} />}
        />
        <Route
          path="/login"
          element={<LoginPage onLogin={handleLogin} />}
        />

        {/* Rutas Protegidas */}
        {isAuthenticated ? (
          <>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/productos" element={<ProductTable />} />
            <Route path="/clientes" element={<ClientsPage />} />
            <Route path="/proveedores" element={<ProvidersPage />} />
            <Route path="/ventas" element={<SalesPage />} />
            {/* La ruta de Usuarios ahora puede ser protegida por rol */}
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
