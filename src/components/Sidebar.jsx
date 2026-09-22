import { NavLink } from "react-router-dom";
import { useGoogle } from "../context/GoogleContext";
import {
    ArrowRightLeft,
    CalendarDays,
    FileText,
    HandCoins,
    House,
    ReceiptText,
    Truck
} from "lucide-react";

export default function Sidebar({
    open,
    token,
    onLogoutClick
}) {
    const { role } = useGoogle();

    const links = [
        { label: "Home", to: "/home", roles: ["admin", "logistica"], icon: House },
        { label: "Entradas / Salidas", to: "/entradas-salidas", roles: ["admin"], icon: ArrowRightLeft },
        { label: "Cotizaciones", to: "/cotizaciones", roles: ["admin"], icon: FileText },
        { label: "Cuentas de Cobro", to: "/cuentas-de-cobro", roles: ["admin"], icon: HandCoins },
        { label: "Comprobante de Ingreso", to: "/comprobante-de-ingreso", roles: ["admin"], icon: ReceiptText },
        { label: "Vehículos", to: "/vehiculos", roles: ["admin", "logistica"], icon: Truck },
        { label: "Programación", to: "/programacion", roles: ["admin", "logistica"], icon: CalendarDays }
    ];

    return (
        <aside
            className={`fixed top-0 left-0 h-full bg-blue-600 text-white p-5 flex flex-col shadow-lg transition-all duration-300 overflow-hidden z-50 ${open ? "w-56 translate-x-0" : "-translate-x-64 w-56"
                }`}
        >
            <div className="flex items-center justify-between mb-4 ml-14">
                <h2 className="text-xl font-semibold">Ingetul</h2>
            </div>

            <nav className="flex flex-col gap-3 mt-4">
                {links
                    .filter(link => link.roles.includes(role))
                    .map(link => {
                        const Icon = link.icon;

                        return (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={({ isActive }) =>
                                `font-medium px-3 py-2 rounded-md ${isActive
                                    ? "bg-white text-blue-600"
                                    : "hover:bg-white/20"
                                }`
                            }
                            >
                                <span className="flex items-center gap-2">
                                    <Icon className="shrink-0" size={18} />
                                    {link.label}
                                </span>
                            </NavLink>
                        );
                    })}
            </nav>

            {token && (
                <div className="mt-auto">
                    <button
                        onClick={onLogoutClick}
                        className="bg-red-500 w-full mt-4 px-3 py-2 rounded-md hover:bg-red-600"
                    >
                        Desconectar
                    </button>
                </div>
            )}
        </aside>
    );
}
