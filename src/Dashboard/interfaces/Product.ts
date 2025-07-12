/* Define la interfaz para los datos de producto relevantes para el Dashboard. */
export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
}
