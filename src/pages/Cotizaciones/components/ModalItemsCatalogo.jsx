import { useState, useEffect } from "react";
import { createItemCatalog, updateItemCatalog, deleteItemCatalog } from "../services/items.service";
import ModalConfirm from "../../../components/ModalConfirm";

export default function ModalItemsCatalogo({
    open,
    onClose,
    itemsCatalogo,
    setItemsCatalogo
}) {

    const [nuevoItem, setNuevoItem] = useState("");
    const [editandoId, setEditandoId] = useState(null);
    const [textoEditando, setTextoEditando] = useState("");
    const [busqueda, setBusqueda] = useState("");
    const [loading, setLoading] = useState(false);
    const [mensaje, setMensaje] = useState("");
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [itemAEliminar, setItemAEliminar] = useState(null);

    if (!open) return null;

    useEffect(() => {

        const handleEsc = (e) => {
            if (e.key === "Escape") onClose();
        };

        window.addEventListener("keydown", handleEsc);

        return () => window.removeEventListener("keydown", handleEsc);

    }, []);

    const crearItem = async () => {

        const texto = nuevoItem.trim();

        if (!texto) return;

        const existe = itemsCatalogo.some(
            it => it.nombre.toLowerCase() === texto.toLowerCase()
        );

        if (existe) {
            setMensaje("Este ítem ya existe en el catálogo");
            return;
        }

        try {

            setLoading(true);

            const nuevo = await createItemCatalog(texto);

            setItemsCatalogo(prev => [...prev, nuevo]);

            setNuevoItem("");

            setMensaje("Ítem creado correctamente");

        } catch (err) {

            setMensaje("Error creando el ítem");

        } finally {
            setLoading(false);
        }

    };

    const guardarEdicion = async (id) => {

        if (!textoEditando.trim()) return;

        try {

            setLoading(true);

            const actualizado = await updateItemCatalog(id, textoEditando);

            setItemsCatalogo(prev =>
                prev.map(it => it.id === id ? actualizado : it)
            );

            setEditandoId(null);

            setMensaje("Ítem actualizado");

        } finally {
            setLoading(false);
        }

    };

    const eliminar = (id) => {
        setItemAEliminar(id);
        setConfirmOpen(true);
    };

    const confirmarEliminar = async () => {

        if (!itemAEliminar) return;

        try {

            setLoading(true);

            await deleteItemCatalog(itemAEliminar);

            setItemsCatalogo(prev =>
                prev.filter(it => it.id !== itemAEliminar)
            );

            setMensaje("Ítem eliminado");

        } finally {

            setLoading(false);
            setConfirmOpen(false);
            setItemAEliminar(null);

        }

    };

    const itemsFiltrados = itemsCatalogo
        .filter(it =>
            it.nombre.toLowerCase().includes(busqueda.toLowerCase())
        )
        .sort((a, b) => a.nombre.localeCompare(b.nombre));
    const itemSeleccionado = itemsCatalogo.find(i => i.id === itemAEliminar);

    return (

        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]">

            <div className="bg-white w-[650px] max-h-[85vh] rounded-xl shadow-xl flex flex-col">

                <div className="flex items-center justify-between border-b px-6 py-4">

                    <h2 className="text-lg font-semibold">
                        Catálogo de Ítems
                    </h2>

                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>

                </div>

                <div className="p-6 flex flex-col gap-4 flex-1 overflow-hidden">

                    <div className="flex gap-2">

                        <input
                            className="flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Nuevo ítem..."
                            value={nuevoItem}
                            onChange={(e) => setNuevoItem(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") crearItem();
                            }}
                        />

                        <button
                            onClick={crearItem}
                            disabled={loading || !nuevoItem.trim()}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                        >
                            Crear
                        </button>

                    </div>

                    <input
                        className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Buscar ítem..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />

                    <div className="text-sm text-gray-500">
                        {itemsFiltrados.length} resultados
                    </div>

                    <div className="flex-1 overflow-y-auto border rounded-md">

                        {itemsFiltrados.map((item) => (

                            <div
                                key={item.id}
                                className={`flex items-center justify-between px-3 py-2 border-b hover:bg-gray-50 ${editandoId === item.id ? "bg-blue-50" : ""
                                    }`}
                            >

                                {editandoId === item.id ? (

                                    <input
                                        className="flex-1 border rounded px-2 py-1"
                                        value={textoEditando}
                                        onChange={(e) => setTextoEditando(e.target.value)}
                                    />

                                ) : (

                                    <span className="flex-1 text-sm">
                                        {item.nombre}
                                    </span>

                                )}

                                <div className="flex gap-3 ml-3 text-sm">

                                    {editandoId === item.id ? (

                                        <div className="flex gap-3">

                                            <button
                                                onClick={() => guardarEdicion(item.id)}
                                                className="text-green-600 hover:underline"
                                            >
                                                Guardar
                                            </button>

                                            <button
                                                onClick={() => setEditandoId(null)}
                                                className="text-gray-500 hover:underline"
                                            >
                                                Cancelar
                                            </button>

                                        </div>

                                    ) : (

                                        <button
                                            onClick={() => {
                                                setEditandoId(item.id);
                                                setTextoEditando(item.nombre);
                                            }}
                                            className="text-blue-600 hover:underline"
                                        >
                                            Editar
                                        </button>

                                    )}

                                    <button
                                        onClick={() => eliminar(item.id)}
                                        className="text-red-600 hover:underline"
                                    >
                                        Eliminar
                                    </button>

                                </div>

                            </div>

                        ))}

                        {itemsFiltrados.length === 0 && (

                            <div className="p-6 text-center text-sm text-gray-500">
                                No se encontraron resultados
                            </div>

                        )}

                    </div>

                    {mensaje && (

                        <div className="text-sm text-gray-600">
                            {mensaje}
                        </div>

                    )}

                </div>

                <div className="border-t px-6 py-4 flex justify-end">

                    <button
                        onClick={onClose}
                        className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md"
                    >
                        Cerrar
                    </button>

                </div>
            </div>

            <ModalConfirm
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={confirmarEliminar}
                title="Eliminar ítem"
                message={`¿Eliminar "${itemSeleccionado?.nombre}" del catálogo?`}
                confirmText="Eliminar"
            />
        </div>
    );
}