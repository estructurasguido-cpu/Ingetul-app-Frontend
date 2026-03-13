import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGoogle } from "../../context/GoogleContext";

export default function Inicio() {
  const { token, user, login, loading } = useGoogle();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && token && user) {
      navigate("/home", { replace: true });
    }
  }, [loading, token, user, navigate]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <p className="text-lg text-gray-600 animate-pulse">
          Verificando autenticación...
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-3xl font-bold text-blue-600 mb-6">
        INGETUL
      </h1>

      <button
        onClick={login}
        className="bg-green-600 text-white px-6 py-3 rounded-lg text-lg hover:bg-green-700 transition-all"
      >
        Iniciar con Google
      </button>
    </div>
  );
}
