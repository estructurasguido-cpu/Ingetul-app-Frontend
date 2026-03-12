export default function BotonFlotanteUI({
    pos,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onClick,
}) {
    return (
        <div
            className="sm:hidden"
            style={{
                position: "fixed",
                top: pos.y,
                left: pos.x,
                zIndex: 9999,
                touchAction: "none",
                userSelect: "none",
            }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            <button
                type="button"
                onClick={onClick}
                className="bg-gray-700 text-white px-4 py-3 rounded-full shadow-lg
                   active:scale-95 transition-all"
                aria-label="Limpiar formulario"
            >
                🧹
            </button>
        </div>
    );
}
