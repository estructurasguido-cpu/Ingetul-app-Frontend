import { X, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function ItemsTableUI({
    items,
    errores,
    formatoCOP,
    handleAgregarItem,
    handleEliminarItem,
    handleChangeItem,
    setErrores,
    itemsCatalogo,
    onOpenCatalogo
}) {
    const [openIndex, setOpenIndex] = useState(null);
    const anchorRefs = useRef([]);
    const dropdownRef = useRef(null);

    const [dropdownPos, setDropdownPos] = useState({
        left: 0,
        top: 0,
        width: 420,
    });

    const updateDropdownPos = () => {
        if (openIndex == null) return;
        const el = anchorRefs.current[openIndex];
        if (!el) return;

        const rect = el.getBoundingClientRect();

        const width = Math.max(320, rect.width);
        let left = rect.left;
        let top = rect.bottom + 6;

        const maxLeft = window.innerWidth - width - 8;
        if (left > maxLeft) left = Math.max(8, maxLeft);

        const dropdownHeight = 224;
        const spaceBelow = window.innerHeight - top;
        if (spaceBelow < 120) {
            top = rect.top - dropdownHeight - 6;
        }

        setDropdownPos({ left, top, width });
    };

    useEffect(() => {
        updateDropdownPos();
    }, [openIndex, items.length]);

    useEffect(() => {
        if (openIndex == null) return;

        const onScroll = () => updateDropdownPos();
        const onResize = () => updateDropdownPos();

        window.addEventListener("scroll", onScroll, true);
        window.addEventListener("resize", onResize);

        return () => {
            window.removeEventListener("scroll", onScroll, true);
            window.removeEventListener("resize", onResize);
        };
    }, [openIndex]);

    useEffect(() => {
        const onDown = (e) => {
            if (openIndex == null) return;

            const anchor = anchorRefs.current[openIndex];
            const drop = dropdownRef.current;

            if (drop && drop.contains(e.target)) return;
            if (anchor && anchor.contains(e.target)) return;

            setOpenIndex(null);
        };

        document.addEventListener("mousedown", onDown);
        document.addEventListener("touchstart", onDown, { passive: true });

        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("touchstart", onDown);
        };
    }, [openIndex]);

    return (
        <section>
            <div className="flex items-center justify-between border-b border-blue-100 pb-1 mb-4">
                <h2 className="text-[#0051ff] text-xl font-semibold">
                    Ítems
                </h2>

                <button
                    type="button"
                    onClick={onOpenCatalogo}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md"
                >
                    +
                </button>
            </div>

            <div className="w-full overflow-x-auto">
                <table
                    data-error={errores.items || false}
                    className={`min-w-[900px] table-auto border-collapse text-sm transition-all
  ${errores.items ? "border-2 border-red-500 rounded-lg" : ""}`}
                >
                    <thead>
                        <tr>
                            <th className="bg-[#0051ff] text-white p-2 text-center font-semibold min-w-[280px]">Descripción</th>
                            <th className="bg-[#0051ff] text-white p-2 text-center font-semibold w-[110px]">UND</th>
                            <th className="bg-[#0051ff] text-white p-2 text-center font-semibold w-[80px]">Cant</th>
                            <th className="bg-[#0051ff] text-white p-2 text-center font-semibold w-[260px]">Vr. Unitario</th>
                            <th className="bg-[#0051ff] text-white p-2 text-center font-semibold w-[120px]">Vr. Total</th>
                            <th className="bg-[#0051ff] text-white p-2 text-center font-semibold w-[50px]"></th>
                        </tr>
                    </thead>


                    <tbody>
                        {items.map((it, i) => {
                            const itemIncompleto =
                                errores.items &&
                                (it.desc.trim() === "" || Number(it.unit) <= 0);

                            const confirmarPorcentaje = () => {
                                if (it.baseIndex === "" || it.baseIndex === undefined) return;

                                const baseItem = items[it.baseIndex];
                                if (!baseItem) return;

                                const baseValue = Number(baseItem.unit || 0);
                                const calculated = (baseValue * Number(it.percent || 0)) / 100;

                                handleChangeItem(i, "unit", calculated);
                                handleChangeItem(i, "percentEditing", false);
                            };

                            return (
                                <tr
                                    key={i}
                                    className={`border border-gray-300 transition-all
                    ${itemIncompleto ? "bg-red-50" : ""}`}
                                >
                                    {/* DESCRIPCIÓN */}
                                    <td className="p-1 relative align-top min-w-[280px]">

                                        <textarea
                                            rows={1}
                                            ref={(el) => {
                                                if (el) {
                                                    el.style.height = "0px";
                                                    el.style.height = el.scrollHeight + "px";
                                                }
                                            }}
                                            className={`w-full p-1 border rounded pr-7 resize-none overflow-hidden leading-tight
      ${itemIncompleto && it.desc.trim() === ""
                                                    ? "border-red-500 ring-red-300"
                                                    : "border-gray-300"
                                                }`}
                                            value={it.desc}
                                            placeholder="Descripción del ítem"

                                            onInput={(e) => {
                                                const el = e.currentTarget;
                                                el.style.height = "0px";
                                                el.style.height = el.scrollHeight + "px";
                                            }}

                                            onChange={(e) => {
                                                setErrores({ ...errores, items: false });
                                                handleChangeItem(i, "desc", e.target.value);
                                            }}
                                        />

                                        {/* botón desplegar */}
                                        <button
                                            type="button"
                                            ref={(el) => (anchorRefs.current[i] = el)}
                                            onClick={() => {
                                                setOpenIndex((prev) => (prev === i ? null : i));
                                                // recalcular en el siguiente frame para que quede exacto
                                                requestAnimationFrame(() => updateDropdownPos());
                                            }}
                                            className="absolute right-2 top-2 text-gray-500 text-xs"
                                        >
                                            ▼
                                        </button>


                                    </td>

                                    {/* UND */}
                                    <td className="p-1 w-[110px] max-w-[130px]">
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
                                    <td className="p-1 w-[80px] max-w-[80px]">
                                        <input
                                            className="w-full p-1 border border-gray-300 rounded text-right"
                                            type="number"
                                            value={it.cant}
                                            onChange={(e) =>
                                                handleChangeItem(
                                                    i,
                                                    "cant",
                                                    parseFloat(e.target.value)
                                                )
                                            }
                                        />
                                    </td>

                                    {/* VR UNITARIO */}
                                    <td className="p-1 w-[260px] max-w-[260px] align-middle relative">
                                        <div className="flex items-center gap-2 w-full">

                                            <div className="flex border rounded-md overflow-hidden h-9 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const isPercent = it.unitMode === "percent";

                                                        handleChangeItem(i, "unitMode", isPercent ? "fixed" : "percent");

                                                        if (!isPercent) {
                                                            handleChangeItem(i, "percentEditing", true);
                                                            handleChangeItem(i, "baseIndex", "");
                                                        } else {
                                                            handleChangeItem(i, "percentEditing", false);
                                                        }
                                                    }}
                                                    className={`w-9 transition-all ${it.unitMode === "percent"
                                                        ? "bg-blue-600 text-white"
                                                        : "bg-white text-gray-600 hover:bg-gray-100"
                                                        }`}
                                                >
                                                    %
                                                </button>
                                            </div>

                                            {/* ZONA VARIABLE */}
                                            <div className="flex items-center gap-2 w-full overflow-hidden">

                                                {it.unitMode !== "percent" ? (
                                                    <input
                                                        className="w-full h-9 px-2 border border-gray-300 rounded-md text-right"
                                                        type="number"
                                                        value={it.unit}
                                                        onChange={(e) => {
                                                            setErrores({ ...errores, items: false });
                                                            handleChangeItem(i, "unit", e.target.value);
                                                        }}
                                                    />

                                                ) : it.percentEditing ? (

                                                    <>
                                                        <input
                                                            className="w-16 h-9 px-2 border border-gray-300 rounded-md text-right"
                                                            type="number"
                                                            value={it.percent ?? 0}
                                                            onChange={(e) => {
                                                                setErrores({ ...errores, items: false });
                                                                handleChangeItem(i, "percent", e.target.value);
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") {
                                                                    e.preventDefault();
                                                                    confirmarPorcentaje();
                                                                }
                                                            }}
                                                        />

                                                        <select
                                                            className="flex-1 h-9 px-2 border border-gray-300 rounded-md text-xs bg-white min-w-0"
                                                            value={it.baseIndex ?? ""}
                                                            onChange={(e) => {
                                                                setErrores({ ...errores, items: false });
                                                                handleChangeItem(i, "baseIndex", e.target.value);
                                                            }}
                                                        >
                                                            <option value="">Seleccione un ítem</option>

                                                            {items
                                                                .map((b, bi) => ({ b, bi }))
                                                                .filter(({ bi }) => bi !== i)
                                                                .map(({ b, bi }) => (
                                                                    <option key={bi} value={bi}>
                                                                        {`Ítem ${bi + 1}${b.desc?.trim()
                                                                            ? ` - ${b.desc.slice(0, 40)}`
                                                                            : ""}`}
                                                                    </option>
                                                                ))}
                                                        </select>

                                                        {/* BOTÓN CHECK */}
                                                        <button
                                                            type="button"
                                                            onClick={confirmarPorcentaje}
                                                            className="h-9 w-9 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white rounded-md shrink-0"
                                                        >
                                                            <Check size={16} />
                                                        </button>
                                                    </>
                                                ) : (

                                                    <input
                                                        className="w-full h-9 px-2 border border-gray-300 rounded-md text-right bg-gray-100"
                                                        type="number"
                                                        value={it.unit}
                                                        readOnly
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    {/* VR TOTAL */}
                                    <td className="p-2 text-center font-semibold w-[120px]">
                                        {formatoCOP(it.cant * it.unit)}
                                    </td>

                                    {/* ELIMINAR */}
                                    <td className="text-center w-[50px]">
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

            {/* AGREGAR ÍTEM */}
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

            {/* TOTAL */}
            <p className="text-right text-lg font-bold mt-4">
                Total: {formatoCOP(
                    items.reduce((sum, it) => sum + it.cant * it.unit, 0)
                )}
            </p>

            {openIndex != null && (
                <div
                    ref={dropdownRef}
                    className="fixed z-[9999] bg-white border rounded shadow max-h-56 overflow-y-auto"
                    style={{
                        left: dropdownPos.left,
                        top: dropdownPos.top,
                        width: dropdownPos.width,
                    }}
                >
                    {itemsCatalogo.map((item) => (
                        <div
                            key={item.id}
                            className="px-2 py-1 text-xs hover:bg-blue-50 cursor-pointer"
                            onClick={() => {
                                handleChangeItem(openIndex, "desc", item.nombre);
                                setOpenIndex(null);
                            }}
                        >
                            {item.nombre}
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
