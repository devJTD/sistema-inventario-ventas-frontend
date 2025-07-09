// src/pages/UsersPage.tsx
import React, { useEffect, useState } from 'react';
import { Container, Table, Button, Spinner, Alert, Modal } from 'react-bootstrap';
import UserForm from './UserForm'; // Importa el UserForm

// Define la interfaz para la estructura de tus usuarios (sin contraseña para la tabla)
interface User {
  id: string;
  username: string;
  role: string;
}

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionMessageType, setActionMessageType] = useState<'success' | 'danger' | null>(null);

  // Estados para el modal de Crear/Editar
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null); // Usuario a editar, o null para crear

  // Estados para el modal de Confirmación de Eliminación
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null); // Usuario que se va a eliminar

  // Función para cargar los usuarios del backend
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      // Nota: La API para users_management filtra la contraseña en GET
      const response = await fetch('http://localhost:3001/api/users_management');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: User[] = await response.json();
      setUsers(data);
    } catch (err: any) {
      console.error("Error al obtener los usuarios:", err);
      setError("No se pudieron cargar los usuarios. Intenta de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  };

  // Carga los usuarios cuando el componente se monta
  useEffect(() => {
    fetchUsers();
  }, []);

  // Funciones para abrir y cerrar el modal de Crear/Editar
  const handleShowCreateModal = () => {
    setEditingUser(null); // Asegurarse de que no haya usuario en edición (modo crear)
    setShowFormModal(true);
    setActionMessage(null); // Limpiar mensajes al abrir modal
    setActionMessageType(null);
  };

  const handleShowEditModal = (user: User) => {
    setEditingUser(user); // Establecer el usuario a editar
    setShowFormModal(true);
    setActionMessage(null); // Limpiar mensajes al abrir modal
    setActionMessageType(null);
  };

  const handleCloseFormModal = () => {
    setShowFormModal(false);
    setEditingUser(null); // Limpiar el usuario en edición al cerrar el modal
  };

  // Función que se llama cuando el formulario del modal guarda (crea o edita) un usuario
  const handleUserSaved = () => {
    fetchUsers(); // Recargar la lista de usuarios para ver los cambios
    setActionMessage('Operación realizada con éxito.');
    setActionMessageType('success');
  };

  // --- Lógica para el modal de confirmación de eliminación ---
  const handleShowDeleteConfirm = (user: User) => {
    setUserToDelete(user); // Guarda el usuario a eliminar
    setShowDeleteConfirmModal(true); // Muestra el modal de confirmación
    setActionMessage(null); // Limpiar mensajes previos
    setActionMessageType(null);
  };

  const handleCloseDeleteConfirm = () => {
    setShowDeleteConfirmModal(false);
    setUserToDelete(null); // Limpiar el usuario a eliminar
  };

  const confirmDelete = async () => {
    if (!userToDelete) return; // Si no hay usuario para eliminar, salir

    const userId = userToDelete.id;
    handleCloseDeleteConfirm(); // Cierra el modal de confirmación

    try {
      const response = await fetch(`http://localhost:3001/api/users_management/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setActionMessage('Usuario eliminado exitosamente.');
        setActionMessageType('success');
        setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
      } else {
        const errorData = await response.json();
        setActionMessage(errorData.message || 'Error al eliminar el usuario.');
        setActionMessageType('danger');
      }
    } catch (err) {
      console.error("Error al eliminar el usuario:", err);
      setActionMessage('No se pudo conectar con el servidor para eliminar el usuario.');
      setActionMessageType('danger');
    }
  };
  // --- Fin lógica modal de confirmación de eliminación ---


  if (loading) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando usuarios...</span>
        </Spinner>
        <p>Cargando usuarios...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">{error}</Alert>
        <Button variant="secondary" onClick={fetchUsers}>Reintentar Carga</Button>
      </Container>
    );
  }

 return (
    <Container className="my-5 animate__animated animate__fadeInUp">
      <h2 className="mb-4 animate__animated animate__fadeInUp">
        Gestión de Usuarios
      </h2>
      {actionMessage && (
        <Alert variant={actionMessageType || "info"}>{actionMessage}</Alert>
      )}
      <div className="d-flex justify-content-end mb-3 animate__animated animate__fadeInUp">
        <Button variant="success" onClick={handleShowCreateModal}>
          Agregar Nuevo Usuario
        </Button>
      </div>
      {users.length === 0 ? (
        <Alert variant="info" className="text-center">
          No hay usuarios registrados. ¡Agrega uno nuevo!
        </Alert>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>ID</th>
              <th>Usuario</th>
              <th>Rol</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.role}</td>
                <td className="text-center">
                  <Button
                    variant="info"
                    size="sm"
                    className="me-2"
                    onClick={() => handleShowEditModal(user)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleShowDeleteConfirm(user)}
                  >
                    Eliminar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* El componente UserForm ahora se renderiza como un Modal */}
      <UserForm
        show={showFormModal}
        onHide={handleCloseFormModal}
        onSave={handleUserSaved}
        editingUser={editingUser}
      />

      {/* Modal de Confirmación de Eliminación */}
      <Modal
        show={showDeleteConfirmModal}
        onHide={handleCloseDeleteConfirm}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ¿Estás seguro de que quieres eliminar al usuario **
          {userToDelete?.username}** (ID: {userToDelete?.id})? Esta acción no se
          puede deshacer.
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

export default UsersPage;