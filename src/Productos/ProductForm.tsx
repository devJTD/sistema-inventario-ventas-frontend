// src/components/ProductForm.tsx
import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Alert, Spinner, Modal } from 'react-bootstrap';
// Ya no necesitamos useParams ni useNavigate aquí

// Define la interfaz para la estructura de tus productos
interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  description: string;
}

// Define los props que este formulario esperará
interface ProductFormProps {
  show: boolean; // Controla la visibilidad del modal
  onHide: () => void; // Función para cerrar el modal
  onSave: () => void; // Función para notificar al padre que se guardó algo y refresque la tabla
  editingProduct: Product | null; // El producto a editar, o null si es un nuevo producto
}

const ProductForm: React.FC<ProductFormProps> = ({ show, onHide, onSave, editingProduct }) => {
  // Estados para cada campo del formulario
  const [name, setName] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [stock, setStock] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  // Estados para manejo de UI
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'danger' | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // useEffect para pre-rellenar el formulario cuando editingProduct cambia
  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name);
      setPrice(editingProduct.price.toString());
      setStock(editingProduct.stock.toString());
      setCategory(editingProduct.category);
      setDescription(editingProduct.description);
    } else {
      // Limpiar el formulario si no hay producto para editar (modo creación)
      setName('');
      setPrice('');
      setStock('');
      setCategory('');
      setDescription('');
    }
    // Limpiar mensajes al cambiar el producto a editar (o a modo creación)
    setMessage(null);
    setMessageType(null);
  }, [editingProduct, show]); // También cuando el modal se muestra/oculta

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setMessageType(null);
    setLoading(true);

    if (!name || !price || !stock || !category || !description) {
      setMessage('Todos los campos son obligatorios.');
      setMessageType('danger');
      setLoading(false);
      return;
    }

    const productPrice = parseFloat(price);
    const productStock = parseInt(stock, 10);

    if (isNaN(productPrice) || isNaN(productStock) || productPrice <= 0 || productStock < 0) {
      setMessage('El precio debe ser un número positivo y el stock un número no negativo.');
      setMessageType('danger');
      setLoading(false);
      return;
    }

    const productDataToSend = {
      name,
      price: productPrice,
      stock: productStock,
      category,
      description,
    };

    try {
      const method = editingProduct ? 'PUT' : 'POST'; // Si hay editingProduct, es PUT; si no, es POST
      const url = editingProduct
        ? `http://localhost:3001/api/products/${editingProduct.id}`
        : 'http://localhost:3001/api/products';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productDataToSend),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || `Producto ${editingProduct ? 'actualizado' : 'guardado'} exitosamente.`);
        setMessageType('success');
        onSave(); // Notificar al padre que la operación fue exitosa

        // Opcional: Cerrar el modal automáticamente después de un éxito (o dejarlo abierto para otro guardado rápido)
        setTimeout(() => {
          onHide(); // Cerrar el modal
        }, 1000); // Dar un segundo para que el usuario vea el mensaje de éxito

      } else {
        setMessage(data.message || `Error al ${editingProduct ? 'actualizar' : 'guardar'} el producto.`);
        setMessageType('danger');
      }
    } catch (error) {
      console.error('Error de red o del servidor:', error);
      setMessage('No se pudo conectar con el servidor. Intenta de nuevo más tarde.');
      setMessageType('danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static" keyboard={false}>
      <Modal.Header closeButton>
        <Modal.Title>{editingProduct ? 'Editar Producto' : 'Agregar Nuevo Producto'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {message && <Alert variant={messageType || 'info'}>{message}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="formProductName">
            <Form.Label>Nombre del Producto</Form.Label>
            <Form.Control
              type="text"
              placeholder="Ingrese el nombre del producto"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
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
              />
            </Form.Group>
          </Row>

          <Form.Group className="mb-3" controlId="formProductCategory">
            <Form.Label>Categoría</Form.Label>
            <Form.Select
              aria-label="Seleccione una categoría"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="">Seleccione una categoría</option>
              <option value="Electrónica">Electrónica</option>
              <option value="Ropa">Ropa</option>
              <option value="Alimentos">Alimentos</option>
              <option value="Hogar">Hogar</option>
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
            />
          </Form.Group>

          <div className="d-flex justify-content-end">
            <Button variant="secondary" onClick={onHide} className="me-2" disabled={loading}>
              Cancelar
            </Button>
            <Button variant="success" type="submit" disabled={loading}>
              {loading ? (
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
      </Modal.Body>
    </Modal>
  );
};

export default ProductForm;