/* Define la interfaz para la estructura de un producto. */
export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  categoryId: string; /* Ahora se refiere al ID de la categoría. */
  description: string;
}
