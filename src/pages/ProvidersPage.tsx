// src/pages/ProvidersPage.tsx
import React, { useEffect, useState } from 'react';
import { Container, Table, Button, Spinner, Alert, Modal } from 'react-bootstrap';
import ProviderForm from '../components/ProviderForm'; // Importa el ProviderForm

// Define la interfaz para la estructura de tus proveedores
interface Provider {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
}

const ProvidersPage: React.FC = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionMessageType, setActionMessageType] = useState<'success' | 'danger' | null>(null);

  // Estados para el modal de Crear/Editar
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null); // Proveedor a editar, o null para crear

  // Estados para el modal de Confirmación de Eliminación
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState<boolean>(false);
  const [providerToDelete, setProviderToDelete] = useState<Provider | null>(null); // Proveedor que se va a eliminar

  // Función para cargar los proveedores del backend
  const fetchProviders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/api/providers'); // URL de tu backend para obtener proveedores
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Provider[] = await response.json();
      setProviders(data);
    } catch (err: any) {
      console.error("Error al obtener los proveedores:", err);
      setError("No se pudieron cargar los proveedores. Intenta de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  };

  // Carga los proveedores cuando el componente se monta
  useEffect(() => {
    fetchProviders();
  }, []);

  // Funciones para abrir y cerrar el modal de Crear/Editar
  const handleShowCreateModal = () => {
    setEditingProvider(null); // Asegurarse de que no haya proveedor en edición (modo crear)
    setShowFormModal(true);
    setActionMessage(null); // Limpiar mensajes al abrir modal
    setActionMessageType(null);
  };

  const handleShowEditModal = (provider: Provider) => {
    setEditingProvider(provider); // Establecer el proveedor a editar
    setShowFormModal(true);
    setActionMessage(null); // Limpiar mensajes al abrir modal
    setActionMessageType(null);
  };

  const handleCloseFormModal = () => {
    setShowFormModal(false);
    setEditingProvider(null); // Limpiar el proveedor en edición al cerrar el modal
  };

  // Función que se llama cuando el formulario del modal guarda (crea o edita) un proveedor
  const handleProviderSaved = () => {
    fetchProviders(); // Recargar la lista de proveedores para ver los cambios
    setActionMessage('Operación realizada con éxito.');
    setActionMessageType('success');
  };

  // --- Lógica para el modal de confirmación de eliminación ---
  const handleShowDeleteConfirm = (provider: Provider) => {
    setProviderToDelete(provider); // Guarda el proveedor a eliminar
    setShowDeleteConfirmModal(true); // Muestra el modal de confirmación
    setActionMessage(null); // Limpiar mensajes previos
    setActionMessageType(null);
  };

  const handleCloseDeleteConfirm = () => {
    setShowDeleteConfirmModal(false);
    setProviderToDelete(null); // Limpiar el proveedor a eliminar
  };

  const confirmDelete = async () => {
    if (!providerToDelete) return; // Si no hay proveedor para eliminar, salir

    const providerId = providerToDelete.id;
    handleCloseDeleteConfirm(); // Cierra el modal de confirmación

    try {
      const response = await fetch(`http://localhost:3001/api/providers/${providerId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setActionMessage('Proveedor eliminado exitosamente.');
        setActionMessageType('success');
        setProviders(prevProviders => prevProviders.filter(p => p.id !== providerId));
      } else {
        const errorData = await response.json();
        setActionMessage(errorData.message || 'Error al eliminar el proveedor.');
        setActionMessageType('danger');
      }
    } catch (err) {
      console.error("Error al eliminar el proveedor:", err);
      setActionMessage('No se pudo conectar con el servidor para eliminar el proveedor.');
      setActionMessageType('danger');
    }
  };
  // --- Fin lógica modal de confirmación de eliminación ---


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

  return (
    <Container className="my-5">
      <h2 className="mb-4">Gestión de Proveedores</h2>
      {actionMessage && <Alert variant={actionMessageType || 'info'}>{actionMessage}</Alert>}
      <div className="d-flex justify-content-end mb-3">
        <Button variant="success" onClick={handleShowCreateModal}>
          Agregar Nuevo Proveedor
        </Button>
      </div>
      {providers.length === 0 ? (
        <Alert variant="info" className="text-center">No hay proveedores registrados. ¡Agrega uno nuevo!</Alert>
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
                    onClick={() => handleShowEditModal(provider)}
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

      {/* El componente ProviderForm ahora se renderiza como un Modal */}
      <ProviderForm
        show={showFormModal}
        onHide={handleCloseFormModal}
        onSave={handleProviderSaved}
        editingProvider={editingProvider}
      />

      {/* Modal de Confirmación de Eliminación */}
      <Modal show={showDeleteConfirmModal} onHide={handleCloseDeleteConfirm} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ¿Estás seguro de que quieres eliminar al proveedor **{providerToDelete?.name}** (ID: {providerToDelete?.id})? Esta acción no se puede deshacer.
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