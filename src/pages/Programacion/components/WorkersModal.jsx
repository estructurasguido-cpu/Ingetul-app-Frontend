import { Trash2, UserPlus, Users, X } from "lucide-react";
import useModalFocus from "../hooks/useModalFocus";

export default function WorkersModal({ error, isSaving, workerName, workers, onAdd, onChangeName, onClose, onDelete }) {
    const dialogRef = useModalFocus({ onClose });

    return (
        <div className="fixed inset-0 z-[1010] flex items-center justify-center bg-black/45 p-2 sm:p-4" onMouseDown={event => event.target === event.currentTarget && onClose()}>
            <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="workers-title" aria-describedby="workers-description" tabIndex={-1} className="max-h-[calc(100dvh-1rem)] w-full max-w-md overflow-y-auto rounded-xl bg-white shadow-2xl outline-none sm:max-h-[92vh]">
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                    <div>
                        <h2 id="workers-title" className="text-lg font-bold text-gray-900">Trabajadores de campo</h2>
                        <p id="workers-description" className="text-sm text-gray-500">Catálogo sencillo para asignar labores.</p>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"><X size={20} /></button>
                </div>

                <form onSubmit={onAdd} aria-busy={isSaving} className="flex flex-col gap-2 border-b border-gray-100 p-5 sm:flex-row">
                    <input data-autofocus disabled={isSaving} value={workerName} onChange={event => onChangeName(event.target.value)} placeholder="Nombre completo" aria-label="Nombre del trabajador" className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100" />
                    <button type="submit" disabled={isSaving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"><UserPlus size={17} /> {isSaving ? "Guardando..." : "Agregar"}</button>
                </form>

                {error && <p className="mx-5 mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

                <div className="max-h-72 overflow-y-auto p-5">
                    {workers.length === 0 ? (
                        <div className="py-8 text-center text-sm text-gray-500">
                            <Users className="mx-auto mb-2" size={34} strokeWidth={1.5} />
                            Aún no hay trabajadores en el catálogo.
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {[...workers].sort((a, b) => a.name.localeCompare(b.name, "es")).map(worker => (
                                <div key={worker.id} className="flex items-center justify-between gap-3 py-3">
                                    <span className="font-semibold text-gray-800">{worker.name}</span>
                                    <button type="button" disabled={isSaving} onClick={() => onDelete(worker)} title="Quitar del catálogo" className="rounded-md p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"><Trash2 size={16} /></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
