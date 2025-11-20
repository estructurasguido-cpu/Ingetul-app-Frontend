import ExcelJS from "exceljs";

export async function exportExcel(items) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("EntradasSalidas");

  sheet.columns = [
    { header: 'Fecha', key: 'fecha' },
    { header: 'Tipo', key: 'tipo' },
    { header: 'Descripción', key: 'descripcion' },
    { header: 'Entra', key: 'entra' },
    { header: 'Sale', key: 'sale' },
    { header: 'Saldo', key: 'saldo' },
  ];

  const COLORS = {
    Entrada: 'D9EAF7',
    Salida: 'F2F2F2',
    Prestamo: 'F7D7D7',
    Bancos: 'D7F7D7'
  };

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

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `entradas_salidas_${new Date().toISOString().slice(0, 10)}.xlsx`;
  link.click();
}
