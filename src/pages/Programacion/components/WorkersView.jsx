import { Car, Copy, Users } from "lucide-react";
import { STATUS_TONES, WEEK_DAYS } from "../programacion.constants";
import { formatStartTime, sortByTime, toDateKey } from "../programacion.utils";

export default function WorkersView({ rows, selectedDate, todayKey, weekDays, onDuplicate, onEdit, onSelectDate }) {
    return (
        <div className="overflow-x-auto">
            <div className="min-w-[980px]">
                <div className="grid grid-cols-[180px_repeat(7,minmax(110px,1fr))] border-b border-gray-200 bg-gray-50">
                    <div className="sticky left-0 z-10 flex items-center bg-gray-50 px-4 py-3 text-xs font-bold uppercase text-gray-500">Trabajador</div>
                    {weekDays.map((date, index) => {
                        const dateKey = toDateKey(date);
                        return (
                            <button type="button" key={dateKey} onClick={() => onSelectDate(dateKey)} className="border-l border-gray-200 px-2 py-3 text-center hover:bg-gray-100">
                                <span className="block text-xs font-bold uppercase text-gray-500">{WEEK_DAYS[index]}</span>
                                <strong className={`mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full ${dateKey === todayKey ? "bg-blue-600 text-white" : "text-gray-900"}`}>{date.getDate()}</strong>
                            </button>
                        );
                    })}
                </div>

                {rows.length === 0 ? (
                    <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 p-8 text-center text-gray-500">
                        <Users size={38} strokeWidth={1.5} />
                        <p className="font-semibold">No hay trabajadores que coincidan con los filtros.</p>
                    </div>
                ) : (
                    rows.map(row => (
                        <div key={row.worker} className="grid min-h-28 grid-cols-[180px_repeat(7,minmax(110px,1fr))] border-b border-gray-100">
                            <div className="sticky left-0 z-10 bg-white px-4 py-3 shadow-[1px_0_0_0_#f3f4f6]">
                                <strong className="block text-sm text-gray-900">{row.worker}</strong>
                                <span className="mt-1 block text-xs text-gray-500">{row.assignments.length} {row.assignments.length === 1 ? "labor" : "labores"}</span>
                            </div>
                            {weekDays.map(date => {
                                const dateKey = toDateKey(date);
                                const assignments = sortByTime(row.itemsByDate[dateKey] || []);
                                return (
                                    <div key={dateKey} className={`space-y-2 border-l border-gray-100 p-2 ${dateKey === selectedDate ? "bg-blue-50/50" : ""}`}>
                                        {assignments.length === 0 ? (
                                            <span className="block py-3 text-center text-xs text-gray-300">Libre</span>
                                        ) : assignments.map(item => (
                                            <div key={item.id} className={`rounded-md px-2 py-1.5 text-xs ${STATUS_TONES[item.status]}`}>
                                                <button type="button" onClick={() => onEdit(dateKey, item)} className="w-full text-left">
                                                    <strong className="block">{formatStartTime(item)} · {item.task}</strong>
                                                    {item.location && <span className="mt-0.5 block truncate opacity-80">{item.location}</span>}
                                                    {item.vehicle && <span className="mt-0.5 flex items-center gap-1 opacity-80"><Car size={11} /> {item.vehicle.plate}</span>}
                                                </button>
                                                <button type="button" onClick={() => onDuplicate(item)} className="mt-1 inline-flex items-center gap-1 font-semibold opacity-70 hover:opacity-100"><Copy size={12} /> Duplicar</button>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
