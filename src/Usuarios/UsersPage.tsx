import React, { useEffect, useState } from 'react';
import { Container, Table, Button, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import api from '../api/axiosConfig';

/* Importaciones de Interfaces */
import type { User } from './interfaces/User';
import type { UserApiResponse } from './interfaces/UserApiResponse';

const UsersPage: React.FC = () => {
  /* Estados para la Tabla de Usuarios */
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionMessageType, setActionMessageType] = useState<'success' | 'danger' | null>(null);

  /* Estados para el Formulario de Crear/Editar */
  const [showUserForm, setShowUserForm] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  /* Estados del Formulario */
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [formMessageType, setFormMessageType] = useState<'success' | 'danger' | null>(null);
  const [formLoading, setFormLoading] = useState<boolean>(false);

  /* Estados para el Modal de Confirmación de Eliminación */
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  /* Funciones de Carga de Datos */
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<User[]>('/users_management');
      setUsers(response.data);
    } catch (err: any) {
      console.error("Error al obtener los usuarios:", err);
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        setError("Tu sesión ha expirado o no tienes permisos para ver usuarios.");
      } else {
        setError("No se pudieron cargar los usuarios. Intenta de nuevo más tarde.");
      }
    } finally {
      setLoading(false);
    }
  };

  /* Efectos de Carga Inicial y Formulario */
  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (showUserForm) {
      if (editingUser) {
        setUsername(editingUser.username);
        setRole(editingUser.role);
        setPassword('');
      } else {
        setUsername('');
        setPassword('');
        setRole('');
      }
      setFormMessage(null);
      setFormMessageType(null);
      setFormLoading(false);
    }
  }, [editingUser, showUserForm]);

  /* Funciones de la Tabla de Usuarios */
  const handleShowCreateForm = () => {
    setEditingUser(null);
    setShowUserForm(true);
    setActionMessage(null);
    setActionMessageType(null);
  };

  const handleShowEditForm = (user: User) => {
    setEditingUser(user);
    setShowUserForm(true);
    setActionMessage(null);
    setActionMessageType(null);
  };

  const handleCancelForm = () => {
    setShowUserForm(false);
    setEditingUser(null);
  };

  const handleUserSaved = () => {
    fetchUsers();
    setShowUserForm(false);
    setEditingUser(null);
    setActionMessage('Operación realizada con éxito.');
    setActionMessageType('success');
  };

  /* Lógica del Formulario de Usuario */
  const handleSubmitForm = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormMessage(null);
    setFormMessageType(null);
    setFormLoading(true);

    if (!username || !role || (!editingUser && !password)) {
      setFormMessage('Usuario, contraseña (al crear) y rol son obligatorios.');
      setFormMessageType('danger');
      return;
    }

    const userDataToSend: Partial<User> = {
      username,
      role,
    };
    if (password) {
      userDataToSend.password = password;
    }

    try {
      let response;
      if (editingUser) {
        response = await api.put<UserApiResponse>(`/users_management/${editingUser.id}`, userDataToSend);
      } else {
        response = await api.post<UserApiResponse>('/users_management', userDataToSend);
      }

      setFormMessage(response.data.message || `Usuario ${editingUser ? 'actualizado' : 'guardado'} exitosamente.`);
      setFormMessageType('success');
      handleUserSaved();

    } catch (error: any) {
      console.error('Error al guardar/actualizar el usuario:', error);
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
  const handleShowDeleteConfirm = (user: User) => {
    setUserToDelete(user);
    setShowDeleteConfirmModal(true);
    setActionMessage(null);
    setActionMessageType(null);
  };

  const handleCloseDeleteConfirm = () => {
    setShowDeleteConfirmModal(false);
    setUserToDelete(null);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    const userId = userToDelete.id;
    handleCloseDeleteConfirm();

    try {
      await api.delete(`/users_management/${userId}`);

      setActionMessage('Usuario eliminado exitosamente.');
      setActionMessageType('success');
      setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
    } catch (err: any) {
      console.error("Error al eliminar el usuario:", err);
      if (err.response && err.response.data && err.response.data.message) {
        setActionMessage(err.response.data.message);
      } else {
        setActionMessage('No se pudo conectar con el servidor para eliminar el usuario.');
      }
      setActionMessageType('danger');
    }
  };

  /* Renderizado Condicional de la Página */
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

  /* Formulario de Usuario */
  if (showUserForm) {
    return (
      <Container className="my-5 animate__animated animate__fadeInUp">
        <h2 className="mb-4">{editingUser ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}</h2>
        {formMessage && <Alert variant={formMessageType || 'info'}>{formMessage}</Alert>}

        <Form onSubmit={handleSubmitForm}>
          <Form.Group className="mb-3" controlId="formUsername">
            <Form.Label>Nombre de Usuario</Form.Label>
            <Form.Control
              type="text"
              placeholder="Ingrese el nombre de usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={formLoading}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formPassword">
            <Form.Label>Contraseña {editingUser && "(dejar en blanco para no cambiar)"}</Form.Label>
            <Form.Control
              type="password"
              placeholder={editingUser ? "Dejar en blanco para no cambiar" : "Ingrese la contraseña"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!editingUser}
              disabled={formLoading}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formRole">
            <Form.Label>Rol</Form.Label>
            <Form.Select
              aria-label="Seleccione un rol"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              disabled={formLoading}
            >
              <option value="">Seleccione un rol</option>
              <option value="admin">Administrador</option>
              <option value="vendedor">Vendedor</option>
              <option value="almacenista">Almacenista</option>
            </Form.Select>
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
                    className="me-1"
                  />
                  {editingUser ? 'Actualizando...' : 'Guardando...'}
                </>
              ) : (
                editingUser ? 'Actualizar Usuario' : 'Guardar Usuario'
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
        Gestión de Usuarios
      </h2>
      {actionMessage && (
        <Alert variant={actionMessageType || "info"}>{actionMessage}</Alert>
      )}
      <div className="d-flex justify-content-end mb-3 animate__animated animate__fadeInUp">
        <Button variant="success" onClick={handleShowCreateForm}>
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
                    onClick={() => handleShowEditForm(user)}
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