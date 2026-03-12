export default function UbicacionFecha({
    departamentos,
    ciudades,
    departamentoSel,
    ciudadSel,
    setDepartamentoSel,
    setCiudadSel,
    form,
    handleChange,
}) {
    return (
        <div className="grid grid-cols-4 gap-3">
            <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold">Departamento *</label>
                <select
                    value={departamentoSel}
                    onChange={(e) => setDepartamentoSel(e.target.value)}
                    className="border rounded px-2 py-1"
                >
                    <option value="">Seleccione</option>
                    {departamentos.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                </select>
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold">Ciudad *</label>
                <select
                    value={ciudadSel}
                    onChange={(e) => setCiudadSel(e.target.value)}
                    disabled={!ciudades.length}
                    className="border rounded px-2 py-1 disabled:bg-gray-100"
                >
                    <option value="">Seleccione</option>
                    {ciudades.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                </select>
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold">Fecha *</label>
                <input
                    name="fecha"
                    type="date"
                    value={form.fecha}
                    onChange={handleChange}
                    className="border rounded px-2 py-1"
                />
            </div>
        </div>
    );
}
