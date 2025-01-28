"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"

const Navbar = () => {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  if (!user) {
    // navbar minimal sin usuario
    return (
      <nav className="bg-primary text-primary-foreground shadow-md">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <Link href="/" className="font-bold text-xl">Casino Ops</Link>
          <Button variant="secondary" onClick={() => router.push("/login")}>Iniciar Sesión</Button>
        </div>
      </nav>
    )
  }

  let navLinks = []
  switch (user.role) {
    case "jefe_operaciones":
      navLinks = [
        { href: "/dashboard/operaciones", label: "Dashboard Ops" },
        { href: "/areas/operaciones", label: "Validaciones" },
        // las que quieras
      ]
      break
    case "jefe_limpieza":
      navLinks = [
        { href: "/dashboard/limpieza", label: "Dashboard Limpieza" },
        { href: "/areas/limpieza", label: "Validaciones" },
      ]
      break
    case "coordinador_atencion":
      navLinks = [
        { href: "/dashboard/atencion", label: "Dashboard Atención" },
        { href: "/areas/atencion", label: "Validaciones" },
      ]
      break
    case "jefe_juego":
      // el rol de mayor perfil
      navLinks = [
        { href: "/dashboard/juego", label: "Dashboard Juego" },
        { href: "/aprobaciones", label: "Aprobaciones" },
        { href: "/resumen-turno", label: "Resumen de Turno" },
        { href: "/journey-map", label: "Journey Map" },
        { href: "/configuracion", label: "Configuración" }, 
      ]
      break
    default:
      // si hay algún otro rol no contemplado
      navLinks = [{ href: "/dashboard", label: "Dashboard" }]
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
          <Button variant="secondary" onClick={handleLogout}>Cerrar Sesión</Button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
