import { supabase } from "../../../services/supabaseClient";

const TABLE = "entradas_salidas_movimientos";

function getMovementAmount(item) {
  const entra = Number(item.entra) || 0;
  const sale = Number(item.sale) || 0;
  return entra > 0 ? entra : sale;
}

function mapMovementFromDb(row) {
  const value = Number(row.valor) || 0;
  const isEntry = row.tipo === "Entrada" || row.tipo === "Bancos";

  return {
    id: row.id,
    fecha: row.fecha,
    tipo: row.tipo,
    cuenta: row.cuenta,
    descripcion: row.descripcion,
    entra: isEntry ? value : 0,
    sale: isEntry ? 0 : value
  };
}

function mapMovementToDb(item, userEmail) {
  return {
    id: item.id,
    fecha: item.fecha,
    tipo: item.tipo,
    cuenta: item.cuenta,
    descripcion: item.descripcion.trim(),
    valor: getMovementAmount(item),
    updated_by_email: userEmail || null,
    deleted_at: null
  };
}

export async function getMovements() {
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, fecha, tipo, cuenta, descripcion, valor, created_at")
    .is("deleted_at", null)
    .order("fecha", { ascending: true })
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  if (error) throw error;

  return data.map(mapMovementFromDb);
}

export async function saveMovementsSnapshot(items, userEmail) {
  const { data: storedRows, error: loadError } = await supabase
    .from(TABLE)
    .select("id, deleted_at");

  if (loadError) throw loadError;

  const currentIds = new Set(items.map(item => item.id));
  const storedIds = new Set(storedRows.map(row => row.id));
  const deletedIds = storedRows
    .filter(row => row.deleted_at === null)
    .map(row => row.id)
    .filter(id => !currentIds.has(id));
  const newItems = items.filter(item => !storedIds.has(item.id));
  const existingItems = items.filter(item => storedIds.has(item.id));

  if (newItems.length > 0) {
    const createdAt = Date.now();
    const rows = newItems.map((item, index) => ({
      ...mapMovementToDb(item, userEmail),
      created_by_email: userEmail || null,
      created_at: new Date(createdAt + index).toISOString()
    }));
    const { error: insertError } = await supabase
      .from(TABLE)
      .insert(rows);

    if (insertError) throw insertError;
  }

  if (existingItems.length > 0) {
    const rows = existingItems.map(item => mapMovementToDb(item, userEmail));
    const { error: updateError } = await supabase
      .from(TABLE)
      .upsert(rows, { onConflict: "id" });

    if (updateError) throw updateError;
  }

  if (deletedIds.length > 0) {
    const { error: deleteError } = await supabase
      .from(TABLE)
      .update({
        deleted_at: new Date().toISOString(),
        updated_by_email: userEmail || null
      })
      .in("id", deletedIds);

    if (deleteError) throw deleteError;
  }

  return true;
}
