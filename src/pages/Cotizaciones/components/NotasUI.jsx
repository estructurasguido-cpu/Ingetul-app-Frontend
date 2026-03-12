import { RotateCcw, Plus } from "lucide-react";
import { useRef } from "react";

export default function NotasUI({ notas, setNotas, notasDefault }) {

    const textareaRef = useRef(null);

    const handleReset = () => {
        setNotas(notasDefault);
    };

    const handleAgregarBullet = () => {
        const bullet = "\n• ";

        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        const nuevoTexto =
            notas.substring(0, start) +
            bullet +
            notas.substring(end);

        setNotas(nuevoTexto);

        setTimeout(() => {
            textarea.focus();
            textarea.selectionStart = textarea.selectionEnd = start + bullet.length;
        }, 0);
    };

    return (
        <section>
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-[#0051ff] text-xl font-semibold">
                    Notas
                </h2>

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={handleAgregarBullet}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 rounded"
                    >
                        <Plus size={14} />
                    </button>

                    <button
                        type="button"
                        onClick={handleReset}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                    >
                        <RotateCcw size={14} />
                        Reiniciar
                    </button>
                </div>
            </div>

            <textarea
                ref={textareaRef}
                rows="5"
                className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full resize-y"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
            />
        </section>
    );
}
