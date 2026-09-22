import { CalendarDays, Car, CheckCircle2, Clock3, Copy, MapPin, Pencil, Plus, RotateCcw, Trash2, Users, XCircle } from "lucide-react";
import { STATUS_LABELS, STATUS_TONES } from "../programacion.constants";
import { formatTimeRange, formatWorkerNames } from "../programacion.utils";

export default function DayAgenda({ items, title, onCancel, onComplete, onCreate, onDelete, onDuplicate, onEdit, onReopen }) {
    return (
        <aside className="h-fit rounded-xl bg-white shadow-sm">
            <div className="flex items-start justify-between gap-3 border-b border-gray-200 p-4">
                <div>
                    <span className="text-xs font-bold uppercase tracking-wide text-blue-600">Agenda del día</span>
                    <h2 className="mt-1 font-bold capitalize text-gray-900">{title}</h2>
                </div>
                <button type="button" onClick={onCreate} aria-label="Agregar labor" className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700">
                    <Plus size={18} />
                </button>
            </div>

            {items.length === 0 ? (
                <div className="flex min-h-56 flex-col items-center justify-center gap-3 p-6 text-center text-gray-500">
                    <CalendarDays size={38} strokeWidth={1.5} />
                    <p className="font-semibold">No hay labores programadas.</p>
                    <button type="button" onClick={onCreate} className="text-sm font-semibold text-blue-600 hover:text-blue-700">Programar la primera</button>
                </div>
            ) : (
                <div className="divide-y divide-gray-100">
                    {items.map(item => (
                        <article key={item.id} className="p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${STATUS_TONES[item.status]}`}>{STATUS_LABELS[item.status]}</span>
                                    <h3 className="mt-2 font-bold text-gray-900">{item.task}</h3>
                                    <p className="mt-1 flex items-center gap-2 text-sm text-gray-600"><Users size={15} /> {formatWorkerNames(item)}</p>
                                    <p className="mt-1 flex items-center gap-2 text-sm text-gray-600"><Clock3 size={15} /> {formatTimeRange(item)}</p>
                                    {item.vehicle && <p className="mt-1 flex items-center gap-2 text-sm text-gray-600"><Car size={15} /> {item.vehicle.plate}{item.vehicle.description ? ` · ${item.vehicle.description}` : ""}</p>}
                                    {item.location && <p className="mt-1 flex items-center gap-2 text-sm text-gray-600"><MapPin size={15} /> {item.location}</p>}
                                </div>
                                <div className="flex shrink-0 gap-1">
                                    <button type="button" onClick={() => onDuplicate(item)} title="Duplicar labor" className="rounded-md p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600"><Copy size={16} /></button>
                                    <button type="button" onClick={() => onEdit(item)} title="Editar labor" className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-blue-600"><Pencil size={16} /></button>
                                    <button type="button" onClick={() => onDelete(item)} title="Eliminar labor" className="rounded-md p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
                                </div>
                            </div>
                            {item.notes && <p className="mt-3 rounded-lg bg-gray-50 p-2 text-sm text-gray-600">{item.notes}</p>}
                            {item.status === "programada" && (
                                <div className="mt-3 grid grid-cols-2 gap-2">
                                    <button type="button" onClick={() => onComplete(item)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm font-bold text-green-700 hover:bg-green-100"><CheckCircle2 size={17} /> Completar</button>
                                    <button type="button" onClick={() => onCancel(item)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-200"><XCircle size={17} /> Cancelar</button>
                                </div>
                            )}
                            {item.status !== "programada" && <button type="button" onClick={() => onReopen(item)} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-bold text-amber-700 hover:bg-amber-100"><RotateCcw size={17} /> Reabrir labor</button>}
                        </article>
                    ))}
                </div>
            )}
        </aside>
    );
}
