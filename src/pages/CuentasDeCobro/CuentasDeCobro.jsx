import { useState, useEffect } from "react";
import { FileUp } from "lucide-react";
import { today, numeroALetras, formatearFecha } from "./utils/formatters";
import { BENEFICIARIOS } from "./constants/Enums";
import { generarPDFVectorial } from "./utils/generarPDFVectorial";

const safeParse = (json) => {
    try {
        return JSON.parse(json);
    } catch {
        return null;
    }
}

const STORAGE_KEY = "form_cuenta_cobro";
const STORAGE_BACKUP_KEY = "form_cuenta_cobro_backup";

export default function CuentasDeCobro() {

    const [fecha, setFecha] = useState("");
    const [ciudad] = useState("Tuluá");
    const [departamento] = useState("Valle del Cauca");

    const [deudorNombre, setDeudorNombre] = useState("");
    const [deudorDocumento, setDeudorDocumento] = useState("");
    const [deudorTipoDocumento, setDeudorTipoDocumento] = useState("NIT");

    const [beneficiario, setBeneficiario] = useState("INGETUL");
    const [beneficiarioNombre, setBeneficiarioNombre] = useState("INGETUL S.A.S");
    const [beneficiarioTipoDocumento, setBeneficiarioTipoDocumento] = useState("NIT");
    const [beneficiarioDocumento, setBeneficiarioDocumento] = useState("901298387-2")

    const [valorNumero, setValorNumero] = useState("");
    const [valorLetras, setValorLetras] = useState("");

    const [concepto, setConcepto] = useState("");
    const [usarNotas, setUsarNotas] = useState(false);
    const [notas, setNotas] = useState(`• En el momento de cancelar el proyecto en su totalidad se entregará la debida factura electrónica como obra civil. Si el cliente desea que la factura se entregue como diseño se deberá adicionar el valor del IVA.`);
    const [firmante, setFirmante] = useState("guido_ingetul");

    const [archivoExtra, setArchivoExtra] = useState(null);

    const validarFormulario = () => {
        if (!fecha) return "La fecha es obligatoria.";
        if (!deudorNombre.trim()) return "El deudor es obligatorio.";
        if (!valorNumero || Number(valorNumero) <= 0) return "Debe ingresar un valor válido.";
        if (!concepto.trim()) return "Debe escribir el concepto.";
        if (!firmante) return "Debe seleccionar un firmante.";

        return null;
    };

    const generarPDF = async () => {
        const error = validarFormulario();
        if (error) {
            alert(error);
            return;
        }

        const data = {
            ciudad,
            departamento,
            fecha: formatearFecha(fecha),

            deudorNombre,
            deudorDocumento: deudorDocumento?.trim() || null,
            deudorTipoDocumento: deudorDocumento?.trim() ? deudorTipoDocumento : null,

            beneficiario,
            beneficiarioNombre,
            beneficiarioDocumento,
            beneficiarioTipoDocumento,

            valorLetras,
            concepto,
            usarNotas,
            notas,
            firmante
        };

        const finalBytes = await generarPDFVectorial(data, archivoExtra);

        const blob = new Blob([finalBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);

        const nombreDeudorLimpio = deudorNombre
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "_")
            .toLowerCase();

        const a = document.createElement("a");
        a.href = url;
        a.download = `cuenta-de-cobro_${nombreDeudorLimpio}.pdf`;
        a.click();

        URL.revokeObjectURL(url);
    };

    useEffect(() => {
        setFecha(today());
    }, []);

    useEffect(() => {
        const data = BENEFICIARIOS[beneficiario];

        if (data) {
            setBeneficiarioNombre(data.nombre);
            setBeneficiarioDocumento(data.documento);
            setBeneficiarioTipoDocumento(data.tipoDocumento);
        }

        if (beneficiario === "INGETUL") {
            setFirmante("guido_ingetul");
        }

        if (beneficiario === "GUIDO") {
            setFirmante("guido_personal");
        }
    }, [beneficiario]);

    useEffect(() => {
        setValorLetras(numeroALetras(Number(valorNumero)));
    }, [valorNumero]);

    const handleArchivo = (e) => {
        const file = e.target.files[0];
        if (file && file.type === "application/pdf") {
            setArchivoExtra(file);
        }
    };

    const handleLimpiar = () => {
        setFecha(today());

        setDeudorNombre("");
        setDeudorDocumento("");
        setDeudorTipoDocumento("NIT");
        setBeneficiario("INGETUL");
        setBeneficiarioNombre("INGETUL S.A.S");
        setBeneficiarioDocumento("901298387-2");
        setBeneficiarioTipoDocumento("NIT");
        setValorNumero("");
        setValorLetras("");
        setConcepto("");
        setUsarNotas(false);
        setNotas(`• En el momento de cancelar el proyecto en su totalidad se entregará la debida factura electrónica.
• Los detalles técnicos de las exploraciones y los estudios se encuentran consignados en la propuesta económica anexa a este documento.`);
        setFirmante("guido_ingetul");

        localStorage.removeItem(STORAGE_KEY);
    };

    // --- PERSISTENCIA EN LOCALSTORAGE ---

    useEffect(() => {
        const backup = localStorage.getItem(STORAGE_BACKUP_KEY);
        const raw = backup ?? localStorage.getItem(STORAGE_KEY);
        const data = safeParse(raw);
        if (!data) return;

        if (data.deudorNombre !== undefined) setDeudorNombre(data.deudorNombre);
        if (data.deudorDocumento !== undefined) setDeudorDocumento(data.deudorDocumento);
        if (data.deudorTipoDocumento !== undefined) setDeudorTipoDocumento(data.deudorTipoDocumento);
        if (data.beneficiario !== undefined) setBeneficiario(data.beneficiario);
        if (data.beneficiarioNombre !== undefined) setBeneficiarioNombre(data.beneficiarioNombre);
        if (data.beneficiarioDocumento !== undefined) setBeneficiarioDocumento(data.beneficiarioDocumento);
        if (data.beneficiarioTipoDocumento !== undefined) setBeneficiarioTipoDocumento(data.beneficiarioTipoDocumento);
        if (data.valorNumero !== undefined) setValorNumero(data.valorNumero);
        if (data.valorLetras !== undefined) setValorLetras(data.valorLetras);
        if (data.concepto !== undefined) setConcepto(data.concepto);
        if (data.usarNotas !== undefined) setUsarNotas(data.usarNotas);
        if (data.notas !== undefined) setNotas(data.notas);
        if (data.firmante !== undefined) setFirmante(data.firmante);

        if (backup) localStorage.removeItem(STORAGE_BACKUP_KEY);
    }, []);

    useEffect(() => {
        const payload = {
            ciudad,
            departamento,
            deudorNombre,
            deudorDocumento,
            deudorTipoDocumento,
            beneficiario,
            beneficiarioNombre,
            beneficiarioDocumento,
            beneficiarioTipoDocumento,
            valorNumero,
            valorLetras,
            concepto,
            usarNotas,
            notas,
            firmante,
            _ts: Date.now()
        };

        const t = setTimeout(() => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        }, 300);

        return () => clearTimeout(t);
    }, [
        ciudad,
        departamento,
        deudorNombre,
        deudorDocumento,
        deudorTipoDocumento,
        beneficiario,
        beneficiarioNombre,
        beneficiarioDocumento,
        beneficiarioTipoDocumento,
        valorNumero,
        valorLetras,
        concepto,
        usarNotas,
        notas,
        firmante
    ]);

    return (
        <main className="max-w-3xl mx-auto p-6">
            <h1 className="text-center text-[#0051ff] text-2xl font-bold mb-8">
                Formulario Cuenta de Cobro
            </h1>

            {/* ENCABEZADO */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <input
                    className="p-2 border rounded bg-gray-100"
                    value={ciudad}
                    readOnly
                />

                <input
                    className="p-2 border rounded bg-gray-100"
                    value={departamento}
                    readOnly
                />
                <input
                    type="date"
                    className="p-2 border rounded md:col-span-2"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                />
            </section>

            {/* DEUDOR */}
            <section className="mb-6">
                <h2 className="font-bold text-lg mb-2">Deudor: </h2>

                <input
                    className="p-2 border rounded mb-2"
                    placeholder="Nombre del deudor"
                    value={deudorNombre}
                    onChange={(e) => setDeudorNombre(e.target.value)}
                />

                <select
                    className="p-2 border rounded mb-2"
                    value={deudorTipoDocumento}
                    onChange={(e) => setDeudorTipoDocumento(e.target.value)}
                >
                    <option value="NIT">NIT</option>
                    <option value="CC">C.C.</option>
                </select>

                <input
                    className="p-2 border rounded"
                    placeholder="Documento del deudor"
                    value={deudorDocumento}
                    onChange={(e) => setDeudorDocumento(e.target.value)}
                />
            </section>

            {/* BENEFICIARIO */}
            <section className="mb-6">
                <h2 className="font-bold text-lg mb-2">Debe a:</h2>

                <select
                    className="p-2 border rounded mb-2"
                    value={beneficiario}
                    onChange={(e) => setBeneficiario(e.target.value)}
                >
                    <option value="INGETUL">INGETUL S.A.S</option>
                    <option value="GUIDO">Guido Victoria</option>
                </select>

                <input
                    className="p-2 border rounded mb-2"
                    value={beneficiarioNombre}
                    readOnly
                />

                <input
                    className="p-2 border rounded"
                    value={beneficiarioDocumento}
                    readOnly
                />
            </section>

            {/* VALOR */}
            <section className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="number" className="p-2 border rounded" placeholder="Valor en números" value={valorNumero} onChange={(e) => setValorNumero(e.target.value)} />
                <input className="p-2 border rounded bg-gray-100" placeholder="Valor en letras" value={valorLetras} readOnly />
            </section>

            {/* CONCEPTO */}
            <section className="mb-6">
                <textarea rows="4" className="p-2 border rounded w-full" placeholder="Por concepto de:" value={concepto} onChange={(e) => setConcepto(e.target.value)} />
            </section>

            {/* NOTAS */}
            <section className="mb-6">
                <label className="flex items-center gap-2 mb-2 font-medium">
                    <input type="checkbox" checked={usarNotas} onChange={(e) => setUsarNotas(e.target.checked)} />
                    Incluir notas
                </label>

                {usarNotas && (
                    <textarea rows="3" className="p-2 border rounded w-full" value={notas} onChange={(e) => setNotas(e.target.value)}></textarea>
                )}
            </section>

            {/* FIRMANTE */}
            <section className="mb-6">
                <h2 className="font-bold text-lg mb-2">Firmado por:</h2>

                <select
                    className="p-2 border rounded"
                    value={firmante}
                    onChange={(e) => setFirmante(e.target.value)}
                >
                    {beneficiario === "INGETUL" && (
                        <>
                            <option value="guido_ingetul">Guido Humberto (INGETUL)</option>
                            <option value="julio">Julio Tocoche</option>
                        </>
                    )}

                    {beneficiario === "GUIDO" && (
                        <option value="guido_personal">Guido Humberto</option>
                    )}
                </select>
            </section>

            <section className="mb-6">
                <label className="font-bold block mb-2 text-gray-700">
                    Adjuntar archivos:
                </label>

                <div className="flex items-center gap-4">

                    <label
                        htmlFor="rut-upload"
                        className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow font-medium transition-all duration-200 flex items-center gap-2"
                    >
                        <FileUp />
                        Seleccionar PDF
                    </label>

                    <input
                        id="rut-upload"
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={handleArchivo}
                    />

                    <div className="flex items-center gap-3">
                        <span className="text-gray-600 text-sm italic">
                            {archivoExtra ? archivoExtra.name : "Ningún archivo seleccionado"}
                        </span>

                        {archivoExtra && (
                            <button
                                onClick={() => setArchivoExtra(null)}
                                className="text-red-600 text-sm underline hover:text-red-800"
                            >
                                Quitar archivo
                            </button>
                        )}
                    </div>
                </div>
            </section>

            {/* ACCIONES */}
            <div className="flex gap-4">
                <button
                    onClick={generarPDF}
                    className="bg-green-600 text-white px-6 py-3 rounded"
                >
                    Generar PDF
                </button>

                <button
                    className="bg-gray-300 px-6 py-3 rounded"
                    onClick={handleLimpiar}
                >
                    Limpiar
                </button>
            </div>
        </main>
    );
}
