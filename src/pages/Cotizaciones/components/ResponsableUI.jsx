export default function ResponsableUI({ responsable, setResponsable }) {
    return (
        <section>
            <h2 className="text-[#0051ff] text-xl font-semibold border-b border-blue-100 pb-1 mb-4">
                Proyectó
            </h2>

            <select
                className="w-full p-2 border border-gray-300 rounded-lg text-sm
                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={responsable}
                onChange={(e) => setResponsable(e.target.value)}
            >
                <option value="">Seleccione</option>
                <option value="G">G</option>
                <option value="J">J</option>
                <option value="D.G.">D.G.</option>
                <option value="D">D</option>
                <option value="C">C</option>
            </select>
        </section>
    );
}
