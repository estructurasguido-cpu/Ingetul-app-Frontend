import { STATUS_TONES, WEEK_DAYS } from "../programacion.constants";
import { formatStartTime, formatWorkerNames, sortByTime, toDateKey } from "../programacion.utils";

export default function MonthView({ calendarDays, itemsByDate, selectedDate, todayKey, visibleMonth, onSelectDate }) {
    return (
        <div className="overflow-x-auto">
            <div className="min-w-[560px] sm:min-w-0">
                <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 text-center text-xs font-bold uppercase text-gray-500">
                    {WEEK_DAYS.map(day => <div key={day} className="py-3">{day}</div>)}
                </div>
                <div className="grid grid-cols-7">
                    {calendarDays.map(date => {
                        const dateKey = toDateKey(date);
                        const dayItems = sortByTime(itemsByDate[dateKey] || []);
                        const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
                        const isSelected = dateKey === selectedDate;
                        const isToday = dateKey === todayKey;

                        return (
                            <button
                                type="button"
                                key={dateKey}
                                onClick={() => onSelectDate(dateKey)}
                                className={`min-h-24 border-b border-r border-gray-100 p-1.5 text-left align-top transition sm:min-h-28 sm:p-2 ${isSelected ? "bg-blue-50 ring-2 ring-inset ring-blue-500" : "hover:bg-gray-50"} ${isCurrentMonth ? "text-gray-800" : "bg-gray-50/60 text-gray-400"}`}
                            >
                                <span className={`mb-1 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${isToday ? "bg-blue-600 text-white" : ""}`}>
                                    {date.getDate()}
                                </span>
                                <div className="space-y-1">
                                    {dayItems.slice(0, 2).map(item => (
                                        <div key={item.id} className={`truncate rounded px-1.5 py-1 text-[10px] font-semibold sm:text-xs ${STATUS_TONES[item.status]}`} title={`${formatStartTime(item)} · ${formatWorkerNames(item)} · ${item.task}`}>
                                            <span className="hidden sm:inline">{formatStartTime(item)} · </span>{formatWorkerNames(item)}
                                        </div>
                                    ))}
                                    {dayItems.length > 2 && <div className="px-1 text-[10px] font-semibold text-gray-500">+{dayItems.length - 2} más</div>}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
