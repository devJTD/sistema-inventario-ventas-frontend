// src/pages/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
// Importa componentes de Recharts
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Define interfaces para los datos que se esperan del backend
interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string; // Asegúrate de que la categoría esté presente
}

interface Client {
  id: string;
  name: string;
}

interface Sale {
  id: string;
  total: number;
}

// Colores para las secciones del gráfico de pastel
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  // Estados para almacenar los datos resumidos
  const [totalProducts, setTotalProducts] = useState<number | null>(null);
  const [totalClients, setTotalClients] = useState<number | null>(null);
  const [totalSalesAmount, setTotalSalesAmount] = useState<number | null>(null);
  // Nuevo estado para los datos del gráfico de pastel
  const [productsByCategory, setProductsByCategory] = useState<{ name: string; value: number }[]>([]);

  // Estados para manejo de UI (carga y errores)
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, clientsRes, salesRes] = await Promise.all([
          fetch('http://localhost:3001/api/products'),
          fetch('http://localhost:3001/api/clients'),
          fetch('http://localhost:3001/api/sales')
        ]);

        if (!productsRes.ok) throw new Error(`Error al cargar productos: ${productsRes.status}`);
        if (!clientsRes.ok) throw new Error(`Error al cargar clientes: ${clientsRes.status}`);
        if (!salesRes.ok) throw new Error(`Error al cargar ventas: ${salesRes.status}`);

        const productsData: Product[] = await productsRes.json();
        const clientsData: Client[] = await clientsRes.json();
        const salesData: Sale[] = await salesRes.json();

        setTotalProducts(productsData.length);
        setTotalClients(clientsData.length);
        
        const salesSum = salesData.reduce((sum, sale) => sum + sale.total, 0);
        setTotalSalesAmount(salesSum);

        // --- Lógica para el gráfico de pastel: Contar productos por categoría ---
        const categoryCounts: { [key: string]: number } = {};
        productsData.forEach(product => {
          const category = product.category || 'Sin Categoría'; // Manejar productos sin categoría
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });

        const chartData = Object.keys(categoryCounts).map(category => ({
          name: category,
          value: categoryCounts[category]
        }));
        setProductsByCategory(chartData);
        // --- Fin lógica gráfico ---

      } catch (err: any) {
        console.error("Error al cargar datos del dashboard:", err);
        setError("No se pudieron cargar los datos del resumen. Intenta de nuevo más tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Funciones para la navegación de los botones
  const goToProducts = () => navigate('/productos');
  const goToNewSale = () => navigate('/ventas');
  const goToClients = () => navigate('/clientes');

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

  return (
    // AÑADIDO: pb-5 para padding-bottom en el contenedor principal
    <Container className="my-5 pb-5"> 
      <Row className="justify-content-center mb-4">
        <Col md={8} className="text-center">
          <h1>¡Bienvenido a tu Sistema de Inventario y Ventas!</h1>
          <p className="lead">
            Gestiona tus productos, ventas, clientes y proveedores de forma eficiente.
          </p>
        </Col>
      </Row>

      <Row className="justify-content-center">
        {/* Tarjeta de Resumen: Total Productos */}
        <Col md={4} className="mb-4">
          <Card className="text-center shadow-sm">
            <Card.Body>
              <Card.Title>Total Productos Registrados</Card.Title>
              <Card.Text className="fs-1 fw-bold">
                {totalProducts !== null ? totalProducts : 'Cargando...'}
              </Card.Text>
              <Button variant="primary" onClick={goToProducts}>Ir a Productos</Button>
            </Card.Body>
          </Card>
        </Col>

        {/* Tarjeta de Resumen: Total Clientes */}
        <Col md={4} className="mb-4">
          <Card className="text-center shadow-sm">
            <Card.Body>
              <Card.Title>Total Clientes Registrados</Card.Title>
              <Card.Text className="fs-1 fw-bold">
                {totalClients !== null ? totalClients : 'Cargando...'}
              </Card.Text>
              <Button variant="info" onClick={goToClients}>Ver Clientes</Button>
            </Card.Body>
          </Card>
        </Col>

        {/* Tarjeta de Resumen: Total Ventas */}
        <Col md={4} className="mb-4">
          <Card className="text-center shadow-sm">
            <Card.Body>
              <Card.Title>Total Ventas (Acumulado)</Card.Title>
              <Card.Text className="fs-1 fw-bold">
                {totalSalesAmount !== null ? `$${totalSalesAmount.toFixed(2)}` : 'Cargando...'}
              </Card.Text>
              <Button variant="success" onClick={goToNewSale}>Registrar Nueva Venta</Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Sección del Gráfico */}
      <Row className="mt-5 justify-content-center">
        <Col md={8}>
          <Card className="p-3 shadow-sm">
            <Card.Body>
              <Card.Title className="text-center mb-4">Distribución de Productos por Categoría</Card.Title>
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
                      nameKey="name" // Usa 'name' para la leyenda y el tooltip
                      animationBegin={0} // Inicia la animación inmediatamente
                      animationDuration={800} // Duración de la animación en milisegundos
                      isAnimationActive={true} // Habilita la animación
                    >
                      {productsByCategory.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip /> {/* Muestra información al pasar el ratón */}
                    <Legend /> {/* Muestra la leyenda de las categorías */}
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Alert variant="info" className="text-center">No hay datos de productos para mostrar en el gráfico.</Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Sección de Información General del Sistema - Eliminamos mb-5 de la Row y agregamos pb-5 al Container */}
      <Row className="mt-4"> 
        <Col>
          <Card className="p-3 shadow-sm">
            <Card.Body>
              <Card.Title>Información General del Sistema</Card.Title>
              <Card.Text>
                Este panel te ofrece una vista rápida de los datos clave de tu sistema de inventario y ventas.
                Puedes navegar a las secciones específicas usando el menú superior para una gestión detallada.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default DashboardPage;
