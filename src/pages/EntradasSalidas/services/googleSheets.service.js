const BASE_URL = "https://sheets.googleapis.com/v4/spreadsheets";

/**
 * Lee una hoja de cálculo de Google como JSON
 * @param {string} fileId ID del archivo en Google Sheets
 * @param {string} token Token OAuth2 del usuario autenticado
 * @param {string} range Rango (por defecto: "Hoja 1!A1:F")
 * @returns {Promise<Array>} Arreglo de objetos con los datos
 */
export async function loadSheetData(fileId, token, range = "Hoja 1!A1:F") {
  const url = `${BASE_URL}/${fileId}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  if (!data.values) return [];

  const headers = data.values[0];
  return data.values.slice(1).map((row) => {
    const obj = {};
    headers.forEach((h, i) => (obj[h] = row[i] || ""));
    return obj;
  });
}

/**
 * Limpia y sobrescribe datos en una hoja de cálculo
 * @param {string} fileId ID del archivo
 * @param {string} token Token OAuth2
 * @param {Array} rows Datos a escribir (array de objetos)
 * @param {string} range Rango de celdas
 */
export async function saveSheetData(fileId, token, rows, range = "Hoja 1!A1:F") {
  // Limpiar rango anterior
  const clearUrl = `${BASE_URL}/${fileId}/values/${encodeURIComponent(range)}:clear`;
  await fetch(clearUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  // Escribir nuevos valores
  const writeUrl = `${BASE_URL}/${fileId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  const values = [
    ["Fecha", "Tipo", "Descripción", "Entra", "Sale", "Saldo"],
    ...rows.map((r) => [r.fecha, r.tipo, r.descripcion, r.entra, r.sale, r.saldo]),
  ];

  const res = await fetch(writeUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values }),
  });

  if (!res.ok) throw new Error("Error al guardar datos en Google Sheets");
  return await res.json();
}

/**
 * Aplica colores de fondo a las filas según el tipo
 * @param {string} fileId ID del archivo
 * @param {string} token Token OAuth2
 * @param {Array} rows Datos con campo `tipo`
 */
export async function colorizeRows(fileId, token, rows) {
  const COLORS = {
    Entrada: { red: 0.8, green: 0.9, blue: 1 },
    Salida: { red: 0.95, green: 0.95, blue: 0.95 },
    Prestamo: { red: 1, green: 0.8, blue: 0.8 },
    Bancos: { red: 0.8, green: 1, blue: 0.8 },
  };

  const requests = [];

  // Limpia colores anteriores
  requests.push({
    repeatCell: {
      range: { sheetId: 0, startRowIndex: 1, endRowIndex: 1000 },
      cell: {
        userEnteredFormat: { backgroundColor: { red: 1, green: 1, blue: 1 } },
      },
      fields: "userEnteredFormat.backgroundColor",
    },
  });

  // Aplica color según tipo
  rows.forEach((r, i) => {
    const color = COLORS[r.tipo] || { red: 1, green: 1, blue: 1 };
    const rowIndex = i + 1;

    requests.push({
      repeatCell: {
        range: {
          sheetId: 0,
          startRowIndex: rowIndex,
          endRowIndex: rowIndex + 1,
          startColumnIndex: 0,
          endColumnIndex: 6
        },
        cell: {
          userEnteredFormat: { backgroundColor: color },
        },
        fields: "userEnteredFormat.backgroundColor",
      },
    });
  });

  const res = await fetch(`${BASE_URL}/${fileId}:batchUpdate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ requests }),
  });

  if (!res.ok) throw new Error("Error aplicando colores en Google Sheets");
  return await res.json();
}
