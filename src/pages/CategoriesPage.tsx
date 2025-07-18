import React, { useEffect, useState } from 'react';
import { Container, Table, Button, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import api from '../api/axiosConfig';

/* Importaciones de Interfaces */
import type { Category } from '../interfaces/Category';
import type { CategoryApiResponse } from '../interfaces/CategoryApiResponse';

const CategoriesPage: React.FC = () => {
  /* Estados para la Tabla de Categorías */
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionMessageType, setActionMessageType] = useState<'success' | 'danger' | null>(null);

  /* Estados para el Formulario de Crear/Editar */
  const [showCategoryForm, setShowCategoryForm] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  /* Estados del Formulario */
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [formMessageType, setFormMessageType] = useState<'success' | 'danger' | null>(null);
  const [formLoading, setFormLoading] = useState<boolean>(false);

  /* Estados para el Modal de Confirmación de Eliminación */
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState<boolean>(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  /* Funciones de Carga de Datos */
  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<Category[]>('/categories');
      setCategories(response.data);
    } catch (err: any) {
      console.error("Error al obtener las categorías:", err);
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        setError("Tu sesión ha expirado o no tienes permisos para ver categorías.");
      } else {
        setError("No se pudieron cargar las categorías. Intenta de nuevo más tarde.");
      }
    } finally {
      setLoading(false);
    }
  };

  /* Efectos de Carga Inicial y Formulario */
  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (showCategoryForm) {
      if (editingCategory) {
        setName(editingCategory.name);
        setDescription(editingCategory.description || '');
      } else {
        setName('');
        setDescription('');
      }
      setFormMessage(null);
      setFormMessageType(null);
      setFormLoading(false);
    }
  }, [editingCategory, showCategoryForm]);

  /* Funciones para la Tabla de Categorías */
  const handleShowCreateForm = () => {
    setEditingCategory(null);
    setShowCategoryForm(true);
    setActionMessage(null);
    setActionMessageType(null);
  };

  const handleShowEditForm = (category: Category) => {
    setEditingCategory(category);
    setShowCategoryForm(true);
    setActionMessage(null);
    setActionMessageType(null);
  };

  const handleCancelForm = () => {
    setShowCategoryForm(false);
    setEditingCategory(null);
  };

  const handleCategorySaved = () => {
    fetchCategories();
    setShowCategoryForm(false);
    setEditingCategory(null);
    setActionMessage('Operación realizada con éxito.');
    setActionMessageType('success');
  };

  /* Lógica para el Formulario de Categoría */
  const handleSubmitForm = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormMessage(null);
    setFormMessageType(null);
    setFormLoading(true);

    if (!name) {
      setFormMessage('El nombre de la categoría es obligatorio.');
      setFormMessageType('danger');
      setFormLoading(false);
      return;
    }

    const categoryDataToSend = {
      name,
      description: description || undefined, // Envía undefined si está vacío
    };

    try {
      let response;
      if (editingCategory) {
        response = await api.put<CategoryApiResponse>(`/categories/${editingCategory.id}`, categoryDataToSend);
      } else {
        response = await api.post<CategoryApiResponse>('/categories', categoryDataToSend);
      }

      setFormMessage(response.data.message || `Categoría ${editingCategory ? 'actualizada' : 'guardada'} exitosamente.`);
      setFormMessageType('success');
      handleCategorySaved();

    } catch (error: any) {
      console.error('Error al guardar/actualizar la categoría:', error);
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

  /* Lógica para el Modal de Confirmación de Eliminación */
  const handleShowDeleteConfirm = (category: Category) => {
    setCategoryToDelete(category);
    setShowDeleteConfirmModal(true);
    setActionMessage(null);
    setActionMessageType(null);
  };

  const handleCloseDeleteConfirm = () => {
    setShowDeleteConfirmModal(false);
    setCategoryToDelete(null);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;

    const categoryId = categoryToDelete.id;
    handleCloseDeleteConfirm();

    try {
      await api.delete(`/categories/${categoryId}`);

      setActionMessage('Categoría eliminada exitosamente.');
      setActionMessageType('success');
      setCategories(prevCategories => prevCategories.filter(c => c.id !== categoryId));
    } catch (err: any) {
      console.error("Error al eliminar la categoría:", err);
      if (err.response && err.response.data && err.response.data.message) {
        setActionMessage(err.response.data.message);
      } else {
        setActionMessage('No se pudo conectar con el servidor para eliminar la categoría.');
      }
      setActionMessageType('danger');
    }
  };

  /* Renderizado Condicional de la Página */
  if (loading) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando categorías...</span>
        </Spinner>
        <p>Cargando categorías...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">{error}</Alert>
        <Button variant="secondary" onClick={fetchCategories}>Reintentar Carga</Button>
      </Container>
    );
  }

  /* Formulario de Categoría */
  if (showCategoryForm) {
    return (
      <Container className="my-5 animate__animated animate__fadeInUp">
        <h2 className="mb-4">{editingCategory ? 'Editar Categoría' : 'Agregar Nueva Categoría'}</h2>
        {formMessage && <Alert variant={formMessageType || 'info'}>{formMessage}</Alert>}

        <Form onSubmit={handleSubmitForm}>
          <Form.Group className="mb-3" controlId="formCategoryName">
            <Form.Label>Nombre de la Categoría</Form.Label>
            <Form.Control
              type="text"
              placeholder="Ingrese el nombre de la categoría"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={formLoading}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formCategoryDescription">
            <Form.Label>Descripción (Opcional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              placeholder="Ingrese una descripción para la categoría"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={formLoading}
            />
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
                  {editingCategory ? 'Actualizando...' : 'Guardando...'}
                </>
              ) : (
                editingCategory ? 'Actualizar Categoría' : 'Guardar Categoría'
              )}
            </Button>
          </div>
        </Form>
      </Container>
    );
  }

  /* Tabla de Gestión de Categorías */
  return (
    <Container className="my-5 animate__animated animate__fadeInUp">
      <h2 className="mb-4 animate__animated animate__fadeInUp">
        Gestión de Categorías
      </h2>
      {actionMessage && (
        <Alert variant={actionMessageType || "info"}>{actionMessage}</Alert>
      )}
      <div className="d-flex justify-content-end mb-3 animate__animated animate__fadeInUp">
        <Button variant="success" onClick={handleShowCreateForm}>
          Agregar Nueva Categoría
        </Button>
      </div>
      {categories.length === 0 ? (
        <Alert variant="info" className="text-center">
          No hay categorías registradas. ¡Agrega una nueva!
        </Alert>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td>{category.id}</td>
                <td>{category.name}</td>
                <td>{category.description || "N/A"}</td>
                <td className="text-center">
                  <Button
                    variant="info"
                    size="sm"
                    className="me-2"
                    onClick={() => handleShowEditForm(category)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleShowDeleteConfirm(category)}
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
          ¿Estás seguro de que quieres eliminar la categoría **
          {categoryToDelete?.name}** (ID: {categoryToDelete?.id})? Esta acción no
          se puede deshacer.
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

export default CategoriesPage;
