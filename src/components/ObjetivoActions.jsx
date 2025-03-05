"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { Calendar, LineChart, CheckCircle2, FileDown } from "lucide-react"

export default function ObjetivoActions() {
  const router = useRouter()
  const { user } = useAuth()
  
  // Verificar si el usuario puede cargar resultados
  const puedeCargarResultados = user?.role === "coordinador_atencion" || 
                                user?.role === "jefe_juego" || 
                                user?.role === "jefe_operaciones" || 
                                user?.role === "jefe_limpieza"
  
  // Verificar si el usuario puede administrar objetivos
  const puedeAdministrarObjetivos = user?.role === "jefe_juego"
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Carga Diaria - Solo para roles autorizados */}
      {puedeCargarResultados && (
        <Card className="bg-gradient-to-br from-blue-50 to-white border-l-4 border-l-blue-500 hover:shadow-md transition-shadow cursor-pointer" 
              onClick={() => router.push("/objetivos/seguimiento/diario")}>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="bg-blue-100 rounded-full p-3">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">Carga Diaria</p>
              <p className="text-sm text-muted-foreground">Registrar resultados</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Seguimiento - Para todos */}
      <Card className="bg-gradient-to-br from-green-50 to-white border-l-4 border-l-green-500 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => router.push("/objetivos/seguimiento")}>
        <CardContent className="pt-6 flex items-center gap-4">
          <div className="bg-green-100 rounded-full p-3">
            <LineChart className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="font-medium">Seguimiento</p>
            <p className="text-sm text-muted-foreground">Ver tendencias</p>
          </div>
        </CardContent>
      </Card>
      
      {/* Administrar Objetivos - Solo para Jefe de Juego */}
      {puedeAdministrarObjetivos && (
        <Card className="bg-gradient-to-br from-purple-50 to-white border-l-4 border-l-purple-500 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push("/objetivos/crear")}>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="bg-purple-100 rounded-full p-3">
              <CheckCircle2 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium">Administrar</p>
              <p className="text-sm text-muted-foreground">Gestionar objetivos</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Exportar - Para todos */}
      <Card className="bg-gradient-to-br from-amber-50 to-white border-l-4 border-l-amber-500 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => {/* Implementar exportación */}}>
        <CardContent className="pt-6 flex items-center gap-4">
          <div className="bg-amber-100 rounded-full p-3">
            <FileDown className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="font-medium">Exportar</p>
            <p className="text-sm text-muted-foreground">Descargar reporte</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}