import { useCallback, useEffect, useMemo, useState } from "react";
import { KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { CalendarDays, ChevronLeft, ChevronRight, LayoutGrid, List, LoaderCircle, Plus, Users, X } from "lucide-react";
import DayAgenda from "./components/DayAgenda";
import ListView from "./components/ListView";
import MonthView from "./components/MonthView";
import ProgramacionFormModal from "./components/ProgramacionFormModal";
import WeekView from "./components/WeekView";
import WorkersModal from "./components/WorkersModal";
import WorkersView from "./components/WorkersView";
import { STATUS_LABELS } from "./programacion.constants";
import {
    buildCalendarDays, buildWeekDays, createEmptyForm, dateFromKey,
    findScheduleConflict, formatShortDate, formatTimeRange, formatWorkerNames, normalizeName, sortByTime,
    timeToMinutes, toDateKey
} from "./programacion.utils";
import { getVehiculos } from "../Vehiculos/services/vehiculos.service";
import {
    createProgramacion,
    createProgramacionWorker,
    deleteProgramacion,
    deleteProgramacionWorker,
    getProgramacionWorkers,
    getProgramaciones,
    updateProgramacion
} from "./services/programacion.service";

export default function Programacion() {
    const todayKey = toDateKey(new Date());
    const [programaciones, setProgramaciones] = useState([]);
    const [workers, setWorkers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSavingWorker, setIsSavingWorker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(todayKey);
    const [visibleMonth, setVisibleMonth] = useState(() => {
        const today = new Date();
        return new Date(today.getFullYear(), today.getMonth(), 1);
    });
    const [form, setForm] = useState(() => createEmptyForm(todayKey));
    const [editingId, setEditingId] = useState(null);
    const [isDuplicating, setIsDuplicating] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [dataError, setDataError] = useState("");
    const [dataWarning, setDataWarning] = useState("");
    const [viewMode, setViewMode] = useState("month");
    const [showWorkers, setShowWorkers] = useState(false);
    const [workerName, setWorkerName] = useState("");
    const [workerError, setWorkerError] = useState("");
    const [formError, setFormError] = useState("");
    const [filters, setFilters] = useState({ worker: "", vehicle: "", status: "", search: "" });
    const [activeDragId, setActiveDragId] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor)
    );

    const loadProgramacion = useCallback(async () => {
        setIsLoading(true);
        setDataError("");
        setDataWarning("");

        try {
            const [schedulesResult, workersResult, vehiclesResult] = await Promise.allSettled([
                getProgramaciones(),
                getProgramacionWorkers(),
                getVehiculos()
            ]);

            if (schedulesResult.status === "rejected" || workersResult.status === "rejected") {
                throw schedulesResult.status === "rejected"
                    ? schedulesResult.reason
                    : workersResult.reason;
            }

            setProgramaciones(schedulesResult.value);
            setWorkers(workersResult.value);

            if (vehiclesResult.status === "fulfilled") {
                setVehicles(vehiclesResult.value);
            } else {
                console.error("No se pudo cargar el catálogo de vehículos:", vehiclesResult.reason);
                setVehicles([]);
                setDataWarning("La programación está disponible, pero no se pudo cargar el catálogo de vehículos.");
            }
        } catch (error) {
            console.error("No se pudo cargar la programación:", error);
            setDataError("No se pudo cargar la programación.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProgramacion();
    }, [loadProgramacion]);

    useEffect(() => {
        if (feedback?.tone !== "success") return undefined;
        const timeoutId = setTimeout(() => setFeedback(null), 4500);
        return () => clearTimeout(timeoutId);
    }, [feedback]);

    const workerOptions = useMemo(() => {
        const names = [
            ...workers.map(worker => worker.name),
            ...programaciones.flatMap(item => item.workers.map(worker => worker.name))
        ].filter(Boolean);
        return [...new Map(names.map(name => [normalizeName(name), name.trim()])).values()]
            .sort((a, b) => a.localeCompare(b, "es"));
    }, [programaciones, workers]);
    const scheduleWorkerOptions = useMemo(() => {
        const options = [...workers];
        if (editingId || isDuplicating) {
            const assignedWorkers = programaciones
                .find(item => item.id === editingId)?.workers || form.workers || [];
            assignedWorkers.forEach(worker => {
                if (!options.some(option => option.id === worker.id)) options.push(worker);
            });
        }
        return options.sort((a, b) => a.name.localeCompare(b.name, "es"));
    }, [editingId, form.workers, isDuplicating, programaciones, workers]);
    const scheduleVehicleOptions = useMemo(() => {
        const options = vehicles.map(vehicle => ({
            id: vehicle.id,
            plate: vehicle.placa,
            description: vehicle.descripcion,
            active: vehicle.activo
        }));
        if (form.vehicle && !options.some(option => option.id === form.vehicle.id)) {
            options.push(form.vehicle);
        }
        return options.sort((a, b) => a.plate.localeCompare(b.plate, "es"));
    }, [form.vehicle, vehicles]);
    const filteredProgramaciones = useMemo(() => {
        const search = filters.search.trim().toLocaleLowerCase("es");
        return programaciones.filter(item => {
            if (filters.worker && !item.workers.some(worker => normalizeName(worker.name) === normalizeName(filters.worker))) return false;
            if (filters.vehicle && item.vehicleId !== filters.vehicle) return false;
            if (filters.status && item.status !== filters.status) return false;
            if (!search) return true;
            return [item.task, item.location, item.notes, formatWorkerNames(item), item.vehicle?.plate, item.vehicle?.description]
                .some(value => value?.toLocaleLowerCase("es").includes(search));
        });
    }, [filters, programaciones]);
    const activeDraggedItem = useMemo(
        () => programaciones.find(item => item.id === activeDragId) || null,
        [activeDragId, programaciones]
    );
    const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
    const weekDays = useMemo(() => buildWeekDays(dateFromKey(selectedDate)), [selectedDate]);
    const workerWeekRows = useMemo(() => {
        const weekDateKeys = new Set(weekDays.map(toDateKey));
        const weekItems = filteredProgramaciones.filter(item => weekDateKeys.has(item.date));
        let names;

        if (filters.worker) names = [filters.worker];
        else if (filters.status || filters.search.trim()) names = weekItems.flatMap(item => item.workers.map(worker => worker.name));
        else names = [...workers.map(worker => worker.name), ...weekItems.flatMap(item => item.workers.map(worker => worker.name))];

        const uniqueNames = [...new Map(names.filter(Boolean).map(name => [normalizeName(name), name.trim()])).values()]
            .sort((a, b) => a.localeCompare(b, "es"));

        return uniqueNames.map(worker => {
            const assignments = weekItems.filter(item => item.workers.some(assigned => normalizeName(assigned.name) === normalizeName(worker)));
            return {
                worker,
                assignments,
                itemsByDate: assignments.reduce((grouped, item) => {
                    grouped[item.date] = [...(grouped[item.date] || []), item];
                    return grouped;
                }, {})
            };
        });
    }, [filteredProgramaciones, filters, weekDays, workers]);
    const itemsByDate = useMemo(() => filteredProgramaciones.reduce((grouped, item) => {
        grouped[item.date] = [...(grouped[item.date] || []), item];
        return grouped;
    }, {}), [filteredProgramaciones]);
    const selectedItems = useMemo(
        () => sortByTime(itemsByDate[selectedDate] || []),
        [itemsByDate, selectedDate]
    );
    const monthItems = useMemo(() => {
        const prefix = `${visibleMonth.getFullYear()}-${String(visibleMonth.getMonth() + 1).padStart(2, "0")}`;
        return filteredProgramaciones.filter(item => item.date.startsWith(prefix));
    }, [filteredProgramaciones, visibleMonth]);
    const sortedMonthItems = useMemo(
        () => [...monthItems].sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`)),
        [monthItems]
    );
    const monthSummary = useMemo(() => ({
        total: monthItems.length,
        workers: new Set(monthItems.flatMap(item => item.workerIds)).size,
        completed: monthItems.filter(item => item.status === "completada").length
    }), [monthItems]);

    const monthTitle = new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric" }).format(visibleMonth);
    const selectedTitle = new Intl.DateTimeFormat("es-CO", {
        weekday: "long", day: "numeric", month: "long"
    }).format(dateFromKey(selectedDate));
    const weekTitle = `${formatShortDate(weekDays[0])} – ${formatShortDate(weekDays[6])}`;
    const periodTitle = viewMode === "week" || viewMode === "workers" ? weekTitle : monthTitle;

    function describeConflict(conflict) {
        const subject = conflict.type === "vehicle"
            ? `El vehículo ${conflict.resource}`
            : conflict.resource;
        return `${subject} ya está asignado a "${conflict.item.task}" (${formatTimeRange(conflict.item)}).`;
    }

    function getSaveErrorMessage(error, fallback) {
        return error?.code === "P0001" && error.message
            ? error.message
            : fallback;
    }

    function openCreate(date = selectedDate) {
        setSelectedDate(date);
        setEditingId(null);
        setIsDuplicating(false);
        setForm(createEmptyForm(date));
        setFormError("");
        setShowForm(true);
    }

    function openEdit(item) {
        setEditingId(item.id);
        setIsDuplicating(false);
        setForm({ ...item });
        setFormError("");
        setShowForm(true);
    }

    function openEditForDate(date, item) {
        setSelectedDate(date);
        openEdit(item);
    }

    function openDuplicate(item) {
        const nextDate = dateFromKey(item.date);
        nextDate.setDate(nextDate.getDate() + 1);
        const copy = { ...item };
        delete copy.id;
        setEditingId(null);
        setIsDuplicating(true);
        setForm({ ...copy, date: toDateKey(nextDate), status: "programada" });
        setFormError("");
        setShowForm(true);
    }

    function closeForm() {
        setShowForm(false);
        setEditingId(null);
        setIsDuplicating(false);
        setFormError("");
    }

    async function handleAddWorker(event) {
        event.preventDefault();
        if (isSavingWorker) return;
        const normalizedWorker = workerName.trim();
        if (!normalizedWorker) return;
        if (workers.some(worker => normalizeName(worker.name) === normalizeName(normalizedWorker))) {
            setWorkerError("Ese trabajador ya está en el catálogo.");
            return;
        }

        setIsSavingWorker(true);
        try {
            const createdWorker = await createProgramacionWorker(normalizedWorker);
            setWorkers(current => [...current, createdWorker]);
            setWorkerName("");
            setWorkerError("");
        } catch (error) {
            console.error("No se pudo crear el trabajador:", error);
            setWorkerError(error.code === "23505"
                ? "Ese trabajador ya existe en el catálogo."
                : "No se pudo guardar el trabajador.");
        } finally {
            setIsSavingWorker(false);
        }
    }

    async function handleDeleteWorker(worker) {
        if (isSavingWorker) return;
        if (!confirm(`¿Eliminar a ${worker.name} del catálogo? Solo podrá eliminarse si no tiene labores asociadas.`)) return;

        setIsSavingWorker(true);
        try {
            await deleteProgramacionWorker(worker.id);
            setWorkers(current => current.filter(item => item.id !== worker.id));
            setWorkerError("");
        } catch (error) {
            console.error("No se pudo eliminar el trabajador:", error);
            setWorkerError(error.code === "23503"
                ? "No se puede eliminar porque tiene labores asociadas. Reasígnalas o elimínalas primero."
                : "No se pudo eliminar el trabajador del catálogo.");
        } finally {
            setIsSavingWorker(false);
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (isSaving) return;
        const normalized = {
            ...form,
            workerIds: [...new Set(form.workerIds)],
            task: form.task.trim(),
            location: form.location.trim(),
            notes: form.notes.trim()
        };

        if (normalized.workerIds.length === 0) {
            setFormError("Selecciona al menos un trabajador.");
            return;
        }
        if (!normalized.task || !normalized.date) return;
        const startMinutes = timeToMinutes(normalized.startTime);
        const endMinutes = timeToMinutes(normalized.endTime);
        if ((startMinutes === null) !== (endMinutes === null)) {
            setFormError("Completa ambas horas o deja las dos vacías.");
            return;
        }
        if (startMinutes !== null && endMinutes !== null && endMinutes <= startMinutes) {
            setFormError("La hora de fin debe ser posterior a la hora de inicio.");
            return;
        }

        const conflict = findScheduleConflict(normalized, programaciones, editingId);
        if (conflict) {
            setFormError(describeConflict(conflict));
            return;
        }

        setIsSaving(true);
        try {
            const savedItem = editingId
                ? await updateProgramacion(editingId, normalized, normalized.workerIds)
                : await createProgramacion(normalized, normalized.workerIds);

            setProgramaciones(current => editingId
                ? current.map(item => item.id === editingId ? savedItem : item)
                : [...current, savedItem]);
            setSelectedDate(normalized.date);
            const programmedDate = dateFromKey(normalized.date);
            setVisibleMonth(new Date(programmedDate.getFullYear(), programmedDate.getMonth(), 1));
            closeForm();
            setDataError("");
            setFeedback({ tone: "success", message: editingId ? "Labor actualizada." : "Labor programada." });
        } catch (error) {
            console.error("No se pudo guardar la labor:", error);
            setFormError(getSaveErrorMessage(error, "No se pudo guardar la labor."));
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDelete(item) {
        if (isSaving) return;
        if (!confirm(`¿Eliminar la labor "${item.task}" asignada a ${formatWorkerNames(item)}?`)) return;

        setIsSaving(true);
        try {
            await deleteProgramacion(item.id);
            setProgramaciones(current => current.filter(programacion => programacion.id !== item.id));
            setFeedback({ tone: "success", message: "Labor eliminada." });
        } catch (error) {
            console.error("No se pudo eliminar la labor:", error);
            setFeedback({ tone: "error", message: "No se pudo eliminar la labor." });
        } finally {
            setIsSaving(false);
        }
    }

    function handleMarkCompleted(item) {
        handleStatusChange(item, "completada", "Labor marcada como completada.");
    }

    function handleCancel(item) {
        handleStatusChange(item, "cancelada", "Labor cancelada.");
    }

    function handleReopen(item) {
        const reopenedItem = { ...item, status: "programada" };
        const conflict = findScheduleConflict(reopenedItem, programaciones, item.id);
        if (conflict) {
            setFeedback({
                tone: "error",
                message: `No se pudo reabrir: ${describeConflict(conflict)}`
            });
            return;
        }
        handleStatusChange(item, "programada", "Labor reabierta.");
    }

    async function handleStatusChange(item, status, message) {
        if (isSaving || item.status === status) return;

        setIsSaving(true);
        try {
            const updatedItem = await updateProgramacion(
                item.id,
                { ...item, status },
                item.workerIds
            );
            setProgramaciones(current => current.map(programacion =>
                programacion.id === item.id ? updatedItem : programacion
            ));
            setFeedback({ tone: "success", message });
        } catch (error) {
            console.error("No se pudo actualizar el estado:", error);
            setFeedback({
                tone: "error",
                message: getSaveErrorMessage(error, "No se pudo actualizar el estado de la labor.")
            });
        } finally {
            setIsSaving(false);
        }
    }

    function handleWeekDragStart(event) {
        setActiveDragId(event.active.id);
        setFeedback(null);
    }

    function handleWeekDragCancel() {
        setActiveDragId(null);
    }

    async function handleWeekDragEnd(event) {
        const draggedItem = programaciones.find(item => item.id === event.active.id);
        const targetDate = event.over?.data.current?.dateKey;
        setActiveDragId(null);

        if (isSaving || !draggedItem || !targetDate || draggedItem.date === targetDate) return;
        if (draggedItem.status !== "programada") return;

        const movedItem = { ...draggedItem, date: targetDate };
        const conflict = findScheduleConflict(movedItem, programaciones, draggedItem.id);
        if (conflict) {
            setFeedback({
                tone: "error",
                message: `No se pudo mover: ${describeConflict(conflict)}`
            });
            return;
        }

        setIsSaving(true);
        try {
            const updatedItem = await updateProgramacion(
                draggedItem.id,
                movedItem,
                movedItem.workerIds
            );
            setProgramaciones(current => current.map(item => item.id === draggedItem.id ? updatedItem : item));
            setSelectedDate(targetDate);
            setFeedback({
                tone: "success",
                message: `Labor movida al ${new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long" }).format(dateFromKey(targetDate))}.`
            });
        } catch (error) {
            console.error("No se pudo mover la labor:", error);
            setFeedback({
                tone: "error",
                message: getSaveErrorMessage(error, "No se pudo mover la labor.")
            });
        } finally {
            setIsSaving(false);
        }
    }

    function changePeriod(offset) {
        if (viewMode === "week" || viewMode === "workers") {
            const nextDate = dateFromKey(selectedDate);
            nextDate.setDate(nextDate.getDate() + (offset * 7));
            setSelectedDate(toDateKey(nextDate));
            setVisibleMonth(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
            return;
        }
        setVisibleMonth(current => new Date(current.getFullYear(), current.getMonth() + offset, 1));
    }

    function selectView(nextView) {
        setViewMode(nextView);
        if (nextView === "week" || nextView === "workers") {
            const selected = dateFromKey(selectedDate);
            setVisibleMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
        }
    }

    function goToday() {
        const today = new Date();
        setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
        setSelectedDate(toDateKey(today));
    }

    if (isLoading) {
        return (
            <div className="mx-auto flex min-h-80 max-w-7xl items-center justify-center text-gray-500" role="status">
                <LoaderCircle className="mr-2 animate-spin" size={22} /> Cargando programación...
            </div>
        );
    }

    return (
        <div className="mx-auto min-w-0 max-w-7xl text-gray-800">
            <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-h-10 min-w-0 pl-14">
                    <h1 className="text-2xl font-bold text-[#0051ff]">Programación</h1>
                    <p className="text-sm text-gray-500">Labores diarias del personal de campo.</p>
                </div>
                <div className="grid w-full grid-cols-3 gap-2 lg:w-auto">
                    <div className="min-w-0 rounded-lg bg-white px-2 py-3 shadow-sm sm:px-4"><span className="block text-[11px] text-gray-500 sm:text-xs">Labores</span><strong className="text-xl">{monthSummary.total}</strong></div>
                    <div className="min-w-0 rounded-lg bg-white px-2 py-3 shadow-sm sm:px-4"><span className="block text-[11px] text-gray-500 sm:text-xs">Trabajadores</span><strong className="text-xl">{monthSummary.workers}</strong></div>
                    <div className="min-w-0 rounded-lg bg-green-50 px-2 py-3 text-green-700 shadow-sm sm:px-4"><span className="block text-[11px] sm:text-xs">Completadas</span><strong className="text-xl">{monthSummary.completed}</strong></div>
                </div>
            </header>

            {dataError && <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><span>{dataError}</span><button type="button" onClick={loadProgramacion} className="shrink-0 font-semibold underline">Reintentar</button></div>}
            {dataWarning && <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"><span>{dataWarning}</span><button type="button" onClick={loadProgramacion} className="shrink-0 font-semibold underline">Reintentar</button></div>}
            {feedback && (
                <div className={`mb-4 flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm font-semibold ${feedback.tone === "success" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>
                    <span>{feedback.message}</span>
                    <button type="button" onClick={() => setFeedback(null)} aria-label="Cerrar mensaje" className="rounded p-1 hover:bg-black/5"><X size={16} /></button>
                </div>
            )}

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                <section className="overflow-hidden rounded-xl bg-white shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-4">
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={() => changePeriod(-1)} aria-label="Periodo anterior" className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50"><ChevronLeft size={20} /></button>
                            <button type="button" onClick={() => changePeriod(1)} aria-label="Periodo siguiente" className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50"><ChevronRight size={20} /></button>
                            <button type="button" onClick={goToday} className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold hover:bg-gray-50">Hoy</button>
                        </div>
                        <h2 className="w-full text-center text-lg font-bold capitalize text-gray-900 sm:w-auto">{periodTitle}</h2>
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={() => setShowWorkers(true)} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"><Users size={18} /> <span className="hidden sm:inline">Trabajadores</span></button>
                            <button type="button" onClick={() => openCreate()} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"><Plus size={18} /> Nueva labor</button>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3">
                        <span className="text-xs font-semibold text-gray-500">Selecciona cómo quieres organizar la agenda</span>
                        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1" role="group" aria-label="Cambiar vista">
                            {[
                                { value: "month", label: "Mes", icon: CalendarDays },
                                { value: "week", label: "Semana", icon: LayoutGrid },
                                { value: "list", label: "Lista", icon: List },
                                { value: "workers", label: "Personal", icon: Users }
                            ].map(option => {
                                const ViewIcon = option.icon;
                                return (
                                    <button type="button" key={option.value} onClick={() => selectView(option.value)} aria-pressed={viewMode === option.value} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition ${viewMode === option.value ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"}`}>
                                        <ViewIcon size={16} /><span className="hidden sm:inline">{option.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid gap-2 border-b border-gray-200 bg-white px-4 py-3 md:grid-cols-2 xl:grid-cols-[minmax(180px,1fr)_180px_180px_180px_auto]">
                        <input type="search" value={filters.search} onChange={event => setFilters(current => ({ ...current, search: event.target.value }))} placeholder="Buscar labor, obra o notas" aria-label="Buscar programación" className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                        <select value={filters.worker} onChange={event => setFilters(current => ({ ...current, worker: event.target.value }))} aria-label="Filtrar por trabajador" className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                            <option value="">Todos los trabajadores</option>
                            {workerOptions.map(worker => <option key={worker} value={worker}>{worker}</option>)}
                        </select>
                        <select value={filters.vehicle} onChange={event => setFilters(current => ({ ...current, vehicle: event.target.value }))} aria-label="Filtrar por vehículo" className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                            <option value="">Todos los vehículos</option>
                            {vehicles.map(vehicle => <option key={vehicle.id} value={vehicle.id}>{vehicle.placa}</option>)}
                        </select>
                        <select value={filters.status} onChange={event => setFilters(current => ({ ...current, status: event.target.value }))} aria-label="Filtrar por estado" className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                            <option value="">Todos los estados</option>
                            {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                        {(filters.search || filters.worker || filters.vehicle || filters.status) && <button type="button" onClick={() => setFilters({ worker: "", vehicle: "", status: "", search: "" })} className="rounded-lg px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50">Limpiar</button>}
                    </div>

                    {viewMode === "month" && <MonthView calendarDays={calendarDays} itemsByDate={itemsByDate} selectedDate={selectedDate} todayKey={todayKey} visibleMonth={visibleMonth} onSelectDate={setSelectedDate} />}
                    {viewMode === "week" && <WeekView activeDraggedItem={activeDraggedItem} itemsByDate={itemsByDate} selectedDate={selectedDate} sensors={sensors} todayKey={todayKey} weekDays={weekDays} onCancel={handleCancel} onComplete={handleMarkCompleted} onCreate={openCreate} onDragCancel={handleWeekDragCancel} onDragEnd={handleWeekDragEnd} onDragStart={handleWeekDragStart} onDuplicate={openDuplicate} onEdit={openEditForDate} onReopen={handleReopen} onSelectDate={setSelectedDate} />}
                    {viewMode === "workers" && <WorkersView rows={workerWeekRows} selectedDate={selectedDate} todayKey={todayKey} weekDays={weekDays} onDuplicate={openDuplicate} onEdit={openEditForDate} onSelectDate={setSelectedDate} />}
                    {viewMode === "list" && <ListView items={sortedMonthItems} selectedDate={selectedDate} onCancel={handleCancel} onComplete={handleMarkCompleted} onCreate={() => openCreate()} onDelete={handleDelete} onDuplicate={openDuplicate} onEdit={openEdit} onReopen={handleReopen} onSelectDate={setSelectedDate} />}
                </section>

                <DayAgenda items={selectedItems} title={selectedTitle} onCancel={handleCancel} onComplete={handleMarkCompleted} onCreate={() => openCreate()} onDelete={handleDelete} onDuplicate={openDuplicate} onEdit={openEdit} onReopen={handleReopen} />
            </div>

            {showForm && <ProgramacionFormModal editingId={editingId} error={formError} form={form} isActive={!showWorkers} isDuplicating={isDuplicating} isSaving={isSaving} scheduleVehicleOptions={scheduleVehicleOptions} scheduleWorkerOptions={scheduleWorkerOptions} workers={workers} onChange={setForm} onClearError={() => setFormError("")} onClose={closeForm} onOpenWorkers={() => setShowWorkers(true)} onSubmit={handleSubmit} />}
            {showWorkers && <WorkersModal error={workerError} isSaving={isSavingWorker} workerName={workerName} workers={workers} onAdd={handleAddWorker} onChangeName={value => { setWorkerName(value); setWorkerError(""); }} onClose={() => setShowWorkers(false)} onDelete={handleDeleteWorker} />}
        </div>
    );
}
