/* Define la interfaz para un ítem individual dentro de una venta. */
export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}
