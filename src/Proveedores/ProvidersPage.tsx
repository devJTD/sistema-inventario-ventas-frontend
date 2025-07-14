import React, { useEffect, useState } from 'react';
import { Container, Table, Button, Spinner, Alert, Modal, Form, Row, Col } from 'react-bootstrap';
import api from '../api/axiosConfig';

/* Importaciones de Interfaces */
import type { Provider } from './interfaces/Provider';
import type { ProviderApiResponse } from './interfaces/ProviderApiResponse';

const ProvidersPage: React.FC = () => {
  /* Estados para la Tabla de Proveedores */
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionMessageType, setActionMessageType] = useState<'success' | 'danger' | null>(null);

  /* Estados para el Formulario de Crear/Editar */
  const [showProviderForm, setShowProviderForm] = useState<boolean>(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);

  /* Estados del Formulario */
  const [name, setName] = useState<string>('');
  const [contactPerson, setContactPerson] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [formMessageType, setFormMessageType] = useState<'success' | 'danger' | null>(null);
  const [formLoading, setFormLoading] = useState<boolean>(false);

  /* Estados para el Modal de Confirmación de Eliminación */
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState<boolean>(false);
  const [providerToDelete, setProviderToDelete] = useState<Provider | null>(null);

  /* Funciones de Carga de Datos */
  const fetchProviders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<Provider[]>('/providers');
      setProviders(response.data);
    } catch (err: any) {
      console.error("Error al obtener los proveedores:", err);
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        setError("Tu sesión ha expirado o no tienes permisos para ver proveedores.");
      } else {
        setError("No se pudieron cargar los proveedores. Intenta de nuevo más tarde.");
      }
    } finally {
      setLoading(false);
    }
  };

  /* Efectos de Carga Inicial y Formulario */
  useEffect(() => {
    fetchProviders();
  }, []);

  useEffect(() => {
    if (showProviderForm) {
      if (editingProvider) {
        setName(editingProvider.name);
        setContactPerson(editingProvider.contactPerson);
        setEmail(editingProvider.email);
        setPhone(editingProvider.phone);
        setAddress(editingProvider.address);
      } else {
        setName('');
        setContactPerson('');
        setEmail('');
        setPhone('');
        setAddress('');
      }
      setFormMessage(null);
      setFormMessageType(null);
      setFormLoading(false);
    }
  }, [editingProvider, showProviderForm]);

  /* Funciones de la Tabla de Proveedores */
  const handleShowCreateForm = () => {
    setEditingProvider(null);
    setShowProviderForm(true);
    setActionMessage(null);
    setActionMessageType(null);
  };

  const handleShowEditForm = (provider: Provider) => {
    setEditingProvider(provider);
    setShowProviderForm(true);
    setActionMessage(null);
    setActionMessageType(null);
  };

  const handleCancelForm = () => {
    setShowProviderForm(false);
    setEditingProvider(null);
  };

  const handleProviderSaved = () => {
    fetchProviders();
    setShowProviderForm(false);
    setEditingProvider(null);
    setActionMessage('Operación realizada con éxito.');
    setActionMessageType('success');
  };

  /* Lógica del Formulario de Proveedor */
  const handleSubmitForm = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormMessage(null);
    setFormMessageType(null);
    setFormLoading(true);

    if (!name || !contactPerson || !email || !phone || !address) {
      setFormMessage('Todos los campos son obligatorios.');
      setFormMessageType('danger');
      setFormLoading(false);
      return;
    }

    const providerDataToSend = {
      name,
      contactPerson,
      email,
      phone,
      address,
    };

    try {
      let response;
      if (editingProvider) {
        response = await api.put<ProviderApiResponse>(`/providers/${editingProvider.id}`, providerDataToSend);
      } else {
        response = await api.post<ProviderApiResponse>('/providers', providerDataToSend);
      }

      setFormMessage(response.data.message || `Proveedor ${editingProvider ? 'actualizado' : 'guardado'} exitosamente.`);
      setFormMessageType('success');
      handleProviderSaved();

    } catch (error: any) {
      console.error('Error al guardar/actualizar el proveedor:', error);
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

  /* Lógica del Modal de Confirmación de Eliminación */
  const handleShowDeleteConfirm = (provider: Provider) => {
    setProviderToDelete(provider);
    setShowDeleteConfirmModal(true);
    setActionMessage(null);
    setActionMessageType(null);
  };

  const handleCloseDeleteConfirm = () => {
    setShowDeleteConfirmModal(false);
    setProviderToDelete(null);
  };

  const confirmDelete = async () => {
    if (!providerToDelete) return;

    const providerId = providerToDelete.id;
    handleCloseDeleteConfirm();

    try {
      await api.delete(`/providers/${providerId}`);

      setActionMessage('Proveedor eliminado exitosamente.');
      setActionMessageType('success');
      setProviders(prevProviders => prevProviders.filter(p => p.id !== providerId));
    } catch (err: any) {
      console.error("Error al eliminar el proveedor:", err);
      if (err.response && err.response.data && err.response.data.message) {
        setActionMessage(err.response.data.message);
      } else {
        setActionMessage('No se pudo conectar con el servidor para eliminar el proveedor.');
      }
      setActionMessageType('danger');
    }
  };

  /* Renderizado Condicional de la Página */
  if (loading) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando proveedores...</span>
        </Spinner>
        <p>Cargando proveedores...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">{error}</Alert>
        <Button variant="secondary" onClick={fetchProviders}>Reintentar Carga</Button>
      </Container>
    );
  }

  /* Formulario de Proveedor */
  if (showProviderForm) {
    return (
      <Container className="my-5 animate__animated animate__fadeInUp">
        <h2 className="mb-4">{editingProvider ? 'Editar Proveedor' : 'Agregar Nuevo Proveedor'}</h2>
        {formMessage && <Alert variant={formMessageType || 'info'}>{formMessage}</Alert>}

        <Form onSubmit={handleSubmitForm}>
          <Form.Group className="mb-3" controlId="formProviderName">
            <Form.Label>Nombre del Proveedor</Form.Label>
            <Form.Control
              type="text"
              placeholder="Ingrese el nombre del proveedor"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={formLoading}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formContactPerson">
            <Form.Label>Persona de Contacto</Form.Label>
            <Form.Control
              type="text"
              placeholder="Ingrese el nombre de la persona de contacto"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              required
              disabled={formLoading}
            />
          </Form.Group>

          <Row className="mb-3">
            <Form.Group as={Col} controlId="formProviderEmail">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Ingrese el email del proveedor"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={formLoading}
              />
            </Form.Group>

            <Form.Group as={Col} controlId="formProviderPhone">
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
          </Row>

          <Form.Group className="mb-3" controlId="formProviderAddress">
            <Form.Label>Dirección</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              placeholder="Ingrese la dirección del proveedor"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
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
                  />
                  {editingProvider ? 'Actualizando...' : 'Guardando...'}
                </>
              ) : (
                editingProvider ? 'Actualizar Proveedor' : 'Guardar Proveedor'
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
        Gestión de Proveedores
      </h2>
      {actionMessage && (
        <Alert variant={actionMessageType || "info"}>{actionMessage}</Alert>
      )}
      <div className="d-flex justify-content-end mb-3 animate__animated animate__fadeInUp">
        <Button variant="success" onClick={handleShowCreateForm}>
          Agregar Nuevo Proveedor
        </Button>
      </div>
      {providers.length === 0 ? (
        <Alert variant="info" className="text-center">
          No hay proveedores registrados. ¡Agrega uno nuevo!
        </Alert>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Contacto</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Dirección</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((provider) => (
              <tr key={provider.id}>
                <td>{provider.id}</td>
                <td>{provider.name}</td>
                <td>{provider.contactPerson}</td>
                <td>{provider.email}</td>
                <td>{provider.phone}</td>
                <td>{provider.address}</td>
                <td className="text-center">
                  <Button
                    variant="info"
                    size="sm"
                    className="me-2"
                    onClick={() => handleShowEditForm(provider)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleShowDeleteConfirm(provider)}
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
          ¿Estás seguro de que quieres eliminar al proveedor **
          {providerToDelete?.name}** (ID: {providerToDelete?.id})? Esta acción
          no se puede deshacer.
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

export default ProvidersPage;