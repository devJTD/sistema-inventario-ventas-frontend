// src/components/ClientForm.tsx
import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Alert, Spinner, Modal } from 'react-bootstrap';

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

// Define los props que este formulario esperará
interface ClientFormProps {
  show: boolean; // Controla la visibilidad del modal
  onHide: () => void; // Función para cerrar el modal
  onSave: () => void; // Función para notificar al padre que se guardó algo y refresque la tabla
  editingClient: Client | null; // El cliente a editar, o null si es un nuevo cliente
}

// --- NUEVA INTERFAZ PARA LA RESPUESTA DE LA API (similar a ProductApiResponse) ---
interface ClientApiResponse {
  message?: string; // Mensaje opcional del backend
  // Si tu backend devuelve el cliente creado/actualizado en la respuesta,
  // puedes añadirlo aquí, por ejemplo: client?: Client;
}

const ClientForm: React.FC<ClientFormProps> = ({ show, onHide, onSave, editingClient }) => {
  // Estados para cada campo del formulario
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');

  // Estados para manejo de UI
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'danger' | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // useEffect para pre-rellenar el formulario cuando editingClient cambia
  useEffect(() => {
    if (editingClient) {
      setName(editingClient.name);
      setEmail(editingClient.email);
      setPhone(editingClient.phone);
      setAddress(editingClient.address);
    } else {
      // Limpiar el formulario si no hay cliente en edición (modo creación)
      setName('');
      setEmail('');
      setPhone('');
      setAddress('');
    }
    // Limpiar mensajes al cambiar el cliente a editar (o a modo creación)
    setMessage(null);
    setMessageType(null);
  }, [editingClient, show]); // También cuando el modal se muestra/oculta

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setMessageType(null);
    setLoading(true);

    // Validaciones básicas del lado del cliente
    if (!name || !email || !phone || !address) {
      setMessage('Todos los campos son obligatorios.');
      setMessageType('danger');
      setLoading(false);
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
        // --- CAMBIO: Usar api.put para actualizar y especificar el tipo de respuesta ---
        response = await api.put<ClientApiResponse>(`/clients/${editingClient.id}`, clientDataToSend);
      } else {
        // --- CAMBIO: Usar api.post para crear y especificar el tipo de respuesta ---
        response = await api.post<ClientApiResponse>('/clients', clientDataToSend);
      }

      // Axios no lanza error para 2xx, así que si llegamos aquí, fue exitoso
      // Ahora TypeScript sabe que response.data tiene la propiedad 'message'
      setMessage(response.data.message || `Cliente ${editingClient ? 'actualizado' : 'guardado'} exitosamente.`);
      setMessageType('success');
      onSave(); // Notificar al padre que la operación fue exitosa

      // Opcional: Cerrar el modal automáticamente después de un éxito
      setTimeout(() => {
        onHide(); // Cerrar el modal
      }, 1000);

    } catch (error: any) { // Mantenemos 'any' para el error general
      console.error('Error al guardar/actualizar el cliente:', error);
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
        <Modal.Title>{editingClient ? 'Editar Cliente' : 'Agregar Nuevo Cliente'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {message && <Alert variant={messageType || 'info'}>{message}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="formClientName">
            <Form.Label>Nombre del Cliente</Form.Label>
            <Form.Control
              type="text"
              placeholder="Ingrese el nombre del cliente"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
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
              />
            </Form.Group>
          </Row>

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
                  {editingClient ? 'Actualizando...' : 'Guardando...'}
                </>
              ) : (
                editingClient ? 'Actualizar Cliente' : 'Guardar Cliente'
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default ClientForm;
