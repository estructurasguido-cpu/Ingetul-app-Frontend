import { createContext, useContext, useState } from "react";

const LoaderContext = createContext();

export function LoaderProvider({ children }) {
    const [loading, setLoading] = useState(false);
    const [mensaje, setMensaje] = useState("Procesando...");

    const showLoader = (msg = "Procesando...") => {
        setMensaje(msg);
        setLoading(true);
    };

    const hideLoader = () => {
        setLoading(false);
        setMensaje("Procesando...");
    };

    return (
        <LoaderContext.Provider value={{ loading, showLoader, hideLoader, mensaje }}>
            {children}
        </LoaderContext.Provider>
    );
}

export function useLoader() {
    const ctx = useContext(LoaderContext);
    if (!ctx) {
        throw new Error("useLoader debe usarse dentro del LoaderProvider");
    }
    return ctx;
}
