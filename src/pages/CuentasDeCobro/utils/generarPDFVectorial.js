import { jsPDF } from "jspdf";
import { PDFDocument } from "pdf-lib";
import { obtenerFirmante } from "../services/firmantes.service";
import { obtenerPDFsBeneficiario } from "../services/documentos.service";

export async function generarPDFVectorial(data, archivoExtra) {
    const pdf = new jsPDF({
        unit: "mm",
        format: "letter",
        compress: true,
    });

    pdf.setFont("Helvetica");

    pdf.setFontSize(11);
    pdf.text(`${data.ciudad} – ${data.departamento}, ${data.fecha}`, 20, 15);

    pdf.setFontSize(18);
    pdf.setFont("Helvetica", "bold");
    pdf.text("CUENTA DE COBRO", 108, 35, { align: "center" });

    pdf.setFontSize(12);
    pdf.setFont("Helvetica", "normal");
    pdf.text(data.deudorNombre, 108, 50, { align: "center" });

    if (data.deudorDocumento) {
        pdf.text(
            `${data.deudorTipoDocumento === "CC" ? "C.C." : "NIT."} ${data.deudorDocumento}`,
            108,
            57,
            { align: "center" }
        );
    }

    pdf.setFont("Helvetica", "bold");
    pdf.text("DEBE A:", 108, 72, { align: "center" });

    pdf.setFont("Helvetica", "normal");
    pdf.text(data.beneficiarioNombre, 108, 82, { align: "center" });
    pdf.text(
        `${data.beneficiarioTipoDocumento}. ${data.beneficiarioDocumento}`,
        108,
        90,
        { align: "center" }
    );

    pdf.setFont("Helvetica", "bold");
    pdf.text("LA SUMA DE:", 108, 105, { align: "center" });

    pdf.text(
        data.valorLetras.trim().replace(/\.*$/, "") + ".",
        20,
        120,
        { maxWidth: 170 }
    );

    pdf.setFont("Helvetica", "bold");
    pdf.text("Por concepto de:", 20, 140);

    pdf.setFont("Helvetica", "normal");
    pdf.text(data.concepto, 20, 147, { maxWidth: 170 });

    if (data.usarNotas) {
        pdf.setFont("Helvetica", "bold");
        pdf.text("NOTAS:", 20, 170);

        pdf.setFont("Helvetica", "normal");
        const lines = pdf.splitTextToSize(data.notas, 170);
        pdf.text(lines, 20, 178);
    }

    const firm = await obtenerFirmante(data.firmante);

    const firmaY = 205;
    const lineaY = firmaY + 25;
    const texto1Y = lineaY + 8;
    const texto2Y = texto1Y + 7;
    const texto3Y = texto2Y + 7;
    const texto4Y = texto3Y + 7;

    pdf.addImage(firm.firmaBase64, "PNG", 20, firmaY, 45, 25);
    pdf.line(20, lineaY, 85, lineaY);

    pdf.setFont("Helvetica", "bold");
    pdf.text(firm.nombre, 20, texto1Y);
    pdf.text(firm.cargo, 20, texto2Y);
    pdf.text(`C.C. ${firm.cedula}  Tel: ${firm.telefono}`, 20, texto3Y);

    let y = texto4Y;

    if (firm.direccion) {
        pdf.text(`Dirección: ${firm.direccion}`, 20, y);
        y += 7;
    }

    if (firm.email) {
        pdf.text(`Email: ${firm.email}`, 20, y);
        y += 7;
    }

    pdf.setFontSize(9);
    pdf.text(
        "Anexo a este documento va la certificación bancaria oficial.",
        20,
        y + 5
    );

    const baseBytes = pdf.output("arraybuffer");
    const pdfDoc = await PDFDocument.load(baseBytes);

    const adjuntos = await obtenerPDFsBeneficiario(data.beneficiario);

    if (archivoExtra) {
        adjuntos.push(await archivoExtra.arrayBuffer());
    }

    for (const bytes of adjuntos) {
        const extraPdf = await PDFDocument.load(bytes);
        const pages = await pdfDoc.copyPages(
            extraPdf,
            extraPdf.getPageIndices()
        );
        pages.forEach(p => pdfDoc.addPage(p));
    }

    return await pdfDoc.save();
}
