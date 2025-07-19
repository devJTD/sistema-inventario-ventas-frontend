import React from 'react';
import { Navbar, Nav, Button } from 'react-bootstrap';

/* Importación de Interfaces */
import type { TaskbarProps } from '../../interfaces/TaskbarProps';

const Taskbar: React.FC<TaskbarProps> = ({ openWindows, onWindowClick }) => {
  /* Filtra las ventanas activas (abiertas o minimizadas). */
  const activeWindows = openWindows.filter(win => !win.minimized || win.minimized);

  /* Renderizado de la Barra de Tareas */
  return (
    <Navbar bg="dark" variant="dark" className="fixed-bottom" style={{ height: '44px', padding: '0 1rem' }}>
      <Nav className="mx-auto d-flex align-items-center">
        {activeWindows.length === 0 ? (
          <Navbar.Text className="text-secondary">No hay ventanas abiertas</Navbar.Text>
        ) : (
          activeWindows.map((win) => (
            <Button
              key={win.id}
              variant={win.minimized ? "outline-secondary" : "primary"}
              size="sm"
              className={`mx-1 my-1 px-3 py-1 rounded-pill ${win.minimized ? 'text-white-50' : 'text-white'}`}
              onClick={() => onWindowClick(win.id)}
              style={{ minWidth: '120px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {win.minimized && <i className="bi bi-dash-circle-fill me-1"></i>}
              {win.title}
            </Button>
          ))
        )}
      </Nav>
    </Navbar>
  );
};

export default Taskbar;
