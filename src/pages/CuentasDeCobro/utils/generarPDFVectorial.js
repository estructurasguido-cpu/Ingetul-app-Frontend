import { jsPDF } from "jspdf";
import { PDFDocument } from "pdf-lib";
import logoIngetul from "../../../assets/logos/ingetul.jpg";
import { FIRMANTES } from "../constants/personas";

import certguido from "../../../assets/pdfs/Certificacion-bancaria-Guido.pdf";
import certingetul from "../../../assets/pdfs/Certificacion-bancaria-Ingetul.pdf";
import rutingetul from "../../../assets/pdfs/RUT-INGETUL-3-12-25.pdf";
import rutguido from "../../../assets/pdfs/RUT-GUIDO.pdf";

async function loadImageAsDataURL(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = reject;
        img.src = src;
    });
}

export async function generarPDFVectorial(data, archivoExtra) {
    const pdf = new jsPDF({
        unit: "mm",
        format: "letter",
        compress: true,
    });

    pdf.setFont("Helvetica");

    // ===== HEADER =====
    pdf.setFontSize(11);
    pdf.text(`${data.ciudad} – ${data.departamento}, ${data.fecha}`, 20, 15);

    pdf.setFontSize(18);
    pdf.setFont("Helvetica", "bold");
    pdf.text("CUENTA DE COBRO", 108, 35, { align: "center" });

    pdf.setFontSize(12);
    pdf.setFont("Helvetica", "normal");
    pdf.text(data.empresaDeudora, 108, 50, { align: "center" });
    pdf.text(
        `${data.tipoDeudor === "CC" ? "C.C." : "NIT."} ${data.nitDeudor}`,
        108,
        57,
        { align: "center" }
    );

    // ===== BENEFICIARIO =====
    pdf.setFont("Helvetica", "bold");
    pdf.text("DEBE A:", 108, 72, { align: "center" });

    pdf.setFont("Helvetica", "normal");
    pdf.text(data.empresaBeneficiaria, 108, 82, { align: "center" });
    pdf.text(
        `${data.beneficiario === "GUIDO" ? "C.C." : "NIT."} ${data.nitBeneficiario}`,
        108,
        90,
        { align: "center" }
    );

    // ===== VALOR =====
    pdf.setFont("Helvetica", "bold");
    pdf.text("LA SUMA DE:", 108, 105, { align: "center" });

    pdf.setFont("Helvetica", "bold");
    pdf.text(data.valorLetras.trim().replace(/\.*$/, "") + ".", 20, 120, { maxWidth: 170 });

    // ===== CONCEPTO =====
    pdf.setFont("Helvetica", "bold");
    pdf.text("Por concepto de:", 20, 140);

    pdf.setFont("Helvetica", "normal");
    pdf.text(data.concepto, 20, 147, { maxWidth: 170 });

    // ===== NOTAS =====
    if (data.usarNotas) {
        pdf.setFont("Helvetica", "bold");
        pdf.text("NOTAS:", 20, 170);

        pdf.setFont("Helvetica", "normal");
        const lines = pdf.splitTextToSize(data.notas, 170);
        pdf.text(lines, 20, 178);
    }

    // ===== FIRMA =====
    const firm = FIRMANTES[data.firmante] || FIRMANTES["guido_ingetul"];
    const firmaDataURL = await loadImageAsDataURL(firm.firma);

    const firmaY = 205;
    const lineaY = firmaY + 25;
    const texto1Y = lineaY + 8;
    const texto2Y = texto1Y + 7;
    const texto3Y = texto2Y + 7;
    const texto4Y = texto3Y + 7;

    pdf.addImage(firmaDataURL, "PNG", 20, firmaY, 45, 25);
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
    pdf.text("Anexo a este documento va la certificación bancaria oficial.", 20, y + 5);

    const baseBytes = pdf.output("arraybuffer");
    const pdfDoc = await PDFDocument.load(baseBytes);

    const pages = pdfDoc.getPages();

    if (data.beneficiario === "INGETUL") {
        const logoBytes = await fetch(logoIngetul).then(r => r.arrayBuffer());
        const logoImage = await pdfDoc.embedJpg(logoBytes);

        const firstPage = pages[0];
        const { width, height } = firstPage.getSize();

        const scale = 0.35;
        const dims = logoImage.scale(scale);

        firstPage.drawImage(logoImage, {
            x: (width - dims.width) / 2,
            y: (height - dims.height) / 2,
            width: dims.width,
            height: dims.height,
            opacity: 0.13,
        });
    }

    const adjuntos = [];

    if (data.beneficiario === "INGETUL") {
        adjuntos.push(certingetul);
        adjuntos.push(rutingetul);
    }

    if (data.beneficiario === "GUIDO") {
        adjuntos.push(certguido);
        adjuntos.push(rutguido);
    }

    if (archivoExtra) {
        adjuntos.push(archivoExtra);
    }

    for (const extra of adjuntos) {
        let bytes;

        if (extra.arrayBuffer) {
            bytes = await extra.arrayBuffer();
        } else {
            bytes = await fetch(extra).then(r => r.arrayBuffer());
        }

        const extraPdf = await PDFDocument.load(bytes);
        const extraPages = await pdfDoc.copyPages(extraPdf, extraPdf.getPageIndices());

        extraPages.forEach(p => pdfDoc.addPage(p));
    }

    return await pdfDoc.save();
}
