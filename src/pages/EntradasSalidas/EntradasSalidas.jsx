import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, Filter, ListChecks, RefreshCw, Save, Trash2, X } from "lucide-react";
import { useGoogle } from "../../context/GoogleContext";
import { GOOGLE_CONFIG } from "../../config/google";
import FiltersModal from "./components/FiltersModal";
import MovementForm from "./components/MovementForm";
import MovementsTable from "./components/MovementsTable";
import {
  getSheetModifiedTime,
  loadSheetData,
  saveSheetData
} from "./services/googleSheets.service";
import {
  getMovements,
  saveMovementsSnapshot
} from "./services/movimientos.service";
import { computeWithSaldo } from "./utils/computeSaldo";
import { exportExcel } from "./utils/Excel";
import { formatDateTime, formatNumber } from "./utils/formatters";
import {
  createMovementId,
  EMPTY_MOVEMENT_FORM,
  mapSheetRows,
  movementSignature,
  readStoredMovements,
  sortByFecha,
  validateMovementDraft,
  validateMovementsForSave
} from "./utils/movimientos";

const STORAGE_KEY = "entradas_salidas";
const DIRTY_KEY = "entradas_salidas_dirty";
const SIGNATURE_KEY = "entradas_salidas_remote_signature";
const FILE_ID = GOOGLE_CONFIG.ENTRADAS_SALIDAS_SPREADSHEET_ID;

const INITIAL_FILTERS = {
  tipo: "",
  cuenta: "",
  desde: "",
  hasta: "",
  texto: ""
};

function getInitialItems() {
  return readStoredMovements(localStorage.getItem(STORAGE_KEY));
}

function getInitialDirtyState() {
  const storedDirtyState = localStorage.getItem(DIRTY_KEY);
  if (storedDirtyState !== null) return storedDirtyState === "true";

  return getInitialItems().length > 0 && !localStorage.getItem(SIGNATURE_KEY);
}

export default function EntradasSalidas() {
  const { token, user, login, loading } = useGoogle();
  const [items, setItems] = useState(getInitialItems);
  const [form, setForm] = useState(EMPTY_MOVEMENT_FORM);
  const [editId, setEditId] = useState(null);
  const [formError, setFormError] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(
    getInitialDirtyState
  );
  const [remoteSignature, setRemoteSignature] = useState(
    () => localStorage.getItem(SIGNATURE_KEY) || ""
  );
  const [databaseSignature, setDatabaseSignature] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [sheetSyncPending, setSheetSyncPending] = useState(false);
  const [lastSheetUpdate, setLastSheetUpdate] = useState("");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [syncMessage, setSyncMessage] = useState(null);
  const primaryLoadRef = useRef(false);

  const ledgerItems = useMemo(
    () => computeWithSaldo(sortByFecha(items)),
    [items]
  );

  const filteredItems = useMemo(() => {
    const text = filters.texto.trim().toLocaleLowerCase("es");

    return ledgerItems.filter(item => {
      if (filters.tipo && item.tipo !== filters.tipo) return false;
      if (filters.cuenta && item.cuenta !== filters.cuenta) return false;
      if (filters.desde && item.fecha < filters.desde) return false;
      if (filters.hasta && item.fecha > filters.hasta) return false;
      if (text && !item.descripcion?.toLocaleLowerCase("es").includes(text)) return false;
      return true;
    });
  }, [filters, ledgerItems]);

  const summary = useMemo(() => {
    const totalEntradas = ledgerItems.reduce((sum, item) => sum + (Number(item.entra) || 0), 0);
    const totalSalidas = ledgerItems.reduce((sum, item) => sum + (Number(item.sale) || 0), 0);
    return {
      total: ledgerItems.length,
      entradas: totalEntradas,
      salidas: totalSalidas,
      saldo: ledgerItems.at(-1)?.saldo ?? 0
    };
  }, [ledgerItems]);

  const visibleTotals = useMemo(() => ({
    entradas: filteredItems.reduce((sum, item) => sum + (Number(item.entra) || 0), 0),
    salidas: filteredItems.reduce((sum, item) => sum + (Number(item.sale) || 0), 0),
    saldo: filteredItems.at(-1)?.saldo ?? 0
  }), [filteredItems]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(DIRTY_KEY, String(hasUnsavedChanges));
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (remoteSignature) localStorage.setItem(SIGNATURE_KEY, remoteSignature);
    else localStorage.removeItem(SIGNATURE_KEY);
  }, [remoteSignature]);

  useEffect(() => {
    if (syncMessage?.tone !== "success") return undefined;

    const timeoutId = setTimeout(() => {
      setSyncMessage(current => current === syncMessage ? null : current);
    }, 4500);

    return () => clearTimeout(timeoutId);
  }, [syncMessage]);

  const loadMovements = useCallback(async ({ notify = true } = {}) => {
    if (syncing) return false;

    setSyncing(true);
    try {
      const loadedItems = sortByFecha(await getMovements());

      setItems(loadedItems);
      setDatabaseSignature(movementSignature(loadedItems));
      setHasUnsavedChanges(false);
      setEditId(null);
      setForm(EMPTY_MOVEMENT_FORM);
      setFormError("");
      setSelectionMode(false);
      setSelectedIds(new Set());

      if (token) {
        try {
          const sheetRows = await loadSheetData(FILE_ID, token);
          const sheetItems = sortByFecha(mapSheetRows(sheetRows));
          const sheetSignature = movementSignature(sheetItems);
          const isPending = movementSignature(loadedItems) !== sheetSignature;

          try {
            setLastSheetUpdate(await getSheetModifiedTime(FILE_ID, token));
          } catch (modifiedTimeError) {
            console.warn("No se pudo consultar la última actualización de Google Sheets:", modifiedTimeError);
          }

          setRemoteSignature(sheetSignature);
          setSheetSyncPending(isPending);
          setSyncMessage(notify || isPending
            ? {
              tone: isPending ? "warning" : "success",
              text: isPending
                ? "Los datos están actualizados, pero Google Sheets tiene cambios pendientes de sincronizar."
                : "Datos actualizados. Google Sheets está sincronizado."
            }
            : null
          );
        } catch (sheetError) {
          console.error("No se pudo comprobar Google Sheets:", sheetError);
          setSheetSyncPending(true);
          setSyncMessage({
            tone: "warning",
            text: "Los datos se cargaron correctamente, pero no se pudo comprobar Google Sheets."
          });
        }
      } else {
        setSheetSyncPending(true);
        setSyncMessage(notify
          ? { tone: "warning", text: "Datos actualizados. Google Sheets no pudo comprobarse." }
          : null
        );
      }

      return true;
    } catch (error) {
      console.error("No se pudieron cargar los movimientos:", error);
      setSyncMessage({
        tone: "error",
        text: "No se pudieron cargar los datos. Se conservaron los datos locales."
      });
      return false;
    } finally {
      setSyncing(false);
    }
  }, [syncing, token]);

  useEffect(() => {
    if (loading || primaryLoadRef.current) return;
    primaryLoadRef.current = true;

    if (hasUnsavedChanges) {
      setSyncMessage({
        tone: "warning",
        text: "Hay cambios locales pendientes. Guárdalos o recarga para descartarlos."
      });
      return;
    }

    void loadMovements({ notify: false });
  }, [hasUnsavedChanges, loadMovements, loading]);

  function markAsChanged() {
    setHasUnsavedChanges(true);
    setSyncMessage({
      tone: "warning",
      text: "Cambios pendientes de guardar."
    });
  }

  function resetForm() {
    setForm(EMPTY_MOVEMENT_FORM);
    setEditId(null);
    setFormError("");
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm(current => ({ ...current, [name]: value }));
    setFormError("");
  }

  function handleSubmit(event) {
    event.preventDefault();
    const validationError = validateMovementDraft(form);

    if (validationError) {
      setFormError(validationError);
      return;
    }

    const amount = Number(form.valor);
    const description = form.descripcion.trim();

    const movement = {
      id: editId || createMovementId(),
      fecha: form.fecha,
      tipo: form.tipo,
      cuenta: form.cuenta,
      descripcion: description,
      entra: form.tipo === "Entrada" || form.tipo === "Bancos" ? amount : 0,
      sale: form.tipo === "Salida" || form.tipo === "Prestamo" ? amount : 0
    };

    setItems(current => sortByFecha(
      editId
        ? current.map(item => item.id === editId ? movement : item)
        : [...current, movement]
    ));
    setSelectionMode(false);
    setSelectedIds(new Set());
    markAsChanged();
    resetForm();
  }

  function handleEdit(item) {
    setEditId(item.id);
    setForm({
      fecha: item.fecha,
      tipo: item.tipo,
      cuenta: item.cuenta || "Ahorros",
      descripcion: item.descripcion || "",
      valor: String(item.entra || item.sale || "")
    });
    setFormError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDelete(item) {
    if (!confirm(`¿Eliminar el movimiento "${item.descripcion}"?`)) return;
    setItems(current => current.filter(movement => movement.id !== item.id));
    if (editId === item.id) resetForm();
    markAsChanged();
  }

  function toggleSelectionMode() {
    setSelectionMode(current => !current);
    setSelectedIds(new Set());
  }

  function handleToggleSelect(id) {
    setSelectedIds(current => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleToggleSelectAll() {
    const visibleIds = filteredItems.map(item => item.id);
    const allVisibleSelected = visibleIds.length > 0
      && visibleIds.every(id => selectedIds.has(id));

    setSelectedIds(current => {
      const next = new Set(current);
      visibleIds.forEach(id => {
        if (allVisibleSelected) next.delete(id);
        else next.add(id);
      });
      return next;
    });
  }

  function handleDeleteSelected() {
    const count = selectedIds.size;
    if (count === 0) return;

    const label = count === 1 ? "movimiento seleccionado" : "movimientos seleccionados";
    if (!confirm(`¿Eliminar ${count} ${label}? El cambio se aplicará cuando guardes.`)) return;

    setItems(current => current.filter(item => !selectedIds.has(item.id)));
    if (editId && selectedIds.has(editId)) resetForm();
    setSelectedIds(new Set());
    setSelectionMode(false);
    markAsChanged();
  }

  function handleApplyFilters(nextFilters) {
    setFilters(nextFilters);
    setSelectedIds(new Set());
  }

  async function handleReload() {
    if (hasUnsavedChanges && !confirm("Hay cambios locales sin guardar. ¿Descartarlos y recargar?")) return;
    await loadMovements();
  }

  async function handleSave() {
    if (!token) {
      login();
      return;
    }
    if (syncing || (!hasUnsavedChanges && !sheetSyncPending)) return;

    const validationError = validateMovementsForSave(ledgerItems);

    if (validationError) {
      setSyncMessage({
        tone: "error",
        text: `${validationError} No se guardó ningún cambio.`
      });
      return;
    }

    setSyncing(true);
    let changesAreSaved = !hasUnsavedChanges;

    try {
      const latestDatabaseItems = sortByFecha(await getMovements());
      const latestDatabaseSignature = movementSignature(latestDatabaseItems);

      if (
        (databaseSignature !== null && latestDatabaseSignature !== databaseSignature)
        || (databaseSignature === null && latestDatabaseItems.length > 0)
      ) {
        setSyncMessage({
          tone: "error",
          text: "Los datos cambiaron desde la última carga. Recarga antes de guardar para no sobrescribir movimientos de otro usuario."
        });
        return;
      }

      if (hasUnsavedChanges) {
        await saveMovementsSnapshot(ledgerItems, user?.email);
        changesAreSaved = true;
        setDatabaseSignature(movementSignature(ledgerItems));
        setHasUnsavedChanges(false);
      }

      const remoteRows = await loadSheetData(FILE_ID, token);
      const currentRemoteSignature = movementSignature(mapSheetRows(remoteRows));

      if (remoteSignature && currentRemoteSignature !== remoteSignature) {
        setSheetSyncPending(true);
        setSyncMessage({
          tone: "warning",
          text: "Los cambios quedaron guardados, pero Google Sheets cambió desde la última carga. Revisa la hoja y luego recarga antes de decidir si la sobrescribes."
        });
        return;
      }

      if (!remoteSignature && remoteRows.length > 0) {
        const overwrite = confirm("No existe una referencia de sincronización anterior. ¿Sobrescribir la hoja con los datos locales?");
        if (!overwrite) {
          setSheetSyncPending(true);
          setSyncMessage({
            tone: "warning",
            text: "Los datos están guardados. La actualización de Google Sheets quedó pendiente."
          });
          return;
        }
      }

      const rows = ledgerItems;
      const rowsWithTotals = [
        ...rows,
        {
          fecha: "",
          tipo: "TOTALES",
          cuenta: "",
          descripcion: "",
          entra: summary.entradas,
          sale: summary.salidas,
          saldo: summary.saldo
        }
      ];

      await saveSheetData(FILE_ID, token, rowsWithTotals);
      try {
        setLastSheetUpdate(await getSheetModifiedTime(FILE_ID, token));
      } catch (modifiedTimeError) {
        console.warn("No se pudo consultar la última actualización de Google Sheets:", modifiedTimeError);
        setLastSheetUpdate(new Date().toISOString());
      }
      const signature = movementSignature(rows);
      setRemoteSignature(signature);
      setHasUnsavedChanges(false);
      setSheetSyncPending(false);
      setSyncMessage({
        tone: "success",
        text: "Datos guardados correctamente. Google Sheets está actualizado."
      });
    } catch (error) {
      console.error("No se pudieron guardar los movimientos:", error);
      if (changesAreSaved) {
        setSheetSyncPending(true);
        setSyncMessage({
          tone: "warning",
          text: `${error?.message || "No se pudo actualizar Google Sheets"}. Los datos sí quedaron guardados y la hoja quedó pendiente.`
        });
      } else {
        setSyncMessage({
          tone: "error",
          text: "No se pudieron guardar los cambios. Intenta nuevamente."
        });
      }
    } finally {
      setSyncing(false);
    }
  }

  async function handleExport() {
    try {
      await exportExcel(ledgerItems);
    } catch (error) {
      console.error("No se pudo exportar el archivo:", error);
      setSyncMessage({ tone: "error", text: "No se pudo generar el archivo de Excel." });
    }
  }

  const closeFilters = useCallback(() => setShowFilters(false), []);
  const savePending = hasUnsavedChanges || sheetSyncPending;

  const messageTone = {
    success: "border-green-200 bg-green-50 text-green-700",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    error: "border-red-200 bg-red-50 text-red-700"
  };

  return (
    <main className="mx-auto min-w-0 max-w-6xl text-gray-800">
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-h-10 pl-14">
          <h1 className="text-2xl font-bold text-[#0051ff]">Entradas y salidas</h1>
          <p className="text-sm text-gray-500">Control de movimientos y saldo consolidado.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-md bg-white px-4 py-3 shadow-sm"><span className="block text-xs text-gray-500">Movimientos</span><strong className="text-xl">{summary.total}</strong></div>
          <div className="rounded-md bg-blue-50 px-4 py-3 text-blue-800 shadow-sm"><span className="block text-xs">Entradas</span><strong className="text-lg">{formatNumber(summary.entradas)}</strong></div>
          <div className="rounded-md bg-red-50 px-4 py-3 text-red-800 shadow-sm"><span className="block text-xs">Salidas</span><strong className="text-lg">{formatNumber(summary.salidas)}</strong></div>
          <div className="rounded-md bg-green-50 px-4 py-3 text-green-800 shadow-sm"><span className="block text-xs">Saldo</span><strong className="text-lg">{formatNumber(summary.saldo)}</strong></div>
        </div>
      </header>

      {syncMessage && (
        <div role="status" className={`mb-4 rounded-md border px-4 py-3 text-sm font-semibold ${messageTone[syncMessage.tone]}`}>
          {syncMessage.text}
        </div>
      )}

      <section className="mb-5 rounded-md bg-white p-4 shadow-sm">
        <MovementForm error={formError} form={form} isEditing={editId !== null} onCancel={resetForm} onChange={handleChange} onSubmit={handleSubmit} />
      </section>

      <section className="overflow-hidden rounded-md bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-200 p-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="font-bold text-gray-900">Movimientos</h2>
            <p className="text-xs text-gray-500">
              {hasUnsavedChanges
                ? "Cambios pendientes de guardar"
                : sheetSyncPending
                  ? "Guardado · Google Sheets pendiente"
                  : "Sincronizado"}
            </p>
            {lastSheetUpdate && (
              <p className="mt-1 text-xs text-gray-500">
                Google Sheets actualizado: {formatDateTime(lastSheetUpdate)}
              </p>
            )}
            {selectionMode && (
              <p className="mt-1 text-xs font-semibold text-blue-700">
                {selectedIds.size} {selectedIds.size === 1 ? "seleccionado" : "seleccionados"}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setShowFilters(true)} className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <Filter size={17} /> Filtros{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </button>
            <button type="button" onClick={handleReload} disabled={syncing} title="Recargar datos" className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              <RefreshCw className={syncing ? "animate-spin" : ""} size={17} /> Recargar
            </button>
            <button type="button" onClick={handleExport} disabled={ledgerItems.length === 0} className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              <Download size={17} /> Excel
            </button>
            {selectionMode && (
              <button type="button" onClick={handleDeleteSelected} disabled={selectedIds.size === 0} className="inline-flex items-center gap-2 rounded-md border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50">
                <Trash2 size={17} /> Eliminar ({selectedIds.size})
              </button>
            )}
            <button type="button" onClick={toggleSelectionMode} disabled={items.length === 0} className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              {selectionMode ? <X size={17} /> : <ListChecks size={17} />}
              {selectionMode ? "Cancelar selección" : "Seleccionar"}
            </button>
            <button type="button" onClick={handleSave} disabled={syncing || !savePending} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
              <Save size={17} /> {syncing
                ? "Guardando..."
                : hasUnsavedChanges
                  ? "Guardar"
                  : sheetSyncPending
                    ? "Guardar"
                    : "Guardado"}
            </button>
          </div>
        </div>

        <MovementsTable
          items={filteredItems}
          totalEntradas={visibleTotals.entradas}
          totalSalidas={visibleTotals.salidas}
          totalSaldo={visibleTotals.saldo}
          onDelete={handleDelete}
          onEdit={handleEdit}
          selectionMode={selectionMode}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
        />
      </section>

      <FiltersModal
        isOpen={showFilters}
        onClose={closeFilters}
        initialFilters={filters}
        onApply={handleApplyFilters}
      />
    </main>
  );
}
