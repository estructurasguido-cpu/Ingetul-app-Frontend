import { useEffect, useRef, useState } from "react";
import { Filter, RotateCcw, X } from "lucide-react";

export function FiltersModal({ isOpen, onClose, initialFilters, onApply }) {
    const [localFilters, setLocalFilters] = useState(initialFilters);
    const [filterError, setFilterError] = useState("");
    const dialogRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return undefined;

        setLocalFilters(initialFilters);
        setFilterError("");
        const previousFocus = document.activeElement;
        const dialog = dialogRef.current;
        dialog?.focus();

        function handleKeyDown(event) {
            if (event.key === "Escape") onClose();
            if (event.key !== "Tab" || !dialog) return;

            const focusable = [...dialog.querySelectorAll("button, input, select")]
                .filter(element => !element.disabled);
            if (focusable.length === 0) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            previousFocus?.focus?.();
        };
    }, [initialFilters, isOpen, onClose]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setLocalFilters(prev => ({ ...prev, [name]: value }));
        setFilterError("");
    };

    const handleClear = () => {
        setLocalFilters({ tipo: "", cuenta: "", desde: "", hasta: "", texto: "" });
        setFilterError("");
    };

    const handleApply = () => {
        if (localFilters.desde && localFilters.hasta && localFilters.desde > localFilters.hasta) {
            setFilterError("La fecha inicial no puede ser posterior a la fecha final.");
            return;
        }

        onApply(localFilters);
        onClose();
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/45 p-3"
            onClick={handleBackdropClick}
        >
            <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="filters-title" tabIndex={-1} className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-4 shadow-xl outline-none sm:p-6">
                <button
                    onClick={onClose}
                    aria-label="Cerrar filtros"
                    className="absolute right-3 top-3 rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                    type="button"
                >
                    <X size={19} />
                </button>

                <h2 id="filters-title" className="mb-4 pr-10 text-lg font-semibold">Filtros</h2>

                <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-5">

                    {/* Tipo */}
                    <label className="flex flex-col">
                        Tipo
                        <select
                            name="tipo"
                            value={localFilters.tipo}
                            onChange={handleChange}
                            className="border px-2 py-1 rounded"
                        >
                            <option value="">Todos</option>
                            <option value="Entrada">Entrada</option>
                            <option value="Salida">Salida</option>
                            <option value="Prestamo">Préstamo</option>
                            <option value="Bancos">Bancos</option>
                        </select>
                    </label>

                    <label className="flex flex-col">
                        Cuenta
                        <select
                            name="cuenta"
                            value={localFilters.cuenta}
                            onChange={handleChange}
                            className="rounded border px-2 py-1"
                        >
                            <option value="">Todas</option>
                            <option value="Ahorros">Cuenta de ahorro</option>
                            <option value="Ingetul">A Ingetul</option>
                        </select>
                    </label>

                    {/* Desde */}
                    <label className="flex flex-col">
                        Desde
                        <input
                            type="date"
                            name="desde"
                            value={localFilters.desde}
                            onChange={handleChange}
                            max={localFilters.hasta || undefined}
                            className="border px-2 py-1 rounded"
                        />
                    </label>

                    {/* Hasta */}
                    <label className="flex flex-col">
                        Hasta
                        <input
                            type="date"
                            name="hasta"
                            value={localFilters.hasta}
                            onChange={handleChange}
                            min={localFilters.desde || undefined}
                            className="border px-2 py-1 rounded"
                        />
                    </label>

                    {/* Texto descripción */}
                    <label className="flex flex-col">
                        Buscar texto
                        <input
                            type="text"
                            name="texto"
                            value={localFilters.texto}
                            placeholder="Buscar en descripción…"
                            onChange={handleChange}
                            className="border px-2 py-1 rounded"
                        />
                    </label>
                </div>

                {filterError && (
                    <p role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                        {filterError}
                    </p>
                )}

                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={handleClear}
                        className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        <RotateCcw size={16} /> Limpiar
                    </button>

                    <button
                        type="button"
                        onClick={handleApply}
                        className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                        <Filter size={16} /> Aplicar filtros
                    </button>
                </div>
            </section>
        </div>
    );
}

export default FiltersModal;
