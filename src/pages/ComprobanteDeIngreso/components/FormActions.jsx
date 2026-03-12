export default function FormActions({ onLimpiar, onUpload }) {
    return (
        <div className="flex justify-end gap-3 pt-4">
            <button
                type="button"
                onClick={onLimpiar}
                className="px-4 py-2 border rounded"
            >
                Limpiar
            </button>

            <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded"
            >
                Generar comprobante
            </button>

            <button
                type="button"
                onClick={onUpload}
                className="px-4 py-2 bg-green-600 text-white rounded"
            >
                Subir comprobante
            </button>
        </div>
    );
}
