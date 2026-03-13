import { useEffect } from "react";

export default function Toast({ message, type = "info", onClose, duration = 3000 }) {

    useEffect(() => {

        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);

    }, [duration, onClose]);

    const colors = {
        success: "bg-green-600",
        error: "bg-red-600",
        info: "bg-blue-600",
        warning: "bg-yellow-500 text-black"
    };

    return (

        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">

            <div className={`${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg min-w-[250px] flex items-center justify-between`}>

                <span className="text-sm">{message}</span>

                <button
                    onClick={onClose}
                    className="ml-4 text-white/80 hover:text-white"
                >
                    ✕
                </button>

            </div>

        </div>
    );
}