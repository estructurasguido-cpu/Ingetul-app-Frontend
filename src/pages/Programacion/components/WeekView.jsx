import { DndContext, DragOverlay, useDraggable, useDroppable } from "@dnd-kit/core";
import { Car, CheckCircle2, Copy, GripVertical, RotateCcw, XCircle } from "lucide-react";
import { WEEK_DAYS } from "../programacion.constants";
import { formatStartTime, formatTimeRange, formatWorkerNames, sortByTime, toDateKey } from "../programacion.utils";

function WeekDropZone({ dateKey, isSelected, children }) {
    const { isOver, setNodeRef } = useDroppable({
        id: `day:${dateKey}`,
        data: { dateKey }
    });

    return (
        <div ref={setNodeRef} className={`min-h-[430px] border-r border-gray-100 transition ${isSelected ? "bg-blue-50/60" : ""} ${isOver ? "bg-green-50 ring-2 ring-inset ring-green-400" : ""}`}>
            {children}
        </div>
    );
}

function DraggableWeekItem({ item, dateKey, onCancel, onComplete, onDuplicate, onEdit, onReopen }) {
    const canDrag = item.status === "programada";
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: item.id,
        data: { item },
        disabled: !canDrag
    });

    return (
        <div ref={setNodeRef} className={`rounded-lg border border-gray-200 bg-white p-2 shadow-sm hover:border-blue-300 ${isDragging ? "opacity-30" : ""}`}>
            <div className="flex items-start gap-1">
                <button type="button" onClick={() => onEdit(dateKey, item)} className="min-w-0 flex-1 text-left">
                    <span className="text-xs font-bold text-blue-600">{formatStartTime(item)}</span>
                    <strong className="mt-1 block text-xs text-gray-900">{item.task}</strong>
                    <span className="mt-1 block truncate text-xs text-gray-500">{formatWorkerNames(item)}</span>
                    {item.vehicle && <span className="mt-1 flex items-center gap-1 text-[11px] text-gray-500"><Car size={12} /> {item.vehicle.plate}</span>}
                </button>
                <button type="button" onClick={() => onDuplicate(item)} aria-label={`Duplicar ${item.task}`} title="Duplicar labor" className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-blue-600">
                    <Copy size={15} />
                </button>
                {canDrag && (
                    <button type="button" {...listeners} {...attributes} aria-label={`Mover ${item.task}`} title="Arrastrar a otro día" className="touch-none cursor-grab rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-blue-600 active:cursor-grabbing">
                        <GripVertical size={16} />
                    </button>
                )}
            </div>
            {canDrag && (
                <div className="mt-2 grid grid-cols-2 gap-1">
                    <button type="button" onClick={() => onComplete(item)} title="Marcar como completada" className="inline-flex items-center justify-center gap-1 rounded-md bg-green-50 px-1 py-1 text-[11px] font-bold text-green-700 hover:bg-green-100"><CheckCircle2 size={13} /> Completar</button>
                    <button type="button" onClick={() => onCancel(item)} title="Cancelar labor" className="inline-flex items-center justify-center gap-1 rounded-md bg-gray-100 px-1 py-1 text-[11px] font-bold text-gray-700 hover:bg-gray-200"><XCircle size={13} /> Cancelar</button>
                </div>
            )}
            {!canDrag && <button type="button" onClick={() => onReopen(item)} title="Reabrir labor" className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700 hover:bg-amber-100"><RotateCcw size={13} /> Reabrir</button>}
        </div>
    );
}

export default function WeekView({
    activeDraggedItem,
    itemsByDate,
    selectedDate,
    sensors,
    todayKey,
    weekDays,
    onComplete,
    onCancel,
    onCreate,
    onDragCancel,
    onDragEnd,
    onDragStart,
    onDuplicate,
    onEdit,
    onReopen,
    onSelectDate
}) {
    return (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragCancel={onDragCancel} onDragEnd={onDragEnd}>
            <div className="overflow-x-auto">
                <div className="grid min-w-[760px] grid-cols-7">
                    {weekDays.map((date, index) => {
                        const dateKey = toDateKey(date);
                        const dayItems = sortByTime(itemsByDate[dateKey] || []);
                        const isSelected = dateKey === selectedDate;
                        const isToday = dateKey === todayKey;

                        return (
                            <WeekDropZone key={dateKey} dateKey={dateKey} isSelected={isSelected}>
                                <button type="button" onClick={() => onSelectDate(dateKey)} className="flex w-full flex-col items-center border-b border-gray-100 px-2 py-3 hover:bg-gray-50">
                                    <span className="text-xs font-bold uppercase text-gray-500">{WEEK_DAYS[index]}</span>
                                    <span className={`mt-1 flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold ${isToday ? "bg-blue-600 text-white" : "text-gray-900"}`}>{date.getDate()}</span>
                                </button>
                                <div className="space-y-2 p-2">
                                    {dayItems.map(item => (
                                        <DraggableWeekItem key={item.id} item={item} dateKey={dateKey} onCancel={onCancel} onComplete={onComplete} onDuplicate={onDuplicate} onEdit={onEdit} onReopen={onReopen} />
                                    ))}
                                    {dayItems.length === 0 && (
                                        <button type="button" onClick={() => onCreate(dateKey)} className="w-full rounded-lg border border-dashed border-gray-200 px-2 py-4 text-xs font-semibold text-gray-400 hover:border-blue-300 hover:text-blue-600">+ Agregar</button>
                                    )}
                                </div>
                            </WeekDropZone>
                        );
                    })}
                </div>
            </div>
            <DragOverlay>
                {activeDraggedItem ? (
                    <div className="w-40 rotate-2 rounded-lg border border-blue-300 bg-white p-3 shadow-xl">
                        <span className="text-xs font-bold text-blue-600">{formatTimeRange(activeDraggedItem)}</span>
                        <strong className="mt-1 block text-sm text-gray-900">{activeDraggedItem.task}</strong>
                        <span className="mt-1 block truncate text-xs text-gray-500">{formatWorkerNames(activeDraggedItem)}</span>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
