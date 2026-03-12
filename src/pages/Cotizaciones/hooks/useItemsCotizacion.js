import { useEffect, useState } from "react";

const ITEM_DEFAULT = {
    desc: "",
    und: "und",
    cant: 1,
    unit: 0,
    unitMode: "fixed",
    percentEditing: false,
    baseIndex: "",
    percent: 0,
};

function resolveUnit(arr, idx, seen = new Set()) {
    if (seen.has(idx)) return 0;
    seen.add(idx);

    const it = arr[idx];
    const u = Number(it?.unit ?? 0);

    if (it?.unitMode !== "percent") {
        return Number.isNaN(u) ? 0 : u;
    }

    if (it?.baseIndex === "" || it?.baseIndex === undefined) return 0;

    const base = Number(it.baseIndex);
    const pct = Number(it?.percent);

    if (!Number.isFinite(base) || base < 0 || base >= arr.length) return 0;
    if (!Number.isFinite(pct)) return 0;

    const baseUnit = resolveUnit(arr, base, seen);
    return (baseUnit * pct) / 100;
}

function normalizarItemsPorLongitud(items) {
    return items.map((it, idx) => {
        if (it.unitMode !== "percent") return it;

        if (it.baseIndex === "" || it.baseIndex === undefined) return it;

        if (it.baseIndex === idx) {
            return { ...it, baseIndex: "" };
        }

        if (it.baseIndex >= items.length) {
            return { ...it, baseIndex: "" };
        }

        return it;
    });
}

function recalcularItems(items) {
    return items.map((it, idx) => {
        if (it.unitMode === "percent") {
            return {
                ...it,
                unit: resolveUnit(items, idx),
            };
        }

        return it;
    });
}

export function useItemsCotizacion(initialItems = [ITEM_DEFAULT]) {
    const [items, setItems] = useState(initialItems);

    const agregarItem = () => {
        setItems((prev) => [...prev, { ...ITEM_DEFAULT }]);
    };

    const eliminarItem = (index) => {
        setItems((prev) => {
            const nuevos = prev.filter((_, i) => i !== index);
            const normalizados = normalizarItemsPorLongitud(nuevos);
            return recalcularItems(normalizados);
        });
    };

    const cambiarItem = (index, field, value) => {
        setItems((prev) => {
            const nuevos = [...prev];

            if (field === "cant" || field === "unit" || field === "percent") {
                const num = Number(value);
                nuevos[index][field] = Number.isNaN(num) ? 0 : num;
            } else if (field === "baseIndex") {
                nuevos[index][field] = value === "" ? "" : Number(value);
            } else {
                nuevos[index][field] = value;
            }

            return recalcularItems(nuevos);
        });
    };

    const reemplazarItems = (nuevosItems) => {
        const normalizados = normalizarItemsPorLongitud(nuevosItems);
        setItems(recalcularItems(normalizados));
    };

    const limpiarItems = () => {
        setItems([{ ...ITEM_DEFAULT }]);
    };

    useEffect(() => {
        setItems((prev) => {
            const normalizados = normalizarItemsPorLongitud(prev);
            return recalcularItems(normalizados);
        });
    }, [items.length]);

    return {
        items,
        setItems: reemplazarItems,
        agregarItem,
        eliminarItem,
        cambiarItem,
        limpiarItems,
        itemDefault: ITEM_DEFAULT,
    };
}