import { supabase } from "../../../services/supabaseClient";

const BUCKET = "private-assets";

export async function obtenerFirmante(id) {
    const { data, error } = await supabase
        .from("firmantes")
        .select("cedula, firma_path")
        .eq("id", id)
        .single();

    if (error) throw error;

    let firmaBase64 = null;

    if (data?.firma_path) {
        const { data: file, error: fileError } = await supabase
            .storage
            .from(BUCKET)
            .download(data.firma_path);

        if (fileError) throw fileError;

        const bytes = await file.arrayBuffer();

        firmaBase64 =
            "data:image/png;base64," +
            btoa(
                new Uint8Array(bytes)
                    .reduce((acc, b) => acc + String.fromCharCode(b), "")
            );
    }

    return {
        cedula: data.cedula,
        firmaBase64,
    };
}
