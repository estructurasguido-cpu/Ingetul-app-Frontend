import { useEffect } from "react";

function safeParse(json) {
    try {
        return JSON.parse(json);
    } catch {
        return null;
    }
}

export function useCotizacionStorage({
    STORAGE_KEY,
    STORAGE_BACKUP_KEY,
    state,
    setState,
    items,
    setItems,
    setDepartamentoSel,
    setCiudadSel,
}) {

    useEffect(() => {
        const backup = localStorage.getItem(STORAGE_BACKUP_KEY);
        const raw = backup ?? localStorage.getItem(STORAGE_KEY);

        const data = safeParse(raw);
        if (!data) return;

        setState(prev => ({
            ...prev,
            ...data
        }));

        if (data.departamentoSel !== undefined) {
            setDepartamentoSel(data.departamentoSel);
        }

        if (data.ciudadSel !== undefined) {
            setCiudadSel(data.ciudadSel);
        }

        if (Array.isArray(data.items) && data.items.length) {
            setItems(data.items);
        }

        if (backup) localStorage.removeItem(STORAGE_BACKUP_KEY);

    }, []);

    useEffect(() => {

        const payload = {
            ...state,
            items,
            _ts: Date.now()
        };

        const t = setTimeout(() => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        }, 300);

        return () => clearTimeout(t);

    }, [state, items]);
}