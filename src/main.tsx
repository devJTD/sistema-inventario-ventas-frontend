// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import { BrowserRouter } from 'react-router-dom';

// --- NUEVAS IMPORTACIONES ---
import { AuthProvider } from './contexts/AuthContext.tsx'; // Importa el AuthProvider
import './api/axiosConfig'; // Importa la configuración de Axios para que los interceptores se activen

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* Envuelve tu aplicación con el AuthProvider */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);