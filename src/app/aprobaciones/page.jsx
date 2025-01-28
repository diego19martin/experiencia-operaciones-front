"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Star } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

/**
 * Componente para que el Jefe de Juego apruebe/rechace validaciones pendientes.
 * Asume que en el backend tienes:
 *   GET /api/validations?status=pending
 *   PATCH /api/validations/:id -> { status: "approved" | "rejected" }
 */
export default function AprobacionesJefeJuego() {
  const [validaciones, setValidaciones] = useState([])
  const [filtroArea, setFiltroArea] = useState("todas")

  // Al montar, cargamos las validaciones pendientes.
  useEffect(() => {
    fetch("http://localhost:3001/api/validations?status=pending")
      .then(res => res.json())
      .then(data => setValidaciones(data))
      .catch(err => console.error("Error al obtener validaciones pendientes:", err))
  }, [])

  // Filtra por área si no está en "todas".
  const validacionesFiltradas =
    filtroArea === "todas"
      ? validaciones
      : validaciones.filter((v) => v.area === filtroArea)

  // Función para renderizar estrellas.
  const renderStars = (puntuacion) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`${star <= puntuacion ? "text-yellow-400" : "text-gray-300"} inline-block`}
      />
    ))
  }

  // Aprobar validación -> PATCH /api/validations/:id con { status: "approved" }
  const aprobarValidacion = async (validationId) => {
    try {
      await fetch(`http://localhost:3001/api/validations/${validationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" })
      })
      // Removemos la validación del estado local
      setValidaciones(prev => prev.filter(v => v.validation_id !== validationId))
    } catch (error) {
      console.error("Error al aprobar validación:", error)
    }
  }

  // Rechazar validación -> PATCH /api/validations/:id con { status: "rejected" }
  const rechazarValidacion = async (validationId) => {
    try {
      await fetch(`http://localhost:3001/api/validations/${validationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" })
      })
      // Removemos la validación del estado local
      setValidaciones(prev => prev.filter(v => v.validation_id !== validationId))
    } catch (error) {
      console.error("Error al rechazar validación:", error)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Aprobaciones del Jefe de Juego</h1>

      {/* Selector para filtrar por área */}
      <div className="mb-4">
        <Select onValueChange={setFiltroArea}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por área" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las áreas</SelectItem>
            {/* Ajusta si en tu DB existen áreas "Limpieza", "Atención al Cliente", etc. */}
            <SelectItem value="Limpieza">Limpieza</SelectItem>
            <SelectItem value="Atención al Cliente">Atención al Cliente</SelectItem>
            <SelectItem value="Operaciones">Operaciones</SelectItem>
            {/* Agrega más si es necesario */}
          </SelectContent>
        </Select>
      </div>

      {/* Render de validaciones pendientes (filtradas por área) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {validacionesFiltradas.map((validacion) => (
          <Card key={validacion.validation_id}>
            <CardHeader>
              <CardTitle>{validacion.item}</CardTitle>
            </CardHeader>
            <CardContent>
              <p><strong>Área:</strong> {validacion.area}</p>
              <p><strong>Instancia:</strong> {validacion.instancia?.replace("_", " ")}</p>
              <div className="my-2">
                {renderStars(validacion.rating)}
              </div>
              <p><strong>Puntuación:</strong> {validacion.rating}</p>

              {/* Si tu campo foto se llama `photo`, lo mostramos */}
              {validacion.photo && (
                <img
                  src={validacion.photo}
                  alt="Evidencia"
                  className="mt-2 w-full h-32 object-cover rounded"
                />
              )}

              <div className="flex space-x-2 mt-4">
                <Button
                  variant="default"
                  onClick={() => aprobarValidacion(validacion.validation_id)}
                >
                  Aprobar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => rechazarValidacion(validacion.validation_id)}
                >
                  Rechazar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
