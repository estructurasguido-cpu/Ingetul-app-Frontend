const BASE_URL = "https://sheets.googleapis.com/v4/spreadsheets";
const DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files";
const DEFAULT_SHEET_NAME = "Hoja 1";

async function readGoogleResponse(response, fallbackMessage) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message || fallbackMessage);
  }

  return data;
}

function getSheetName(range) {
  const separatorIndex = range.indexOf("!");
  if (separatorIndex === -1) return DEFAULT_SHEET_NAME;

  return range
    .slice(0, separatorIndex)
    .replace(/^'(.*)'$/, "$1");
}

async function getSheetId(fileId, token, sheetName) {
  const url = `${BASE_URL}/${fileId}?fields=sheets.properties(sheetId,title)`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await readGoogleResponse(
    response,
    "No se pudo consultar la estructura de Google Sheets"
  );
  const sheet = data.sheets?.find(item => item.properties?.title === sheetName);

  if (!sheet) {
    throw new Error(`No existe la hoja "${sheetName}" en el archivo configurado`);
  }

  return sheet.properties.sheetId;
}

function toCellData(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return { userEnteredValue: { numberValue: value } };
  }

  return {
    userEnteredValue: {
      stringValue: value === null || value === undefined ? "" : String(value)
    }
  };
}

/**
 * Lee una hoja de cálculo de Google como JSON
 * @param {string} fileId ID del archivo en Google Sheets
 * @param {string} token Token OAuth2 del usuario autenticado
 * @param {string} range Rango (por defecto: "Hoja 1!A1:F")
 * @returns {Promise<Array>} Arreglo de objetos con los datos
 */
export async function loadSheetData(fileId, token, range = "Hoja 1!A1:G") {
  const url = `${BASE_URL}/${fileId}/values/${encodeURIComponent(range)}?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await readGoogleResponse(
    response,
    "No se pudieron cargar los datos desde Google Sheets"
  );
  if (!data.values) return [];

  const headers = data.values[0];
  if (!Array.isArray(headers)) {
    throw new Error("La hoja no contiene una fila de encabezados válida");
  }

  return data.values.slice(1).map((row) => {
    const obj = {};
    headers.forEach((h, i) => (obj[h] = row[i] || ""));
    return obj;
  });
}

/** Guarda valores y colores en una única operación atómica. */
export async function saveSheetData(fileId, token, rows, range = "Hoja 1!A1:G") {
  const sheetId = await getSheetId(fileId, token, getSheetName(range));
  const values = [
    ["Fecha", "Tipo", "Cuenta", "Descripción", "Entra", "Sale", "Saldo"],
    ...rows.map((r) => [r.fecha, r.tipo, r.cuenta || "", r.descripcion, r.entra, r.sale, r.saldo]),
  ];
  const COLORS = {
    Entrada: { red: 0.8, green: 0.9, blue: 1 },
    Salida: { red: 0.95, green: 0.95, blue: 0.95 },
    Prestamo: { red: 1, green: 0.8, blue: 0.8 },
    Bancos: { red: 0.8, green: 1, blue: 0.8 },
  };

  const requests = [
    {
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 0,
          startColumnIndex: 0,
          endColumnIndex: 7
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 1, green: 1, blue: 1 }
          }
        },
        fields: "userEnteredValue,userEnteredFormat.backgroundColor"
      }
    },
    {
      updateCells: {
        start: { sheetId, rowIndex: 0, columnIndex: 0 },
        rows: values.map(row => ({
          values: row.map(toCellData)
        })),
        fields: "userEnteredValue"
      }
    }
  ];

  rows.forEach((row, index) => {
    if (row.tipo === "TOTALES") return;

    requests.push({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: index + 1,
          endRowIndex: index + 2,
          startColumnIndex: 0,
          endColumnIndex: 7
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: COLORS[row.tipo] || { red: 1, green: 1, blue: 1 }
          }
        },
        fields: "userEnteredFormat.backgroundColor"
      }
    });
  });

  const response = await fetch(`${BASE_URL}/${fileId}:batchUpdate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ requests }),
  });

  return readGoogleResponse(
    response,
    "No se pudieron guardar los datos en Google Sheets"
  );
}

export async function getSheetModifiedTime(fileId, token) {
  const response = await fetch(
    `${DRIVE_FILES_URL}/${fileId}?fields=modifiedTime`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await readGoogleResponse(
    response,
    "No se pudo consultar la fecha de actualización de Google Sheets"
  );

  return data.modifiedTime || "";
}
