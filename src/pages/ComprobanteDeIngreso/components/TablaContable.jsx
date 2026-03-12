export default function TablaContable({
    movimientos,
    handleMovimientoChange,
    agregarMovimiento,
    eliminarMovimiento,
}) {
    return (
        <>
            <table className="w-full border mt-4">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border p-1">Código</th>
                        <th className="border p-1">Cuenta *</th>
                        <th className="border p-1">Débito</th>
                        <th className="border p-1">Crédito</th>
                        <th className="border p-1"></th>
                    </tr>
                </thead>

                <tbody>
                    {movimientos.map((m, i) => (
                        <tr key={i}>
                            <td className="border">
                                <input
                                    className="w-full px-1"
                                    value={m.codigo}
                                    onChange={(e) =>
                                        handleMovimientoChange(i, "codigo", e.target.value)
                                    }
                                />
                            </td>

                            <td className="border">
                                <input
                                    className="w-full px-1"
                                    value={m.cuenta}
                                    onChange={(e) =>
                                        handleMovimientoChange(i, "cuenta", e.target.value)
                                    }
                                />
                            </td>

                            <td className="border">
                                <input
                                    className="w-full px-1"
                                    value={m.debito}
                                    onChange={(e) =>
                                        handleMovimientoChange(i, "debito", e.target.value)
                                    }
                                />
                            </td>

                            <td className="border">
                                <input
                                    className="w-full px-1"
                                    value={m.credito}
                                    onChange={(e) =>
                                        handleMovimientoChange(i, "credito", e.target.value)
                                    }
                                />
                            </td>

                            <td className="border text-center">
                                {movimientos.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => eliminarMovimiento(i)}
                                        className="text-red-600 font-bold"
                                    >
                                        ✕
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={agregarMovimiento}
                    className="px-3 py-1 border rounded"
                >
                    + Agregar movimiento
                </button>
            </div>
        </>
    );
}
