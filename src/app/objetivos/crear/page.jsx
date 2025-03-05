"use client"

import { useAuth } from "@/contexts/AuthContext"
import ObjetivosForm from "@/components/ObjetivosForm"

export default function CrearObjetivoPage() {
  const { user } = useAuth()

  if (user?.role !== "jefe_juego") {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-muted-foreground">
          No tienes permisos para crear objetivos.
        </p>
      </div>
    )
  }

  return <ObjetivosForm />
}