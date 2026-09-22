import { supabase } from "../../../services/supabaseClient";

const WORKERS_TABLE = "programacion_trabajadores";
const SCHEDULES_TABLE = "programacion_labores";
const SCHEDULE_SELECT = `
    id,
    vehiculo_id,
    fecha,
    hora_inicio,
    hora_fin,
    labor,
    lugar,
    notas,
    estado,
    created_at,
    updated_at,
    vehiculo:vehiculos!programacion_labores_vehiculo_fk (
        id,
        placa,
        descripcion,
        activo
    ),
    asignaciones:programacion_labor_trabajadores (
        trabajador:programacion_trabajadores (
            id,
            nombre
        )
    )
`;

function formatTime(value) {
    return value ? value.slice(0, 5) : "";
}

function mapWorkerFromDb(row) {
    return {
        id: row.id,
        name: row.nombre,
        createdAt: row.created_at
    };
}

function mapScheduleFromDb(row) {
    const assignedWorkers = (row.asignaciones || [])
        .map(assignment => assignment.trabajador)
        .filter(Boolean)
        .map(worker => ({ id: worker.id, name: worker.nombre }))
        .sort((a, b) => a.name.localeCompare(b.name, "es"));

    return {
        id: row.id,
        workers: assignedWorkers,
        workerIds: assignedWorkers.map(worker => worker.id),
        vehicleId: row.vehiculo_id || "",
        vehicle: row.vehiculo ? {
            id: row.vehiculo.id,
            plate: row.vehiculo.placa,
            description: row.vehiculo.descripcion || "",
            active: row.vehiculo.activo
        } : null,
        date: row.fecha,
        startTime: formatTime(row.hora_inicio),
        endTime: formatTime(row.hora_fin),
        task: row.labor,
        location: row.lugar || "",
        notes: row.notas || "",
        status: row.estado,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

async function getProgramacionById(id) {
    const { data, error } = await supabase
        .from(SCHEDULES_TABLE)
        .select(SCHEDULE_SELECT)
        .eq("id", id)
        .single();

    if (error) throw error;
    return mapScheduleFromDb(data);
}

async function saveProgramacionWithRpc(id, payload, workerIds) {
    const { data, error } = await supabase.rpc("guardar_programacion_labor", {
        p_labor_id: id || null,
        p_fecha: payload.date,
        p_hora_inicio: payload.startTime || null,
        p_hora_fin: payload.endTime || null,
        p_labor: payload.task,
        p_lugar: payload.location || null,
        p_notas: payload.notes || null,
        p_estado: payload.status,
        p_vehiculo_id: payload.vehicleId || null,
        p_trabajador_ids: [...new Set(workerIds)]
    });

    if (error) throw error;
    return getProgramacionById(data);
}

export async function getProgramacionWorkers() {
    const { data, error } = await supabase
        .from(WORKERS_TABLE)
        .select("id, nombre, created_at")
        .order("nombre");

    if (error) throw error;
    return data.map(mapWorkerFromDb);
}

export async function createProgramacionWorker(name) {
    const { data, error } = await supabase
        .from(WORKERS_TABLE)
        .insert({ nombre: name.trim() })
        .select("id, nombre, created_at")
        .single();

    if (error) throw error;
    return mapWorkerFromDb(data);
}

export async function deleteProgramacionWorker(id) {
    const { error } = await supabase.from(WORKERS_TABLE).delete().eq("id", id);
    if (error) throw error;
}

export async function getProgramaciones() {
    const { data, error } = await supabase
        .from(SCHEDULES_TABLE)
        .select(SCHEDULE_SELECT)
        .order("fecha")
        .order("hora_inicio");

    if (error) throw error;
    return data.map(mapScheduleFromDb);
}

export async function createProgramacion(payload, workerIds) {
    return saveProgramacionWithRpc(null, payload, workerIds);
}

export async function updateProgramacion(id, payload, workerIds) {
    return saveProgramacionWithRpc(id, payload, workerIds);
}

export async function deleteProgramacion(id) {
    const { error } = await supabase.from(SCHEDULES_TABLE).delete().eq("id", id);
    if (error) throw error;
}
