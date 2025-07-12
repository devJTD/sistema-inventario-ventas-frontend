import type { SaleItem } from './SaleItem';

/* Define la interfaz para una venta completa. */
export interface Sale {
  id: string;
  date: string;
  clientId: string;
  items: SaleItem[];
  total: number;
}
