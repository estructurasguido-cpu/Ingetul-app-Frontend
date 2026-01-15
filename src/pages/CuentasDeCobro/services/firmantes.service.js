import { supabase } from "../../../services/supabaseClient";

const BUCKET = "private-assets";

export async function obtenerFirmante(id) {
    const { data, error } = await supabase
        .from("firmantes")
        .select("*")
        .eq("id", id)
        .single();

    if (error) throw error;

    const { data: file } = await supabase
        .storage
        .from(BUCKET)
        .download(data.firma_path);

    const bytes = await file.arrayBuffer();

    const firmaBase64 =
        "data:image/png;base64," +
        btoa(
            new Uint8Array(bytes)
                .reduce((acc, b) => acc + String.fromCharCode(b), "")
        );

    return {
        ...data,
        firmaBase64,
    };
}
