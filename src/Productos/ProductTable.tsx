// src/components/ProductTable.tsx
import React, { useEffect, useState } from 'react';
import { Container, Table, Button, Spinner, Alert, Modal } from 'react-bootstrap'; // Importa Modal
// Ya no necesitamos Link ni useNavigate directamente en la tabla para los formularios
import ProductForm from './ProductForm'; // Importa el ProductForm

// Define la interfaz para la estructura de tus productos
interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  description: string;
}

const ProductTable: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null); // Mensajes de éxito/error general (crear/editar/eliminar)
  const [actionMessageType, setActionMessageType] = useState<'success' | 'danger' | null>(null);

  // Estados para el modal de Crear/Editar
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null); // Producto a editar, o null para crear

  // Estados para el modal de Confirmación de Eliminación
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState<boolean>(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null); // Producto que se va a eliminar

  // Función para cargar los productos del backend
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/api/products');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Product[] = await response.json();
      setProducts(data);
    } catch (err: any) {
      console.error("Error al obtener los productos:", err);
      setError("No se pudieron cargar los productos. Intenta de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  };

  // Carga los productos cuando el componente se monta
  useEffect(() => {
    fetchProducts();
  }, []);

  // Funciones para abrir y cerrar el modal de Crear/Editar
  const handleShowCreateModal = () => {
    setEditingProduct(null); // Asegurarse de que no haya producto en edición (modo crear)
    setShowFormModal(true);
    setActionMessage(null); // Limpiar mensajes al abrir modal
    setActionMessageType(null);
  };

  const handleShowEditModal = (product: Product) => {
    setEditingProduct(product); // Establecer el producto a editar
    setShowFormModal(true);
    setActionMessage(null); // Limpiar mensajes al abrir modal
    setActionMessageType(null);
  };

  const handleCloseFormModal = () => {
    setShowFormModal(false);
    setEditingProduct(null); // Limpiar el producto en edición al cerrar el modal
  };

  // Función que se llama cuando el formulario del modal guarda (crea o edita) un producto
  const handleProductSaved = () => {
    fetchProducts(); // Recargar la lista de productos para ver los cambios
    // El modal se cerrará automáticamente desde ProductForm al guardar con éxito
    setActionMessage('Operación realizada con éxito.'); // Mensaje genérico de éxito
    setActionMessageType('success');
  };

  // --- Lógica para el modal de confirmación de eliminación ---
  const handleShowDeleteConfirm = (product: Product) => {
    setProductToDelete(product); // Guarda el producto a eliminar
    setShowDeleteConfirmModal(true); // Muestra el modal de confirmación
    setActionMessage(null); // Limpiar mensajes previos
    setActionMessageType(null);
  };

  const handleCloseDeleteConfirm = () => {
    setShowDeleteConfirmModal(false);
    setProductToDelete(null); // Limpiar el producto a eliminar
  };

  const confirmDelete = async () => {
    if (!productToDelete) return; // Si no hay producto para eliminar, salir

    const productId = productToDelete.id;
    handleCloseDeleteConfirm(); // Cierra el modal de confirmación

    try {
      const response = await fetch(`http://localhost:3001/api/products/${productId}`, {
        method: 'DELETE', // Método DELETE
      });

      if (response.ok) { // Un 204 No Content también es 'ok'
        setActionMessage('Producto eliminado exitosamente.');
        setActionMessageType('success');
        // Actualizar la lista de productos en el frontend sin recargar toda la página
        setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
      } else {
        const errorData = await response.json(); // Intentar leer el mensaje de error del backend
        setActionMessage(errorData.message || 'Error al eliminar el producto.');
        setActionMessageType('danger');
      }
    } catch (err) {
      console.error("Error al eliminar el producto:", err);
      setActionMessage('No se pudo conectar con el servidor para eliminar el producto.');
      setActionMessageType('danger');
    }
  };
  // --- Fin lógica modal de confirmación de eliminación ---


  if (loading) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando productos...</span>
        </Spinner>
        <p>Cargando productos...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">{error}</Alert>
        <Button variant="secondary" onClick={fetchProducts}>Reintentar Carga</Button>
      </Container>
    );
  }

  return (
    <Container className="my-5 animate__animated animate__fadeInUp">
      <h2 className="mb-4 animate__animated animate__fadeInUp">
        Gestión de Productos
      </h2>
      {/* Muestra mensajes de acciones (crear, editar, eliminar) */}
      {actionMessage && (
        <Alert variant={actionMessageType || "info"}>{actionMessage}</Alert>
      )}
      <div className="d-flex justify-content-end mb-3 animate__animated animate__fadeInUp">
        {/* Botón para abrir el modal de creación de producto */}
        <Button variant="success" onClick={handleShowCreateModal}>
          Agregar Nuevo Producto
        </Button>
      </div>
      {products.length === 0 ? (
        <Alert variant="info" className="text-center">
          No hay productos registrados. ¡Agrega uno nuevo!
        </Alert>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Categoría</th>
              <th>Descripción</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>{product.name}</td>
                <td>${product.price ? product.price.toFixed(2) : "N/A"}</td>
                <td>{product.stock}</td>
                <td>{product.category || "N/A"}</td>
                <td>{product.description || "N/A"}</td>
                <td className="text-center">
                  <Button
                    variant="info"
                    size="sm"
                    className="me-2"
                    onClick={() => handleShowEditModal(product)} // Llama a handleShowEditModal
                  >
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleShowDeleteConfirm(product)} // Llama al modal de confirmación
                  >
                    Eliminar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* El componente ProductForm ahora se renderiza como un Modal */}
      <ProductForm
        show={showFormModal}
        onHide={handleCloseFormModal}
        onSave={handleProductSaved}
        editingProduct={editingProduct}
      />

      {/* Modal de Confirmación de Eliminación */}
      <Modal
        show={showDeleteConfirmModal}
        onHide={handleCloseDeleteConfirm}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ¿Estás seguro de que quieres eliminar el producto **
          {productToDelete?.name}** (ID: {productToDelete?.id})? Esta acción no
          se puede deshacer.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDeleteConfirm}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Eliminar
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ProductTable;
