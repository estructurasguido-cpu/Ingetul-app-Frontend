import { jsPDF } from "jspdf";
import { PDFDocument } from "pdf-lib";
import Logo from "../../../assets/logos/ingetul.jpg"
import { obtenerFirmante } from "../services/firmantes.service";
import { obtenerPDFsBeneficiario } from "../services/documentos.service";

function textoJustificado(pdf, texto, x, yInicial, maxWidth, pageHeight, margenInferior, lineHeight = 6) {

    const parrafos = texto.split("\n");
    let y = yInicial;

    parrafos.forEach((parrafo) => {

        const lineas = pdf.splitTextToSize(parrafo, maxWidth);

        lineas.forEach((linea, index) => {

            // Si la siguiente línea se sale, crear nueva página
            if (y + lineHeight + margenInferior > pageHeight) {
                pdf.addPage();
                y = 40;
            }

            const esUltimaLinea = index === lineas.length - 1;

            if (esUltimaLinea) {
                pdf.text(linea, x, y);
            } else {
                justificarLinea(pdf, linea, x, y, maxWidth);
            }

            y += lineHeight;
        });

        y += lineHeight * 0.5;
    });

    return y;
}

function justificarLinea(pdf, texto, x, y, maxWidth) {
    const palabras = texto.trim().split(" ");
    if (palabras.length <= 1) {
        pdf.text(texto, x, y);
        return;
    }

    const espacioBase = pdf.getTextWidth(" ");
    const anchoTexto = pdf.getTextWidth(texto.replace(/\s+/g, ""));
    const espacios = palabras.length - 1;
    const espacioExtra = (maxWidth - anchoTexto) / espacios;

    let offsetX = x;

    palabras.forEach((palabra, i) => {
        pdf.text(palabra, offsetX, y);

        if (i < palabras.length - 1) {
            offsetX += pdf.getTextWidth(palabra) + espacioExtra;
        }
    });
}

export async function generarPDFVectorial(data, archivoExtra) {
    const pdf = new jsPDF({
        unit: "mm",
        format: "letter",
        compress: true,
    });

    const pageHeight = pdf.internal.pageSize.getHeight();
    const margenInferior = 20;

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

    let yContenido = 147;

    pdf.setFont("Helvetica", "bold");
    pdf.text("Por concepto de:", 20, 140);

    pdf.setFont("Helvetica", "normal");

    const conceptoLineas = pdf.splitTextToSize(data.concepto, 170);

    // Dibujar concepto con salto automático
    conceptoLineas.forEach((linea) => {

        if (yContenido + 6 + margenInferior > pageHeight) {
            pdf.addPage();
            yContenido = 40;
        }

        pdf.text(linea, 20, yContenido);
        yContenido += 6;
    });

    // Espacio real entre concepto y NOTAS
    yContenido += 6;

    if (data.usarNotas) {
        pdf.setFont("Helvetica", "bold");
        pdf.text("NOTAS:", 20, yContenido);

        yContenido += 8;

        pdf.setFont("Helvetica", "normal");
        yContenido = textoJustificado(
            pdf,
            data.notas,
            20,
            yContenido,
            170,
            pageHeight,
            margenInferior
        );
    }

    const firm = await obtenerFirmante(data.firmante);


    pdf.setFontSize(10);

    const alturaBloqueFirma = 55;

    if (yContenido + alturaBloqueFirma + margenInferior > pageHeight) {
        pdf.addPage();
        yContenido = 40;
    }

    const firmaY = yContenido + 8;
    const lineaY = firmaY + 20;
    const texto1Y = lineaY + 6;
    const texto2Y = texto1Y + 6;
    const texto3Y = texto2Y + 6;
    const texto4Y = texto3Y + 6;

    pdf.addImage(firm.firmaBase64, "PNG", 20, firmaY, 38, 20);
    pdf.line(20, lineaY, 85, lineaY);

    // 🔹 Todo el bloque institucional en negrilla
    pdf.setFont("Helvetica", "bold");

    pdf.text(firm.nombre, 20, texto1Y);
    pdf.text(firm.cargo, 20, texto2Y);
    pdf.text(`C.C. ${firm.cedula}  Tel: ${firm.telefono}`, 20, texto3Y);

    let y = texto4Y;

    if (firm.direccion) {
        pdf.text(`Dirección: ${firm.direccion}`, 20, y);
        y += 6;
    }

    pdf.setFontSize(9);
    pdf.text(
        "Anexo a este documento va la certificación bancaria oficial.",
        20,
        y + 4
    );

    const baseBytes = pdf.output("arraybuffer");
    const pdfDoc = await PDFDocument.load(baseBytes);

    if (data.beneficiario === "INGETUL") {
        const logoBytes = await fetch(Logo).then(r => r.arrayBuffer());

        const logoImage = await pdfDoc.embedJpg(logoBytes);

        const firstPage = pdfDoc.getPages()[0];
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
