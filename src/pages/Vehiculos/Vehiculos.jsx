import { useEffect, useMemo, useState } from "react";
import {
    AlertTriangle,
    CalendarDays,
    Car,
    CheckCircle2,
    Pencil,
    Plus,
    Search,
    Trash2,
    XCircle
} from "lucide-react";
import {
    VEHICLE_FILTERS,
    buildVehicleSummary,
    filterAndSortVehicles,
    formatVehicleDate,
    getDocumentStatus,
    getVehicleStatus,
    initialVehicleForm,
    normalizePlate
} from "./utils/vencimientos";
import {
    createVehiculo,
    deleteVehiculo,
    getVehiculoByPlate,
    getVehiculos,
    updateVehiculo
} from "./services/vehiculos.service";

const STATUS_ICONS = {
    Vencido: XCircle,
    Crítico: AlertTriangle,
    Próximo: CalendarDays,
    Vigente: CheckCircle2,
    Pendiente: CalendarDays
};

function DocumentBadge({ label, dateValue }) {
    const status = getDocumentStatus(dateValue);

    return (
        <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase text-gray-500">{label}</span>
            <span className={`inline-flex w-fit items-center rounded-md border px-2 py-1 text-xs font-medium ${status.tone}`}>
                {status.label}
            </span>
            <span className="text-sm text-gray-700">{formatVehicleDate(dateValue)}</span>
        </div>
    );
}

export default function Vehiculos() {
    const [vehicles, setVehicles] = useState([]);
    const [form, setForm] = useState(initialVehicleForm);
    const [editId, setEditId] = useState(null);
    const [filter, setFilter] = useState("todos");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [loadFailed, setLoadFailed] = useState(false);
    const [feedback, setFeedback] = useState("");

    useEffect(() => {
        loadVehiculos();
    }, []);

    useEffect(() => {
        if (!feedback) return undefined;
        const timeoutId = setTimeout(() => setFeedback(""), 4500);
        return () => clearTimeout(timeoutId);
    }, [feedback]);

    const summary = useMemo(() => buildVehicleSummary(vehicles), [vehicles]);

    const filteredVehicles = useMemo(
        () => filterAndSortVehicles(vehicles, filter, search),
        [vehicles, filter, search]
    );

    function handleChange(event) {
        const { name, value } = event.target;

        setError("");

        setForm(prev => ({
            ...prev,
            [name]: name === "placa" ? normalizePlate(value) : value
        }));
    }

    function resetForm() {
        setForm(initialVehicleForm);
        setEditId(null);
    }

    async function loadVehiculos() {
        try {
            setLoading(true);
            setError("");
            setLoadFailed(false);
            const data = await getVehiculos();
            setVehicles(data);
        } catch (err) {
            console.error("Error cargando vehiculos:", err);
            setError("No se pudieron cargar los vehículos.");
            setLoadFailed(true);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();

        const placa = normalizePlate(form.placa);
        if (!placa) {
            setError("La placa es obligatoria.");
            return;
        }

        const duplicated = vehicles.some(vehicle =>
            vehicle.placa === placa && vehicle.id !== editId
        );

        if (duplicated) {
            setError("Ya existe un vehículo registrado con esa placa.");
            return;
        }

        const payload = {
            placa,
            descripcion: form.descripcion.trim(),
            tipoDocumentoPropietario: form.tipoDocumentoPropietario,
            documentoPropietario: form.documentoPropietario.trim(),
            fechaSoat: form.fechaSoat,
            fechaTecnomecanica: form.fechaTecnomecanica
        };

        try {
            setSaving(true);
            setError("");

            let successMessage;
            if (editId) {
                const updated = await updateVehiculo(editId, payload);
                setVehicles(prev =>
                    prev.map(vehicle => vehicle.id === editId ? updated : vehicle)
                );
                successMessage = "Vehículo actualizado.";
            } else {
                const previousVehicle = await getVehiculoByPlate(placa);
                if (previousVehicle?.activo) {
                    setError("Ya existe un vehículo registrado con esa placa.");
                    return;
                }

                if (previousVehicle) {
                    const reactivated = await updateVehiculo(previousVehicle.id, { ...payload, activo: true });
                    setVehicles(prev => [...prev, reactivated]);
                    successMessage = "Vehículo reactivado y actualizado.";
                } else {
                    const created = await createVehiculo(payload);
                    setVehicles(prev => [...prev, created]);
                    successMessage = "Vehículo registrado.";
                }
            }

            resetForm();
            setFeedback(successMessage);
        } catch (err) {
            console.error("Error guardando vehiculo:", err);
            setError(err.code === "23505"
                ? "Ya existe un vehículo registrado con esa placa."
                : "No se pudo guardar el vehículo."
            );
        } finally {
            setSaving(false);
        }
    }

    function handleEdit(vehicle) {
        setEditId(vehicle.id);
        setForm({
            placa: vehicle.placa,
            descripcion: vehicle.descripcion || "",
            tipoDocumentoPropietario: vehicle.tipoDocumentoPropietario || "CC",
            documentoPropietario: vehicle.documentoPropietario || "",
            fechaSoat: vehicle.fechaSoat || "",
            fechaTecnomecanica: vehicle.fechaTecnomecanica || ""
        });
    }

    async function handleDelete(id) {
        const vehicle = vehicles.find(item => item.id === id);
        if (!confirm(`¿Eliminar el vehículo ${vehicle?.placa || "seleccionado"} del registro?`)) return;

        try {
            setSaving(true);
            setError("");
            await deleteVehiculo(id);
            setVehicles(prev => prev.filter(vehicle => vehicle.id !== id));
            setFeedback("Vehículo eliminado. Puedes registrarlo nuevamente para reactivarlo.");
        } catch (err) {
            console.error("Error eliminando vehiculo:", err);
            setError("No se pudo eliminar el vehículo.");
        } finally {
            setSaving(false);
        }

        if (editId === id) {
            resetForm();
        }
    }

    return (
        <div className="mx-auto max-w-6xl text-gray-800">
            <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#0051ff]">Vehículos</h1>
                    <p className="text-sm text-gray-500">
                        Control temprano de SOAT y revisión tecnomecánica.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                    <div className="rounded-md bg-white px-4 py-3 shadow-sm">
                        <span className="block text-xs text-gray-500">Total</span>
                        <strong className="text-xl">{summary.total}</strong>
                    </div>
                    <div className="rounded-md bg-red-50 px-4 py-3 text-red-700 shadow-sm">
                        <span className="block text-xs">Vencidos</span>
                        <strong className="text-xl">{summary.vencidos}</strong>
                    </div>
                    <div className="rounded-md bg-yellow-50 px-4 py-3 text-yellow-700 shadow-sm">
                        <span className="block text-xs">Próximos</span>
                        <strong className="text-xl">{summary.proximos}</strong>
                    </div>
                    <div className="rounded-md bg-green-50 px-4 py-3 text-green-700 shadow-sm">
                        <span className="block text-xs">Vigentes</span>
                        <strong className="text-xl">{summary.vigentes}</strong>
                    </div>
                    <div className="rounded-md bg-gray-100 px-4 py-3 text-gray-700 shadow-sm">
                        <span className="block text-xs">Pendientes</span>
                        <strong className="text-xl">{summary.pendientes}</strong>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mb-4 flex items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <span>{error}</span>
                    {loadFailed && <button type="button" onClick={loadVehiculos} className="shrink-0 font-semibold underline">Reintentar</button>}
                </div>
            )}

            {feedback && (
                <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                    {feedback}
                </div>
            )}

            <section className="mb-6 rounded-md bg-white p-4 shadow-sm">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
                    <label className="flex flex-col text-sm font-medium">
                        Placa
                        <input
                            required
                            name="placa"
                            value={form.placa}
                            onChange={handleChange}
                            maxLength={10}
                            placeholder="ABC123"
                            className="mt-1 rounded-md border border-gray-300 px-3 py-2 uppercase focus:outline-none focus:ring focus:ring-blue-200"
                        />
                    </label>

                    <label className="flex flex-col text-sm font-medium">
                        Descripción
                        <input
                            name="descripcion"
                            value={form.descripcion}
                            onChange={handleChange}
                            placeholder="Camioneta, volqueta..."
                            className="mt-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
                        />
                    </label>

                    <label className="flex flex-col text-sm font-medium">
                        Tipo doc.
                        <select
                            name="tipoDocumentoPropietario"
                            value={form.tipoDocumentoPropietario}
                            onChange={handleChange}
                            className="mt-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
                        >
                            <option value="CC">Cédula</option>
                            <option value="NIT">NIT</option>
                        </select>
                    </label>

                    <label className="flex flex-col text-sm font-medium">
                        Documento propietario
                        <input
                            name="documentoPropietario"
                            value={form.documentoPropietario}
                            onChange={handleChange}
                            placeholder="Número"
                            className="mt-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
                        />
                    </label>

                    <label className="flex flex-col text-sm font-medium">
                        Vence SOAT
                        <input
                            type="date"
                            name="fechaSoat"
                            value={form.fechaSoat}
                            onChange={handleChange}
                            className="mt-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
                        />
                    </label>

                    <label className="flex flex-col text-sm font-medium">
                        Vence tecnomecánica
                        <input
                            type="date"
                            name="fechaTecnomecanica"
                            value={form.fechaTecnomecanica}
                            onChange={handleChange}
                            className="mt-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
                        />
                    </label>

                    <div className="flex gap-2 md:col-span-2 xl:col-span-6">
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Plus size={18} />
                            {saving ? "Guardando..." : editId ? "Guardar cambios" : "Registrar vehículo"}
                        </button>

                        {editId && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                        )}
                    </div>
                </form>
            </section>

            <section className="rounded-md bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-gray-200 p-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="relative max-w-md flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Buscar por placa, descripción o documento"
                            className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring focus:ring-blue-200"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {Object.entries(VEHICLE_FILTERS).map(([value, label]) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setFilter(value)}
                                className={`rounded-md px-3 py-2 text-sm font-medium ${filter === value
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex min-h-48 items-center justify-center p-8 text-sm font-medium text-gray-500">
                        Cargando vehículos...
                    </div>
                ) : filteredVehicles.length === 0 ? (
                    <div className="flex min-h-48 flex-col items-center justify-center gap-3 p-8 text-center text-gray-500">
                        <Car size={40} strokeWidth={1.6} />
                        <p className="font-medium">No hay vehículos para mostrar.</p>
                        <p className="max-w-md text-sm">
                            Registra una placa y sus fechas para empezar a controlar vencimientos.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[860px] text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-4 py-3">Vehículo</th>
                                    <th className="px-4 py-3">Propietario</th>
                                    <th className="px-4 py-3">Estado</th>
                                    <th className="px-4 py-3">SOAT</th>
                                    <th className="px-4 py-3">Tecnomecánica</th>
                                    <th className="px-4 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredVehicles.map(vehicle => {
                                    const status = getVehicleStatus(vehicle);
                                    const StatusIcon = STATUS_ICONS[status.label] || CalendarDays;

                                    return (
                                        <tr key={vehicle.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-4">
                                                <div className="font-bold text-gray-900">{vehicle.placa}</div>
                                                <div className="text-sm text-gray-600">{vehicle.descripcion || "Sin descripción"}</div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="text-sm font-medium text-gray-800">
                                                    {vehicle.tipoDocumentoPropietario || "CC"}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {vehicle.documentoPropietario || "Sin documento"}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${status.tone}`}>
                                                    <StatusIcon size={17} />
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <DocumentBadge label="SOAT" dateValue={vehicle.fechaSoat} />
                                            </td>
                                            <td className="px-4 py-4">
                                                <DocumentBadge label="Revisión" dateValue={vehicle.fechaTecnomecanica} />
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleEdit(vehicle)}
                                                        disabled={saving}
                                                        title="Editar vehículo"
                                                        className="rounded-md border border-gray-300 p-2 text-gray-700 hover:bg-gray-100"
                                                    >
                                                        <Pencil size={17} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(vehicle.id)}
                                                        disabled={saving}
                                                        title="Eliminar vehículo"
                                                        className="rounded-md border border-red-200 p-2 text-red-600 hover:bg-red-50"
                                                    >
                                                        <Trash2 size={17} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}
