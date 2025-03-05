"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { 
  Menu, 
  Home, 
  ClipboardCheck, 
  BarChart2, 
  Map, 
  Settings, 
  Bell, 
  LogOut,
  Target,
  Calendar,
  LineChart,
  CheckSquare
} from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"

const NavItem = ({ href, label, icon: Icon, isActive, indent = false }) => (
  <Link
    href={href}
    className={cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
      isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
      indent && "pl-9" // Aplicar sangría si es un subítem
    )}
  >
    <Icon className="h-4 w-4" />
    <span>{label}</span>
  </Link>
)

export function Sidebar({ className }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout } = useAuth()
  const [currentTurno, setCurrentTurno] = useState("Sin turno")

  useEffect(() => {
    const calcularTurno = () => {
      const now = new Date()
      const currentHour = now.getHours()

      if (currentHour >= 6 && currentHour < 14) {
        setCurrentTurno("Mañana")
      } else if (currentHour >= 14 && currentHour < 22) {
        setCurrentTurno("Tarde")
      } else {
        setCurrentTurno("Noche")
      }
    }

    calcularTurno()
    const interval = setInterval(calcularTurno, 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Determinar si el usuario es coordinador o jefe
  const puedeCargarResultados = user?.role === "coordinador_atencion" || 
                                user?.role === "jefe_juego" || 
                                user?.role === "jefe_operaciones" || 
                                user?.role === "jefe_limpieza"

  const getNavLinks = () => {
    if (!user) {
      return [{ href: "/login", label: "Iniciar Sesión", icon: LogOut }]
    }

    // Links base según el rol
    let links = []

    switch (user.role) {
      case "jefe_juego":
        links = [
          { href: "/dashboard/juego", label: "Dashboard", icon: Home },
          { href: "/aprobaciones", label: "Aprobaciones", icon: ClipboardCheck },
          { href: "/resumen-turno", label: "Resumen de Turno", icon: BarChart2 },
          { href: "/journey-map", label: "Journey Map", icon: Map },
          { href: "/configuracion", label: "Configuración", icon: Settings },
          { href: "/novedades", label: "Novedades", icon: Bell }
        ]
        break
      case "jefe_operaciones":
        links = [
          { href: "/dashboard/operaciones", label: "Dashboard", icon: Home },
          { href: "/areas/operaciones", label: "Validaciones", icon: ClipboardCheck },
          { href: "/novedades", label: "Novedades", icon: Bell }
        ]
        break
      case "jefe_limpieza":
        links = [
          { href: "/dashboard/limpieza", label: "Dashboard", icon: Home },
          { href: "/areas/limpieza", label: "Validaciones", icon: ClipboardCheck },
          { href: "/novedades", label: "Novedades", icon: Bell }
        ]
        break
      case "coordinador_atencion":
        links = [
          { href: "/dashboard/atencion", label: "Dashboard", icon: Home },
          { href: "/areas/atencion", label: "Validaciones", icon: ClipboardCheck },
          { href: "/novedades", label: "Novedades", icon: Bell }
        ]
        break
      default:
        links = [
          { href: "/dashboard", label: "Dashboard", icon: Home },
          { href: "/novedades", label: "Novedades", icon: Bell }
        ]
    }

    // Agregar sección de objetivos para todos los usuarios
    links.push({ href: "/objetivos", label: "Objetivos", icon: Target })
    
    // Agregar enlaces adicionales de objetivos para roles específicos
    if (puedeCargarResultados) {
      links.push(
        { href: "/objetivos/seguimiento", label: "Seguimiento", icon: LineChart },
        { href: "/objetivos/seguimiento/diario", label: "Carga Diaria", icon: Calendar, indent: true }
      )
    }
    
    // Solo para jefe_juego, agregar administración de objetivos
    if (user.role === "jefe_juego") {
      links.push({ href: "/objetivos/crear", label: "Administrar Objetivos", icon: ClipboardCheck })
    }

    return links
  }

  const navLinks = getNavLinks()

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/login")
      router.refresh()
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center h-16 px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Menu className="h-6 w-6" />
          <span>Casino Ops</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-4 py-4">
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Navegación</h2>
            <div className="space-y-1">
              {navLinks.map((link) => (
                <NavItem
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  icon={link.icon}
                  isActive={pathname === link.href}
                  indent={link.indent}
                />
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
      {user && (
        <>
          <Separator />
          <div className="p-4">
            <p className="text-sm font-medium text-muted-foreground mb-2">Turno Actual</p>
            <div className="bg-accent text-accent-foreground rounded-md p-2 text-sm font-medium mb-4">
              {currentTurno}
            </div>
            <Button onClick={handleLogout} className="w-full" variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </>
      )}
    </div>
  )

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-[240px]">
          {sidebarContent}
        </SheetContent>
      </Sheet>

      <div
        className={cn(
          "hidden md:flex md:flex-col md:fixed md:inset-y-0 z-[80] w-[240px] bg-background border-r",
          className,
        )}
      >
        {sidebarContent}
      </div>
    </>
  )
}