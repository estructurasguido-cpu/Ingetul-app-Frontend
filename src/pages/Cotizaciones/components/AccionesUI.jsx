export default function AccionesUI({
    onGenerarPDF,
    onSubirDrive,
    onLimpiar,
}) {
    return (
        <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex gap-2 mb-2 sm:mb-0">
                <button
                    type="button"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold"
                    onClick={onGenerarPDF}
                >
                    Generar PDF
                </button>

                <button
                    type="button"
                    className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg font-semibold"
                    onClick={onSubirDrive}
                >
                    Subir a Google Drive
                </button>
            </div>

            <div>
                <button
                    type="button"
                    onClick={onLimpiar}
                    className="bg-gray-300 hover:bg-gray-400 text-black px-5 py-3 rounded-lg font-semibold"
                >
                    Limpiar
                </button>
            </div>
        </div>
    );
}
