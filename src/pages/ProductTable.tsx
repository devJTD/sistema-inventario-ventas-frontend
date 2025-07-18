import React, { useEffect, useState } from 'react';
import { Container, Table, Button, Spinner, Alert, Form, Row, Col, Modal } from 'react-bootstrap';
import api from '../api/axiosConfig';

/* Importaciones de Interfaces */
import type { Product } from '../interfaces/Product';
import type { ProductApiResponse } from '../interfaces/ProductApiResponse';
import type { Category } from '../interfaces/Category';


const ProductTable: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionMessageType, setActionMessageType] = useState<'success' | 'danger' | null>(null);

  const [showProductForm, setShowProductForm] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [name, setName] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [stock, setStock] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [formMessageType, setFormMessageType] = useState<'success' | 'danger' | null>(null);
  const [formLoading, setFormLoading] = useState<boolean>(false);

  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState<boolean>(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);

  const fetchProductsAndCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        api.get<Product[]>('/products'),
        api.get<Category[]>('/categories')
      ]);
      setProducts(productsRes.data);
      setAvailableCategories(categoriesRes.data);
    } catch (err: any) {
      console.error("Error al obtener productos o categorías:", err);
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        setError("Tu sesión ha expirado o no tienes permisos para ver productos o categorías.");
      } else {
        setError("No se pudieron cargar los productos o categorías. Intenta de nuevo más tarde.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsAndCategories();
  }, []);

  useEffect(() => {
    if (showProductForm) {
      if (editingProduct) {
        setName(editingProduct.name);
        setPrice(editingProduct.price.toString());
        setStock(editingProduct.stock.toString());
        setCategoryId(editingProduct.categoryId);
        setDescription(editingProduct.description);
      } else {
        setName('');
        setPrice('');
        setStock('');
        setCategoryId('');
        setDescription('');
      }
      setFormMessage(null);
      setFormMessageType(null);
      setFormLoading(false);
    }
  }, [editingProduct, showProductForm]);

  const handleShowCreateForm = () => {
    setEditingProduct(null);
    setShowProductForm(true);
    setActionMessage(null);
    setActionMessageType(null);
  };

  const handleShowEditForm = (product: Product) => {
    setEditingProduct(product);
    setShowProductForm(true);
    setActionMessage(null);
    setActionMessageType(null);
  };

  const handleCancelForm = () => {
    setShowProductForm(false);
    setEditingProduct(null);
  };

  const handleProductSaved = () => {
    fetchProductsAndCategories();
    setShowProductForm(false);
    setEditingProduct(null);
    setActionMessage('Operación realizada con éxito.');
    setActionMessageType('success');
  };

  const handleSubmitForm = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormMessage(null);
    setFormMessageType(null);
    setFormLoading(true);

    if (!name || !price || !stock || !categoryId  || !description) {
      setFormMessage('Todos los campos son obligatorios.');
      setFormMessageType('danger');
      setFormLoading(false);
      return;
    }

    const productPrice = parseFloat(price);
    const productStock = parseInt(stock, 10);

    if (isNaN(productPrice) || isNaN(productStock) || productPrice <= 0 || productStock < 0) {
      setFormMessage('El precio debe ser un número positivo y el stock un número no negativo.');
      setFormMessageType('danger');
      setFormLoading(false);
      return;
    }

    const productDataToSend = {
      name,
      price: productPrice,
      stock: productStock,
      categoryId,
      description,
    };

    try {
      let response;
      if (editingProduct) {
        response = await api.put<ProductApiResponse>(`/products/${editingProduct.id}`, productDataToSend);
      } else {
        response = await api.post<ProductApiResponse>('/products', productDataToSend);
      }

      setFormMessage(response.data.message || `Producto ${editingProduct ? 'actualizado' : 'guardado'} exitosamente.`);
      setFormMessageType('success');
      handleProductSaved();

    } catch (error: any) {
      console.error('Error al guardar/actualizar el producto:', error);
      if (error.response && error.response.data && error.response.data.message) {
        setFormMessage(error.response.data.message);
      } else {
        setFormMessage('No se pudo conectar con el servidor. Intenta de nuevo más tarde.');
      }
      setFormMessageType('danger');
    } finally {
      setFormLoading(false);
    }
  };

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
      await api.delete(`/products/${productId}`);

      setActionMessage('Producto eliminado exitosamente.');
      setActionMessageType('success');
      setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
    } catch (err: any) {
      console.error("Error al eliminar el producto:", err);
      if (err.response && err.response.data && err.response.data.message) {
        setActionMessage(err.response.data.message);
      } else {
        setActionMessage('No se pudo conectar con el servidor para eliminar el producto.');
      }
      setActionMessageType('danger');
    }
  };

const getCategoryName = (categoryId: string) => {
    const category = availableCategories.find(cat => cat.id === categoryId);
    return category ? category.name : "Categoría Desconocida";
  };

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
        <Button variant="secondary" onClick={fetchProductsAndCategories}>Reintentar Carga</Button>
      </Container>
    );
  }

  if (showProductForm) {
    return (
      <Container className="my-5 animate__animated animate__fadeInUp">
        <h2 className="mb-4">{editingProduct ? 'Editar Producto' : 'Agregar Nuevo Producto'}</h2>
        {formMessage && <Alert variant={formMessageType || 'info'}>{formMessage}</Alert>}

        <Form onSubmit={handleSubmitForm}>
          <Form.Group className="mb-3" controlId="formProductName">
            <Form.Label>Nombre del Producto</Form.Label>
            <Form.Control
              type="text"
              placeholder="Ingrese el nombre del producto"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={formLoading}
            />
          </Form.Group>

          <Row className="mb-3">
            <Form.Group as={Col} controlId="formProductPrice">
              <Form.Label>Precio</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                placeholder="Ingrese el precio"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                disabled={formLoading}
              />
            </Form.Group>

            <Form.Group as={Col} controlId="formProductStock">
              <Form.Label>Stock Actual</Form.Label>
              <Form.Control
                type="number"
                placeholder="Ingrese la cantidad en stock"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
                disabled={formLoading}
              />
            </Form.Group>
          </Row>

          <Form.Group className="mb-3" controlId="formProductCategory">
            <Form.Label>Categoría</Form.Label>
            <Form.Select
              aria-label="Seleccione una categoría"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              disabled={formLoading}
            >
              <option value="">Seleccione una categoría</option>
              {availableCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3" controlId="formProductDescription">
            <Form.Label>Descripción</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Ingrese una descripción del producto"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              disabled={formLoading}
            />
          </Form.Group>

          <div className="d-flex justify-content-end">
            <Button variant="secondary" onClick={handleCancelForm} className="me-2" disabled={formLoading}>
              Cancelar
            </Button>
            <Button variant="success" type="submit" disabled={formLoading}>
              {formLoading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-1"
                  />
                  {editingProduct ? 'Actualizando...' : 'Guardando...'}
                </>
              ) : (
                editingProduct ? 'Actualizar Producto' : 'Guardar Producto'
              )}
            </Button>
          </div>
        </Form>
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
        <Button variant="success" onClick={handleShowCreateForm}>
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
                <td>{getCategoryName(product.categoryId)}</td>
                <td>{product.description || "N/A"}</td>
                <td className="text-center">
                  <Button
                    variant="info"
                    size="sm"
                    className="me-2"
                    onClick={() => handleShowEditForm(product)}
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