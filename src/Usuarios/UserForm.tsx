// src/components/UserForm.tsx
import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Spinner, Modal } from 'react-bootstrap';

// --- ¡IMPORTA TU INSTANCIA CONFIGURADA DE AXIOS AQUÍ! ---
import api from '../api/axiosConfig';

// Define la interfaz para la estructura de tus usuarios
interface User {
  id: string;
  username: string;
  password?: string; // Opcional para edición, ya que no siempre se envía la contraseña
  role: string;
}

// Define los props que este formulario esperará
interface UserFormProps {
  show: boolean; // Controla la visibilidad del modal
  onHide: () => void; // Función para cerrar el modal
  onSave: () => void; // Función para notificar al padre que se guardó algo y refresque la tabla
  editingUser: User | null; // El usuario a editar, o null si es un nuevo usuario
}

// --- NUEVA INTERFAZ PARA LA RESPUESTA DE LA API (similar a ProductApiResponse) ---
interface UserApiResponse {
  message?: string; // Mensaje opcional del backend
  // Si tu backend devuelve el usuario creado/actualizado en la respuesta,
  // puedes añadirlo aquí, por ejemplo: user?: User;
}

const UserForm: React.FC<UserFormProps> = ({ show, onHide, onSave, editingUser }) => {
  // Estados para cada campo del formulario
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<string>('');

  // Estados para manejo de UI
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'danger' | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // useEffect para pre-rellenar el formulario cuando editingUser cambia
  useEffect(() => {
    if (editingUser) {
      setUsername(editingUser.username);
      setRole(editingUser.role);
      setPassword(''); // No pre-rellenar la contraseña por seguridad
    } else {
      // Limpiar el formulario si no hay usuario en edición (modo creación)
      setUsername('');
      setPassword('');
      setRole(''); // O un valor por defecto como 'vendedor'
    }
    // Limpiar mensajes al cambiar el usuario a editar (o a modo creación)
    setMessage(null);
    setMessageType(null);
  }, [editingUser, show]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setMessageType(null);
    setLoading(true);

    // Validaciones básicas del lado del cliente
    if (!username || !role || (!editingUser && !password)) { // Contraseña requerida solo al crear
      setMessage('Usuario, contraseña (al crear) y rol son obligatorios.');
      setMessageType('danger');
      setLoading(false);
      return;
    }

    const userDataToSend: Partial<User> = { // Partial porque password es opcional
      username,
      role,
    };
    if (password) { // Solo añadir contraseña si se ha modificado o es una creación
      userDataToSend.password = password;
    }

    try {
      let response;
      if (editingUser) {
        // --- CAMBIO: Usar api.put para actualizar y especificar el tipo de respuesta ---
        response = await api.put<UserApiResponse>(`/users_management/${editingUser.id}`, userDataToSend);
      } else {
        // --- CAMBIO: Usar api.post para crear y especificar el tipo de respuesta ---
        response = await api.post<UserApiResponse>('/users_management', userDataToSend);
      }

      // Axios no lanza error para 2xx, así que si llegamos aquí, fue exitoso
      // Ahora TypeScript sabe que response.data tiene la propiedad 'message'
      setMessage(response.data.message || `Usuario ${editingUser ? 'actualizado' : 'guardado'} exitosamente.`);
      setMessageType('success');
      onSave(); // Notificar al padre que la operación fue exitosa

      setTimeout(() => {
        onHide(); // Cerrar el modal
      }, 1000);

    } catch (error: any) { // Mantenemos 'any' para el error general
      console.error('Error al guardar/actualizar el usuario:', error);
      // El interceptor de respuesta en axiosConfig.ts ya debería manejar 401/403
      if (error.response && error.response.data && error.response.data.message) {
        setMessage(error.response.data.message);
      } else {
        setMessage('No se pudo conectar con el servidor. Intenta de nuevo más tarde.');
      }
      setMessageType('danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static" keyboard={false}>
      <Modal.Header closeButton>
        <Modal.Title>{editingUser ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {message && <Alert variant={messageType || 'info'}>{message}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="formUsername">
            <Form.Label>Nombre de Usuario</Form.Label>
            <Form.Control
              type="text"
              placeholder="Ingrese el nombre de usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formPassword">
            <Form.Label>Contraseña {editingUser && "(dejar en blanco para no cambiar)"}</Form.Label>
            <Form.Control
              type="password"
              placeholder={editingUser ? "Dejar en blanco para no cambiar" : "Ingrese la contraseña"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!editingUser} // Requerido solo si no estamos editando
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formRole">
            <Form.Label>Rol</Form.Label>
            <Form.Select
              aria-label="Seleccione un rol"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="">Seleccione un rol</option>
              <option value="admin">Administrador</option>
              <option value="vendedor">Vendedor</option>
              <option value="almacenista">Almacenista</option>
            </Form.Select>
          </Form.Group>

          <div className="d-flex justify-content-end">
            <Button variant="secondary" onClick={onHide} className="me-2" disabled={loading}>
              Cancelar
            </Button>
            <Button variant="success" type="submit" disabled={loading}>
              {loading ? (
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
      </Modal.Body>
    </Modal>
  );
};

export default UserForm;
