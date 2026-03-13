import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Outlet, useNavigate } from "react-router-dom";
import { useGoogle } from "../context/GoogleContext";
import ModalConfirm from "../components/ModalConfirm";
import Sidebar from "../components/Sidebar";

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

      <div className="flex min-h-screen relative">
        <Sidebar
          open={open}
          token={token}
          onLogoutClick={() => setShowLogoutModal(true)}
        />

        <main className="flex-1 bg-gray-100 p-3 md:p-5">
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
        confirmText="Cerrar sesión"
      />
    </>
  );
}
