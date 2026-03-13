import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layout/layout.jsx';
import Inicio from './pages/Inicio/Inicio.jsx';
import Home from './pages/Home/Home.jsx';
import EntradasSalidas from './pages/EntradasSalidas/EntradasSalidas.jsx';
import Cotizaciones from './pages/Cotizaciones/Cotizaciones.jsx';
import Cronograma from './pages/Cronograma/Cronograma.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import CuentasDeCobro from './pages/CuentasDeCobro/CuentasDeCobro.jsx';
import ComprobanteDeIngreso from './pages/ComprobanteDeIngreso/ComprobanteDeIngreso.jsx';

// import Laboratorio from './pages/Laboratorio/Laboratorio.jsx';
// import Viguetas from './pages/Laboratorio/Viguetas/Viguetas.jsx';
// import ConoArena from './pages/Laboratorio/ConoArena/ConoArena.jsx';
// import Cilindros from './pages/Laboratorio/Cilindros/Cilindros.jsx';
// import Esclerometria from './pages/Laboratorio/Esclerometria/Esclerometria.jsx';
// import LaboratorioMenu from './pages/Laboratorio/LaboratorioMenu.jsx';

export default function App() {
  return (
    <Routes>
      {/* Ruta pública */}
      <Route path="/" element={<Inicio />} />

      {/* Rutas protegidas */}
      <Route element={<ProtectedRoute allowedRoles={["admin", "laboratorio"]} />}>
        <Route element={<Layout />}>
          <Route path="home" element={<Home />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route element={<Layout />}>
          <Route path="entradas-salidas" element={<EntradasSalidas />} />
          <Route path="cotizaciones" element={<Cotizaciones />} />
          <Route path="cronograma" element={<Cronograma />} />
          <Route path="cuentas-de-cobro" element={<CuentasDeCobro />} />
          <Route path="comprobante-de-ingreso" element={<ComprobanteDeIngreso />} />
        </Route>
      </Route>

      {/* Rutas de laboratorio deshabilitadas temporalmente */}
      {/*
      <Route element={<ProtectedRoute allowedRoles={["admin", "laboratorio"]} />}>
        <Route element={<Layout />}>
          <Route path="laboratorio" element={<Laboratorio />}>
            <Route index element={<LaboratorioMenu />} />
            <Route path="viguetas" element={<Viguetas />} />
            <Route path="cono-arena" element={<ConoArena />} />
            <Route path="cilindros" element={<Cilindros />} />
            <Route path="esclerometria" element={<Esclerometria />} />
          </Route>
        </Route>
      </Route>
      */}

      {/* Cualquier otra ruta redirige al inicio */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
