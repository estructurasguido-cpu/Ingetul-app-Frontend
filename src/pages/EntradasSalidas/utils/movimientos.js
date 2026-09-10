import { formatFecha } from "./formatters.js";

export const MOVEMENT_TYPES = ["Entrada", "Salida", "Prestamo", "Bancos"];
export const MOVEMENT_ACCOUNTS = ["Ahorros", "Ingetul"];

export const EMPTY_MOVEMENT_FORM = {
  fecha: "",
  tipo: "Entrada",
  cuenta: "Ahorros",
  descripcion: "",
  valor: ""
};

export function createMovementId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, character => {
    const random = Math.floor(Math.random() * 16);
    const value = character === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value));
}

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

function getMovementAmount(item) {
  const entra = Number(item.entra) || 0;
  const sale = Number(item.sale) || 0;
  return entra > 0 ? entra : sale;
}

export function validateMovementDraft(form) {
  const fecha = String(form.fecha || "").trim();
  const tipo = String(form.tipo || "").trim();
  const cuenta = String(form.cuenta || "").trim();
  const descripcion = String(form.descripcion || "").trim();
  const valor = Number(form.valor);

  if (!fecha) return "Selecciona una fecha para el movimiento.";
  if (!isValidDate(fecha)) return "Selecciona una fecha válida.";
  if (!MOVEMENT_TYPES.includes(tipo)) return "Selecciona un tipo de movimiento válido.";
  if (!MOVEMENT_ACCOUNTS.includes(cuenta)) return "Selecciona una cuenta válida.";
  if (!descripcion) return "Escribe un concepto para identificar el movimiento.";
  if (!Number.isFinite(valor) || valor <= 0) return "El valor debe ser un número mayor que cero.";

  return "";
}

export function validateMovementsForSave(items) {
  for (const [index, item] of items.entries()) {
    const rowNumber = index + 1;
    const fecha = String(item.fecha || "").trim();
    const tipo = String(item.tipo || "").trim();
    const cuenta = String(item.cuenta || "").trim();
    const descripcion = String(item.descripcion || "").trim();
    const amount = getMovementAmount(item);

    if (!fecha || !isValidDate(fecha)) return `Corrige la fecha del movimiento ${rowNumber}.`;
    if (!MOVEMENT_TYPES.includes(tipo)) return `Corrige el tipo del movimiento ${rowNumber}.`;
    if (!MOVEMENT_ACCOUNTS.includes(cuenta)) return `Corrige la cuenta del movimiento ${rowNumber}.`;
    if (!descripcion) return `Agrega un concepto al movimiento ${rowNumber}.`;
    if (!Number.isFinite(amount) || amount <= 0) return `Corrige el valor del movimiento ${rowNumber}.`;
  }

  return "";
}

export function sortByFecha(list) {
  return [...list].sort((a, b) =>
    String(a.fecha || "").localeCompare(String(b.fecha || ""))
  );
}

export function mapSheetRows(rows) {
  return rows
    .filter(row =>
      row.Tipo !== "TOTALES"
      && (row.Fecha || row.fecha)
      && (row.Entra || row.Sale)
    )
    .map(row => {
      const description = String(
        row.Descripcion || row["Descripción"] || row.descripcion || ""
      ).trim();

      return {
        id: createMovementId(),
        fecha: formatFecha(row.Fecha || row.fecha || ""),
        tipo: MOVEMENT_TYPES.includes(row.Tipo) ? row.Tipo : "Entrada",
        cuenta: MOVEMENT_ACCOUNTS.includes(row.Cuenta || row.cuenta)
          ? row.Cuenta || row.cuenta
          : "Ahorros",
        descripcion: description,
        entra: Number(row.Entra || 0),
        sale: Number(row.Sale || 0)
      };
    })
    .filter(row => Number.isFinite(row.entra) && Number.isFinite(row.sale));
}

export function movementSignature(items) {
  const comparable = sortByFecha(items).map(item => ({
    fecha: item.fecha,
    tipo: item.tipo,
    cuenta: item.cuenta || "",
    descripcion: item.descripcion || "",
    entra: Number(item.entra) || 0,
    sale: Number(item.sale) || 0
  }));

  return JSON.stringify(comparable);
}

export function readStoredMovements(raw) {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.map(item => ({
        ...item,
        id: isUuid(item.id) ? item.id : createMovementId()
      }))
      : [];
  } catch {
    return [];
  }
}
