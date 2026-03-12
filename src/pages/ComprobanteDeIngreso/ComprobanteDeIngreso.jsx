import { useState, useEffect } from "react";
import { useDepartamentos } from "../../hooks/useDepartments";
import { useGoogle } from "../../context/GoogleContext";
import { GOOGLE_CONFIG } from "../../config/google";
import { numeroALetras } from "./utils/formatters";
import { generarPDFComprobanteIngreso } from "./utils/generarPDFComprobanteIngreso"
import { UbicacionFecha, TablaContable, MedioPago, FormActions } from "./components";
import { guardarComprobanteIngreso, obtenerConsecutivoDelDia } from "./services/googleDrive.service";

const ROOT_FOLDER_ID = GOOGLE_CONFIG.COMPROBANTES_INGRESO_ROOT_FOLDER_ID;

const STORAGE_KEY = "form_comprobante_ingreso";

function safeParse(json) {
    try {
        return JSON.parse(json);
    } catch {
        return null;
    }
}

function hoyISO() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

async function generarNumeroComprobante({ token, fecha }) {
    const { consecutivo } = await obtenerConsecutivoDelDia({
        token,
        rootFolderId: ROOT_FOLDER_ID,
        fecha,
    });

    const [yyyy, mm, dd] = fecha.split("-");
    return `${dd}${mm}${yyyy}-${consecutivo}`;
}

const initialState = {
    fecha: hoyISO(),
    recibidoDe: "",
    direccion: "",
    valor: "",
    valorLetras: "",
    concepto: "",
    medioPago: "efectivo",
    firmante: "",
    cheque: {
        numero: "",
        banco: "",
        sucursal: "",
    },
    movimientos: [
        { codigo: "", cuenta: "", debito: "", credito: "" },
    ],
    fechaRecibido: "",
};

const buildDataVacio = () => ({
    numero: "",
    ciudad: "",
    departamento: "",
    fecha: "",

    recibidoDe: "",
    direccion: "",
    valor: "",
    valorLetras: "",
    concepto: "",

    medioPago: "",
    cheque: { numero: "", banco: "", sucursal: "" },

    movimientos: [
        { codigo: "", cuenta: "", debito: "", credito: "" },
        { codigo: "", cuenta: "", debito: "", credito: "" },
        { codigo: "", cuenta: "", debito: "", credito: "" },
    ],

    fechaRecibido: "",
    firmante: "",
});

function validarFormulario(form, departamentoSel, ciudadSel) {
    const errores = [];

    if (!departamentoSel) errores.push("Departamento obligatorio");
    if (!ciudadSel) errores.push("Ciudad obligatoria");
    if (!form.fecha) errores.push("Fecha obligatoria");
    if (!form.direccion) errores.push("Dirección obligatoria");
    if (!form.recibidoDe) errores.push("Recibido de obligatorio");
    if (!form.concepto) errores.push("Concepto obligatorio");

    const valor = Number(String(form.valor).replace(/[^\d]/g, ""));
    if (valor <= 0) errores.push("Valor inválido");

    if (form.medioPago === "cheque") {
        if (!form.cheque.numero) errores.push("Número de cheque obligatorio");
        if (!form.cheque.banco) errores.push("Banco del cheque obligatorio");
    }

    if (!form.fechaRecibido) errores.push("Fecha de recibido obligatoria");
    return errores;
}

export default function ComprobanteDeIngreso() {

    const { token } = useGoogle();

    const [form, setForm] = useState(() => {
        const raw = localStorage.getItem(STORAGE_KEY);
        const data = safeParse(raw);

        if (!data) return initialState;

        return {
            ...initialState,
            ...data,
            cheque: { ...initialState.cheque, ...(data.cheque || {}) },
            movimientos: Array.isArray(data.movimientos) && data.movimientos.length
                ? data.movimientos
                : initialState.movimientos,
            fecha: hoyISO(),
            fechaRecibido: "",
        };
    });

    const {
        departamentos,
        ciudades,
        departamentoSel,
        setDepartamentoSel,
        ciudadSel,
        setCiudadSel,
    } = useDepartamentos();

    useEffect(() => {
        const raw = localStorage.getItem(STORAGE_KEY);
        const data = safeParse(raw);
        if (!data) return;

        if (data.departamentoSel) setDepartamentoSel(data.departamentoSel);
        if (data.ciudadSel) setCiudadSel(data.ciudadSel);
    }, [setDepartamentoSel, setCiudadSel]);

    useEffect(() => {
        const { fecha, fechaRecibido, ...rest } = form;

        const payload = {
            ...rest,
            departamentoSel,
            ciudadSel,
            _ts: Date.now(),
        };

        const t = setTimeout(() => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        }, 300);

        return () => clearTimeout(t);
    }, [form, departamentoSel, ciudadSel]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleUpload = async () => {
        try {
            if (!token) {
                alert("Debe iniciar sesión con Google");
                return;
            }

            const errores = validarFormulario(form, departamentoSel, ciudadSel);
            if (errores.length) {
                alert("Errores:\n" + errores.join("\n"));
                return;
            }

            const numero = await generarNumeroComprobante({
                token,
                fecha: form.fecha,
            });

            const data = {
                ...form,
                numero,
                valor: valorNumerico,
                valorLetras: valorEnLetras,
                ciudad: ciudadSel,
                departamento:
                    departamentos.find((d) => d.id == departamentoSel)?.name || "",
            };

            const buffer = await generarPDFComprobanteIngreso(data);
            const blob = new Blob([buffer], { type: "application/pdf" });

            await guardarComprobanteIngreso({
                pdfBlob: blob,
                token,
                rootFolderId: ROOT_FOLDER_ID,
                fecha: form.fecha,
                numero,
                isIphone: /iPhone|iPad|iPod/i.test(navigator.userAgent),
            });

            alert("✅ Comprobante subido correctamente");

        } catch (error) {
            console.error(error);
            alert("❌ Error al subir comprobante");
        }
    };

    const handleChequeChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            cheque: {
                ...prev.cheque,
                [name]: value,
            },
        }));
    };

    const handleMovimientoChange = (index, field, value) => {
        const movimientos = [...form.movimientos];
        movimientos[index][field] = value;
        setForm((prev) => ({ ...prev, movimientos }));
    };

    const agregarMovimiento = () => {
        setForm((prev) => ({
            ...prev,
            movimientos: [
                ...prev.movimientos,
                { codigo: "", cuenta: "", debito: "", credito: "" },
            ],
        }));
    };

    const eliminarMovimiento = (index) => {
        setForm((prev) => ({
            ...prev,
            movimientos: prev.movimientos.filter((_, i) => i !== index),
        }));
    };

    const handlePDFVacio = async () => {
        try {
            const data = buildDataVacio();

            const buffer = await generarPDFComprobanteIngreso(data);
            const blob = new Blob([buffer], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = `ComprobanteIngreso_VACIO.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);
            alert("❌ Error al generar PDF vacío");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!token) {
            alert("Debe iniciar sesión con Google");
            return;
        }

        const errores = validarFormulario(form, departamentoSel, ciudadSel);
        if (errores.length) {
            alert("Errores:\n" + errores.join("\n"));
            return;
        }

        const numero = await generarNumeroComprobante({
            token,
            fecha: form.fecha,
        });

        const data = {
            ...form,
            numero,
            valor: valorNumerico,
            valorLetras: valorEnLetras,
            ciudad: ciudadSel,
            departamento:
                departamentos.find((d) => d.id == departamentoSel)?.name || "",
        };

        const buffer = await generarPDFComprobanteIngreso(data);
        const blob = new Blob([buffer], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);

        const recibidoLimpio = form.recibidoDe
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, " ");

        const nombreArchivo = `${numero}-${recibidoLimpio}.pdf`;

        const link = document.createElement("a");
        link.href = url;
        link.download = nombreArchivo;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    /* LIMPIAR */
    const handleLimpiar = () => {
        setForm(initialState);
        setDepartamentoSel("");
        setCiudadSel("");
        localStorage.removeItem(STORAGE_KEY);
    };

    const valorNumerico = Number(
        String(form.valor).replace(/[^\d]/g, "")
    );

    const valorEnLetras =
        valorNumerico > 0 ? numeroALetras(valorNumerico) : "";

    return (
        <form
            onSubmit={handleSubmit}
            className="max-w-5xl mx-auto p-6 text-sm space-y-4"
        >
            <h2 className="text-center font-bold text-green-700 text-lg">
                COMPROBANTE DE INGRESO
            </h2>

            <UbicacionFecha
                departamentos={departamentos}
                ciudades={ciudades}
                departamentoSel={departamentoSel}
                ciudadSel={ciudadSel}
                setDepartamentoSel={setDepartamentoSel}
                setCiudadSel={setCiudadSel}
                form={form}
                handleChange={handleChange}
            />

            <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold">Valor *</label>
                <input
                    name="valor"
                    value={form.valor}
                    onChange={handleChange}
                    className="border rounded px-2 py-1"
                />
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold">Recibido de *</label>
                <input
                    name="recibidoDe"
                    value={form.recibidoDe}
                    onChange={handleChange}
                    className="border rounded px-2 py-1"
                />
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold">Dirección *</label>
                <input
                    name="direccion"
                    value={form.direccion}
                    onChange={handleChange}
                    className="border rounded px-2 py-1"
                />
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold">Valor en letras</label>
                <input
                    value={valorEnLetras}
                    readOnly
                    className="border rounded px-2 py-1 bg-gray-100"
                />
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold">Concepto *</label>
                <textarea
                    name="concepto"
                    value={form.concepto}
                    onChange={handleChange}
                    rows={2}
                    className="border rounded px-2 py-1"
                />
            </div>

            <MedioPago
                medioPago={form.medioPago}
                cheque={form.cheque}
                handleChange={handleChange}
                handleChequeChange={handleChequeChange}
            />

            <TablaContable
                movimientos={form.movimientos}
                handleMovimientoChange={handleMovimientoChange}
                agregarMovimiento={agregarMovimiento}
                eliminarMovimiento={eliminarMovimiento}
            />

            <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold">Fecha de recibido *</label>
                <input
                    name="fechaRecibido"
                    type="date"
                    value={form.fechaRecibido}
                    onChange={handleChange}
                    className="border rounded px-2 py-1"
                />
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold">Firmado por *</label>
                <select
                    name="firmante"
                    value={form.firmante}
                    onChange={handleChange}
                    className="border rounded px-2 py-1"
                >
                    <option value="">Sin firma</option>
                    <option value="guido_ingetul">Guido Humberto</option>
                    <option value="julio">Julio Tocoche</option>
                </select>
            </div>

            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={handlePDFVacio}
                    className="px-3 py-2 rounded border"
                >
                    PDF vacío
                </button>

                <FormActions onLimpiar={handleLimpiar} onUpload={handleUpload} />
            </div>

        </form>
    );

}
