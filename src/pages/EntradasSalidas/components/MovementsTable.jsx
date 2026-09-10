import { Pencil, Trash2 } from "lucide-react";
import { formatDisplayDate, formatNumber } from "../utils/formatters";

const TYPE_COLORS = {
  Entrada: "bg-blue-50 text-blue-900",
  Salida: "bg-gray-50 text-gray-800",
  Prestamo: "bg-red-50 text-red-900",
  Bancos: "bg-green-50 text-green-900"
};

export default function MovementsTable({
  items,
  totalEntradas,
  totalSalidas,
  totalSaldo,
  onDelete,
  onEdit,
  selectionMode = false,
  selectedIds = new Set(),
  onToggleSelect,
  onToggleSelectAll
}) {
  const allVisibleSelected = items.length > 0 && items.every(item => selectedIds.has(item.id));

  return (
    <div className="max-h-[520px] overflow-auto">
      <table className="w-full min-w-[760px] border-collapse text-sm">
        <thead className="sticky top-0 z-20 bg-gray-100 text-xs uppercase text-gray-600">
          <tr>
            <th className="border-b px-4 py-3 text-left">Fecha</th>
            <th className="border-b px-4 py-3 text-left">Cuenta</th>
            <th className="border-b px-4 py-3 text-left">Descripción</th>
            <th className="border-b px-4 py-3 text-right">Entra</th>
            <th className="border-b px-4 py-3 text-right">Sale</th>
            <th className="border-b px-4 py-3 text-right">Saldo</th>
            <th className="border-b px-4 py-3 text-right">
              {selectionMode ? (
                <label className="inline-flex items-center justify-end gap-2 normal-case">
                  <span>Todos visibles</span>
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={onToggleSelectAll}
                    disabled={items.length === 0}
                    aria-label="Seleccionar todos los movimientos visibles"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                </label>
              ) : "Acciones"}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                No hay movimientos que coincidan con los filtros.
              </td>
            </tr>
          ) : items.map(item => (
            <tr key={item.id} className={`${TYPE_COLORS[item.tipo] || "bg-white text-gray-800"} hover:brightness-[0.98]`}>
              <td className="px-4 py-3 font-medium">{formatDisplayDate(item.fecha)}</td>
              <td className="px-4 py-3">{item.cuenta || ""}</td>
              <td className="max-w-xs px-4 py-3"><span className="block truncate" title={item.descripcion}>{item.descripcion}</span></td>
              <td className="px-4 py-3 text-right tabular-nums">{item.entra ? formatNumber(item.entra) : ""}</td>
              <td className="px-4 py-3 text-right tabular-nums">{item.sale ? formatNumber(item.sale) : ""}</td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatNumber(item.saldo)}</td>
              <td className="px-4 py-3">
                {selectionMode ? (
                  <label className="flex justify-end">
                    <span className="sr-only">Seleccionar {item.descripcion}</span>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => onToggleSelect(item.id)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                  </label>
                ) : (
                  <div className="flex justify-end gap-1">
                    <button type="button" onClick={() => onEdit(item)} aria-label={`Editar ${item.descripcion}`} title="Editar movimiento" className="rounded-md p-2 text-gray-600 hover:bg-white/70 hover:text-blue-700">
                      <Pencil size={16} />
                    </button>
                    <button type="button" onClick={() => onDelete(item)} aria-label={`Eliminar ${item.descripcion}`} title="Eliminar movimiento" className="rounded-md p-2 text-gray-600 hover:bg-white/70 hover:text-red-700">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
        {items.length > 0 && (
          <tfoot className="sticky bottom-0 bg-white font-bold shadow-[0_-1px_0_0_#e5e7eb]">
            <tr>
              <td colSpan={3} className="px-4 py-3">Totales visibles</td>
              <td className="px-4 py-3 text-right tabular-nums">{formatNumber(totalEntradas)}</td>
              <td className="px-4 py-3 text-right tabular-nums">{formatNumber(totalSalidas)}</td>
              <td className="px-4 py-3 text-right tabular-nums">{formatNumber(totalSaldo)}</td>
              <td className="px-4 py-3" />
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
