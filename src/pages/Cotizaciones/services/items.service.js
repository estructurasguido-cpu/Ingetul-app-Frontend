import { supabase } from "../../../services/supabaseClient"

export async function getItemsCatalog() {
    const { data, error } = await supabase
        .from("items")
        .select("id, nombre")
        .order("id");

    if (error) {
        console.error("Error obteniendo items:", error);
        throw error;
    }

    return data;
}

export async function createItemCatalog(nombre) {
    const { data, error } = await supabase
        .from("items")
        .insert([{ nombre }])
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateItemCatalog(id, nombre) {
    const { data, error } = await supabase
        .from("items")
        .update({ nombre })
        .eq("id", id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteItemCatalog(id) {
    const { error } = await supabase
        .from("items")
        .delete()
        .eq("id", id);

    if (error) throw error;
}