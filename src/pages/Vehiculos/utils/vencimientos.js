export const initialVehicleForm = {
    placa: "",
    descripcion: "",
    tipoDocumentoPropietario: "CC",
    documentoPropietario: "",
    fechaSoat: "",
    fechaTecnomecanica: ""
};

export const VEHICLE_FILTERS = {
    todos: "Todos",
    vencidos: "Vencidos",
    proximos: "Próximos",
    vigentes: "Vigentes",
    pendientes: "Pendientes"
};

export function normalizePlate(value) {
    return value.toUpperCase().replace(/\s+/g, "");
}

export function getTodayDate() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

export function getDaysUntil(dateValue) {
    if (!dateValue) return null;

    const today = getTodayDate();
    const target = new Date(`${dateValue}T00:00:00`);
    const diff = target.getTime() - today.getTime();

    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getDocumentStatus(dateValue) {
    const days = getDaysUntil(dateValue);

    if (days === null) {
        return {
            label: "Sin fecha",
            tone: "bg-gray-100 text-gray-700 border-gray-200",
            priority: 4,
            days
        };
    }

    if (days < 0) {
        return {
            label: `Vencido hace ${Math.abs(days)} día${Math.abs(days) === 1 ? "" : "s"}`,
            tone: "bg-red-50 text-red-700 border-red-200",
            priority: 0,
            days
        };
    }

    if (days <= 7) {
        return {
            label: days === 0 ? "Vence hoy" : `Vence en ${days} día${days === 1 ? "" : "s"}`,
            tone: "bg-orange-50 text-orange-700 border-orange-200",
            priority: 1,
            days
        };
    }

    if (days <= 30) {
        return {
            label: `Vence en ${days} días`,
            tone: "bg-yellow-50 text-yellow-700 border-yellow-200",
            priority: 2,
            days
        };
    }

    return {
        label: `Vigente por ${days} días`,
        tone: "bg-green-50 text-green-700 border-green-200",
        priority: 3,
        days
    };
}

export function getVehicleStatus(vehicle) {
    const soat = getDocumentStatus(vehicle.fechaSoat);
    const tecnomecanica = getDocumentStatus(vehicle.fechaTecnomecanica);

    if (soat.days === null || tecnomecanica.days === null) {
        return { label: "Pendiente", tone: "text-gray-700 bg-gray-100" };
    }

    const worstPriority = Math.min(soat.priority, tecnomecanica.priority);

    if (worstPriority === 0) return { label: "Vencido", tone: "text-red-700 bg-red-50" };
    if (worstPriority === 1) return { label: "Crítico", tone: "text-orange-700 bg-orange-50" };
    if (worstPriority === 2) return { label: "Próximo", tone: "text-yellow-700 bg-yellow-50" };
    if (worstPriority === 3) return { label: "Vigente", tone: "text-green-700 bg-green-50" };

    return { label: "Pendiente", tone: "text-gray-700 bg-gray-100" };
}

export function matchesVehicleFilter(vehicle, filter) {
    const status = getVehicleStatus(vehicle).label;

    if (filter === "vencidos") return status === "Vencido";
    if (filter === "proximos") return status === "Crítico" || status === "Próximo";
    if (filter === "vigentes") return status === "Vigente";
    if (filter === "pendientes") return status === "Pendiente";

    return true;
}

export function getVehicleSortValue(vehicle) {
    const soat = getDocumentStatus(vehicle.fechaSoat);
    const tecnomecanica = getDocumentStatus(vehicle.fechaTecnomecanica);
    const priorities = [soat.priority, tecnomecanica.priority];
    const days = [soat.days, tecnomecanica.days].filter(day => day !== null);

    return {
        priority: Math.min(...priorities),
        days: days.length ? Math.min(...days) : 9999
    };
}

export function buildVehicleSummary(vehicles) {
    return vehicles.reduce(
        (acc, vehicle) => {
            const status = getVehicleStatus(vehicle).label;

            acc.total += 1;
            if (status === "Vencido") acc.vencidos += 1;
            if (status === "Crítico" || status === "Próximo") acc.proximos += 1;
            if (status === "Vigente") acc.vigentes += 1;
            if (status === "Pendiente") acc.pendientes += 1;

            return acc;
        },
        { total: 0, vencidos: 0, proximos: 0, vigentes: 0, pendientes: 0 }
    );
}

export function formatVehicleDate(dateValue) {
    if (!dateValue) return "No registrada";
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
    if (!match) return dateValue;

    const [, year, month, day] = match;
    return `${day}/${month}/${year}`;
}

export function filterAndSortVehicles(vehicles, filter, search) {
    const query = search.trim().toLowerCase();

    return vehicles
        .filter(vehicle => matchesVehicleFilter(vehicle, filter))
        .filter(vehicle => {
            if (!query) return true;

            return [
                vehicle.placa,
                vehicle.descripcion,
                vehicle.tipoDocumentoPropietario,
                vehicle.documentoPropietario
            ].some(value => value?.toLowerCase().includes(query));
        })
        .sort((a, b) => {
            const sortA = getVehicleSortValue(a);
            const sortB = getVehicleSortValue(b);

            if (sortA.priority !== sortB.priority) return sortA.priority - sortB.priority;
            if (sortA.days !== sortB.days) return sortA.days - sortB.days;

            return a.placa.localeCompare(b.placa);
        });
}
