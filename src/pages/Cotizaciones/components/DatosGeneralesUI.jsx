import { useRef } from "react";
import { Plus } from "lucide-react";

export default function DatosGeneralesUI({
    fecha,

    departamentos,
    ciudades,
    departamentoSel,
    setDepartamentoSel,
    ciudadSel,
    setCiudadSel,

    dirigido,
    setDirigido,
    referido,
    setReferido,

    dirigidoOpciones,
    modoDirigidoManual,
    setModoDirigidoManual,
    handleDirigidoChange,

    tiempoDeEntrega,
    setTiempoDeEntrega,
    objeto,
    setObjeto,

    errores,
    setErrores,
}) {

    const objetoRef = useRef(null);

    const handleAgregarBulletObjeto = () => {
        const textarea = objetoRef.current;
        if (!textarea) return;

        const bullet = objeto.trim() === "" ? "• " : "\n• ";

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        const nuevoTexto =
            objeto.substring(0, start) +
            bullet +
            objeto.substring(end);

        setObjeto(nuevoTexto);

        setTimeout(() => {
            textarea.focus();
            textarea.selectionStart =
                textarea.selectionEnd = start + bullet.length;
        }, 0);
    };

    return (
        <section>
            <h2 className="text-[#0051ff] text-xl font-semibold border-b border-blue-100 pb-1 mb-4">
                Datos Generales
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {/* Fecha */}
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
                        data-error={errores.departamento || false}
                        className={`p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              ${errores.departamento ? "border-red-500 ring-red-300" : "border-gray-300"}`}
                        value={departamentoSel}
                        onChange={(e) => {
                            setErrores({ ...errores, departamento: false });
                            setDepartamentoSel(e.target.value);
                        }}
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
                        data-error={errores.ciudad || false}
                        disabled={!ciudades.length}
                        className={`p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100
              ${errores.ciudad ? "border-red-500 ring-red-300" : "border-gray-300"}`}
                        value={ciudadSel}
                        onChange={(e) => {
                            setErrores({ ...errores, ciudad: false });
                            setCiudadSel(e.target.value);
                        }}
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
                                className={`w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500
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
                                className={`w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500
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

                        {/* Copiar dirigido → referido */}
                        <button
                            type="button"
                            onClick={() => {
                                setErrores({ ...errores, referido: false });
                                setReferido(dirigido);
                            }}
                            className="px-3 py-2 bg-gray-200 rounded-md hover:bg-gray-300 shrink-0"
                            title="Copiar Dirigido a Referido"
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
                <div className="flex flex-col font-medium mt-4 col-span-full">
                    <div className="flex items-center justify-between mb-1">
                        <label>Objeto:</label>

                        <button
                            type="button"
                            onClick={handleAgregarBulletObjeto}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 rounded"
                        >
                            <Plus size={14} />
                        </button>
                    </div>

                    <textarea
                        ref={objetoRef}
                        rows="3"
                        data-error={errores.objeto || false}
                        className={`p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        ${errores.objeto ? "border-red-500 ring-red-300" : "border-gray-300"}`}
                        value={objeto}
                        onChange={(e) => {
                            setErrores({ ...errores, objeto: false });
                            setObjeto(e.target.value);
                        }}
                    />
                </div>
            </div>
        </section>
    );
}
