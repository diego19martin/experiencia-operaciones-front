"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { Calendar, LineChart, Target, ClipboardCheck } from "lucide-react"
import { usePathname } from "next/navigation"

export default function ObjetivosLayout({ children }) {
  const { user } = useAuth()
  const pathname = usePathname()
  
  // Determinar si el usuario puede cargar resultados
  const puedeCargarResultados = user?.role === "coordinador_atencion" || 
                                user?.role === "jefe_juego" || 
                                user?.role === "jefe_operaciones" || 
                                user?.role === "jefe_limpieza"

  // Determinar la tab activa basada en la ruta actual
  const getActiveTab = () => {
    if (pathname.includes("/objetivos/crear")) return "create"
    if (pathname.includes("/objetivos/seguimiento/diario")) return "daily"
    if (pathname.includes("/objetivos/seguimiento")) return "tracking"
    return "list"
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Objetivos</h1>
      </div>

      <Tabs value={getActiveTab()} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          <Link href="/objetivos">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Objetivos</span>
            </TabsTrigger>
          </Link>
          
          <Link href="/objetivos/seguimiento">
            <TabsTrigger value="tracking" className="flex items-center gap-2">
              <LineChart className="h-4 w-4" />
              <span className="hidden sm:inline">Seguimiento</span>
            </TabsTrigger>
          </Link>
          
          {puedeCargarResultados && (
            <Link href="/objetivos/seguimiento/diario">
              <TabsTrigger value="daily" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Carga Diaria</span>
              </TabsTrigger>
            </Link>
          )}
          
          {user?.role === "jefe_juego" && (
            <Link href="/objetivos/crear">
              <TabsTrigger value="create" className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Administrar</span>
              </TabsTrigger>
            </Link>
          )}
        </TabsList>
      </Tabs>

      {children}
    </div>
  )
}