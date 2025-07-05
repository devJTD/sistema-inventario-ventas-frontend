// src/components/SaleFormModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert, Spinner, Table } from 'react-bootstrap';

// Interfaces necesarias
interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
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
            fetch('http://localhost:3001/api/clients'),
            fetch('http://localhost:3001/api/products')
          ]);

          const clientsData: Client[] = await clientsRes.json();
          const productsData: Product[] = await productsRes.json();

          setClients(clientsData);
          setProducts(productsData.filter(p => p.stock > 0)); // Solo productos con stock > 0
        } catch (error) {
          console.error("Error al cargar datos para la venta:", error);
          setMessage('Error al cargar clientes o productos. Intenta de nuevo.');
          setMessageType('danger');
        }
      };
      fetchClientsAndProducts();
      // Limpiar formulario al abrir
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

      // Buscar si el producto ya está en la lista de ítems de la venta
      const existingItemIndex = saleItems.findIndex(item => item.productId === selectedProductId);

      if (existingItemIndex !== -1) {
        // Si el producto ya está, actualiza la cantidad
        const updatedItems = [...saleItems];
        updatedItems[existingItemIndex].quantity += qtyNum;
        setSaleItems(updatedItems);
      } else {
        // Si es un producto nuevo, añádelo
        setSaleItems([...saleItems, {
          productId: productToAdd.id,
          name: productToAdd.name,
          quantity: qtyNum,
          price: productToAdd.price
        }]);
      }

      // Resta temporalmente el stock en la lista de productos para evitar sobreventas en el formulario
      setProducts(prevProducts => prevProducts.map(p =>
        p.id === productToAdd.id ? { ...p, stock: p.stock - qtyNum } : p
      ));

      // Limpiar selección de producto y cantidad para el siguiente
      setSelectedProductId('');
      setQuantity('1');
    }
  };

  const handleRemoveItem = (index: number) => {
    setMessage(null);
    const itemToRemove = saleItems[index];
    setSaleItems(prevItems => prevItems.filter((_, i) => i !== index));

    // Devolver el stock al producto en la lista temporal de productos
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
      const response = await fetch('http://localhost:3001/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Venta registrada exitosamente.');
        setMessageType('success');
        onSaleSuccess(); // Notificar al padre para recargar la lista de ventas
        setTimeout(() => {
          onHide(); // Cerrar el modal
        }, 1500); // Dar un poco de tiempo para ver el mensaje
      } else {
        setMessage(data.message || 'Error al registrar la venta.');
        if (data.details) {
          setMessage(prev => `${prev}\n${data.details.join('\n')}`);
        }
        setMessageType('danger');
      }
    } catch (error) {
      console.error('Error de red al registrar venta:', error);
      setMessage('No se pudo conectar con el servidor. Intenta de nuevo más tarde.');
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