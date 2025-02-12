"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

const Navbar = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [currentTurno, setCurrentTurno] = useState("Sin turno");

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  useEffect(() => {
    // Función para determinar el turno actual según la hora
    const calcularTurno = () => {
      const now = new Date();
      const currentHour = now.getHours();

      if (currentHour >= 6 && currentHour < 14) {
        setCurrentTurno("Mañana");
        return 1; // turno_id 1
      } else if (currentHour >= 14 && currentHour < 22) {
        setCurrentTurno("Tarde");
        return 2; // turno_id 2
      } else {
        setCurrentTurno("Noche");
        return 3; // turno_id 3
      }
    };

    calcularTurno();
    const interval = setInterval(calcularTurno, 60 * 1000); // Recalcular cada minuto

    return () => clearInterval(interval); // Limpia el intervalo al desmontar
  }, []);

  if (!user) {
    // Navbar minimal sin usuario
    return (
      <nav className="bg-primary text-primary-foreground shadow-md">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <Link href="/" className="font-bold text-xl">
            Casino Ops
          </Link>
          <Button variant="secondary" onClick={() => router.push("/login")}>
            Iniciar Sesión
          </Button>
        </div>
      </nav>
    );
  }

  let navLinks = [];
  switch (user.role) {
    case "jefe_operaciones":
      navLinks = [
        { href: "/dashboard/operaciones", label: "Dashboard Ops" },
        { href: "/areas/operaciones", label: "Validaciones" },
        { href: "/novedades", label: "Novedades" },
      ];
      break;
    case "jefe_limpieza":
      navLinks = [
        { href: "/dashboard/limpieza", label: "Dashboard Limpieza" },
        { href: "/areas/limpieza", label: "Validaciones" },
        { href: "/novedades", label: "Novedades" },
      ];
      break;
    case "coordinador_atencion":
      navLinks = [
        { href: "/dashboard/atencion", label: "Dashboard Atención" },
        { href: "/areas/atencion", label: "Validaciones" },
        { href: "/novedades", label: "Novedades" },
      ];
      break;
    case "jefe_juego":
      navLinks = [
        { href: "/dashboard/juego", label: "Dashboard Juego" },
        { href: "/aprobaciones", label: "Aprobaciones" },
        { href: "/resumen-turno", label: "Resumen de Turno" },
        { href: "/journey-map", label: "Journey Map" },
        { href: "/configuracion", label: "Configuración" },
        { href: "/novedades", label: "Novedades" },
      ];
      break;
    default:
      navLinks = [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/novedades", label: "Novedades" },
      ];
  }

  return (
    <nav className="bg-primary text-primary-foreground shadow-md">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <Link href="/" className="font-bold text-xl">
          Casino Ops
        </Link>
        <div className="hidden md:block">
          <div className="ml-10 flex items-baseline space-x-4">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-foreground hover:text-primary"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
        <div className="hidden md:block">
          <span className="text-sm font-medium mr-4">Turno Actual: {currentTurno}</span>
          <Button variant="secondary" onClick={handleLogout}>
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;