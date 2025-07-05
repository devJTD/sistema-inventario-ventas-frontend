// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
// --- CORRECCIÓN AQUÍ ---
import type { UserRole } from '../App'; // Añade 'type' antes de { UserRole }

// Definimos los props que este componente esperará
interface LoginPageProps {
  onLogin: (role: UserRole) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'danger' | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setMessageType(null);

    if (!username || !password) {
      setMessage('Por favor, ingresa tu usuario y contraseña.');
      setMessageType('danger');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Login exitoso.');
        setMessageType('success');
        onLogin(data.user.role as UserRole);
      } else {
        setMessage(data.message || 'Error al iniciar sesión.');
        setMessageType('danger');
      }
    } catch (error) {
      console.error('Error de red o del servidor:', error);
      setMessage('No se pudo conectar con el servidor. Intenta de nuevo más tarde.');
      setMessageType('danger');
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <Row>
        <Col md={12}>
          <Card className="p-4 shadow-lg" style={{ width: '25rem' }}>
            <Card.Body>
              <h2 className="text-center mb-4">Iniciar Sesión</h2>
              {message && <Alert variant={messageType || 'info'}>{message}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="formBasicUsername">
                  <Form.Label>Usuario</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ingrese su nombre de usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-4" controlId="formBasicPassword">
                  <Form.Label>Contraseña</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Form.Group>

                <Button variant="primary" type="submit" className="w-100">
                  Acceder
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginPage;
