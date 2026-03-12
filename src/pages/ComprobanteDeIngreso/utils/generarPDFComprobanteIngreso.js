import { jsPDF } from "jspdf";
import { obtenerFirmante } from "../services/firmantes.service";

const VERDE = [0, 130, 70];

const formatMoney = (v) => {
    if (v === null || v === undefined) return "";
    if (typeof v === "string" && v.trim() === "") return "";

    const n = Number(v);
    return Number.isFinite(n) ? n.toLocaleString("es-CO") : "";
};

function campoMultilinea(pdf, label, value, x, y, width, minHeight = 8) {
    pdf.text(label, x + 2, y + 4);

    const texto = pdf.splitTextToSize(value || "", width - 4);
    const altoTexto = texto.length * 4;
    const altoFinal = Math.max(minHeight, altoTexto + 6);

    pdf.rect(x, y, width, altoFinal);
    pdf.text(texto, x + 2, y + 8, {
        maxWidth: width - 4,
        align: "justify",
    });

    return altoFinal;
}

function descomponerFecha(fecha) {
    if (!fecha) return { dia: "", mes: "", anio: "" };

    const [anio, mes, dia] = fecha.split("-");

    return { dia, mes, anio };
}

export async function generarPDFComprobanteIngreso(data) {
    const pdf = new jsPDF({
        unit: "mm",
        format: "a4",
        compress: true,
    });

    pdf.setFont("Helvetica", "normal");
    pdf.setFontSize(8.5);
    pdf.setDrawColor(...VERDE);
    pdf.setLineWidth(0.3);
    pdf.setTextColor(0);

    const L = 15;
    const W = 180;
    let y = 18;

    let firmante = null;

    if (data.firmante) {
        try {
            firmante = await obtenerFirmante(data.firmante);
        } catch (err) {
            console.error(err);
            firmante = null;
        }
    }

    pdf.setTextColor(...VERDE);
    pdf.setFontSize(11);
    pdf.roundedRect(L + 55, y, 70, 8, 2, 2);
    pdf.text("COMPROBANTE DE INGRESO", L + 90, y + 5.5, { align: "center" });

    pdf.setFontSize(8.5);
    pdf.setTextColor(0);
    y += 14;

    const H = 10;

    pdf.rect(L, y, 80, H);
    pdf.rect(L + 80, y, 30, H);
    pdf.rect(L + 110, y, 70, H);

    pdf.setFontSize(7.5);
    pdf.text("CIUDAD Y FECHA", L + 2, y + 3.5);
    pdf.text("No.", L + 82, y + 3.5);
    pdf.text("$", L + 112, y + 3.5);

    pdf.setFontSize(8.5);
    const ciudadFecha = [
        data.ciudad,
        data.departamento,
        data.fecha,
    ].filter(Boolean).join(", ");

    pdf.text(ciudadFecha, L + 2, y + 7.5);
    pdf.text(data.numero || "", L + 82, y + 7.5);
    pdf.text(formatMoney(data.valor), L + 178, y + 7.5, { align: "right" });

    y += H + 2;

    const campos = [
        ["RECIBIDO DE", data.recibidoDe],
        ["DIRECCIÓN", data.direccion],
        ["LA SUMA DE", data.valorLetras],
        ["POR CONCEPTO DE", data.concepto],
    ];

    campos.forEach(([label, value]) => {
        const h = campoMultilinea(pdf, label, value, L, y, W);
        y += h;
    });

    pdf.rect(L, y, 45, 8);
    pdf.rect(L + 45, y, 45, 8);
    pdf.rect(L + 90, y, 45, 8);
    pdf.rect(L + 135, y, 45, 8);

    pdf.text("CHEQUE No.", L + 2, y + 4);
    pdf.text("BANCO", L + 47, y + 4);
    pdf.text("SUCURSAL", L + 92, y + 4);
    pdf.text("EFECTIVO", L + 137, y + 4);

    if (data.medioPago === "cheque") {
        pdf.text(data.cheque?.numero || "", L + 2, y + 7);
        pdf.text(data.cheque?.banco || "", L + 47, y + 7);
        pdf.text(data.cheque?.sucursal || "", L + 92, y + 7);
    } else if (data.medioPago === "efectivo") {
        pdf.rect(L + 157, y + 2, 4, 4);
        pdf.text("X", L + 158.3, y + 6);
    }

    y += 12;

    const cols = [20, 100, 30, 30];
    const headers = ["CÓDIGO", "CUENTA", "DÉBITOS", "CRÉDITOS"];
    const altoFila = 8;
    const filas = Math.max(data.movimientos?.length || 0, 3);
    const altoTabla = filas * altoFila;

    let x = L;
    headers.forEach((h, i) => {
        pdf.rect(x, y, cols[i], altoFila);
        pdf.text(h, x + 2, y + 4);
        x += cols[i];
    });

    y += altoFila;
    const yInicioFilas = y;

    (data.movimientos || []).forEach((m) => {
        x = L;
        const fila = [
            m.codigo || "",
            m.cuenta || "",
            formatMoney(m.debito),
            formatMoney(m.credito),
        ];

        fila.forEach((val, i) => {
            pdf.rect(x, y, cols[i], altoFila);
            pdf.text(val, x + 2, y + 5.2);
            x += cols[i];
        });

        y += altoFila;
    });

    while (y < yInicioFilas + altoTabla) {
        x = L;
        for (let i = 0; i < cols.length; i++) {
            pdf.rect(x, y, cols[i], altoFila);
            x += cols[i];
        }
        y += altoFila;
    }

    const hFirma = 22;

    pdf.rect(L, y + 2, W, hFirma);
    pdf.setFontSize(7);
    pdf.text("FIRMA Y SELLO", L + 2, y + 6);

    if (firmante?.firmaBase64) {
        pdf.addImage(
            firmante.firmaBase64,
            "PNG",
            L + 5,
            y + 8,
            50,
            hFirma - 10
        );
    }

    y += hFirma + 4;

    const { dia, mes, anio } = descomponerFecha(data.fechaRecibido);
    const hPie = 12;

    pdf.rect(L, y, 100, hPie);
    pdf.setFontSize(7);
    pdf.text("C.C./NIT", L + 2, y + 4);

    pdf.setFontSize(8.5);
    pdf.text(firmante?.cedula || "", L + 2, y + 9);

    const xF = L + 100;
    const wFecha = 30;
    const wDia = 15;
    const wMes = 15;
    const wAnio = 20;

    pdf.rect(xF, y, wFecha, hPie);
    pdf.rect(xF + wFecha, y, wDia, hPie);
    pdf.rect(xF + wFecha + wDia, y, wMes, hPie);
    pdf.rect(xF + wFecha + wDia + wMes, y, wAnio, hPie);

    pdf.setFontSize(7);
    pdf.text("Fecha de", xF + 2, y + 4);
    pdf.text("Recibido", xF + 2, y + 8);

    pdf.text("Día", xF + wFecha + 2, y + 4);
    pdf.text("Mes", xF + wFecha + wDia + 2, y + 4);
    pdf.text("Año", xF + wFecha + wDia + wMes + 2, y + 4);

    pdf.setFontSize(8.5);
    pdf.text(dia, xF + wFecha + 2, y + 9);
    pdf.text(mes, xF + wFecha + wDia + 2, y + 9);
    pdf.text(anio, xF + wFecha + wDia + wMes + 2, y + 9);

    /* OUTPUT */
    return pdf.output("arraybuffer");
}
