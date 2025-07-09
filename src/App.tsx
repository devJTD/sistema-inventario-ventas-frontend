// src/App.tsx
import React from 'react'; // Asegúrate de importar React
import { Container } from 'react-bootstrap';
import { Routes, Route, Navigate } from 'react-router-dom'; // Quitamos useNavigate de aquí, ya no lo necesitamos directamente en App
import NavbarComponent from './components/NavbarComponent';

// --- Importaciones de Páginas ---
import LoginPage from './Login/LoginPage';
import DashboardPage from './Dashboard/DashboardPage';
import ProductTable from './Productos/ProductTable'; // Asumo que es ProductTable y no ProductsPage
import ClientsPage from './Clientes/ClientsPage';
import ProvidersPage from './Proveedores/ProvidersPage';
import SalesPage from './Ventas/SalesPage';
import UsersPage from './Usuarios/UsersPage'; // Asumo que es UsersPage y no UsersManagementPage
import "animate.css";

// --- NUEVA IMPORTACIÓN DEL CONTEXTO DE AUTENTICACIÓN ---
import { useAuth } from './contexts/AuthContext';

// Define el tipo para el rol de usuario si no lo tienes ya en AuthContext
// Si ya lo tienes en AuthContext, puedes eliminar esta línea o importarlo de allí.
export type UserRole = 'admin' | 'vendedor' | 'almacenista' | null;

// --- Componente PrivateRoute para proteger rutas ---
// Este componente se asegura de que el usuario esté autenticado antes de mostrar la ruta.
const PrivateRoute: React.FC<{ children: React.ReactNode; allowedRoles?: UserRole[] }> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth(); // Obtenemos el estado de autenticación y el usuario del contexto

  if (loading) {
    // Muestra un indicador de carga mientras se verifica la sesión inicial
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '24px' }}>
        Cargando sesión...
      </div>
    );
  }

  // Si no está autenticado, redirige al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado, pero se requieren roles específicos
  if (allowedRoles && user && !allowedRoles.includes(user.role as UserRole)) {
    // Si el usuario no tiene un rol permitido, redirige al dashboard o a una página de "Acceso Denegado"
    return <Navigate to="/dashboard" replace />; // O a una página de error de permisos
  }

  // Si todo está bien, renderiza los componentes hijos
  return <>{children}</>;
};

function App() {
  // Obtenemos los estados y funciones del contexto de autenticación
  const { isAuthenticated } = useAuth();

  // No necesitamos handleLogin ni handleLogout aquí, el contexto los maneja.
  // Tampoco necesitamos los useState para isAuthenticated y userRole.

  return (
    <Container fluid className="p-0">
       {/* ANTES: {isAuthenticated && <NavbarComponent onLogout={logout} userRole={user?.role as UserRole} />} */}
      {/* AHORA: Ya no necesita props, las toma directamente del contexto */}
      {isAuthenticated && <NavbarComponent />}

      <Routes>
        {/* La ruta de Login ya no necesita onLogin, ya que el LoginPage usará el contexto directamente */}
        <Route
          path="/login"
          element={<LoginPage />}
        />

        {/* Ruta raíz: redirige al dashboard si está autenticado, de lo contrario al login */}
        <Route
          path="/"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
        />

        {/* Rutas Protegidas usando PrivateRoute */}
        <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/productos" element={<PrivateRoute><ProductTable /></PrivateRoute>} />
        <Route path="/clientes" element={<PrivateRoute><ClientsPage /></PrivateRoute>} />
        <Route path="/proveedores" element={<PrivateRoute><ProvidersPage /></PrivateRoute>} />
        <Route path="/ventas" element={<PrivateRoute><SalesPage /></PrivateRoute>} />
        
        {/* Ruta de Usuarios: Protegida y solo accesible para 'admin' */}
        <Route
          path="/usuarios"
          element={<PrivateRoute allowedRoles={['admin']}><UsersPage /></PrivateRoute>}
        />

        {/* Ruta de fallback para cualquier otra URL no definida */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Container>
  );
}

export default App;