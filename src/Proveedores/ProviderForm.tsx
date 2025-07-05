// src/components/ProviderForm.tsx
import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Alert, Spinner, Modal } from 'react-bootstrap';

// Define la interfaz para la estructura de tus proveedores
interface Provider {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
}

// Define los props que este formulario esperará
interface ProviderFormProps {
  show: boolean; // Controla la visibilidad del modal
  onHide: () => void; // Función para cerrar el modal
  onSave: () => void; // Función para notificar al padre que se guardó algo y refresque la tabla
  editingProvider: Provider | null; // El proveedor a editar, o null si es un nuevo proveedor
}

const ProviderForm: React.FC<ProviderFormProps> = ({ show, onHide, onSave, editingProvider }) => {
  // Estados para cada campo del formulario
  const [name, setName] = useState<string>('');
  const [contactPerson, setContactPerson] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');

  // Estados para manejo de UI
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'danger' | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // useEffect para pre-rellenar el formulario cuando editingProvider cambia
  useEffect(() => {
    if (editingProvider) {
      setName(editingProvider.name);
      setContactPerson(editingProvider.contactPerson);
      setEmail(editingProvider.email);
      setPhone(editingProvider.phone);
      setAddress(editingProvider.address);
    } else {
      // Limpiar el formulario si no hay proveedor en edición (modo creación)
      setName('');
      setContactPerson('');
      setEmail('');
      setPhone('');
      setAddress('');
    }
    // Limpiar mensajes al cambiar el proveedor a editar (o a modo creación)
    setMessage(null);
    setMessageType(null);
  }, [editingProvider, show]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setMessageType(null);
    setLoading(true);

    // Validaciones básicas del lado del cliente
    if (!name || !contactPerson || !email || !phone || !address) {
      setMessage('Todos los campos son obligatorios.');
      setMessageType('danger');
      setLoading(false);
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
      const method = editingProvider ? 'PUT' : 'POST'; // Si hay editingProvider, es PUT; si no, es POST
      const url = editingProvider
        ? `http://localhost:3001/api/providers/${editingProvider.id}`
        : 'http://localhost:3001/api/providers';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(providerDataToSend),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || `Proveedor ${editingProvider ? 'actualizado' : 'guardado'} exitosamente.`);
        setMessageType('success');
        onSave(); // Notificar al padre que la operación fue exitosa

        setTimeout(() => {
          onHide(); // Cerrar el modal
        }, 1000);

      } else {
        setMessage(data.message || `Error al ${editingProvider ? 'actualizar' : 'guardar'} el proveedor.`);
        setMessageType('danger');
      }
    } catch (error) {
      console.error('Error de red o del servidor:', error);
      setMessage('No se pudo conectar con el servidor. Intenta de nuevo más tarde.');
      setMessageType('danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static" keyboard={false}>
      <Modal.Header closeButton>
        <Modal.Title>{editingProvider ? 'Editar Proveedor' : 'Agregar Nuevo Proveedor'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {message && <Alert variant={messageType || 'info'}>{message}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="formProviderName">
            <Form.Label>Nombre del Proveedor</Form.Label>
            <Form.Control
              type="text"
              placeholder="Ingrese el nombre del proveedor"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
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
            />
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
                  {editingProvider ? 'Actualizando...' : 'Guardando...'}
                </>
              ) : (
                editingProvider ? 'Actualizar Proveedor' : 'Guardar Proveedor'
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default ProviderForm;