import { CheckCircle2, UserPlus, X } from "lucide-react";
import { STATUS_LABELS } from "../programacion.constants";
import useModalFocus from "../hooks/useModalFocus";

export default function ProgramacionFormModal({
    editingId,
    error,
    form,
    isActive,
    isDuplicating,
    isSaving,
    scheduleVehicleOptions,
    scheduleWorkerOptions,
    workers,
    onChange,
    onClearError,
    onClose,
    onOpenWorkers,
    onSubmit
}) {
    const dialogRef = useModalFocus({ isActive, onClose });

    function updateField(field, value) {
        onChange(current => ({ ...current, [field]: value }));
        onClearError();
    }

    function toggleWorker(workerId) {
        onChange(current => ({
            ...current,
            workerIds: current.workerIds.includes(workerId)
                ? current.workerIds.filter(id => id !== workerId)
                : [...current.workerIds, workerId]
        }));
        onClearError();
    }

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/45 p-2 sm:p-4" onMouseDown={event => event.target === event.currentTarget && onClose()}>
            <section ref={dialogRef} role="dialog" aria-modal={isActive} aria-hidden={!isActive} aria-labelledby="programacion-form-title" aria-describedby="programacion-form-description" tabIndex={-1} className="max-h-[calc(100dvh-1rem)] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl outline-none sm:max-h-[92vh]">
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                    <div>
                        <h2 id="programacion-form-title" className="text-lg font-bold text-gray-900">{editingId ? "Editar labor" : isDuplicating ? "Duplicar labor" : "Nueva labor"}</h2>
                        <p id="programacion-form-description" className="text-sm text-gray-500">{isDuplicating ? "Revisa la nueva fecha antes de crear la copia." : "Asigna una cuadrilla y, si aplica, un vehículo."}</p>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"><X size={20} /></button>
                </div>

                <form onSubmit={onSubmit} aria-busy={isSaving} className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                    <label className="text-sm font-semibold text-gray-700">
                        Fecha <span className="text-red-500">*</span>
                        <input data-autofocus required type="date" value={form.date} onChange={event => updateField("date", event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-normal focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                    </label>
                    <label className="text-sm font-semibold text-gray-700">
                        Vehículo
                        <select value={form.vehicleId} onChange={event => updateField("vehicleId", event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-normal focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                            <option value="">Sin vehículo</option>
                            {scheduleVehicleOptions.map(vehicle => (
                                <option key={vehicle.id} value={vehicle.id}>
                                    {vehicle.plate}{vehicle.description ? ` · ${vehicle.description}` : ""}{vehicle.active === false ? " (inactivo)" : ""}
                                </option>
                            ))}
                        </select>
                    </label>
                    <fieldset className="sm:col-span-2">
                        <legend className="text-sm font-semibold text-gray-700">Trabajadores <span className="text-red-500">*</span></legend>
                        {scheduleWorkerOptions.length === 0 ? (
                            <p className="mt-2 rounded-lg border border-dashed border-gray-300 px-3 py-4 text-sm text-gray-500">Aún no hay trabajadores en el catálogo.</p>
                        ) : (
                            <div className="mt-2 grid max-h-40 grid-cols-1 gap-2 overflow-y-auto rounded-lg border border-gray-300 p-3 sm:grid-cols-2">
                                {scheduleWorkerOptions.map(worker => (
                                    <label key={worker.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm font-normal text-gray-700 hover:bg-gray-50">
                                        <input type="checkbox" checked={form.workerIds.includes(worker.id)} onChange={() => toggleWorker(worker.id)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                        <span>{worker.name}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs text-gray-500">
                                {workers.length > 0
                                    ? `${form.workerIds.length} ${form.workerIds.length === 1 ? "seleccionado" : "seleccionados"}`
                                    : "Catálogo vacío"}
                            </span>
                            <button type="button" onClick={onOpenWorkers} className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700">
                                <UserPlus size={16} /> Gestionar trabajadores
                            </button>
                        </div>
                    </fieldset>
                    <label className="text-sm font-semibold text-gray-700 sm:col-span-2">
                        Labor <span className="text-red-500">*</span>
                        <input required value={form.task} onChange={event => updateField("task", event.target.value)} placeholder="Ej. Toma de muestras de concreto" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-normal focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                    </label>
                    <label className="text-sm font-semibold text-gray-700 sm:col-span-2">
                        Lugar / obra
                        <input value={form.location} onChange={event => updateField("location", event.target.value)} placeholder="Nombre o dirección de la obra" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-normal focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                    </label>
                    <label className="text-sm font-semibold text-gray-700">
                        Hora de inicio
                        <input type="time" value={form.startTime} onChange={event => updateField("startTime", event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-normal focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                    </label>
                    <label className="text-sm font-semibold text-gray-700">
                        Hora de fin
                        <input type="time" value={form.endTime} onChange={event => updateField("endTime", event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-normal focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                    </label>
                    <label className="text-sm font-semibold text-gray-700">
                        Estado
                        <select value={form.status} onChange={event => updateField("status", event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-normal focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                            {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                    </label>
                    <label className="text-sm font-semibold text-gray-700 sm:col-span-2">
                        Notas
                        <textarea rows="3" value={form.notes} onChange={event => updateField("notes", event.target.value)} placeholder="Indicaciones, equipos o datos relevantes" className="mt-1 w-full resize-y rounded-lg border border-gray-300 px-3 py-2 font-normal focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                    </label>
                    {error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 sm:col-span-2">
                            {error}
                        </div>
                    )}
                    <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:col-span-2 sm:flex-row sm:justify-end">
                        <button type="button" onClick={onClose} className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 sm:w-auto">Cancelar</button>
                        <button type="submit" disabled={isSaving} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
                            <CheckCircle2 size={18} /> {isSaving ? "Guardando..." : editingId ? "Guardar cambios" : isDuplicating ? "Crear copia" : "Programar labor"}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}
