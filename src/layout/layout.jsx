import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useGoogle } from "../context/GoogleContext";
import ModalConfirm from "../components/ModalConfirm";

export default function Layout() {
  const [open, setOpen] = useState(false);
  const { token, logout } = useGoogle();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 bg-blue-600 text-white p-2 rounded-lg shadow-md z-[999]"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      <div className="flex h-screen transition-all duration-300 relative">
        {/* Sidebar */}
        <aside
          className={`fixed top-0 left-0 h-full bg-blue-600 text-white p-5 flex flex-col shadow-lg transition-all duration-300 overflow-hidden z-50 ${open ? "w-56 translate-x-0" : "-translate-x-64 w-56"
            }`}
        >
          <div className="flex items-center justify-between mb-4 ml-14">
            <h2 className="text-xl font-semibold">
              Ingetul
            </h2>
          </div>

          <nav className="flex flex-col gap-3 mt-4">
            <NavLink
              to="/entradas-salidas"
              className={({ isActive }) =>
                `font-medium px-3 py-2 rounded-md ${isActive ? "bg-white text-blue-600" : "hover:bg-white/20"
                }`
              }
            >
              Entradas / Salidas
            </NavLink>

          </nav>

          <div className="mt-auto">
            {token && (
              <button
                onClick={() => setShowLogoutModal(true)}
                className="bg-red-500 w-full mt-4 px-3 py-2 rounded-md hover:bg-red-600"
              >
                Desconectar
              </button>
            )}
          </div>
        </aside>

        {/* Contenido principal */}
        <main className="flex-1 bg-gray-100 p-5 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <ModalConfirm
        open={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={() => {
          setShowLogoutModal(false);
          logout();
          navigate("/");
        }}
        title="Cerrar sesión"
        message="¿Estás seguro de que deseas desconectarte?"
      />
    </>
  );
}
