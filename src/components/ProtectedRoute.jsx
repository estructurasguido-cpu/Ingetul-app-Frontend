import { Navigate, Outlet } from "react-router-dom";
import { useGoogle } from "../context/GoogleContext";

export default function ProtectedRoute({ allowedRoles }) {
  const { token, user, role, loading } = useGoogle();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        Verificando autenticación...
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}