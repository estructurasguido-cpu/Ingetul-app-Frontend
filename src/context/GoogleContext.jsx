import { createContext, useContext } from "react";
import useGoogleAuth from "../hooks/useGoogleAuth";

const GoogleContext = createContext();

export function GoogleProvider({ children }) {
  const { token, user, role, login, logout, loading } = useGoogleAuth();

  return (
    <GoogleContext.Provider value={{ token, user, role, login, logout, loading }}>
      {children}
    </GoogleContext.Provider>
  );
}

export function useGoogle() {
  return useContext(GoogleContext);
}
