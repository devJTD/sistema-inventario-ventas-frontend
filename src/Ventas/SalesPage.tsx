// src/pages/SalesPage.tsx
import React, { useEffect, useState } from 'react';
import { Container, Table, Button, Spinner, Alert, ListGroup, Collapse } from 'react-bootstrap';
import SaleFormModal from './SaleFormModal'; // Importa el SaleFormModal

// Interfaces necesarias
interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

interface Sale {
  id: string;
  date: string;
  clientId: string;
  items: SaleItem[];
  total: number;
}

interface Client { // Para mostrar el nombre del cliente en la tabla
  id: string;
  name: string;
}

const SalesPage: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [clients, setClients] = useState<Client[]>([]); // Para mapear clientId a clientName
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionMessageType, setActionMessageType] = useState<'success' | 'danger' | null>(null);

  // Estados para el modal de registro de ventas
  const [showSaleModal, setShowSaleModal] = useState<boolean>(false);
  const [openSaleId, setOpenSaleId] = useState<string | null>(null); // Para expandir/contraer detalles de venta

  // Función para cargar las ventas y los clientes (para mostrar nombres)
  const fetchSalesAndClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const [salesRes, clientsRes] = await Promise.all([
        fetch('http://localhost:3001/api/sales'),
        fetch('http://localhost:3001/api/clients')
      ]);

      if (!salesRes.ok) throw new Error(`HTTP error! Sales status: ${salesRes.status}`);
      if (!clientsRes.ok) throw new Error(`HTTP error! Clients status: ${clientsRes.status}`);

      const salesData: Sale[] = await salesRes.json();
      const clientsData: Client[] = await clientsRes.json();

      setSales(salesData);
      setClients(clientsData);
    } catch (err: any) {
      console.error("Error al obtener ventas o clientes:", err);
      setError("No se pudieron cargar las ventas. Intenta de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesAndClients();
  }, []);

  const handleShowSaleModal = () => {
    setShowSaleModal(true);
    setActionMessage(null); // Limpiar mensajes al abrir modal
    setActionMessageType(null);
  };

  const handleCloseSaleModal = () => {
    setShowSaleModal(false);
  };

  const handleSaleSuccess = () => {
    fetchSalesAndClients(); // Recargar ventas y productos (para ver stock actualizado)
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

  return (
    <Container className="my-5">
      <h2 className="mb-4">Historial de Ventas</h2>
      {actionMessage && <Alert variant={actionMessageType || 'info'}>{actionMessage}</Alert>}
      <div className="d-flex justify-content-end mb-3">
        <Button variant="success" onClick={handleShowSaleModal}>
          Registrar Nueva Venta
        </Button>
      </div>
      {sales.length === 0 ? (
        <Alert variant="info" className="text-center">No hay ventas registradas. ¡Registra tu primera venta!</Alert>
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
                      {openSaleId === sale.id ? 'Ocultar' : 'Ver'}
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
                            <ListGroup.Item key={itemIndex} className="d-flex justify-content-between align-items-center py-1">
                              <span>{item.name} (x{item.quantity})</span>
                              <span>${(item.quantity * item.price).toFixed(2)}</span>
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

      {/* Modal para registrar una nueva venta */}
      <SaleFormModal
        show={showSaleModal}
        onHide={handleCloseSaleModal}
        onSaleSuccess={handleSaleSuccess}
      />
    </Container>
  );
};

export default SalesPage;