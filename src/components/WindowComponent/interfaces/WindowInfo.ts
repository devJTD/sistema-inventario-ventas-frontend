/* Define la interfaz para la información de una ventana gestionada por la aplicación. */
export interface WindowInfo {
  id: string;
  title: string;
  componentKey: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minimized: boolean;
  zIndex: number;
  props?: Record<string, any>;
}
