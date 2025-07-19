import type React from "react";

/* Define la interfaz para las propiedades del componente de ventana. */
export interface WindowComponentProps {
  id: string;
  title: string;
  children: React.ReactNode;
  x: number;
  y: number;
  width: number;
  height: number;
  minimized: boolean;
  zIndex: number;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onFocus: (id: string) => void;
  onDragEnd: (id: string, newX: number, newY: number) => void;
  onResizeEnd: (id: string, newWidth: number, newHeight: number) => void;
}
