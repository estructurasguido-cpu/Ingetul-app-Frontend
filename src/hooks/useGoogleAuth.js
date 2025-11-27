import { useEffect, useState } from "react";
import { GOOGLE_CONFIG } from "../config/google";

export default function useGoogleAuth() {

  const { CLIENT_ID, REDIRECT_URI, SCOPE } = GOOGLE_CONFIG;

  const [token, setToken] = useState(localStorage.getItem("google_token"));
  const [loading, setLoading] = useState(true);

  const checkGoogleToken = async (token) => {
    if (!token) return false;

    try {
      const res = await fetch(
        "https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=" + token
      );
      return res.ok;
    } catch {
      return false;
    }
  };

  useEffect(() => {

    const stored = localStorage.getItem("google_token");

    if (stored) {
      setToken(stored);
      setLoading(false);
      return;
    }

    if (window.location.hash.includes("access_token")) {
      const params = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = params.get("access_token");

      if (accessToken) {
        localStorage.setItem("google_token", accessToken);
        setToken(accessToken);
        alert("✅ Conectado con Google correctamente");
      }

      window.history.replaceState({}, document.title, window.location.pathname);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    const validar = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      const valido = await checkGoogleToken(token);

      if (!valido) {
        console.warn("❌ Token inválido o expirado");
        logout();
        login();
      } else {
        console.log("✅ Token válido");
      }

      setLoading(false);
    };

    validar();
  }, [token]);

  const login = () => {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}&response_type=token&scope=${encodeURIComponent(SCOPE)}`;
    window.location.href = authUrl;
  };

  const logout = () => {
    localStorage.removeItem("google_token");
    setToken(null);
  };

  return { token, login, logout, loading };
}
