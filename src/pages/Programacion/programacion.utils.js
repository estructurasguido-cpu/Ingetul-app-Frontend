export function toDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export function dateFromKey(dateKey) {
    const [year, month, day] = dateKey.split("-").map(Number);
    return new Date(year, month - 1, day);
}

export function createEmptyForm(date) {
    return {
        date,
        workerIds: [],
        vehicleId: "",
        task: "",
        location: "",
        startTime: "08:00",
        endTime: "17:00",
        status: "programada",
        notes: ""
    };
}

export function buildCalendarDays(visibleMonth) {
    const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const mondayOffset = (firstDay.getDay() + 6) % 7;
    const gridStart = new Date(firstDay);
    gridStart.setDate(firstDay.getDate() - mondayOffset);

    return Array.from({ length: 42 }, (_, index) => {
        const date = new Date(gridStart);
        date.setDate(gridStart.getDate() + index);
        return date;
    });
}

export function getWeekStart(date) {
    const start = new Date(date);
    const mondayOffset = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - mondayOffset);
    return start;
}

export function buildWeekDays(date) {
    const start = getWeekStart(date);
    return Array.from({ length: 7 }, (_, index) => {
        const day = new Date(start);
        day.setDate(start.getDate() + index);
        return day;
    });
}

export function formatShortDate(date) {
    return new Intl.DateTimeFormat("es-CO", {
        day: "numeric",
        month: "short"
    }).format(date);
}

export function sortByTime(items) {
    return [...items].sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export function normalizeName(value) {
    return value.trim().toLocaleLowerCase("es");
}

export function formatWorkerNames(item) {
    return (item.workers || []).map(worker => worker.name).join(", ");
}

export function formatStartTime(item) {
    return item.startTime || "Sin horario";
}

export function formatTimeRange(item) {
    if (!item.startTime && !item.endTime) return "Sin horario definido";
    if (!item.startTime || !item.endTime) return `${item.startTime || item.endTime} · horario incompleto`;
    return `${item.startTime} – ${item.endTime}`;
}

export function timeToMinutes(value) {
    if (!value) return null;
    const [hours, minutes] = value.split(":").map(Number);
    return (hours * 60) + minutes;
}

export function schedulesOverlap(first, second) {
    const firstStart = timeToMinutes(first.startTime);
    const firstEnd = timeToMinutes(first.endTime);
    const secondStart = timeToMinutes(second.startTime);
    const secondEnd = timeToMinutes(second.endTime);

    // Una labor sin horario definido reserva el día completo para evitar dobles asignaciones.
    if ([firstStart, firstEnd, secondStart, secondEnd].some(value => value === null)) return true;
    return firstStart < secondEnd && secondStart < firstEnd;
}

export function findScheduleConflict(candidate, items, ignoredId = candidate.id) {
    if (candidate.status === "cancelada") return null;

    const candidateWorkerIds = new Set(
        candidate.workerIds || (candidate.workers || []).map(worker => worker.id)
    );

    for (const item of items) {
        if (
            item.id === ignoredId ||
            item.date !== candidate.date ||
            item.status === "cancelada" ||
            !schedulesOverlap(item, candidate)
        ) continue;

        const conflictingWorker = (item.workers || [])
            .find(worker => candidateWorkerIds.has(worker.id));
        if (conflictingWorker) {
            return { item, type: "worker", resource: conflictingWorker.name };
        }

        if (candidate.vehicleId && item.vehicleId === candidate.vehicleId) {
            return {
                item,
                type: "vehicle",
                resource: item.vehicle?.plate || "el vehículo seleccionado"
            };
        }
    }

    return null;
}
