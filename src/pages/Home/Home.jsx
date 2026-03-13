import { NavLink } from "react-router-dom";
import {
    ArrowLeftRight,
    FileText,
    Receipt,
    Wallet,
    FlaskConical
} from "lucide-react";
import { useGoogle } from "../../context/GoogleContext";

const modules = [
    {
        label: "Entradas / Salidas",
        to: "/entradas-salidas",
        roles: ["admin"],
        color: "bg-blue-500 hover:bg-blue-600",
        icon: ArrowLeftRight
    },
    {
        label: "Cotizaciones",
        to: "/cotizaciones",
        roles: ["admin"],
        color: "bg-green-500 hover:bg-green-600",
        icon: FileText
    },
    {
        label: "Cuentas de Cobro",
        to: "/cuentas-de-cobro",
        roles: ["admin"],
        color: "bg-purple-500 hover:bg-purple-600",
        icon: Receipt
    },
    {
        label: "Comprobante de Ingreso",
        to: "/comprobante-de-ingreso",
        roles: ["admin"],
        color: "bg-indigo-500 hover:bg-indigo-600",
        icon: Wallet
    },
    {
        label: "Laboratorio",
        to: "/laboratorio",
        roles: ["admin", "laboratorio"],
        color: "bg-orange-500 hover:bg-orange-600",
        icon: FlaskConical
    }
];

export default function Home() {
    const { role } = useGoogle();
    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center">
                INGETUL · Dashboard
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules
                    .filter(mod => mod.roles.includes(role))
                    .map((mod) => {
                        const Icon = mod.icon;

                        return (
                            <NavLink
                                key={mod.to}
                                to={mod.to}
                                className={`text-white rounded-xl shadow-lg p-6 flex flex-col items-center justify-center gap-3 text-lg font-semibold transition-transform transform hover:scale-105 ${mod.color}`}
                            >
                                <Icon size={36} strokeWidth={1.8} />
                                <span className="text-center">{mod.label}</span>
                            </NavLink>
                        );
                    })}
            </div>
        </div>
    );
}
