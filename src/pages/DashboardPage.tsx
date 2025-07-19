import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';

/* Importaciones de Recharts */
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'; // Importar componentes de BarChart

import api from '../api/axiosConfig';

/* Importaciones de Interfaces */
import type { Product } from '../interfaces/Product'; // Ruta corregida
import type { Client } from '../interfaces/Client'; // Ruta corregida
import type { Sale } from '../interfaces/Sale'; // Ruta corregida
import type { Category } from '../interfaces/Category'; // Ruta corregida

/* Constantes de Estilo */
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
const BAR_COLORS = ['#3b82f6', '#16a34a', '#ca8a04', '#ea580c', '#9333ea']; // Colores para el gráfico de barras

/* Interfaz para el Producto Más Vendido */
interface TopSoldProduct {
  productId: string;
  name: string;
  totalQuantitySold: number;
}

const DashboardPage: React.FC = () => {
  /* Estados de Datos del Dashboard */
  const [totalProducts, setTotalProducts] = useState<number | null>(null);
  const [totalClients, setTotalClients] = useState<number | null>(null);
  const [totalSalesAmount, setTotalSalesAmount] = useState<number | null>(null);
  const [productsByCategory, setProductsByCategory] = useState<{ name: string; value: number }[]>([]);
  const [, setAvailableCategories] = useState<Category[]>([]);
  const [topSoldProducts, setTopSoldProducts] = useState<TopSoldProduct[]>([]);

  /* Estados de UI y Errores */
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /* Efecto para Carga de Datos Inicial */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, clientsRes, salesRes, categoriesRes, topProductsRes] = await Promise.all([
          api.get<Product[]>('/products'),
          api.get<Client[]>('/clients'),
          api.get<Sale[]>('/sales'),
          api.get<Category[]>('/categories'),
          api.get<TopSoldProduct[]>('/sales/top-products', { params: { period: 'last30days' } }) // Obtener productos más vendidos
        ]);

        const productsData = productsRes.data;
        const clientsData = clientsRes.data;
        const salesData = salesRes.data;
        const categoriesData = categoriesRes.data;
        const topSoldProductsData = topProductsRes.data;

        setTotalProducts(productsData.length);
        setTotalClients(clientsData.length);
        setAvailableCategories(categoriesData);
        setTopSoldProducts(topSoldProductsData); // Establecer productos más vendidos

        const salesSum = salesData.reduce((sum, sale) => sum + sale.total, 0);
        setTotalSalesAmount(salesSum);

        /* Lógica para Contar Productos por Categoría */
        const categoryCounts: { [key: string]: number } = {};
        productsData.forEach(product => {
          const categoryName = categoriesData.find(cat => cat.id === product.categoryId)?.name || 'Sin Categoría';
          categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
        });

        const chartData = Object.keys(categoryCounts).map(categoryName => ({
          name: categoryName,
          value: categoryCounts[categoryName]
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

      <Row className="mt-5 justify-content-center animate__animated animate__fadeInUp">
        <Col md={6} className="mb-4">
          <Card className="p-3 shadow-sm animate__animated animate__fadeInUp h-100">
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

        {/* Nueva Sección: Productos Más Vendidos (Gráfico de Barras) */}
        <Col md={6} className="mb-4">
          <Card className="p-3 shadow-sm animate__animated animate__fadeInUp h-100">
            <Card.Body>
              <Card.Title className="text-center mb-4 animate__animated animate__fadeInUp">
                Top 5 Productos Más Vendidos (Últimos 30 Días)
              </Card.Title>
              {topSoldProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={topSoldProducts}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-30} // Inclinar etiquetas para nombres largos
                      textAnchor="end"
                      height={60} // Aumentar altura para etiquetas inclinadas
                      interval={0} // Mostrar todas las etiquetas
                      tickFormatter={(value) => {
                        // Cortar y añadir elipsis si el nombre es muy largo
                        return value.length > 15 ? value.substring(0, 12) + '...' : value;
                      }}
                    />
                    <YAxis label={{ value: 'Unidades Vendidas', angle: -90, position: 'insideLeft' }} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Legend />
                    <Bar dataKey="totalQuantitySold" name="Unidades Vendidas">
                      {topSoldProducts.map((_entry, index) => (
                        <Cell key={`bar-cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Alert variant="info" className="text-center">
                  No hay datos de ventas recientes para los productos más vendidos.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

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
