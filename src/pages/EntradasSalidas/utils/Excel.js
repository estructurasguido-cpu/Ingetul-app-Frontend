import ExcelJS from "exceljs";
import { today } from "./formatters.js";

export async function exportExcel(items) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("EntradasSalidas");

  sheet.columns = [
    { header: "Fecha", key: "fecha", width: 14 },
    { header: "Tipo", key: "tipo", width: 14 },
    { header: "Cuenta", key: "cuenta", width: 18 },
    { header: "Descripción", key: "descripcion", width: 42 },
    { header: "Entra", key: "entra", width: 16 },
    { header: "Sale", key: "sale", width: 16 },
    { header: "Saldo", key: "saldo", width: 16 },
  ];

  const COLORS = {
    Entrada: "FFD9EAF7",
    Salida: "FFF2F2F2",
    Prestamo: "FFF7D7D7",
    Bancos: "FFD7F7D7"
  };

  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF2563EB" }
  };
  header.alignment = { vertical: "middle" };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = "A1:G1";

  items.forEach(row => {
    const added = sheet.addRow(row);
    const color = COLORS[row.tipo] || "FFFFFF";

    added.eachCell(cell => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: color }
      };
    });
  });

  const totalEntradas = items.reduce((sum, item) => sum + (Number(item.entra) || 0), 0);
  const totalSalidas = items.reduce((sum, item) => sum + (Number(item.sale) || 0), 0);
  const totalSaldo = items.at(-1)?.saldo ?? 0;
  const totalRow = sheet.addRow({
    descripcion: "TOTALES",
    entra: totalEntradas,
    sale: totalSalidas,
    saldo: totalSaldo
  });
  totalRow.font = { bold: true };

  ["E", "F", "G"].forEach(column => {
    sheet.getColumn(column).numFmt = "#,##0.00";
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

  const link = document.createElement("a");
  const objectUrl = URL.createObjectURL(blob);
  link.href = objectUrl;
  link.download = `entradas_salidas_${today()}.xlsx`;
  link.click();
  URL.revokeObjectURL(objectUrl);
}
