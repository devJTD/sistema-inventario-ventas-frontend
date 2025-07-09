// src/pages/ClientsPage.tsx
import React, { useEffect, useState } from 'react';
import { Container, Table, Button, Spinner, Alert, Modal } from 'react-bootstrap';
import ClientForm from '../Clientes/ClientForm'; // Asegúrate de que la ruta sea correcta

// --- ¡IMPORTA TU INSTANCIA CONFIGURADA DE AXIOS AQUÍ! ---
import api from '../api/axiosConfig';

// Define la interfaz para la estructura de tus clientes
interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionMessageType, setActionMessageType] = useState<'success' | 'danger' | null>(null);

  // Estados para el modal de Crear/Editar
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null); // Cliente a editar, o null para crear

  // Estados para el modal de Confirmación de Eliminación
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState<boolean>(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null); // Cliente que se va a eliminar

  // Función para cargar los clientes del backend
  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    try {
      // --- ¡CAMBIO CRÍTICO AQUÍ: USA 'api.get' EN LUGAR DE 'fetch'! ---
      const response = await api.get<Client[]>('/clients'); // Axios ya maneja la URL base y el JSON
      setClients(response.data); // Los datos están en response.data
    } catch (err: any) { // Mantenemos 'any' para el error general
      console.error("Error al obtener los clientes:", err);
      // El interceptor de respuesta en axiosConfig.ts ya debería manejar 401/403
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        setError("Tu sesión ha expirado o no tienes permisos para ver clientes.");
      } else {
        setError("No se pudieron cargar los clientes. Intenta de nuevo más tarde.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Carga los clientes cuando el componente se monta
  useEffect(() => {
    fetchClients();
  }, []);

  // Funciones para abrir y cerrar el modal de Crear/Editar
  const handleShowCreateModal = () => {
    setEditingClient(null); // Asegurarse de que no haya cliente en edición (modo crear)
    setShowFormModal(true);
    setActionMessage(null); // Limpiar mensajes al abrir modal
    setActionMessageType(null);
  };

  const handleShowEditModal = (client: Client) => {
    setEditingClient(client); // Establecer el cliente a editar
    setShowFormModal(true);
    setActionMessage(null); // Limpiar mensajes al abrir modal
    setActionMessageType(null);
  };

  const handleCloseFormModal = () => {
    setShowFormModal(false);
    setEditingClient(null); // Limpiar el cliente en edición al cerrar el modal
  };

  // Función que se llama cuando el formulario del modal guarda (crea o edita) un cliente
  const handleClientSaved = () => {
    fetchClients(); // Recargar la lista de clientes para ver los cambios
    // El modal se cerrará automáticamente desde ClientForm al guardar con éxito
    setActionMessage('Operación realizada con éxito.'); // Mensaje genérico de éxito
    setActionMessageType('success');
  };

  // --- Lógica para el modal de confirmación de eliminación ---
  const handleShowDeleteConfirm = (client: Client) => {
    setClientToDelete(client); // Guarda el cliente a eliminar
    setShowDeleteConfirmModal(true); // Muestra el modal de confirmación
    setActionMessage(null); // Limpiar mensajes previos
    setActionMessageType(null);
  };

  const handleCloseDeleteConfirm = () => {
    setShowDeleteConfirmModal(false);
    setClientToDelete(null); // Limpiar el cliente a eliminar
  };

  const confirmDelete = async () => {
    if (!clientToDelete) return; // Si no hay cliente para eliminar, salir

    const clientId = clientToDelete.id;
    handleCloseDeleteConfirm(); // Cierra el modal de confirmación

    try {
      // --- ¡CAMBIO CRÍTICO AQUÍ: USA 'api.delete' EN LUGAR DE 'fetch'! ---
      // Axios maneja el 204 No Content como una respuesta exitosa
      await api.delete(`/clients/${clientId}`);

      setActionMessage('Cliente eliminado exitosamente.');
      setActionMessageType('success');
      // Actualizar la lista de clientes en el frontend sin recargar toda la página
      setClients(prevClients => prevClients.filter(c => c.id !== clientId));
    } catch (err: any) { // Mantenemos 'any' para el error general
      console.error("Error al eliminar el cliente:", err);
      // El interceptor de respuesta en axiosConfig.ts ya debería manejar 401/403
      if (err.response && err.response.data && err.response.data.message) {
        setActionMessage(err.response.data.message);
      } else {
        setActionMessage('No se pudo conectar con el servidor para eliminar el cliente.');
      }
      setActionMessageType('danger');
    }
  };
  // --- Fin lógica modal de confirmación de eliminación ---


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

  return (
    <Container className="my-5 animate__animated animate__fadeInUp">
      <h2 className="mb-4 animate__animated animate__fadeInUp">
        Gestión de Clientes
      </h2>
      {actionMessage && (
        <Alert variant={actionMessageType || "info"}>{actionMessage}</Alert>
      )}
      <div className="d-flex justify-content-end mb-3 animate__animated animate__fadeInUp ">
        <Button variant="success" onClick={handleShowCreateModal}>
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
                    onClick={() => handleShowEditModal(client)}
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

      <ClientForm
        show={showFormModal}
        onHide={handleCloseFormModal}
        onSave={handleClientSaved}
        editingClient={editingClient}
      />

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
