import { useEffect, useState } from "react";

export function FiltersModal({ isOpen, onClose, initialFilters, onApply }) {
    const [localFilters, setLocalFilters] = useState(initialFilters);

    useEffect(() => {
        if (isOpen) {
            setLocalFilters(initialFilters);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setLocalFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleClear = () => {
        setLocalFilters({ tipo: "", desde: "", hasta: "", texto: "" });
    };

    const handleApply = () => {
        onApply(localFilters);
        onClose();
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div
            className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-40"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-4 sm:p-6 relative">

                {/* Botón cerrar */}
                <button
                    onClick={onClose}
                    className="absolute top-2 right-3 text-xl font-bold text-gray-500 hover:text-gray-800"
                    type="button"
                >
                    ×
                </button>

                <h2 className="text-lg font-semibold mb-4">Filtros</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">

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

                    {/* Desde */}
                    <label className="flex flex-col">
                        Desde
                        <input
                            type="date"
                            name="desde"
                            value={localFilters.desde}
                            onChange={handleChange}
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

                {/* Botones */}
                <div className="mt-6 flex gap-2 justify-end">
                    <button
                        type="button"
                        onClick={handleClear}
                        className="px-3 py-1 rounded bg-gray-500 text-white hover:scale-105"
                    >
                        Limpiar filtros
                    </button>

                    <button
                        type="button"
                        onClick={handleApply}
                        className="px-3 py-1 rounded bg-purple-600 text-white hover:scale-105"
                    >
                        Aplicar
                    </button>
                </div>

            </div>
        </div>
    );
}

export default FiltersModal;
