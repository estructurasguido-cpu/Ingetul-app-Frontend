import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layout/layout.jsx';
import Inicio from './pages/Inicio/Inicio.jsx';
import EntradasSalidas from './pages/EntradasSalidas/EntradasSalidas.jsx';
import Cotizaciones from './pages/Cotizaciones/Cotizaciones.jsx';
import Cronograma from './pages/Cronograma/Cronograma.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

export default function App() {
  return (
    <Routes>
      {/* Ruta pública */}
      <Route path="/" element={<Inicio />} />

      {/* Rutas protegidas */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="entradas-salidas" element={<EntradasSalidas />} />
          <Route path="cotizaciones" element={<Cotizaciones />} />
          <Route path="cronograma" element={<Cronograma />} />
        </Route>
      </Route>

      {/* Cualquier otra ruta redirige al inicio */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
