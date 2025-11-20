export function today() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
}
  
export function formatNumber(n) {
  if (n === "" || n === null || isNaN(Number(n))) return "";
  return Number(n).toLocaleString("es-CO");
}
  
export function formatFecha(f) {
  if (!f) return "";
  const partes = f.split("/");
  if (partes.length === 3) {
    const [dia, mes, anio] = partes;
    return `${anio}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
  }
  return f;
}