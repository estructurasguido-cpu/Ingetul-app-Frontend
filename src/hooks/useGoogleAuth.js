import { useEffect, useState } from "react";
import { GOOGLE_CONFIG } from "../config/google";
import { supabase } from "../services/supabaseClient";

export default function useGoogleAuth() {

  const { CLIENT_ID, REDIRECT_URI, SCOPE } = GOOGLE_CONFIG;

  const [token, setToken] = useState(localStorage.getItem("google_token"));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("google_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [role, setRole] = useState(() => localStorage.getItem("google_role") || null);
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

  const getUserInfo = async (token) => {
    try {
      const res = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!res.ok) return null;

      return await res.json();
    } catch {
      return null;
    }
  };

  useEffect(() => {

    const stored = localStorage.getItem("google_token");

    if (stored) {
      setToken(stored);
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
        return;
      }

      let info = user;

      if (!info) {
        info = await getUserInfo(token);

        if (!info) {
          console.warn("❌ No se pudo obtener userinfo");
          logout();
          return;
        }

        localStorage.setItem("google_user", JSON.stringify(info));
        setUser(info);
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("email", info.email)
        .single();

      if (error || !data) {
        console.warn("❌ Usuario no registrado:", info.email);
        logout();
        return;
      }

      localStorage.setItem("google_role", data.role);
      setRole(data.role);

      setLoading(false);
    };

    validar();
  }, [token, user]);

  const login = () => {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}&response_type=token&scope=${encodeURIComponent(SCOPE)}`;
    window.location.href = authUrl;
  };

  const logout = () => {
    localStorage.removeItem("google_token");
    localStorage.removeItem("google_user");
    localStorage.removeItem("google_role");
    setToken(null);
    setUser(null);
    setRole(null);
  };

  return { token, user, role, login, logout, loading };
}
