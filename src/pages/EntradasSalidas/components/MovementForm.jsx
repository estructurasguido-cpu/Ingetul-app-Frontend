import { Check, Plus, X } from "lucide-react";

const inputClass = "mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";

export default function MovementForm({ error, form, isEditing, onCancel, onChange, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
      <label className="text-sm font-semibold text-gray-700">
        Fecha
        <input type="date" name="fecha" value={form.fecha} onChange={onChange} className={inputClass} />
      </label>

      <label className="text-sm font-semibold text-gray-700">
        Tipo
        <select name="tipo" value={form.tipo} onChange={onChange} className={inputClass}>
          <option value="Entrada">Entrada</option>
          <option value="Salida">Salida</option>
          <option value="Prestamo">Préstamo</option>
          <option value="Bancos">Bancos</option>
        </select>
      </label>

      <label className="text-sm font-semibold text-gray-700">
        Cuenta
        <select name="cuenta" value={form.cuenta} onChange={onChange} className={inputClass}>
          <option value="Ahorros">Cuenta de ahorro</option>
          <option value="Ingetul">A Ingetul</option>
        </select>
      </label>

      <label className="text-sm font-semibold text-gray-700">
        Descripción <span className="text-red-500">*</span>
        <input required name="descripcion" value={form.descripcion} onChange={onChange} maxLength={240} className={inputClass} />
      </label>

      <label className="text-sm font-semibold text-gray-700">
        Valor <span className="text-red-500">*</span>
        <input required type="number" name="valor" value={form.valor} onChange={onChange} min="1" step="any" inputMode="decimal" className={inputClass} />
      </label>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 md:col-span-2 xl:col-span-5">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2 md:col-span-2 sm:flex-row xl:col-span-5">
        <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          {isEditing ? <Check size={18} /> : <Plus size={18} />}
          {isEditing ? "Guardar cambios" : "Agregar movimiento"}
        </button>
        {isEditing && (
          <button type="button" onClick={onCancel} className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            <X size={18} /> Cancelar edición
          </button>
        )}
      </div>
    </form>
  );
}
