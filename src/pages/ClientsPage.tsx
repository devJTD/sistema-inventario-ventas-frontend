// src/pages/ClientsPage.tsx
import React, { useEffect, useState } from 'react';
import { Container, Table, Button, Spinner, Alert, Modal } from 'react-bootstrap';
import ClientForm from '../components/ClientForm'; // Importa el ClientForm

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
      const response = await fetch('http://localhost:3001/api/clients'); // URL de tu backend para obtener clientes
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Client[] = await response.json();
      setClients(data);
    } catch (err: any) {
      console.error("Error al obtener los clientes:", err);
      setError("No se pudieron cargar los clientes. Intenta de nuevo más tarde.");
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
      const response = await fetch(`http://localhost:3001/api/clients/${clientId}`, {
        method: 'DELETE', // Método DELETE
      });

      if (response.ok) { // Un 204 No Content también es 'ok'
        setActionMessage('Cliente eliminado exitosamente.');
        setActionMessageType('success');
        // Actualizar la lista de clientes en el frontend sin recargar toda la página
        setClients(prevClients => prevClients.filter(c => c.id !== clientId));
      } else {
        const errorData = await response.json(); // Intentar leer el mensaje de error del backend
        setActionMessage(errorData.message || 'Error al eliminar el cliente.');
        setActionMessageType('danger');
      }
    } catch (err) {
      console.error("Error al eliminar el cliente:", err);
      setActionMessage('No se pudo conectar con el servidor para eliminar el cliente.');
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
    <Container className="my-5">
      <h2 className="mb-4">Gestión de Clientes</h2>
      {/* Muestra mensajes de acciones (crear, editar, eliminar) */}
      {actionMessage && <Alert variant={actionMessageType || 'info'}>{actionMessage}</Alert>}
      <div className="d-flex justify-content-end mb-3">
        {/* Botón para abrir el modal de creación de cliente */}
        <Button variant="success" onClick={handleShowCreateModal}>
          Agregar Nuevo Cliente
        </Button>
      </div>
      {clients.length === 0 ? (
        <Alert variant="info" className="text-center">No hay clientes registrados. ¡Agrega uno nuevo!</Alert>
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
                    onClick={() => handleShowEditModal(client)} // Llama a handleShowEditModal
                  >
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleShowDeleteConfirm(client)} // Llama al modal de confirmación
                  >
                    Eliminar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* El componente ClientForm ahora se renderiza como un Modal */}
      <ClientForm
        show={showFormModal}
        onHide={handleCloseFormModal}
        onSave={handleClientSaved}
        editingClient={editingClient}
      />

      {/* Modal de Confirmación de Eliminación */}
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
