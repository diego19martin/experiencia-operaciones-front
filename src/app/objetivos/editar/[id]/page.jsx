"use client"

import { useAuth } from "@/contexts/AuthContext"
import ObjetivosForm from "@/components/ObjetivosForm"

export default function EditarObjetivoPage({ params }) {
  const { user } = useAuth()
  const objetivoId = params.id

  if (user?.role !== "jefe_juego") {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-muted-foreground">
          No tienes permisos para editar objetivos.
        </p>
      </div>
    )
  }

  return <ObjetivosForm objetivoId={objetivoId} />
}