import { supabase } from "../../../services/supabaseClient";

function mapVehiculoFromDb(row) {
    return {
        id: row.id,
        placa: row.placa,
        descripcion: row.descripcion || "",
        tipoDocumentoPropietario: row.tipo_documento_propietario || "CC",
        documentoPropietario: row.documento_propietario || "",
        fechaSoat: row.fecha_soat || "",
        fechaTecnomecanica: row.fecha_tecnomecanica || "",
        activo: row.activo,
        lastNotifiedSoat: row.last_notified_soat,
        lastNotifiedTecnomecanica: row.last_notified_tecnomecanica,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

function mapVehiculoToDb(payload) {
    return {
        placa: payload.placa,
        descripcion: payload.descripcion || null,
        tipo_documento_propietario: payload.tipoDocumentoPropietario || "CC",
        documento_propietario: payload.documentoPropietario || null,
        fecha_soat: payload.fechaSoat || null,
        fecha_tecnomecanica: payload.fechaTecnomecanica || null,
        activo: payload.activo ?? true
    };
}

export async function getVehiculos() {
    const { data, error } = await supabase
        .from("vehiculos")
        .select("*")
        .eq("activo", true)
        .order("placa");

    if (error) throw error;

    return data.map(mapVehiculoFromDb);
}

export async function createVehiculo(payload) {
    const { data, error } = await supabase
        .from("vehiculos")
        .insert(mapVehiculoToDb(payload))
        .select()
        .single();

    if (error) throw error;

    return mapVehiculoFromDb(data);
}

export async function getVehiculoByPlate(placa) {
    const { data, error } = await supabase
        .from("vehiculos")
        .select("*")
        .eq("placa", placa)
        .maybeSingle();

    if (error) throw error;
    return data ? mapVehiculoFromDb(data) : null;
}

export async function updateVehiculo(id, payload) {
    const { data, error } = await supabase
        .from("vehiculos")
        .update(mapVehiculoToDb(payload))
        .eq("id", id)
        .select()
        .single();

    if (error) throw error;

    return mapVehiculoFromDb(data);
}

export async function deleteVehiculo(id) {
    const { error } = await supabase
        .from("vehiculos")
        .update({ activo: false })
        .eq("id", id);

    if (error) throw error;

    return true;
}
