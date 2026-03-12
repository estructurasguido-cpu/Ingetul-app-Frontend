import { jsPDF } from "jspdf";

const AZUL = [0, 81, 255];

function textJustify(pdf, text, x, y, maxWidth, lineHeight = 6, firstLineWidth = null, baseX = null) {

    const words = text.split(" ");
    let line = "";
    let lines = [];

    let currentWidth = firstLineWidth || maxWidth;
    let isFirstLine = true;

    words.forEach(word => {
        const testLine = line + word + " ";
        const testWidth = pdf.getTextWidth(testLine);

        if (testWidth > currentWidth && line !== "") {
            lines.push(line.trim());
            line = word + " ";

            if (isFirstLine && firstLineWidth) {
                currentWidth = maxWidth;
                isFirstLine = false;
            }
        } else {
            line = testLine;
        }
    });

    if (line) lines.push(line.trim());

    lines.forEach((lineText, index) => {

        const currentX = (index === 0)
            ? x
            : (baseX !== null ? baseX : x);

        // 🔥 ancho real desde donde empieza esa línea
        const availableWidth = maxWidth - (currentX - x);

        if (index === lines.length - 1) {
            pdf.text(lineText, currentX, y);
        } else {
            justifyLine(pdf, lineText, currentX, y, availableWidth);
        }

        y += lineHeight;
    });

    return y;
}

function justifyLine(pdf, line, x, y, maxWidth) {
    const words = line.split(" ");
    if (words.length === 1) {
        pdf.text(line, x, y);
        return;
    }

    const textWidth = pdf.getTextWidth(line.replace(/\s+/g, ""));
    const spaceCount = words.length - 1;
    const spaceWidth = (maxWidth - textWidth) / spaceCount;

    let cursorX = x;
    words.forEach((word, i) => {
        pdf.text(word, cursorX, y);
        cursorX += pdf.getTextWidth(word);
        if (i < spaceCount) cursorX += spaceWidth;
    });
}

export async function generarPDFCotizacion(data) {

    const pdf = new jsPDF({
        unit: "mm",
        format: "a4",
        compress: true,
    });

    pdf.setFont("Helvetica");

    /* MEDIDAS Y MÁRGENES */

    const pageWidth = pdf.internal.pageSize.getWidth();

    const MARGIN_LEFT = 20;
    const MARGIN_RIGHT = 20;

    const CONTENT_LEFT = MARGIN_LEFT;
    const CONTENT_RIGHT = pageWidth - MARGIN_RIGHT;
    const CONTENT_WIDTH = CONTENT_RIGHT - CONTENT_LEFT;

    const pageBottom = 280;
    const pageStartY = 30;

    let y = 20;

    /* HELPERS */

    function checkPage(extra = 10) {
        if (y + extra > pageBottom) {
            pdf.addPage();
            y = pageStartY;
        }
    }

    function drawParagraph(text, x, width, lineHeight = 5, marginBottom = 4) {
        const lines = pdf.splitTextToSize(text || "", width);
        checkPage(lines.length * lineHeight);
        pdf.text(lines, x, y);
        y += lines.length * lineHeight + marginBottom;
    }

    /* HEADER */

    pdf.setFontSize(11);
    pdf.text(data.fecha, CONTENT_RIGHT, 15, { align: "right" });
    pdf.text(`${data.ciudad} - ${data.departamento}`, CONTENT_RIGHT, 20, { align: "right" });

    pdf.setFontSize(18);
    pdf.setTextColor(...AZUL);
    pdf.text("Cotización", pageWidth / 2, 28, { align: "center" });

    pdf.setDrawColor(...AZUL);
    pdf.setLineWidth(0.6);
    pdf.line(CONTENT_LEFT, 32, CONTENT_RIGHT, 32);

    pdf.setTextColor(0);
    y = 46;

    /* DATOS GENERALES */

    pdf.setFontSize(11);

    pdf.setFont("Helvetica", "bold");
    pdf.text("Dirigido a:", CONTENT_LEFT, y);

    let x = CONTENT_LEFT + pdf.getTextWidth("Dirigido a:") + 2;

    pdf.setFont("Helvetica", "normal");
    pdf.text(data.dirigido || "", x, y);

    x += pdf.getTextWidth(data.dirigido || "") + 2;
    pdf.text(",", x, y);

    x += 2;
    pdf.setFont("Helvetica", "bold");
    pdf.text("Referido:", x, y);

    x += pdf.getTextWidth("Referido:") + 2;
    pdf.setFont("Helvetica", "normal");
    pdf.text(data.referido || "", x, y);

    y += 6;

    pdf.setFont("Helvetica", "bold");
    pdf.text("Tiempo de entrega:", CONTENT_LEFT, y);

    const tiempoLabelWidth = pdf.getTextWidth("Tiempo de entrega:") + 2;

    pdf.setFont("Helvetica", "normal");
    pdf.text(
        `${data.tiempoDeEntrega || ""} días`,
        CONTENT_LEFT + tiempoLabelWidth,
        y
    );

    y += 6;

    /* OBJETO */

    pdf.setFont("Helvetica", "bold");
    pdf.text("Objeto:", CONTENT_LEFT, y);

    const labelWidth = pdf.getTextWidth("Objeto:") + 3;
    pdf.setFont("Helvetica", "normal");

    const texto = data.objeto || "";
    const bloques = texto.split("\n");

    let primeraLinea = true;

    bloques.forEach(bloque => {

        if (!bloque.trim()) {
            y += 5;
            return;
        }

        if (primeraLinea) {

            y = textJustify(
                pdf,
                bloque,
                CONTENT_LEFT + labelWidth,
                y,
                CONTENT_WIDTH - labelWidth,
                5,
                CONTENT_WIDTH - labelWidth,
                CONTENT_LEFT
            );

            primeraLinea = false;

        } else {

            y = textJustify(
                pdf,
                bloque,
                CONTENT_LEFT,
                y,
                CONTENT_WIDTH,
                5
            );
        }

    });

    y += 3;

    /* TABLA */

    const colW = {
        desc: CONTENT_WIDTH * 0.40,
        und: CONTENT_WIDTH * 0.10,
        cant: CONTENT_WIDTH * 0.10,
        unit: CONTENT_WIDTH * 0.20,
        total: CONTENT_WIDTH * 0.20,
    };

    const colX = { desc: CONTENT_LEFT };
    colX.und = colX.desc + colW.desc;
    colX.cant = colX.und + colW.und;
    colX.unit = colX.cant + colW.cant;
    colX.total = colX.unit + colW.unit;

    const baseRowHeight = 8;
    const lineHeight = 5;

    checkPage(12);

    pdf.setFillColor(...AZUL);
    pdf.setTextColor(255);
    pdf.setFontSize(11);

    Object.keys(colX).forEach(k => {
        pdf.rect(colX[k], y, colW[k], baseRowHeight, "FD");
    });

    pdf.text("Descripción", colX.desc + 2, y + 5);
    pdf.text("UND", colX.und + colW.und / 2, y + 5, { align: "center" });
    pdf.text("CANT", colX.cant + colW.cant / 2, y + 5, { align: "center" });
    pdf.text("Vr. Unitario", colX.unit + colW.unit - 2, y + 5, { align: "right" });
    pdf.text("Vr. Total", colX.total + colW.total - 2, y + 5, { align: "right" });

    pdf.setTextColor(0);
    y += baseRowHeight;

    data.items.forEach(it => {

        const descLines = pdf.splitTextToSize(it.desc || "", colW.desc - 4);

        const rowHeight = Math.max(
            baseRowHeight,
            descLines.length * lineHeight + 3
        );

        checkPage(rowHeight + 2);

        Object.keys(colX).forEach(k => {
            pdf.rect(colX[k], y, colW[k], rowHeight);
        });

        const middleY = y + rowHeight / 2 + 2;

        pdf.text(descLines, colX.desc + 2, y + 5);
        pdf.text(it.und || "", colX.und + colW.und / 2, middleY, { align: "center" });
        pdf.text(String(it.cant || ""), colX.cant + colW.cant / 2, middleY, { align: "center" });

        pdf.text(
            (it.unit || 0).toLocaleString("es-CO", { style: "currency", currency: "COP" }),
            colX.unit + colW.unit - 2,
            middleY,
            { align: "right" }
        );

        pdf.text(
            ((it.cant || 0) * (it.unit || 0)).toLocaleString("es-CO", { style: "currency", currency: "COP" }),
            colX.total + colW.total - 2,
            middleY,
            { align: "right" }
        );

        y += rowHeight;
    });

    /* TOTAL */

    y += 6;
    checkPage(10);

    const totalCalculado = data.items.reduce(
        (acc, it) => acc + (it.cant || 0) * (it.unit || 0),
        0
    );

    pdf.setFont("Helvetica", "bold");
    pdf.text(
        `Total: ${totalCalculado.toLocaleString("es-CO", {
            style: "currency",
            currency: "COP",
        })}`,
        CONTENT_RIGHT,
        y,
        { align: "right" }
    );

    /* NOTAS */

    y += 14;
    checkPage(30);

    pdf.setFontSize(14);
    pdf.setTextColor(...AZUL);
    pdf.setFont("Helvetica", "normal");
    pdf.text("Notas", CONTENT_LEFT, y);
    pdf.line(CONTENT_LEFT, y + 2, CONTENT_LEFT + 25, y + 2);

    y += 8;

    pdf.setFontSize(11);
    pdf.setTextColor(0);
    pdf.setFont("Helvetica", "normal");

    const notasTexto = data.notas || "";

    // Separar por saltos de línea
    const notasLineas = notasTexto
        .split("\n")
        .map(n => n.trim())
        .filter(Boolean);

    notasLineas.forEach(linea => {
        checkPage(20);
        y = textJustify(
            pdf,
            linea,
            CONTENT_LEFT,
            y,
            CONTENT_WIDTH,
            5
        ) + 2;
    });

    /* RESPONSABLE / APROBACIÓN */

    y += 6;
    checkPage(40);

    pdf.setFontSize(14);
    pdf.setTextColor(...AZUL);
    pdf.text("Responsable / Aprobación", CONTENT_LEFT, y);
    pdf.line(CONTENT_LEFT, y + 2, CONTENT_LEFT + 65, y + 2);

    y += 8;

    pdf.setFontSize(11);
    pdf.setTextColor(0);
    pdf.setFont("Helvetica", "normal");

    pdf.text("INGETUL S.A.S", CONTENT_LEFT, y);
    y += 6;

    drawParagraph(
        "3143284624 - Cl. 28 #19-18 a 19-52, C.C. Bicentenario Plaza, local 15",
        CONTENT_LEFT,
        CONTENT_WIDTH,
        5,
        2
    );

    pdf.text("ingetulsas@gmail.com", CONTENT_LEFT, y);
    y += 6;

    pdf.text(`Proyectó: ${data.responsable || ""}`, CONTENT_LEFT, y);

    return pdf.output("arraybuffer");
}
