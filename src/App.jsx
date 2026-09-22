import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layout/layout.jsx';
import Inicio from './pages/Inicio/Inicio.jsx';
import Home from './pages/Home/Home.jsx';
import EntradasSalidas from './pages/EntradasSalidas/EntradasSalidas.jsx';
import Cotizaciones from './pages/Cotizaciones/Cotizaciones.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import CuentasDeCobro from './pages/CuentasDeCobro/CuentasDeCobro.jsx';
import ComprobanteDeIngreso from './pages/ComprobanteDeIngreso/ComprobanteDeIngreso.jsx';
import Vehiculos from './pages/Vehiculos/Vehiculos.jsx';
import Programacion from './pages/Programacion/Programacion.jsx';

export default function App() {
  const allRoles = ["admin", "logistica"];

  return (
    <Routes>
      {/* Ruta pública */}
      <Route path="/" element={<Inicio />} />

      {/* Rutas protegidas */}
      <Route element={<ProtectedRoute allowedRoles={allRoles} />}>
        <Route element={<Layout />}>
          <Route path="home" element={<Home />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route element={<Layout />}>
          <Route path="entradas-salidas" element={<EntradasSalidas />} />
          <Route path="cotizaciones" element={<Cotizaciones />} />
          <Route path="cuentas-de-cobro" element={<CuentasDeCobro />} />
          <Route path="comprobante-de-ingreso" element={<ComprobanteDeIngreso />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={allRoles} />}>
        <Route element={<Layout />}>
          <Route path="vehiculos" element={<Vehiculos />} />
          <Route path="programacion" element={<Programacion />} />
        </Route>
      </Route>

      {/* Cualquier otra ruta redirige al inicio */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
