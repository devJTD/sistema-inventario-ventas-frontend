// src/components/ProductTable.tsx
import React, { useEffect, useState } from 'react';
import { Container, Table, Button, Spinner, Alert, Modal } from 'react-bootstrap';
import ProductForm from './ProductForm';

// --- ¡IMPORTA TU INSTANCIA CONFIGURADA DE AXIOS AQUÍ! ---
import api from '../api/axiosConfig';

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
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionMessageType, setActionMessageType] = useState<'success' | 'danger' | null>(null);

  // Estados para el modal de Crear/Editar
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Estados para el modal de Confirmación de Eliminación
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState<boolean>(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Función para cargar los productos del backend
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      // --- ¡CAMBIO CRÍTICO AQUÍ: USA 'api.get' EN LUGAR DE 'fetch'! ---
      const response = await api.get<Product[]>('/products'); // Axios ya maneja la URL base y el JSON
      setProducts(response.data); // Los datos están en response.data
    } catch (err: any) {
      console.error("Error al obtener los productos:", err);
      // El interceptor de respuesta en axiosConfig.ts ya debería manejar 401/403
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        setError("Tu sesión ha expirado o no tienes permisos para ver productos.");
      } else {
        setError("No se pudieron cargar los productos. Intenta de nuevo más tarde.");
      }
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
    setEditingProduct(null);
    setShowFormModal(true);
    setActionMessage(null);
    setActionMessageType(null);
  };

  const handleShowEditModal = (product: Product) => {
    setEditingProduct(product);
    setShowFormModal(true);
    setActionMessage(null);
    setActionMessageType(null);
  };

  const handleCloseFormModal = () => {
    setShowFormModal(false);
    setEditingProduct(null);
  };

  // Función que se llama cuando el formulario del modal guarda (crea o edita) un producto
  const handleProductSaved = () => {
    fetchProducts(); // Recargar la lista de productos para ver los cambios
    setActionMessage('Operación realizada con éxito.');
    setActionMessageType('success');
  };

  // --- Lógica para el modal de confirmación de eliminación ---
  const handleShowDeleteConfirm = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteConfirmModal(true);
    setActionMessage(null);
    setActionMessageType(null);
  };

  const handleCloseDeleteConfirm = () => {
    setShowDeleteConfirmModal(false);
    setProductToDelete(null);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    const productId = productToDelete.id;
    handleCloseDeleteConfirm();

    try {
      // --- ¡CAMBIO CRÍTICO AQUÍ: USA 'api.delete' EN LUGAR DE 'fetch'! ---
      // Axios maneja el 204 No Content como una respuesta exitosa
      await api.delete(`/products/${productId}`);

      setActionMessage('Producto eliminado exitosamente.');
      setActionMessageType('success');
      // Actualizar la lista de productos en el frontend sin recargar toda la página
      setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
    } catch (err: any) {
      console.error("Error al eliminar el producto:", err);
      // El interceptor de respuesta en axiosConfig.ts ya debería manejar 401/403
      if (err.response && err.response.data && err.response.data.message) {
        setActionMessage(err.response.data.message);
      } else {
        setActionMessage('No se pudo conectar con el servidor para eliminar el producto.');
      }
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
      {actionMessage && (
        <Alert variant={actionMessageType || "info"}>{actionMessage}</Alert>
      )}
      <div className="d-flex justify-content-end mb-3 animate__animated animate__fadeInUp">
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
                    onClick={() => handleShowEditModal(product)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleShowDeleteConfirm(product)}
                  >
                    Eliminar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <ProductForm
        show={showFormModal}
        onHide={handleCloseFormModal}
        onSave={handleProductSaved}
        editingProduct={editingProduct}
      />

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
