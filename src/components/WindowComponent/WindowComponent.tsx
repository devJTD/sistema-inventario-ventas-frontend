import React, { useRef, useEffect, useState } from "react";
import { Card, Button } from "react-bootstrap";
import Draggable from "react-draggable";
import { ResizableBox, type ResizeCallbackData, type ResizeHandle } from "react-resizable";

/* Importación de Interfaces */
import type { WindowComponentProps } from './interfaces/WindowComponentProps';

const WindowComponent: React.FC<WindowComponentProps> = ({
  id,
  title,
  children,
  x,
  y,
  width,
  height,
  minimized,
  zIndex,
  onClose,
  onMinimize,
  onFocus,
  onDragEnd,
  onResizeEnd,
}) => {
  /* Referencias y Estados */
  const nodeRef = useRef(null);
  const [isMounted, setIsMounted] = useState(false);

  /* Efecto de Montaje para Animación */
  useEffect(() => {
    const animationFrame = requestAnimationFrame(() => {
      setIsMounted(true);
    });

    return () => cancelAnimationFrame(animationFrame);
  }, []);

  /* Cálculo de Alturas Fijas */
  const fixedElementsHeight = 56 + 44; // Navbar + Taskbar

  /* Estilos de la Ventana */
  const windowStyle: React.CSSProperties = {
    position: "absolute",
    left: x,
    top: y,
    width: width,
    height: height,
    zIndex: zIndex,
    display: minimized ? "none" : "flex",
    flexDirection: "column",
  };

  /* Estilos del Cuerpo de la Tarjeta */
  const cardBodyStyle: React.CSSProperties = {
    flexGrow: 1,
    overflowY: "auto",
    padding: "1rem",
  };

  /* Manejadores de Eventos de Arrastre y Redimensionamiento */
  const handleStop = (_e: any, ui: any) => {
    onDragEnd(id, ui.x, ui.y);
  };

  const handleResizeStop = (
    _event: React.SyntheticEvent,
    data: ResizeCallbackData
  ) => {
    onResizeEnd(id, data.size.width, data.size.height);
    onFocus(id);
  };

  /* Configuración de Draggable y Resizable */
  const isDraggable = true;
  const resizeHandles: ResizeHandle[] = ["se", "s", "e"];

  /* Renderizado Condicional para Ventana Minimizada */
  if (minimized) {
    return null;
  }

  /* Renderizado del Componente de Ventana */
  return (
    <Draggable
      nodeRef={nodeRef}
      handle=".window-header"
      position={{ x, y }}
      onStop={handleStop}
      onStart={() => onFocus(id)}
      disabled={!isDraggable}
      bounds="parent"
    >
      <ResizableBox
        width={width}
        height={height}
        minConstraints={[300, 200]}
        maxConstraints={[window.innerWidth, window.innerHeight - fixedElementsHeight]}
        onResizeStop={handleResizeStop}
        resizeHandles={resizeHandles}
        style={windowStyle}
        className={`window-container ${isMounted ? 'window-open-animation' : ''}`}
        ref={nodeRef}
      >
        <Card
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Card.Header
            className="window-header d-flex justify-content-between align-items-center bg-primary text-white"
          >
            <h5 className="mb-0">{title}</h5>
            <div>
              <Button
                variant="link"
                className="window-control-button minimize"
                onClick={(e) => {
                  e.stopPropagation();
                  onMinimize(id);
                }}
                style={{
                  backgroundColor: '#ffbd2e',
                  color: 'white',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
                  border: 'none',
                }}
              >
                <i className="bi bi-dash"></i>
              </Button>
              <Button
                variant="link"
                className="window-control-button close"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose(id);
                }}
                style={{
                  backgroundColor: '#ff5f56',
                  color: 'white',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
                  border: 'none',
                  marginLeft: '8px',
                }}
              >
                <i className="bi bi-x"></i>
              </Button>
            </div>
          </Card.Header>
          <Card.Body style={cardBodyStyle}>
            {children}{" "}
          </Card.Body>
        </Card>
      </ResizableBox>
    </Draggable>
  );
};

export default WindowComponent;
