import { useEffect, useState } from 'react';
import { useGoogle } from '../../context/GoogleContext';
import { GOOGLE_CONFIG } from '../../config/google';
import { today, formatNumber, formatFecha } from './utils/formatters';
import { exportExcel } from './utils/Excel';
import { computeWithSaldo } from './utils/computeSaldo';
import { loadSheetData, saveSheetData, colorizeRows } from './services/googleSheets.service';

const STORAGE_KEY = 'entradas_salidas';
const FILE_ID_KEY = GOOGLE_CONFIG.ENTRADAS_SALIDAS_SPREADSHEET_ID;

const TYPE_COLORS = {
  Entrada: 'bg-blue-50 text-blue-900',
  Salida: 'bg-gray-50 text-gray-800',
  Prestamo: 'bg-red-50 text-red-900',
  Bancos: 'bg-green-50 text-green-900'
};

const TYPE_SELECTED_COLORS = {
  Entrada: 'bg-blue-100 text-blue-900',
  Salida: 'bg-gray-100 text-gray-900',
  Prestamo: 'bg-red-100 text-red-900',
  Bancos: 'bg-green-100 text-green-900'
};

export default function EntradasSalidas() {
  const { token, login, logout } = useGoogle();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ fecha: '', tipo: 'Entrada', descripcion: '', valor: '' });
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setItems(JSON.parse(raw));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (!token) return;
    loadFromDrive();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.tipo || form.valor === '') return;

    const fechaReal = form.fecha || today();
    const valorNum = Number(form.valor) || 0;

    let entra = 0, sale = 0;
    if (form.tipo === 'Entrada' || form.tipo === 'Bancos') entra = valorNum;
    if (form.tipo === 'Salida' || form.tipo === 'Prestamo') sale = valorNum;

    if (editId !== null) {
      const newList = items.map(it =>
        it.id === editId
          ? { ...it, fecha: fechaReal, tipo: form.tipo, descripcion: form.descripcion, entra, sale }
          : it
      );
      setItems(computeWithSaldo(newList));
      setEditId(null);
    } else {
      const newItem = {
        id: Date.now(),
        fecha: fechaReal,
        tipo: form.tipo,
        descripcion: form.descripcion,
        entra,
        sale
      };
      setItems(computeWithSaldo([...items, newItem]));
    }

    setForm({ fecha: '', tipo: 'Entrada', descripcion: '', valor: '' });
  };

  const handleDelete = (id) => {
    const filtered = items.filter(i => i.id !== id);
    setItems(computeWithSaldo(filtered));
    if (editId === id) {
      setEditId(null);
      setForm({ fecha: '', tipo: 'Entrada', valor: '', descripcion: '' });
    }
  };

  const clearAll = () => {
    if (confirm('¿Borrar todos los registros?')) {
      setItems([]);
      setEditId(null);
      setForm({ fecha: '', tipo: 'Entrada', descripcion: '', valor: '' });
    }
  };

  const handleRowClick = (item) => {
    setForm({
      fecha: item.fecha,
      tipo: item.tipo,
      descripcion: item.descripcion,
      valor: item.entra ? item.entra : item.sale,
    });
    setEditId(item.id);
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setForm({ fecha: '', tipo: 'Entrada', valor: '', descripcion: '' });
  };

  const totalSaldo = computeWithSaldo(items).slice(-1)[0]?.saldo ?? 0;
  const totalEntradas = items.reduce((sum, it) => sum + (Number(it.entra) || 0), 0);
  const totalSalidas = items.reduce((sum, it) => sum + (Number(it.sale) || 0), 0);

  const loadFromDrive = async () => {
    try {
      const rows = await loadSheetData(FILE_ID_KEY, token);

      const filtradas = rows.filter(r =>
        r.Tipo !== "TOTALES" &&
        (r.Fecha || r.fecha) &&
        (r.Entra || r.Sale)
      );

      const mapped = filtradas.map((r, i) => ({
        id: Date.now() + i,
        fecha: formatFecha(r.Fecha || r.fecha || ''),
        tipo: r.Tipo || "Entrada",
        descripcion: r.Descripcion || r["Descripción"] || r.descripcion || '',
        entra: Number(r.Entra || 0),
        sale: Number(r.Sale || 0),
      }));
      setItems(computeWithSaldo(mapped));
      console.log("✅ Datos cargados automáticamente desde Google Sheets");
    } catch (err) {
      console.error("❌ Error al cargar automáticamente:", err);
    }
  };

  const saveToDrive = async () => {
    if (!token) return login();

    const id = FILE_ID_KEY

    try {
      const rows = computeWithSaldo(items);

      const rowsConTotales = [
        ...rows,
        {
          fecha: "",
          tipo: "TOTALES",
          descripcion: "",
          entra: totalEntradas,
          sale: totalSalidas,
          saldo: totalSaldo
        }
      ];

      await saveSheetData(id, token, rowsConTotales);
      await colorizeRows(id, token, rows);
      alert("✅ Datos guardados correctamente en Google Sheets");
    } catch (err) {
      console.error(err);
      alert("❌ Error al guardar en Google Sheets");
    }
  };

  return (
    <div className="max-w-4xl mx-auto text-gray-800 p-4">
      <h1 className="text-center text-2xl font-semibold mb-4">Registro de Entradas y Salidas</h1>

      <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">

        <label className="flex flex-col text-sm">
          Fecha
          <input
            type="date"
            name="fecha"
            value={form.fecha}
            onChange={handleChange}
            className="w-full sm:w-40 border border-gray-300 rounded-md px-2 py-1 
                    focus:outline-none focus:ring focus:ring-blue-300"
          />
        </label>

        <label className="flex flex-col text-sm">
          Tipo
          <select
            name="tipo"
            value={form.tipo}
            onChange={handleChange}
            className="w-full sm:w-40 border border-gray-300 rounded-md px-2 py-1 
                    focus:outline-none focus:ring focus:ring-blue-300"
          >
            <option value="Entrada">Entrada</option>
            <option value="Salida">Salida</option>
            <option value="Prestamo">Préstamo</option>
            <option value="Bancos">Bancos</option>
          </select>
        </label>

        <label className="flex flex-col text-sm">
          Descripcion
          <input
            type="text"
            name="descripcion"
            value={form.descripcion}
            onChange={handleChange}
            className="w-full sm:w-40 border border-gray-300 rounded-md px-2 py-1 
                    focus:outline-none focus:ring focus:ring-blue-300"
          />
        </label>

        <label className="flex flex-col text-sm">
          Valor
          <input
            type="number"
            name="valor"
            value={form.valor}
            onChange={handleChange}
            step="any"
            className="w-full sm:w-40 border border-gray-300 rounded-md px-2 py-1 
                    focus:outline-none focus:ring focus:ring-blue-300"
          />
        </label>

        <div className="flex flex-col gap-2">
          <button type="submit" className={`px-3 py-1 rounded text-white transition transform hover:scale-105 ${editId ? 'bg-orange-500' : 'bg-green-600'}`}>
            {editId ? 'Actualizar' : 'Agregar'}
          </button>

          {editId && (
            <button type="button" onClick={handleCancelEdit} className="px-3 py-1 rounded bg-gray-400 text-white transition hover:scale-105">
              Cancelar
            </button>
          )}

          <button type="button" onClick={() => exportExcel(computeWithSaldo(items))} className="px-3 py-1 rounded bg-blue-500 text-white hover:scale-105">
            Exportar hoja
          </button>

          <button type="button" onClick={clearAll} className="px-3 py-1 rounded bg-red-600 text-white hover:scale-105">
            Borrar todo
          </button>
        </div>
      </form>

      <div className="border rounded shadow bg-white overflow-hidden w-full max-w-5xl mx-auto">

        <div className="max-h-[400px] overflow-y-auto overflow-x-auto relative">

          <table
            className="
            w-full
            text-xs sm:text-sm
            border-collapse
            min-w-max       /* Mobile */
            sm:min-w-full   /* Desktop */
          "
          >
            <thead className="sticky top-0 z-20 bg-gray-100">
              <tr>
                <th className="border px-3 py-2 text-left w-auto sm:w-[20%]">Fecha</th>
                <th className="border px-3 py-2 text-left w-auto sm:w-[20%]">Descripción</th>
                <th className="border px-3 py-2 text-left w-auto sm:w-[20%]">Entra</th>
                <th className="border px-3 py-2 text-left w-auto sm:w-[20%]">Sale</th>
                <th className="border px-3 py-2 text-left w-auto sm:w-[20%]">Saldo</th>
                <th className="border px-3 py-2 w-[40px]"></th>
              </tr>
            </thead>

            <tbody>
              {computeWithSaldo(items).length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 py-3 border">
                    Sin datos. Agrega un registro.
                  </td>
                </tr>
              )}

              {computeWithSaldo(items).map((it) => {
                const isSelected = editId === it.id;
                const colorClasses = isSelected
                  ? TYPE_SELECTED_COLORS[it.tipo]
                  : TYPE_COLORS[it.tipo];

                return (
                  <tr
                    key={it.id}
                    onClick={() => handleRowClick(it)}
                    className={`cursor-pointer transition-opacity hover:opacity-90 ${colorClasses} ${isSelected ? 'ring-2 ring-blue-800' : ''
                      }`}
                  >
                    <td className="border px-3 py-2">{it.fecha}</td>
                    <td className="border px-3 py-2">{it.descripcion}</td>
                    <td className="border px-3 py-2">{it.entra ? formatNumber(it.entra) : ''}</td>
                    <td className="border px-3 py-2">{it.sale ? formatNumber(it.sale) : ''}</td>
                    <td className="border px-3 py-2">{formatNumber(it.saldo)}</td>

                    <td className="border px-3 py-2 text-center">
                      <button
                        className="font-bold text-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(it.id);
                        }}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                );
              })}

              {items.length > 0 && (
                <tr className="sticky bottom-0 bg-gray-50 font-bold z-10">
                  <td colSpan={2} className="border px-3 py-2">TOTALES</td>
                  <td className="border px-3 py-2">{formatNumber(totalEntradas)}</td>
                  <td className="border px-3 py-2">{formatNumber(totalSalidas)}</td>
                  <td className="border px-3 py-2">{formatNumber(totalSaldo)}</td>
                  <td className="border px-3 py-2"></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 my-4 items-center justify-center">
        <button onClick={saveToDrive} className="px-3 py-1 rounded bg-blue-600 text-white">
          Guardar en Drive
        </button>
      </div>
    </div>
  );
}
