import { useLoader } from "../context/LoaderContext";

export default function Loader() {
    const { loading, mensaje } = useLoader();

    if (!loading) return null;

    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/50 z-[99999] backdrop-blur-sm">

            <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>

            <p className="text-white font-semibold text-lg animate-pulse">
                {mensaje}
            </p>

        </div>
    );
}
