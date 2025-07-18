import React, { useEffect, useState } from 'react';
import { Container, Table, Button, Spinner, Alert, ListGroup, Collapse, Form, Row, Col } from 'react-bootstrap';
import api from '../api/axiosConfig';

/* Importaciones de Interfaces */
import type { Product } from '../interfaces/Product';
import type { Client } from '../interfaces/Client';
import type { SaleItem } from '../interfaces/SaleItem';
import type { Sale } from '../interfaces/Sale';
import type { SaleApiResponse } from '../interfaces/SaleApiResponse';


const SalesPage: React.FC = () => {
  /* Estados para la Tabla de Ventas */
  const [sales, setSales] = useState<Sale[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionMessageType, setActionMessageType] = useState<'success' | 'danger' | null>(null);
  const [openSaleId, setOpenSaleId] = useState<string | null>(null);

  /* Estados para el Formulario de Registro de Ventas */
  const [showSaleForm, setShowSaleForm] = useState<boolean>(false);
  const [productsForSale, setProductsForSale] = useState<Product[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [formMessageType, setFormMessageType] = useState<'success' | 'danger' | null>(null);
  const [formLoading, setFormLoading] = useState<boolean>(false);


  /* Funciones de Carga de Datos */
  const fetchSalesAndClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const [salesRes, clientsRes] = await Promise.all([
        api.get<Sale[]>('/sales'),
        api.get<Client[]>('/clients')
      ]);

      setSales(salesRes.data);
      setClients(clientsRes.data);
    } catch (err: any) {
      console.error("Error al obtener ventas o clientes:", err);
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        setError("Tu sesión ha expirado o no tienes permisos para ver ventas.");
      } else {
        setError("No se pudieron cargar las ventas. Intenta de nuevo más tarde.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsForSale = async () => {
    try {
      const productsRes = await api.get<Product[]>('/products');
      setProductsForSale(productsRes.data.filter(p => p.stock > 0));
    } catch (error: any) {
      console.error("Error al cargar productos para la venta:", error);
      setFormMessage('Error al cargar productos disponibles. Intenta de nuevo.');
      setFormMessageType('danger');
    }
  };

  /* Efectos de Carga Inicial y Formulario */
  useEffect(() => {
    fetchSalesAndClients();
  }, []);

  useEffect(() => {
    if (showSaleForm) {
      fetchProductsForSale();
      setSelectedClientId('');
      setSelectedProductId('');
      setQuantity('1');
      setSaleItems([]);
      setFormMessage(null);
      setFormMessageType(null);
      setFormLoading(false);
    }
  }, [showSaleForm]);

  /* Funciones de la Tabla de Ventas */
  const handleShowSaleForm = () => {
    setShowSaleForm(true);
    setActionMessage(null);
    setActionMessageType(null);
  };

  const handleCancelSaleForm = () => {
    setShowSaleForm(false);
  };

  const handleSaleSuccess = () => {
    fetchSalesAndClients();
    setShowSaleForm(false);
    setActionMessage('Venta registrada exitosamente.');
    setActionMessageType('success');
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Cliente Desconocido';
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString();
  };

  const toggleDetails = (saleId: string) => {
    setOpenSaleId(openSaleId === saleId ? null : saleId);
  };

  /* Funciones del Formulario de Registro de Ventas */
  const handleAddProduct = () => {
    setFormMessage(null);
    if (!selectedProductId || parseInt(quantity) <= 0) {
      setFormMessage('Por favor, selecciona un producto y una cantidad válida.');
      setFormMessageType('danger');
      return;
    }

    const productToAdd = productsForSale.find(p => p.id === selectedProductId);
    const qtyNum = parseInt(quantity);

    if (productToAdd) {
      if (qtyNum > productToAdd.stock) {
        setFormMessage(`No hay suficiente stock para ${productToAdd.name}. Stock disponible: ${productToAdd.stock}`);
        setFormMessageType('danger');
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

      setProductsForSale(prevProducts => prevProducts.map(p =>
        p.id === productToAdd.id ? { ...p, stock: p.stock - qtyNum } : p
      ));

      setSelectedProductId('');
      setQuantity('1');
    }
  };

  const handleRemoveItem = (index: number) => {
    setFormMessage(null);
    const itemToRemove = saleItems[index];
    setSaleItems(prevItems => prevItems.filter((_, i) => i !== index));

    setProductsForSale(prevProducts => prevProducts.map(p =>
      p.id === itemToRemove.productId ? { ...p, stock: p.stock + itemToRemove.quantity } : p
    ));
  };

  const calculateTotal = () => {
    return saleItems.reduce((acc, item) => acc + (item.quantity * item.price), 0).toFixed(2);
  };

  const handleSubmitSale = async () => {
    setFormMessage(null);
    setFormLoading(true);

    if (!selectedClientId) {
      setFormMessage('Por favor, selecciona un cliente.');
      setFormMessageType('danger');
      setFormLoading(false);
      return;
    }
    if (saleItems.length === 0) {
      setFormMessage('Por favor, añade al menos un producto a la venta.');
      setFormMessageType('danger');
      setFormLoading(false);
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
      const { data } = await api.post<SaleApiResponse>('/sales', saleData);

      setFormMessage(data.message || 'Venta registrada exitosamente.');
      setFormMessageType('success');
      handleSaleSuccess();
    } catch (error: any) {
      console.error('Error de red al registrar venta:', error);
      if (error.response && error.response.data) {
        setFormMessage(error.response.data.message || 'Error al registrar la venta.');
        if (error.response.data.details && Array.isArray(error.response.data.details)) {
          setFormMessage(prev => `${prev}\n${error.response.data.details.join('\n')}`);
        }
      } else {
        setFormMessage('No se pudo conectar con el servidor. Intenta de nuevo más tarde.');
      }
      setFormMessageType('danger');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando ventas...</span>
        </Spinner>
        <p>Cargando ventas...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">{error}</Alert>
        <Button variant="secondary" onClick={fetchSalesAndClients}>Reintentar Carga</Button>
      </Container>
    );
  }

  if (showSaleForm) {
    return (
      <Container className="my-5 animate__animated animate__fadeInUp">
        <h2 className="mb-4">Registrar Nueva Venta</h2>
        {formMessage && <Alert variant={formMessageType || 'info'}>{formMessage}</Alert>}

        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Seleccionar Cliente</Form.Label>
            <Form.Select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              required
              disabled={formLoading}
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
                  disabled={formLoading}
                >
                  <option value="">Seleccione un producto</option>
                  {productsForSale.map(product => (
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
                  disabled={formLoading}
                />
              </Form.Group>
            </Col>
            <Col md={3} className="d-flex align-items-end">
              <Button variant="primary" onClick={handleAddProduct} className="w-100" disabled={formLoading}>
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
                        <Button variant="danger" size="sm" onClick={() => handleRemoveItem(index)} disabled={formLoading}>
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
        <div className="d-flex justify-content-end mt-3">
          <Button variant="secondary" onClick={handleCancelSaleForm} disabled={formLoading} className="me-2">
            Cancelar
          </Button>
          <Button variant="success" onClick={handleSubmitSale} disabled={formLoading || saleItems.length === 0 || !selectedClientId}>
            {formLoading ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1" />
                Registrando...
              </>
            ) : (
              `Registrar Venta ($${calculateTotal()})`
            )}
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="my-5 animate__animated animate__fadeInUp">
      <h2 className="mb-4 animate__animated animate__fadeInUp">
        Historial de Ventas
      </h2>
      {actionMessage && (
        <Alert variant={actionMessageType || "info"}>{actionMessage}</Alert>
      )}
      <div className="d-flex justify-content-end mb-3 animate__animated animate__fadeInUp">
        <Button variant="success" onClick={handleShowSaleForm}>
          Registrar Nueva Venta
        </Button>
      </div>
      {sales.length === 0 ? (
        <Alert variant="info" className="text-center">
          No hay ventas registradas. ¡Registra tu primera venta!
        </Alert>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>ID Venta</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Total</th>
              <th className="text-center">Detalles</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <React.Fragment key={sale.id}>
                <tr>
                  <td>{sale.id}</td>
                  <td>{formatDate(sale.date)}</td>
                  <td>{getClientName(sale.clientId)}</td>
                  <td>${sale.total.toFixed(2)}</td>
                  <td className="text-center">
                    <Button
                      variant="outline-info"
                      size="sm"
                      onClick={() => toggleDetails(sale.id)}
                      aria-controls={`sale-details-${sale.id}`}
                      aria-expanded={openSaleId === sale.id}
                    >
                      {openSaleId === sale.id ? "Ocultar" : "Ver"}
                    </Button>
                  </td>
                </tr>
                <tr>
                  <td colSpan={5}>
                    <Collapse in={openSaleId === sale.id}>
                      <div id={`sale-details-${sale.id}`}>
                        <h6 className="mt-2">Items de la Venta:</h6>
                        <ListGroup variant="flush">
                          {sale.items.map((item, itemIndex) => (
                            <ListGroup.Item
                              key={itemIndex}
                              className="d-flex justify-content-between align-items-center py-1"
                            >
                              <span>
                                {item.name} (x{item.quantity})
                              </span>
                              <span>
                                ${(item.quantity * item.price).toFixed(2)}
                              </span>
                            </ListGroup.Item>
                          ))}
                        </ListGroup>
                    </div>
                  </Collapse>
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
};

export default SalesPage;