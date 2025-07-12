import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';

/* Importaciones de Recharts */
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import api from '../api/axiosConfig';

/* Importaciones de Interfaces */
import type { Product } from './interfaces/Product';
import type { Client } from './interfaces/Client';
import type { Sale } from './interfaces/Sale';

/* Constantes de Estilo */
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const DashboardPage: React.FC = () => {
  /* Estados de Datos del Dashboard */
  const [totalProducts, setTotalProducts] = useState<number | null>(null);
  const [totalClients, setTotalClients] = useState<number | null>(null);
  const [totalSalesAmount, setTotalSalesAmount] = useState<number | null>(null);
  const [productsByCategory, setProductsByCategory] = useState<{ name: string; value: number }[]>([]);

  /* Estados de UI y Errores */
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /* Efecto para Carga de Datos Inicial */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, clientsRes, salesRes] = await Promise.all([
          api.get<Product[]>('/products'),
          api.get<Client[]>('/clients'),
          api.get<Sale[]>('/sales')
        ]);

        const productsData = productsRes.data;
        const clientsData = clientsRes.data;
        const salesData = salesRes.data;

        setTotalProducts(productsData.length);
        setTotalClients(clientsData.length);

        const salesSum = salesData.reduce((sum, sale) => sum + sale.total, 0);
        setTotalSalesAmount(salesSum);

        /* Lógica para Contar Productos por Categoría */
        const categoryCounts: { [key: string]: number } = {};
        productsData.forEach(product => {
          const category = product.category || 'Sin Categoría';
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });

        const chartData = Object.keys(categoryCounts).map(category => ({
          name: category,
          value: categoryCounts[category]
        }));
        setProductsByCategory(chartData);

      } catch (err: any) {
        console.error("Error al cargar datos del dashboard:", err);
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          setError("Tu sesión ha expirado o no tienes permisos. Por favor, inicia sesión de nuevo.");
        } else {
          setError("No se pudieron cargar los datos del resumen. Intenta de nuevo más tarde.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /* Renderizado Condicional de Carga y Error */
  if (loading) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando datos del dashboard...</span>
        </Spinner>
        <p>Cargando información resumida...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">{error}</Alert>
        <Button variant="secondary" onClick={() => window.location.reload()}>Reintentar Carga</Button>
      </Container>
    );
  }

  /* Renderizado del Dashboard */
  return (
    <Container className="my-5 pb-5">
      /* Sección de Bienvenida */
      <Row className="justify-content-center mb-4">
        <Col md={8} className="text-center animate__animated animate__fadeInUp">
          <h1 className="animate__animated animate__fadeInUp">
            ¡Bienvenido a tu Sistema de Inventario y Ventas!
          </h1>
          <p className="lead animate__animated animate__fadeInUp">
            Gestiona tus productos, ventas, clientes y proveedores de forma
            eficiente.
          </p>
        </Col>
      </Row>

      /* Tarjetas de Resumen */
      <Row className="justify-content-center animate__animated animate__fadeInUp">
        <Col md={4} className="mb-4 animate__animated animate__fadeInUp">
          <Card className="text-center shadow-sm animate__animated animate__fadeInUp">
            <Card.Body>
              <Card.Title>Total Productos Registrados</Card.Title>
              <Card.Text className="fs-1 fw-bold">
                {totalProducts !== null ? totalProducts : "Cargando..."}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4} className="mb-4 animate__animated animate__fadeInUp">
          <Card className="text-center shadow-sm animate__animated animate__fadeInUp">
            <Card.Body>
              <Card.Title>Total Clientes Registrados</Card.Title>
              <Card.Text className="fs-1 fw-bold animate__animated animate__fadeInUp">
                {totalClients !== null ? totalClients : "Cargando..."}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4} className="mb-4 animate__animated animate__fadeInUp">
          <Card className="text-center shadow-sm animate__animated animate__fadeInUp">
            <Card.Body>
              <Card.Title>Total Ventas (Acumulado)</Card.Title>
              <Card.Text className="fs-1 fw-bold animate__animated animate__fadeInUp">
                {totalSalesAmount !== null
                  ? `$${totalSalesAmount.toFixed(2)}`
                  : "Cargando..."}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      /* Sección del Gráfico de Distribución de Productos por Categoría */
      <Row className="mt-5 justify-content-center animate__animated animate__fadeInUp">
        <Col md={8}>
          <Card className="p-3 shadow-sm animate__animated animate__fadeInUp">
            <Card.Body>
              <Card.Title className="text-center mb-4 animate__animated animate__fadeInUp">
                Distribución de Productos por Categoría
              </Card.Title>
              {productsByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={productsByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      animationBegin={0}
                      animationDuration={800}
                      isAnimationActive={true}
                    >
                      {productsByCategory.map((_entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Alert variant="info" className="text-center ">
                  No hay datos de productos para mostrar en el gráfico.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      /* Sección de Información General del Sistema */
      <Row className="mt-4 animate__animated animate__fadeInUp">
        <Col>
          <Card className="p-3 shadow-sm animate__animated animate__fadeInUp">
            <Card.Body>
              <Card.Title>Información General del Sistema</Card.Title>
              <Card.Text>
                Este panel te ofrece una vista rápida de los datos clave de tu
                sistema de inventario y ventas. Puedes navegar a las secciones
                específicas usando el menú superior para una gestión detallada.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default DashboardPage;
