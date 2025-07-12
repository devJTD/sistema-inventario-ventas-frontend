import React, { useEffect, useState } from 'react';
import { Container, Table, Button, Spinner, Alert, Modal, Form, Row, Col } from 'react-bootstrap';
import api from '../api/axiosConfig';

/* Importaciones de Interfaces */
import type { Client } from './interfaces/Client';
import type { ClientApiResponse } from './interfaces/ClientApiResponse';

const ClientsPage: React.FC = () => {
  /* Estados para la Tabla de Clientes */
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionMessageType, setActionMessageType] = useState<'success' | 'danger' | null>(null);

  /* Estados para el Formulario de Crear/Editar */
  const [showClientForm, setShowClientForm] = useState<boolean>(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  /* Estados del Formulario */
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [formMessageType, setFormMessageType] = useState<'success' | 'danger' | null>(null);
  const [formLoading, setFormLoading] = useState<boolean>(false);

  /* Estados para el Modal de Confirmación de Eliminación */
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState<boolean>(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  /* Funciones de Carga de Datos */
  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<Client[]>('/clients');
      setClients(response.data);
    } catch (err: any) {
      console.error("Error al obtener los clientes:", err);
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        setError("Tu sesión ha expirado o no tienes permisos para ver clientes.");
      } else {
        setError("No se pudieron cargar los clientes. Intenta de nuevo más tarde.");
      }
    } finally {
      setLoading(false);
    }
  };

  /* Efectos de Carga Inicial y Formulario */
  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (showClientForm) {
      if (editingClient) {
        setName(editingClient.name);
        setEmail(editingClient.email);
        setPhone(editingClient.phone);
        setAddress(editingClient.address);
      } else {
        setName('');
        setEmail('');
        setPhone('');
        setAddress('');
      }
      setFormMessage(null);
      setFormMessageType(null);
      setFormLoading(false);
    }
  }, [editingClient, showClientForm]);

  /* Funciones para la Tabla de Clientes */
  const handleShowCreateForm = () => {
    setEditingClient(null);
    setShowClientForm(true);
    setActionMessage(null);
    setActionMessageType(null);
  };

  const handleShowEditForm = (client: Client) => {
    setEditingClient(client);
    setShowClientForm(true);
    setActionMessage(null);
    setActionMessageType(null);
  };

  const handleCancelForm = () => {
    setShowClientForm(false);
    setEditingClient(null);
  };

  const handleClientSaved = () => {
    fetchClients();
    setShowClientForm(false);
    setEditingClient(null);
    setActionMessage('Operación realizada con éxito.');
    setActionMessageType('success');
  };

  /* Lógica para el Formulario de Cliente */
  const handleSubmitForm = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormMessage(null);
    setFormMessageType(null);
    setFormLoading(true);

    if (!name || !email || !phone || !address) {
      setFormMessage('Todos los campos son obligatorios.');
      setFormMessageType('danger');
      setFormLoading(false);
      return;
    }

    const clientDataToSend = {
      name,
      email,
      phone,
      address,
    };

    try {
      let response;
      if (editingClient) {
        response = await api.put<ClientApiResponse>(`/clients/${editingClient.id}`, clientDataToSend);
      } else {
        response = await api.post<ClientApiResponse>('/clients', clientDataToSend);
      }

      setFormMessage(response.data.message || `Cliente ${editingClient ? 'actualizado' : 'guardado'} exitosamente.`);
      setFormMessageType('success');
      handleClientSaved();

    } catch (error: any) {
      console.error('Error al guardar/actualizar el cliente:', error);
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

  /* Lógica para el Modal de Confirmación de Eliminación */
  const handleShowDeleteConfirm = (client: Client) => {
    setClientToDelete(client);
    setShowDeleteConfirmModal(true);
    setActionMessage(null);
    setActionMessageType(null);
  };

  const handleCloseDeleteConfirm = () => {
    setShowDeleteConfirmModal(false);
    setClientToDelete(null);
  };

  const confirmDelete = async () => {
    if (!clientToDelete) return;

    const clientId = clientToDelete.id;
    handleCloseDeleteConfirm();

    try {
      await api.delete(`/clients/${clientId}`);

      setActionMessage('Cliente eliminado exitosamente.');
      setActionMessageType('success');
      setClients(prevClients => prevClients.filter(c => c.id !== clientId));
    } catch (err: any) {
      console.error("Error al eliminar el cliente:", err);
      if (err.response && err.response.data && err.response.data.message) {
        setActionMessage(err.response.data.message);
      } else {
        setActionMessage('No se pudo conectar con el servidor para eliminar el cliente.');
      }
      setActionMessageType('danger');
    }
  };

  /* Renderizado Condicional de la Página */
  if (loading) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando clientes...</span>
        </Spinner>
        <p>Cargando clientes...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">{error}</Alert>
        <Button variant="secondary" onClick={fetchClients}>Reintentar Carga</Button>
      </Container>
    );
  }

  /* Formulario de Cliente */
  if (showClientForm) {
    return (
      <Container className="my-5 animate__animated animate__fadeInUp">
        <h2 className="mb-4">{editingClient ? 'Editar Cliente' : 'Agregar Nuevo Cliente'}</h2>
        {formMessage && <Alert variant={formMessageType || 'info'}>{formMessage}</Alert>}

        <Form onSubmit={handleSubmitForm}>
          <Form.Group className="mb-3" controlId="formClientName">
            <Form.Label>Nombre del Cliente</Form.Label>
            <Form.Control
              type="text"
              placeholder="Ingrese el nombre del cliente"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={formLoading}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formClientEmail">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="Ingrese el email del cliente"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={formLoading}
            />
          </Form.Group>

          <Row className="mb-3">
            <Form.Group as={Col} controlId="formClientPhone">
              <Form.Label>Teléfono</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ingrese el teléfono"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={formLoading}
              />
            </Form.Group>

            <Form.Group as={Col} controlId="formClientAddress">
              <Form.Label>Dirección</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ingrese la dirección"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                disabled={formLoading}
              />
            </Form.Group>
          </Row>

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
                  {editingClient ? 'Actualizando...' : 'Guardando...'}
                </>
              ) : (
                editingClient ? 'Actualizar Cliente' : 'Guardar Cliente'
              )}
            </Button>
          </div>
        </Form>
      </Container>
    );
  }

  /* Tabla de Gestión de Clientes */
  return (
    <Container className="my-5 animate__animated animate__fadeInUp">
      <h2 className="mb-4 animate__animated animate__fadeInUp">
        Gestión de Clientes
      </h2>
      {actionMessage && (
        <Alert variant={actionMessageType || "info"}>{actionMessage}</Alert>
      )}
      <div className="d-flex justify-content-end mb-3 animate__animated animate__fadeInUp">
        <Button variant="success" onClick={handleShowCreateForm}>
          Agregar Nuevo Cliente
        </Button>
      </div>
      {clients.length === 0 ? (
        <Alert
          variant="info"
          className="text-center animate__animated animate__fadeInUp"
        >
          No hay clientes registrados. ¡Agrega uno nuevo!
        </Alert>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Dirección</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id}>
                <td>{client.id}</td>
                <td>{client.name}</td>
                <td>{client.email}</td>
                <td>{client.phone}</td>
                <td>{client.address}</td>
                <td className="text-center">
                  <Button
                    variant="info"
                    size="sm"
                    className="me-2"
                    onClick={() => handleShowEditForm(client)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleShowDeleteConfirm(client)}
                  >
                    Eliminar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      /* Modal de Confirmación de Eliminación */
      <Modal show={showDeleteConfirmModal} onHide={handleCloseDeleteConfirm} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ¿Estás seguro de que quieres eliminar al cliente **{clientToDelete?.name}** (ID: {clientToDelete?.id})? Esta acción no se puede deshacer.
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

export default ClientsPage;
