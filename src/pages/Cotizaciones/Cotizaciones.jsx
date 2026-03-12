import { useState, useEffect, useRef } from "react";
import { useDepartamentos } from "../../hooks/useDepartments";
import { useItemsCotizacion } from "./hooks/useItemsCotizacion"
import { useGoogle } from "../../context/GoogleContext";
import { useLoader } from "../../context/LoaderContext";
import { GOOGLE_CONFIG } from "../../config/google";
import { getOrCreateFolder, listFolders, getCotizacionNumber, uploadPDFToDrive } from "./services/googleDrive.service";
import { getItemsCatalog } from "./services/items.service";
import { generarPDFCotizacion } from "./utils/generarPDFCotizacion";
import { DatosGeneralesUI, ItemsTableUI, AccionesUI, NotasUI, ResponsableUI, BotonFlotanteUI, ModalItemsCatalogo } from "./components/index"

const ROOT_FOLDER_ID = GOOGLE_CONFIG.COTIZACIONES_ROOT_FOLDER_ID

const STORAGE_KEY = 'form_cotizacion';
const STORAGE_BACKUP_KEY = "form_cotizacion_backup";

const NOTAS_DEFAULT = `• Esta cotización tiene una validez de 30 días.
• La forma de pago será 50% anticipo y el saldo contra entrega.
• Esta cotización no incluye impuestos.
• Las observaciones de la curaduría urbana que impliquen modificaciones arquitectónicas con impacto significativo en el modelo estructural (cambio de ejes, bordes de losas, adición o retiro de columnas, entre otros) generarán un cobro adicional por el rediseño estructural correspondiente y las nuevas impresiones; no se inician correcciones hasta no haber pactado el valor que esta actividad genere.`;


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
  const [notas, setNotas] = useState(NOTAS_DEFAULT);
  const [responsable, setResponsable] = useState("");
  const [itemsCatalogo, setItemsCatalogo] = useState([]);
  const [modalCatalogo, setModalCatalogo] = useState(false);

  const [errores, setErrores] = useState({});

  const [dirigidoOpciones, setDirigidoOpciones] = useState([]);
  const [modoDirigidoManual, setModoDirigidoManual] = useState(false);

  const { showLoader, hideLoader } = useLoader();

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

  const { token } = useGoogle();
  const { departamentos, ciudades, departamentoSel, setDepartamentoSel, ciudadSel, setCiudadSel } = useDepartamentos();
  const { items, setItems, agregarItem, eliminarItem, cambiarItem, limpiarItems } = useItemsCotizacion();

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
    if (data.responsable !== undefined) setResponsable(data.responsable);
    if (data.departamentoSel !== undefined) setDepartamentoSel(data.departamentoSel);
    if (data.ciudadSel !== undefined) setCiudadSel(data.ciudadSel);
    if (Array.isArray(data.items) && data.items.length) {
      setItems(
        data.items.map((it) => ({
          desc: it?.desc ?? "",
          und: it?.und ?? "und",
          cant: Number(it?.cant ?? 0),
          unit: Number(it?.unit ?? 0),
          unitMode: it?.unitMode ?? "fixed",
          percentEditing: Boolean(it?.percentEditing ?? false),
          baseIndex:
            it?.baseIndex === "" || it?.baseIndex === undefined
              ? ""
              : Number(it.baseIndex),
          percent: Number(it?.percent ?? 0),
        }))
      );
    }

    if (backup) localStorage.removeItem(STORAGE_BACKUP_KEY);
  }, []);

  useEffect(() => {
    const payload = {
      dirigido, referido, tiempoDeEntrega, objeto, notas,
      responsable, departamentoSel, ciudadSel, items, _ts: Date.now(),
    };
    const t = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }, 300);
    return () => clearTimeout(t);
  }, [dirigido, referido, tiempoDeEntrega, objeto, notas, responsable, departamentoSel, ciudadSel, items]);

  useEffect(() => {
    async function cargarItemsCatalogo() {
      try {
        const data = await getItemsCatalog();
        setItemsCatalogo(data || []);
      } catch (err) {
        console.error("Error cargando catálogo de items", err);
      }
    }

    cargarItemsCatalogo();
  }, []);

  const granTotal = items.reduce((sum, it) => sum + it.cant * it.unit, 0);

  function validarFormulario() {
    const nuevoError = {};

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
      if (!validarFormulario()) return;

      showLoader(
        subirADrive
          ? "Subiendo cotización a Google Drive..."
          : "Generando cotización en PDF..."
      );

      if (!token && subirADrive) {
        alert("⚠️ Debes conectar tu cuenta de Google Drive antes de subir el PDF.");
        hideLoader();
        return;
      }

      const dataPDF = {
        fecha,
        ciudad: ciudadSel,
        departamento:
          departamentos.find(d => d.id == departamentoSel)?.name || "",
        dirigido,
        referido,
        tiempoDeEntrega,
        objeto,
        notas,
        items,
        granTotal,
        responsable,
      };

      const pdfBytes = await generarPDFCotizacion(dataPDF);

      const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });

      const fechaISO = new Date().toISOString().split("T")[0];

      const numero = await getCotizacionNumber(
        fechaISO,
        referido,
        token,
        ROOT_FOLDER_ID
      );

      const referidoLimpio = referido
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "_");

      const nombreArchivo = `${fechaISO}-${numero}-${referidoLimpio}.pdf`;

      if (!subirADrive) {
        const url = URL.createObjectURL(pdfBlob);

        const a = document.createElement("a");
        a.href = url;
        a.download = nombreArchivo;
        a.click();

        URL.revokeObjectURL(url);

        showLoader("✅ PDF generado correctamente");
        setTimeout(() => hideLoader(), 1200);
        return;
      }

      const personaFolderId = await getOrCreateFolder(
        ROOT_FOLDER_ID,
        referido || "SinNombre",
        token
      );

      const upload = await uploadPDFToDrive({
        pdfBlob,
        token,
        folderId: personaFolderId,
        filename: nombreArchivo,
        isIphone: esIphone(),
      });

      if (upload?.id) {
        showLoader("✅ Cotización subida correctamente");
      } else {
        showLoader("❌ No se pudo subir la cotización");
      }

      setTimeout(() => hideLoader(), 1500);

    } catch (err) {
      console.error("Error al generar o subir PDF:", err);
      showLoader("❌ Error al generar o subir el PDF");
      setTimeout(() => hideLoader(), 1600);
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
    setNotas(NOTAS_DEFAULT);
    setResponsable("");

    limpiarItems();
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <main className="max-w-4xl mx-auto text-gray-800 p-4">

      <h1 className="text-center text-[#0051ff] text-2xl font-bold mb-8">
        Formulario de Cotización
      </h1>

      <form className="flex flex-col gap-8">
        <DatosGeneralesUI
          fecha={fecha}
          departamentos={departamentos}
          ciudades={ciudades}
          departamentoSel={departamentoSel}
          setDepartamentoSel={setDepartamentoSel}
          ciudadSel={ciudadSel}
          setCiudadSel={setCiudadSel}
          dirigido={dirigido}
          setDirigido={setDirigido}
          referido={referido}
          setReferido={setReferido}
          dirigidoOpciones={dirigidoOpciones}
          modoDirigidoManual={modoDirigidoManual}
          setModoDirigidoManual={setModoDirigidoManual}
          handleDirigidoChange={handleDirigidoChange}
          tiempoDeEntrega={tiempoDeEntrega}
          setTiempoDeEntrega={setTiempoDeEntrega}
          objeto={objeto}
          setObjeto={setObjeto}
          errores={errores}
          setErrores={setErrores}
        />

        <ItemsTableUI
          items={items}
          errores={errores}
          formatoCOP={formatoCOP}
          handleAgregarItem={agregarItem}
          handleEliminarItem={eliminarItem}
          handleChangeItem={cambiarItem}
          setErrores={setErrores}
          itemsCatalogo={itemsCatalogo}
          onOpenCatalogo={() => setModalCatalogo(true)}
        />

        <NotasUI
          notas={notas}
          setNotas={setNotas}
          notasDefault={NOTAS_DEFAULT}
        />

        <ResponsableUI
          responsable={responsable}
          setResponsable={setResponsable}
        />

        <AccionesUI
          onGenerarPDF={() => {
            if (validarFormulario()) handleGenerarPDF(false);
          }}
          onSubirDrive={() => {
            if (validarFormulario()) handleGenerarPDF(true);
          }}
          onLimpiar={handleLimpiar}
        />

      </form>

      <BotonFlotanteUI
        pos={pos}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleLimpiar}
      />

      <ModalItemsCatalogo
        open={modalCatalogo}
        onClose={() => setModalCatalogo(false)}
        itemsCatalogo={itemsCatalogo}
        setItemsCatalogo={setItemsCatalogo}
      />
    </main>
  );
}
