export function today() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  return formatter.format(new Date());
}
  
export function formatNumber(n) {
  if (n === "" || n === null || isNaN(Number(n))) return "";
  return Number(n).toLocaleString("es-CO");
}
  
export function formatFecha(f) {
  if (!f) return "";
  const value = String(f).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const partes = value.split("/");
  if (partes.length === 3) {
    const [dia, mes, anio] = partes;
    return `${anio}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
  }
  return value;
}

export function formatDisplayDate(value) {
  const normalized = formatFecha(value);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);
  if (!match) return normalized;

  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

export function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}
