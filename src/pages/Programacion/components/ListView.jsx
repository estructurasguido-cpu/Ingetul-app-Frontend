import { Car, CheckCircle2, Clock3, Copy, List, Pencil, RotateCcw, Trash2, XCircle } from "lucide-react";
import { STATUS_LABELS, STATUS_TONES } from "../programacion.constants";
import { dateFromKey, formatShortDate, formatStartTime, formatWorkerNames } from "../programacion.utils";

export default function ListView({ items, selectedDate, onCancel, onComplete, onCreate, onDelete, onDuplicate, onEdit, onReopen, onSelectDate }) {
    if (items.length === 0) {
        return (
            <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 p-8 text-center text-gray-500">
                <List size={38} strokeWidth={1.5} />
                <p className="font-semibold">No hay labores en este mes.</p>
                <button type="button" onClick={onCreate} className="text-sm font-semibold text-blue-600 hover:text-blue-700">Crear una labor</button>
            </div>
        );
    }

    return (
        <div className="min-h-[360px] divide-y divide-gray-100">
            {items.map(item => {
                const itemDate = dateFromKey(item.date);
                return (
                    <article key={item.id} className={`grid gap-3 p-4 hover:bg-gray-50 sm:grid-cols-[100px_90px_minmax(0,1fr)_auto] sm:items-center ${item.date === selectedDate ? "bg-blue-50/60" : ""}`}>
                        <button type="button" onClick={() => onSelectDate(item.date)} className="text-left">
                            <span className="block text-xs font-bold uppercase text-gray-500">{new Intl.DateTimeFormat("es-CO", { weekday: "short" }).format(itemDate)}</span>
                            <strong className="capitalize text-gray-900">{formatShortDate(itemDate)}</strong>
                        </button>
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-600"><Clock3 size={15} /> {formatStartTime(item)}</span>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <strong className="text-gray-900">{item.task}</strong>
                                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_TONES[item.status]}`}>{STATUS_LABELS[item.status]}</span>
                            </div>
                            <p className="mt-1 truncate text-sm text-gray-500">{formatWorkerNames(item)}{item.location ? ` · ${item.location}` : ""}</p>
                            {item.vehicle && <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500"><Car size={14} /> {item.vehicle.plate}{item.vehicle.description ? ` · ${item.vehicle.description}` : ""}</p>}
                        </div>
                        <div className="flex gap-1 sm:justify-end">
                            <button type="button" onClick={() => onDuplicate(item)} title="Duplicar labor" className="rounded-md p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600"><Copy size={16} /></button>
                            {item.status === "programada" && <button type="button" onClick={() => onComplete(item)} title="Marcar como completada" className="rounded-md p-2 text-gray-500 hover:bg-green-50 hover:text-green-700"><CheckCircle2 size={17} /></button>}
                            {item.status === "programada" && <button type="button" onClick={() => onCancel(item)} title="Cancelar labor" className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"><XCircle size={17} /></button>}
                            {item.status !== "programada" && <button type="button" onClick={() => onReopen(item)} title="Reabrir labor" className="rounded-md p-2 text-gray-500 hover:bg-amber-50 hover:text-amber-700"><RotateCcw size={17} /></button>}
                            <button type="button" onClick={() => onEdit(item)} title="Editar labor" className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-blue-600"><Pencil size={16} /></button>
                            <button type="button" onClick={() => onDelete(item)} title="Eliminar labor" className="rounded-md p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
                        </div>
                    </article>
                );
            })}
        </div>
    );
}
