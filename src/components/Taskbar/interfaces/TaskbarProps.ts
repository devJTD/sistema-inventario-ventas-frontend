import type { TaskbarWindow } from './TaskbarWindow';

// Props para el componente Taskbar
export interface TaskbarProps {
  openWindows: TaskbarWindow[]; 
  onWindowClick: (id: string) => void;
}
