// src/components/SaleFormModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert, Spinner, Table } from 'react-bootstrap';

// --- ¡IMPORTA TU INSTANCIA CONFIGURADA DE AXIOS AQUÍ! ---
import api from '../api/axiosConfig';

// Interfaces necesarias
interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category?: string; // Hago category opcional por si no siempre viene en la respuesta de productos
}

interface Client {
  id: string;
  name: string;
}

interface SaleItem {
  productId: string;
  name: string; // Para mostrar en el formulario
  quantity: number;
  price: number; // Precio unitario en el momento de la venta
}

interface SaleFormModalProps {
  show: boolean;
  onHide: () => void;
  onSaleSuccess: () => void; // Para que el componente padre recargue la lista de ventas
}

// --- NUEVA INTERFAZ PARA LA RESPUESTA DE LA API DE VENTAS ---
interface SaleApiResponse {
  message?: string;
  details?: string[]; // Para mensajes de error detallados del backend
  // Si tu backend devuelve el objeto de venta creado, puedes añadirlo aquí:
  // sale?: { id: string; total: number; /* ...otras propiedades de venta */ };
}


const SaleFormModal: React.FC<SaleFormModalProps> = ({ show, onHide, onSaleSuccess }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1'); // Cantidad del producto a añadir
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]); // Items agregados a la venta actual
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'danger' | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Cargar clientes y productos al abrir el modal
  useEffect(() => {
    if (show) {
      const fetchClientsAndProducts = async () => {
        try {
          const [clientsRes, productsRes] = await Promise.all([
            api.get<Client[]>('/clients'),
            api.get<Product[]>('/products')
          ]);

          setClients(clientsRes.data);
          setProducts(productsRes.data.filter(p => p.stock > 0));
        } catch (error: any) {
          console.error("Error al cargar datos para la venta:", error);
          if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            setMessage("Tu sesión ha expirado o no tienes permisos para cargar clientes/productos.");
          } else {
            setMessage('Error al cargar clientes o productos. Intenta de nuevo.');
          }
          setMessageType('danger');
        }
      };
      fetchClientsAndProducts();
      setSelectedClientId('');
      setSelectedProductId('');
      setQuantity('1');
      setSaleItems([]);
      setMessage(null);
      setMessageType(null);
      setLoading(false);
    }
  }, [show]);

  const handleAddProduct = () => {
    setMessage(null);
    if (!selectedProductId || parseInt(quantity) <= 0) {
      setMessage('Por favor, selecciona un producto y una cantidad válida.');
      setMessageType('danger');
      return;
    }

    const productToAdd = products.find(p => p.id === selectedProductId);
    const qtyNum = parseInt(quantity);

    if (productToAdd) {
      if (qtyNum > productToAdd.stock) {
        setMessage(`No hay suficiente stock para ${productToAdd.name}. Stock disponible: ${productToAdd.stock}`);
        setMessageType('danger');
        return;
      }

      const existingItemIndex = saleItems.findIndex(item => item.productId === selectedProductId);

      if (existingItemIndex !== -1) {
        const updatedItems = [...saleItems];
        updatedItems[existingItemIndex].quantity += qtyNum;
        setSaleItems(updatedItems);
      } else {
        setSaleItems([...saleItems, {
          productId: productToAdd.id,
          name: productToAdd.name,
          quantity: qtyNum,
          price: productToAdd.price
        }]);
      }

      setProducts(prevProducts => prevProducts.map(p =>
        p.id === productToAdd.id ? { ...p, stock: p.stock - qtyNum } : p
      ));

      setSelectedProductId('');
      setQuantity('1');
    }
  };

  const handleRemoveItem = (index: number) => {
    setMessage(null);
    const itemToRemove = saleItems[index];
    setSaleItems(prevItems => prevItems.filter((_, i) => i !== index));

    setProducts(prevProducts => prevProducts.map(p =>
      p.id === itemToRemove.productId ? { ...p, stock: p.stock + itemToRemove.quantity } : p
    ));
  };

  const calculateTotal = () => {
    return saleItems.reduce((acc, item) => acc + (item.quantity * item.price), 0).toFixed(2);
  };

  const handleSubmitSale = async () => {
    setMessage(null);
    setLoading(true);

    if (!selectedClientId) {
      setMessage('Por favor, selecciona un cliente.');
      setMessageType('danger');
      setLoading(false);
      return;
    }
    if (saleItems.length === 0) {
      setMessage('Por favor, añade al menos un producto a la venta.');
      setMessageType('danger');
      setLoading(false);
      return;
    }

    const saleData = {
      clientId: selectedClientId,
      items: saleItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }))
    };

    try {
      // FIX: Desestructura 'data' directamente de la respuesta de Axios
      const { data } = await api.post<SaleApiResponse>('/sales', saleData);

      setMessage(data.message || 'Venta registrada exitosamente.'); // Usa 'data.message'
      setMessageType('success');
      onSaleSuccess();
      setTimeout(() => {
        onHide();
      }, 1500);
    } catch (error: any) {
      console.error('Error de red al registrar venta:', error);
      if (error.response && error.response.data) {
        setMessage(error.response.data.message || 'Error al registrar la venta.');
        if (error.response.data.details && Array.isArray(error.response.data.details)) {
          setMessage(prev => `${prev}\n${error.response.data.details.join('\n')}`);
        }
      } else {
        setMessage('No se pudo conectar con el servidor. Intenta de nuevo más tarde.');
      }
      setMessageType('danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered backdrop="static" keyboard={false}>
      <Modal.Header closeButton>
        <Modal.Title>Registrar Nueva Venta</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {message && <Alert variant={messageType || 'info'}>{message}</Alert>}

        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Seleccionar Cliente</Form.Label>
            <Form.Select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              required
            >
              <option value="">Seleccione un cliente</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </Form.Select>
          </Form.Group>

          <hr />
          <h5>Añadir Productos a la Venta</h5>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Producto</Form.Label>
                <Form.Select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                >
                  <option value="">Seleccione un producto</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} (Stock: {product.stock}) - ${product.price.toFixed(2)}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Cantidad</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3} className="d-flex align-items-end">
              <Button variant="primary" onClick={handleAddProduct} className="w-100">
                Añadir
              </Button>
            </Col>
          </Row>

          {saleItems.length > 0 && (
            <>
              <h6>Productos en la Venta:</h6>
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio Unitario</th>
                    <th>Subtotal</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {saleItems.map((item, index) => (
                    <tr key={index}>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>${item.price.toFixed(2)}</td>
                      <td>${(item.quantity * item.price).toFixed(2)}</td>
                      <td>
                        <Button variant="danger" size="sm" onClick={() => handleRemoveItem(index)}>
                          Quitar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="text-end"><strong>Total:</strong></td>
                    <td colSpan={2}><strong>${calculateTotal()}</strong></td>
                  </tr>
                </tfoot>
              </Table>
            </>
          )}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Cancelar
        </Button>
        <Button variant="success" onClick={handleSubmitSale} disabled={loading || saleItems.length === 0 || !selectedClientId}>
          {loading ? (
            <>
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1" />
              Registrando...
            </>
          ) : (
            `Registrar Venta ($${calculateTotal()})`
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SaleFormModal;
