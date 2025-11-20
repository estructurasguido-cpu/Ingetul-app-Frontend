import { createContext, useContext } from "react";
import useGoogleAuth from "../hooks/useGoogleAuth";

const GoogleContext = createContext();

export function GoogleProvider({ children }) {
  const { token, login, logout, loading } = useGoogleAuth();

  return (
    <GoogleContext.Provider value={{ token, login, logout, loading }}>
      {children}
    </GoogleContext.Provider>
  );
}

export function useGoogle() {
  return useContext(GoogleContext);
}
