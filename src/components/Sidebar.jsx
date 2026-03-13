import { NavLink } from "react-router-dom";
import { useGoogle } from "../context/GoogleContext";

export default function Sidebar({
    open,
    token,
    onLogoutClick
}) {
    const { role } = useGoogle();

    const links = [
        { label: "Home", to: "/home", roles: ["admin", "laboratorio"] },
        { label: "Entradas / Salidas", to: "/entradas-salidas", roles: ["admin"] },
        { label: "Cotizaciones", to: "/cotizaciones", roles: ["admin"] },
        { label: "Cuentas de Cobro", to: "/cuentas-de-cobro", roles: ["admin"] },
        { label: "Comprobante de Ingreso", to: "/comprobante-de-ingreso", roles: ["admin"] },
        { label: "Laboratorio", to: "/laboratorio", roles: ["admin", "laboratorio"] }
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
                    .map(link => (
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
                            {link.label}
                        </NavLink>
                    ))}
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