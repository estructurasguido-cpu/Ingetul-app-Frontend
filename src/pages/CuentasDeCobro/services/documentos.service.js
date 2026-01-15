import { supabase } from "../../../services/supabaseClient";

const BUCKET = "private-assets";

export async function obtenerPDFsBeneficiario(beneficiario) {
    const paths =
        beneficiario === "INGETUL"
            ? [
                "pdfs/Certificacion-bancaria-Ingetul.pdf",
                "pdfs/RUT-INGETUL-3-12-25.pdf",
            ]
            : [
                "pdfs/Certificacion-bancaria-Guido.pdf",
                "pdfs/RUT-GUIDO.pdf",
            ];

    const buffers = [];

    for (const path of paths) {
        const { data } = await supabase
            .storage
            .from(BUCKET)
            .download(path);

        buffers.push(await data.arrayBuffer());
    }

    return buffers;
}
