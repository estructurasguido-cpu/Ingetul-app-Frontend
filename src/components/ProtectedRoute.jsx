import { Navigate, Outlet } from "react-router-dom";
import { useGoogle } from "../context/GoogleContext";

export default function ProtectedRoute() {
  const { token, loading } = useGoogle();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        Verificando autenticación...
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
