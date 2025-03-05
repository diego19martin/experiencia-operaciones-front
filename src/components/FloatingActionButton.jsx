"use client"

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Calendar, LineChart, X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  
  // Verificar si el usuario puede cargar resultados
  const puedeCargarResultados = user?.role === "coordinador_atencion" || 
                                user?.role === "jefe_juego" || 
                                user?.role === "jefe_operaciones" || 
                                user?.role === "jefe_limpieza"
  
  // Solo mostrar para roles autorizados
  if (!puedeCargarResultados) {
    return null
  }
  
  // Si ya estamos en la página de carga diaria, no mostrar el botón
  if (pathname === '/objetivos/seguimiento/diario') {
    return null
  }

  const handleNavigate = (path) => {
    setIsOpen(false)
    router.push(path)
  }
  
  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Menú emergente simple */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-lg overflow-hidden w-56 mb-2 border">
          <button
            onClick={() => handleNavigate('/objetivos/seguimiento/diario')}
            className="w-full flex items-center px-4 py-3 hover:bg-gray-100 text-left"
          >
            <Calendar className="mr-2 h-4 w-4 text-blue-600" />
            <span>Carga Diaria de Objetivos</span>
          </button>
          <button
            onClick={() => handleNavigate('/objetivos/seguimiento')}
            className="w-full flex items-center px-4 py-3 hover:bg-gray-100 text-left"
          >
            <LineChart className="mr-2 h-4 w-4 text-green-600" />
            <span>Ver Seguimiento</span>
          </button>
        </div>
      )}
      
      {/* Botón principal */}
      <Button
        size="icon"
        className={`h-14 w-14 rounded-full shadow-lg ${
          isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Plus className="h-6 w-6" />
        )}
      </Button>
    </div>
  )
}