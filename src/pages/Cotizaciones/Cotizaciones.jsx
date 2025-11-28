import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useDepartamentos } from "../../hooks/useDepartments";
import { useGoogle } from "../../context/GoogleContext";
import { GOOGLE_CONFIG } from "../../config/google";
import PDFCotizacion from "./components/PDFCotizacion";
import { getOrCreateFolder, listFolders, getCotizacionNumber, uploadPDFToDrive } from "./services/googleDrive.service";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const ROOT_FOLDER_ID = GOOGLE_CONFIG.COTIZACIONES_ROOT_FOLDER_ID

const STORAGE_KEY = 'form_cotizacion';
const STORAGE_BACKUP_KEY = "form_cotizacion_backup";

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function Cotizaciones() {
  const [fecha, setFecha] = useState("");
  const [dirigido, setDirigido] = useState("");
  const [referido, setReferido] = useState("");
  const [tiempoDeEntrega, setTiempoDeEntrega] = useState("");
  const [objeto, setObjeto] = useState("");
  const [notas, setNotas] = useState(`• Esta cotización tiene una validez de 30 días.
• La forma de pago será 50% anticipo y el saldo contra entrega.
• Esta cotización no incluye impuestos.`);
  const [proyecto, setProyecto] = useState("");
  const [items, setItems] = useState([
    { desc: "", und: "und", cant: 1, unit: 0 },
  ]);

  const [errores, setErrores] = useState({});

  const [dirigidoOpciones, setDirigidoOpciones] = useState([]);
  const [modoDirigidoManual, setModoDirigidoManual] = useState(false);

  // Mobile Inicio

  const [pos, setPos] = useState({ x: 20, y: 80 });
  const [dragging, setDragging] = useState(false);
  const offset = useRef({ x: 0, y: 0 });

  const handleTouchStart = (e) => {
    setDragging(true);
    const touch = e.touches[0];
    offset.current = {
      x: touch.clientX - pos.x,
      y: touch.clientY - pos.y,
    };
  };

  const handleTouchMove = (e) => {
    if (!dragging) return;
    const touch = e.touches[0];
    setPos({
      x: touch.clientX - offset.current.x,
      y: touch.clientY - offset.current.y,
    });
  };

  const handleTouchEnd = () => setDragging(false);

  // Mobile Final

  const { token } = useGoogle();
  const { departamentos, ciudades, departamentoSel, setDepartamentoSel, ciudadSel, setCiudadSel } = useDepartamentos();

  const pdfRef = useRef();

  const formatoCOP = (valor) =>
    valor.toLocaleString("es-CO", { style: "currency", currency: "COP" });

  const esIphone = () => /iPhone|iPad|iPod/i.test(navigator.userAgent);

  async function cargarCarpetasDirigido() {
    if (!token) return;
    const folders = await listFolders(ROOT_FOLDER_ID, token);

    const opciones = [
      "__manual__",
      ...folders.map(f => f.name)
    ];
    setDirigidoOpciones(opciones);
  }

  const handleDirigidoChange = (value) => {
    if (value === "__manual__") {
      setModoDirigidoManual(true);
      setDirigido("");
    } else {
      setModoDirigidoManual(false);
      setDirigido(value);
    }
  };

  useEffect(() => {
    const hoy = new Date();
    setFecha(
      hoy.toLocaleDateString("es-CO", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
  }, []);

  useEffect(() => {
    if (token) cargarCarpetasDirigido();
  }, [token]);

  // --- PERSISTENCIA EN LOCALSTORAGE ---

  useEffect(() => {
    const backup = localStorage.getItem(STORAGE_BACKUP_KEY);
    const raw = backup ?? localStorage.getItem(STORAGE_KEY);
    const data = safeParse(raw);
    if (!data) return;

    if (data.fecha) setFecha(data.fecha);
    if (data.dirigido !== undefined) setDirigido(data.dirigido);
    if (data.referido !== undefined) setReferido(data.referido);
    if (data.tiempoDeEntrega !== undefined) setTiempoDeEntrega(String(data.tiempoDeEntrega));
    if (data.objeto !== undefined) setObjeto(data.objeto);
    if (data.notas !== undefined) setNotas(data.notas);
    if (data.proyecto !== undefined) setProyecto(data.proyecto);
    if (data.departamentoSel !== undefined) setDepartamentoSel(data.departamentoSel);
    if (data.ciudadSel !== undefined) setCiudadSel(data.ciudadSel);
    if (Array.isArray(data.items) && data.items.length) {
      setItems(
        data.items.map((it) => ({
          desc: it?.desc ?? "",
          und: it?.und ?? "und",
          cant: Number(it?.cant ?? 0),
          unit: Number(it?.unit ?? 0),
        }))
      );
    }

    if (backup) localStorage.removeItem(STORAGE_BACKUP_KEY);
  }, []);

  useEffect(() => {
    const payload = {
      dirigido, referido, tiempoDeEntrega, objeto, notas,
      proyecto, departamentoSel, ciudadSel, items, _ts: Date.now(),
    };
    const t = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }, 300);
    return () => clearTimeout(t);
  }, [dirigido, referido, tiempoDeEntrega, objeto, notas, proyecto, departamentoSel, ciudadSel, items]);

  // --- FIN PERSISTENCIA EN LOCALSTORAGE ---

  const granTotal = items.reduce((sum, it) => sum + it.cant * it.unit, 0);

  const handleAgregarItem = () => {
    setItems([...items, { desc: "", und: "und", cant: 1, unit: 0 }]);
  };

  const handleEliminarItem = (i) => {
    const newItems = [...items];
    newItems.splice(i, 1);
    setItems(newItems);
  };

  const handleChangeItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  function validarFormulario() {
    const nuevoError = {};

    // Campos obligatorios
    if (!departamentoSel) nuevoError.departamento = true;
    if (!ciudadSel) nuevoError.ciudad = true;
    if (!dirigido.trim()) nuevoError.dirigido = true;
    if (!referido.trim()) nuevoError.referido = true;
    if (!tiempoDeEntrega) nuevoError.tiempoDeEntrega = true;
    if (!objeto.trim()) nuevoError.objeto = true;

    const itemValido = items.some(
      (it) => it.desc.trim() !== "" && Number(it.unit) > 0
    );
    if (!itemValido) nuevoError.items = true;

    setErrores(nuevoError);

    if (Object.keys(nuevoError).length > 0) {
      alert(
        "⚠️ Debes completar los siguientes campos antes de generar la cotización:\n\n• " +
        Object.keys(nuevoError)
          .map((k) => k.toUpperCase())
          .join("\n• ")
      );

      const primero = document.querySelector("[data-error='true']");
      if (primero) primero.scrollIntoView({ behavior: "smooth", block: "center" });

      return false;
    }

    return true;
  }

  const handleGenerarPDF = async (subirADrive = false) => {
    try {
      const element = pdfRef.current;
      if (!element) return;

      if (!token && subirADrive) {
        alert("⚠️ Debes conectar tu cuenta de Google Drive antes de subir el PDF.");
        return;
      }

      // Mostrar temporalmente el PDF oculto fuera de pantalla
      const prevDisplay = element.style.display;
      element.style.display = "block";
      element.style.position = "absolute";
      element.style.left = "-9999px";

      // Pequeña espera para renderizado estable
      await new Promise((res) => setTimeout(res, 400));

      // Captura en alta resolución
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      // Restaurar visibilidad original
      element.style.display = prevDisplay;
      element.style.position = "";
      element.style.left = "";

      // Generar el PDF con formato A4 exacto
      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // Añadimos la imagen en posición exacta (0,0)
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

      // Generar el blob del PDF
      const pdfBlob = pdf.output("blob");

      // Genera fecha
      const fechaISO = new Date().toISOString().split("T")[0];

      // Genera número
      const numero = await getCotizacionNumber(
        fechaISO,
        referido,
        token,
        ROOT_FOLDER_ID
      );

      // Opción 1: Descargar localmente
      if (!subirADrive) {
        pdf.save(`${fechaISO}-${numero}-${referido}.pdf`);
        return;
      }

      // Opción 2: Subir a Google Drive
      const nombreArchivo = `${fechaISO}-${numero}.pdf`;
      const personaFolderId = await getOrCreateFolder(
        ROOT_FOLDER_ID,
        referido || "SinNombre",
        token
      );

      const data = await uploadPDFToDrive({
        pdfBlob,
        token,
        folderId: personaFolderId,
        filename: nombreArchivo,
        isIphone: esIphone()
      });

      if (data.id) {
        alert("✅ Cotización subida correctamente a Google Drive.");
      } else {
        alert("❌ No se pudo subir el PDF a Google Drive.");
      }
    } catch (err) {
      console.error("Error al generar o subir PDF:", err);
      alert("❌ Error al generar o subir PDF. Revisa la consola para más detalles.");
    }
  };

  const handleLimpiar = () => {
    setFecha(new Date().toLocaleDateString("es-CO", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }));

    const valle = departamentos.find(
      (d) => d.name.toLowerCase() === "valle del cauca"
    );

    if (valle) {
      setDepartamentoSel(valle.id);
      setTimeout(() => {
        const tulua = ciudades.find(
          (c) => c.name.toLowerCase() === "tuluá"
        );
        if (tulua) setCiudadSel(tulua.name);
      }, 150);
    } else {
      setDepartamentoSel("");
      setCiudadSel("");
    }

    setDirigido("");
    setReferido("");
    setTiempoDeEntrega("");
    setObjeto("");
    setNotas(`• Esta cotización tiene una validez de 30 días.
• La forma de pago será 50% anticipo y el saldo contra entrega.
• Esta cotización no incluye impuestos.`);
    setProyecto("");

    setItems([{ desc: "", und: "und", cant: 1, unit: 0 }]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <main className="max-w-4xl mx-auto text-gray-800 p-4">

      <h1 className="text-center text-[#0051ff] text-2xl font-bold mb-8">
        Formulario de Cotización
      </h1>

      <form className="flex flex-col gap-8">
        {/* DATOS GENERALES */}
        <section>
          <h2 className="text-[#0051ff] text-xl font-semibold border-b border-blue-100 pb-1 mb-4">
            Datos Generales
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            <label className="flex flex-col font-medium">
              Fecha:
              <input
                className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                type="text"
                value={fecha}
                readOnly
              />
            </label>
            {/* Departamento */}
            <label className="flex flex-col font-medium">
              Departamento:
              <select
                className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={departamentoSel}
                onChange={(e) => setDepartamentoSel(e.target.value)}
              >
                <option value="">Seleccione un departamento</option>
                {departamentos.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            {/* Ciudad */}
            <label className="flex flex-col font-medium">
              Ciudad:
              <select
                disabled={!ciudades.length}
                className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                value={ciudadSel}
                onChange={(e) => setCiudadSel(e.target.value)}
              >
                <option value="">Seleccione una ciudad</option>
                {ciudades.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            {/* Dirigido a */}
            <div className="flex flex-col font-medium">
              <label>Dirigido a:</label>

              <div className="flex gap-2 items-center">
                {modoDirigidoManual ? (
                  <input
                    data-error={errores.dirigido || false}
                    className={`flex-1 p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${errores.dirigido ? "border-red-500 ring-red-300" : "border-gray-300"}`}
                    type="text"
                    placeholder="Escribe un nombre"
                    value={dirigido}
                    onChange={(e) => {
                      setErrores({ ...errores, dirigido: false });
                      setDirigido(e.target.value);
                    }}
                    onBlur={() => {
                      if (!dirigido.trim()) setModoDirigidoManual(false);
                    }}
                  />
                ) : (
                  <select
                    data-error={errores.dirigido || false}
                    className={`flex-1 p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${errores.dirigido ? "border-red-500 ring-red-300" : "border-gray-300"}`}
                    value={dirigido}
                    onChange={(e) => {
                      setErrores({ ...errores, dirigido: false });
                      handleDirigidoChange(e.target.value);
                    }}
                  >
                    <option value="">Seleccione una opción</option>
                    {dirigidoOpciones.length === 0 && (
                      <option value="">Cargando carpetas...</option>
                    )}
                    {dirigidoOpciones.map((opt) =>
                      opt === "__manual__" ? (
                        <option key="manual" value="__manual__">
                          ➕ Ingresar nombre
                        </option>
                      ) : (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      )
                    )}
                  </select>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setErrores({ ...errores, referido: false });
                    setReferido(dirigido);
                  }}
                  className="px-3 py-2 bg-gray-200 rounded-md hover:bg-gray-300 shrink-0"
                >
                  →
                </button>
              </div>
            </div>
            {/* Referido */}
            <label className="flex flex-col font-medium">
              Referido:
              <input
                data-error={errores.referido || false}
                className={`flex-1 p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    ${errores.referido ? "border-red-500 ring-red-300" : "border-gray-300"}`}
                type="text"
                value={referido}
                onChange={(e) => {
                  setErrores({ ...errores, referido: false });
                  setReferido(e.target.value);
                }}
              />
            </label>
            {/* Tiempo de entrega */}
            <label className="flex flex-col font-medium">
              Tiempo de entrega:
              <input
                data-error={errores.tiempoDeEntrega || false}
                className={`p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  ${errores.tiempoDeEntrega ? "border-red-500 ring-red-300" : "border-gray-300"}`}
                type="number"
                value={tiempoDeEntrega}
                onChange={(e) => {
                  setErrores({ ...errores, tiempoDeEntrega: false });
                  setTiempoDeEntrega(e.target.value);
                }}
              />
            </label>
            {/* Objeto */}
            <label className="flex flex-col font-medium mt-4 col-span-full">
              Objeto:
              <textarea
                rows="2"
                data-error={errores.objeto || false}
                className={`p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  ${errores.objeto ? "border-red-500 ring-red-300" : "border-gray-300"}`}
                value={objeto}
                onChange={(e) => {
                  setErrores({ ...errores, objeto: false });
                  setObjeto(e.target.value);
                }}
              ></textarea>
            </label>
          </div>
        </section>

        {/* ÍTEMS */}
        <section >
          <h2 className="text-[#0051ff] text-xl font-semibold border-b border-blue-100 pb-1 mb-4">
            Ítems
          </h2>

          <div className="w-full overflow-x-auto sm:overflow-visible">
            <table
              data-error={errores.items || false}
              className={`w-full border-collapse text-sm transition-all
              ${errores.items ? "border-2 border-red-500 rounded-lg" : ""}`}
            >
              <thead>
                <tr>
                  {[
                    "Descripción",
                    "UND",
                    "Cant",
                    "Vr. Unitario",
                    "Vr. Total",
                    "",
                  ].map((t) => (
                    <th
                      key={t}
                      className="bg-[#0051ff] text-white p-2 text-center font-semibold"
                    >
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {items.map((it, i) => {
                  const itemIncompleto =
                    errores.items &&
                    (it.desc.trim() === "" || Number(it.unit) <= 0);

                  return (
                    <tr
                      key={i}
                      className={`border border-gray-300 transition-all 
                      ${itemIncompleto ? "bg-red-50" : ""}`}
                    >
                      {/* DESCRIPCIÓN */}
                      <td className="p-1">
                        <input
                          className={`w-full p-1 border rounded 
                          ${itemIncompleto && it.desc.trim() === ""
                              ? "border-red-500 ring-red-300"
                              : "border-gray-300"
                            }`}
                          type="text"
                          value={it.desc}
                          onChange={(e) => {
                            setErrores({ ...errores, items: false });
                            handleChangeItem(i, "desc", e.target.value);
                          }}
                        />
                      </td>

                      {/* UND */}
                      <td className="p-1">
                        <select
                          className="w-full p-1 border border-gray-300 rounded"
                          value={it.und}
                          onChange={(e) =>
                            handleChangeItem(i, "und", e.target.value)
                          }
                        >
                          <option value="und">Unidad (UND)</option>
                          <option value="glb">Global (glb)</option>
                          <option value="dia">Día (glb)</option>
                          <option value="m">Metros (m)</option>
                          <option value="m2">Metros cuadrados (m²)</option>
                          <option value="m3">Metros cúbicos (m³)</option>
                          <option value="km">Kilómetro (km)</option>
                          <option value="km2">Kilómetros cuadrados (km²)</option>
                          <option value="otro">Otro</option>
                        </select>
                      </td>

                      {/* CANT */}
                      <td className="p-1">
                        <input
                          className={`w-full p-1 border rounded 
                          border-gray-300`}
                          type="number"
                          value={it.cant}
                          onChange={(e) => {
                            handleChangeItem(i, "cant", parseFloat(e.target.value));
                          }}
                        />
                      </td>

                      {/* VR UNITARIO */}
                      <td className="p-1">
                        <input
                          className={`w-full p-1 border rounded 
                          ${itemIncompleto && Number(it.unit) <= 0
                              ? "border-red-500 ring-red-300"
                              : "border-gray-300"
                            }`}
                          type="number"
                          value={it.unit}
                          onChange={(e) => {
                            setErrores({ ...errores, items: false });
                            handleChangeItem(i, "unit", parseFloat(e.target.value));
                          }}
                        />
                      </td>

                      {/* VR TOTAL */}
                      <td className="p-2 text-center font-semibold">
                        {formatoCOP(it.cant * it.unit)}
                      </td>

                      {/* ELIMINAR */}
                      <td className="text-center">
                        <button
                          type="button"
                          onClick={() => handleEliminarItem(i)}
                          className="bg-red-500 hover:bg-red-600 text-white px-1 py-1 rounded-md font-bold"
                        >
                          <X />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={() => {
              setErrores({ ...errores, items: false });
              handleAgregarItem();
            }}
            className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
          >
            + Agregar ítem
          </button>

          <p className="text-right text-lg font-bold mt-4">
            Total: {formatoCOP(granTotal)}
          </p>
        </section>


        {/* NOTAS */}
        <section>
          <h2 className="text-[#0051ff] text-xl font-semibold border-b border-blue-100 pb-1 mb-4">
            Notas
          </h2>

          <textarea
            rows="4"
            className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
          ></textarea>
        </section>

        {/* PROYECTÓ */}
        <section>
          <h2 className="text-[#0051ff] text-xl font-semibold border-b border-blue-100 pb-1 mb-4">
            Proyectó
          </h2>

          <select
            className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={proyecto}
            onChange={(e) => setProyecto(e.target.value)}
          >
            <option value="">Seleccione</option>
            <option value="G">G</option>
            <option value="J">J</option>
            <option value="D.G.">D.G.</option>
            <option value="D">D</option>
            <option value="C">C</option>
          </select>
        </section>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex gap-2 mb-2 sm:mb-0">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold"
              type="button"
              onClick={() => {
                if (validarFormulario()) handleGenerarPDF(false);
              }}
            >
              Generar PDF
            </button>
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg font-semibold"
              type="button"
              onClick={() => {
                if (validarFormulario()) handleGenerarPDF(true);
              }}
            >
              Subir a Google Drive
            </button>
          </div>
          <div>
            <button
              type="button"
              onClick={handleLimpiar}
              className="bg-gray-300 hover:bg-gray-400 text-black px-5 py-3 rounded-lg font-semibold"
            >
              Limpiar
            </button>
          </div>
        </div>
      </form>

      {/* BOTÓN FLOTANTE MÓVIL */}
      <div
        className="sm:hidden"
        style={{
          position: "fixed",
          top: pos.y,
          left: pos.x,
          zIndex: 9999,
          touchAction: "none",
          userSelect: "none",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <button
          onClick={handleLimpiar}
          className="bg-gray-700 text-white px-4 py-3 rounded-full shadow-lg active:scale-95 transition-all"
        >
          🧹
        </button>
      </div>

      <div
        style={{
          position: "absolute",
          left: "-9999px",
          top: 0,
          width: "800px",
          background: "white",
        }}
      >
        <PDFCotizacion
          ref={pdfRef}
          fecha={fecha}
          ciudad={ciudadSel}
          departamentoName={
            departamentos.find((d) => d.id == departamentoSel)?.name || ""
          }
          dirigido={dirigido}
          referido={referido}
          tiempoDeEntrega={tiempoDeEntrega}
          objeto={objeto}
          notas={notas}
          items={items}
          granTotal={granTotal}
          proyecto={proyecto}
        />
      </div>
    </main>
  );
}
