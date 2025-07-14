import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axiosConfig';

/* Importación de Interfaces */
import type { LoginResponse } from './interfaces/LoginResponse';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'danger' | null>(null);

  const navigate = useNavigate();
  const { login } = useAuth();

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
      const response = await api.post<LoginResponse>('/login', { username, password });

      const { token, user } = response.data;

      login(token, user);

      setMessage(response.data.message || 'Login exitoso.');
      setMessageType('success');
      navigate('/');

    } catch (error: any) {
      console.error('Error al iniciar sesión:', error);
      if (error.response && error.response.data && error.response.data.message) {
        setMessage(error.response.data.message);
      } else {
        setMessage('No se pudo conectar con el servidor o error desconocido. Intenta de nuevo más tarde.');
      }
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