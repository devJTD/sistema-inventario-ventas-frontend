import React, { useState, useCallback, useEffect } from 'react';
import { Container, Alert, Spinner } from 'react-bootstrap';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

// Importaciones de componentes con rutas actualizadas
import WindowComponent from './components/WindowComponent/WindowComponent';
import Taskbar from './components/Taskbar/Taskbar';
import NavbarComponent from './components/NavbarComponent/NavbarComponent';

// Importaciones de páginas con rutas actualizadas
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductTable from './pages/ProductTable';
import ClientsPage from './pages/ClientsPage';
import ProvidersPage from './pages/ProvidersPage';
import SalesPage from './pages/SalesPage';
import UsersPage from './pages/UsersPage';

// Importaciones de contextos y tipos
import { useAuth } from './contexts/AuthContext';
import type { UserRole } from './types/UserRole'; 
import type { WindowInfo } from './components/WindowComponent/interfaces/WindowInfo'; 
import type { TaskbarWindow } from './components/Taskbar/interfaces/TaskbarWindow'; 

// Importa animate.css para animaciones
import "animate.css";

const WindowComponentMap: { [key: string]: React.ComponentType<any> } = {
  Dashboard: DashboardPage,
  Productos: ProductTable,
  Clientes: ClientsPage,
  Proveedores: ProvidersPage,
  Ventas: SalesPage,
  Usuarios: UsersPage,
};

function App() {
  const { isAuthenticated, user, loading } = useAuth();

  const [openWindows, setOpenWindows] = useState<WindowInfo[]>([]);
  const [nextZIndex, setNextZIndex] = useState<number>(1000);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string | null>(null);

  const location = useLocation();
  const navigate = useNavigate();

  // Altura del Navbar superior y la Taskbar inferior
  const NAVBAR_HEIGHT = 56;
  const TASKBAR_HEIGHT = 44;

  // Dimensiones del área de "escritorio" disponible para las ventanas
  const DESKTOP_HEIGHT = window.innerHeight - NAVBAR_HEIGHT - TASKBAR_HEIGHT;
  const DESKTOP_WIDTH = window.innerWidth;

  // Dimensiones por defecto para una nueva ventana
  const DEFAULT_WINDOW_WIDTH = 1200;
  const DEFAULT_WINDOW_HEIGHT = 600;

  const openNewWindow = useCallback((
    componentKey: string,
    title: string,
    allowedRoles?: UserRole[],
    initialProps?: Record<string, any>
  ) => {
    // Asegurarse de que user.role sea tratado como UserRole para la comparación
    if (allowedRoles && user && !allowedRoles.includes(user.role as UserRole)) {
      setAccessDeniedMessage(`No tienes permiso para acceder a "${title}".`);
      setTimeout(() => setAccessDeniedMessage(null), 3000);
      return;
    }

    const ComponentToOpen = WindowComponentMap[componentKey];
    if (!ComponentToOpen) {
      console.error(`Componente con clave "${componentKey}" no encontrado en WindowComponentMap.`);
      return;
    }

    const existingWindow = openWindows.find(win => win.componentKey === componentKey);
    if (existingWindow) {
      setOpenWindows(prevWindows => {
        const updatedWindows = prevWindows.map(win =>
          win.id === existingWindow.id
            ? { ...win, minimized: false, zIndex: nextZIndex }
            : { ...win, zIndex: win.zIndex < nextZIndex ? win.zIndex : nextZIndex - 1 }
        );
        setNextZIndex(prev => prev + 1);
        return updatedWindows.sort((a, b) => a.zIndex - b.zIndex);
      });
      return;
    }

    // Cálculo de la posición inicial para centrar la ventana en el área del escritorio
    const initialX = ((DESKTOP_WIDTH / 2) - (DEFAULT_WINDOW_WIDTH / 2)) - 60;
    const initialY = ((DESKTOP_HEIGHT / 2) - (DEFAULT_WINDOW_HEIGHT / 2)) -30;

    // Pequeño offset aleatorio para evitar que las ventanas se apilen perfectamente
    const offsetX = (Math.random() - 0.5) * 60; // Rango +/- 30px

    setNextZIndex(prev => prev + 1);
    const newWindow: WindowInfo = {
      id: `${componentKey}-${uuidv4()}`,
      title,
      componentKey,
      // La posición final debe estar dentro de los límites del desktop-area
      x: Math.max(0, Math.min(initialX + offsetX, DESKTOP_WIDTH - DEFAULT_WINDOW_WIDTH)),
      y: Math.max(0, Math.min(initialY, DESKTOP_HEIGHT - DEFAULT_WINDOW_HEIGHT)),
      width: DEFAULT_WINDOW_WIDTH,
      height: DEFAULT_WINDOW_HEIGHT,
      minimized: false,
      zIndex: nextZIndex,
      props: initialProps,
    };

    setOpenWindows(prevWindows => [...prevWindows, newWindow].sort((a, b) => a.zIndex - b.zIndex));
  }, [openWindows, nextZIndex, DESKTOP_HEIGHT, DESKTOP_WIDTH, user]);

  const closeWindow = useCallback((id: string) => {
    setOpenWindows(prevWindows => prevWindows.filter(win => win.id !== id));
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setOpenWindows(prevWindows => prevWindows.map(win =>
      win.id === id ? { ...win, minimized: !win.minimized, zIndex: nextZIndex } : win
    ).sort((a, b) => a.zIndex - b.zIndex));
    setNextZIndex(prev => prev + 1);
  }, [nextZIndex]);

  const focusWindow = useCallback((id: string) => {
    setOpenWindows(prevWindows => {
      const focusedWindow = prevWindows.find(win => win.id === id);
      if (!focusedWindow) {
        return prevWindows;
      }

      const currentMaxZIndex = prevWindows.reduce((max, win) => Math.max(max, win.zIndex), 0);
      const isCurrentlyFocusedAndOpen = focusedWindow.zIndex === currentMaxZIndex && !focusedWindow.minimized;

      if (isCurrentlyFocusedAndOpen) {
        return prevWindows.map(win =>
          win.id === id ? { ...win, minimized: true, zIndex: nextZIndex } : win
        ).sort((a, b) => a.zIndex - b.zIndex);
      } else {
        setNextZIndex(prev => prev + 1);
        return prevWindows.map(win =>
          win.id === id
            ? { ...win, zIndex: nextZIndex, minimized: false }
            : win
        ).sort((a, b) => a.zIndex - b.zIndex);
      }
    });
  }, [nextZIndex]);

  const updateWindowPosition = useCallback((id: string, newX: number, newY: number) => {
    setOpenWindows(prevWindows => prevWindows.map(win =>
      win.id === id ? { ...win, x: newX, y: newY } : win
    ));
  }, []);

  const updateWindowSize = useCallback((id: string, newWidth: number, newHeight: number) => {
    setOpenWindows(prevWindows => prevWindows.map(win =>
      win.id === id ? { ...win, width: newWidth, height: newHeight } : win
    ));
  }, []);

  // useEffect para manejar la redirección post-recarga
  useEffect(() => {
    if (!loading && isAuthenticated && location.pathname === '/login') {
      navigate('/', { replace: true });
    }
  }, [loading, isAuthenticated, location.pathname, navigate]);

  if (loading) {
    return (
      <Container fluid className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
      </Container>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Container fluid className="p-0 d-flex flex-column vh-100">
      <NavbarComponent openNewWindow={openNewWindow} userRole={user?.role as UserRole} />

      <div
        id="desktop-area"
        style={{
          position: 'relative',
          flexGrow: 1,
          overflow: 'hidden',
          backgroundColor: '#f0f2f5',
          marginTop: `${NAVBAR_HEIGHT}px`,
          marginBottom: `${TASKBAR_HEIGHT}px`,
          height: DESKTOP_HEIGHT,
          width: '100vw',
        }}
      >
        {accessDeniedMessage && (
          <Alert variant="danger" className="position-absolute top-0 start-50 translate-middle-x mt-3" style={{ zIndex: 9999 }}>
            {accessDeniedMessage}
          </Alert>
        )}

        {openWindows.map(win => {
          const ComponentToRender = WindowComponentMap[win.componentKey];
          if (!ComponentToRender) {
            console.error(`Componente para la ventana con clave "${win.componentKey}" no encontrado.`);
            return null;
          }
          return (
            <WindowComponent
              key={win.id}
              id={win.id}
              title={win.title}
              x={win.x}
              y={win.y}
              width={win.width}
              height={win.height}
              minimized={win.minimized}
              zIndex={win.zIndex}
              onClose={closeWindow}
              onMinimize={minimizeWindow}
              onFocus={focusWindow}
              onDragEnd={updateWindowPosition}
              onResizeEnd={updateWindowSize}
            >
              <ComponentToRender {...win.props} />
            </WindowComponent>
          );
        })}
      </div>

      <Taskbar
        openWindows={openWindows.map((win: WindowInfo): TaskbarWindow => ({
          id: win.id,
          title: win.title,
          minimized: win.minimized,
        }))}
        onWindowClick={focusWindow}
      />
    </Container>
  );
}

export default App;
