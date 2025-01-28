"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Star } from "lucide-react"
import { ImageUpload } from "@/components/ImageUpload"
import { ValidationSummary } from "@/components/ValidationSummary"
import { guardarFoto } from "@/lib/db"

const itemsAtencion = [
  { id: 1, nombre: "Amabilidad en recepción", instancia: "ingreso" },
  { id: 2, nombre: "Tiempo de respuesta", instancia: "experiencia_en_maquina" },
  { id: 3, nombre: "Resolución de problemas", instancia: "pausa" },
  // ...
]

export default function ValidacionesAtencion() {
  const [validaciones, setValidaciones] = useState({})
  const [turnoActual, setTurnoActual] = useState(1)

  // Ejemplo: 3 turnos/día
  const totalValidaciones = 3 * itemsAtencion.length
  const validacionesCompletadas = Object.keys(validaciones).length
  const puntajePromedio = validacionesCompletadas > 0
    ? Object.values(validaciones).reduce((sum, val) => sum + val.puntuacion, 0) / validacionesCompletadas
    : 0

  const handleValidacion = (itemId, puntuacion, foto) => {
    setValidaciones((prev) => ({
      ...prev,
      [itemId]: { puntuacion, foto: foto || prev[itemId]?.foto }
    }))
    if (foto) {
      guardarFoto(itemId, foto)
    }
  }

  const enviarValidaciones = () => {
    console.log("Validaciones enviadas:", validaciones)
    alert("Validaciones enviadas con éxito")
    if (turnoActual < 3) {
      setTurnoActual((prev) => prev + 1)
      setValidaciones({})
    } else {
      alert("Has completado todas las validaciones del día")
    }
  }

  const renderStars = (itemId) => {
    const puntuacion = validaciones[itemId]?.puntuacion || 0
    return [1,2,3,4,5].map((star) => (
      <Star
        key={star}
        className={`cursor-pointer ${star <= puntuacion ? "text-yellow-400" : "text-gray-300"}`}
        onClick={() => handleValidacion(itemId, star, null)}
      />
    ))
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Validaciones de Atención</h1>
      <ValidationSummary
        totalValidations={totalValidaciones}
        completedValidations={validacionesCompletadas}
        averageScore={puntajePromedio}
      />
      <h2 className="text-2xl font-bold mt-8 mb-4">Turno Actual: {turnoActual} de 3</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {itemsAtencion.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle>{item.nombre}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-2">Instancia: {item.instancia.replace("_", " ")}</p>
              <div className="flex space-x-1 mb-4">
                {renderStars(item.id)}
              </div>
              <p>Puntuación: {validaciones[item.id]?.puntuacion || 0}</p>
              <ImageUpload onImageUpload={(foto) => handleValidacion(item.id, validaciones[item.id]?.puntuacion||0, foto)} />
              {validaciones[item.id]?.foto && (
                <img
                  src={validaciones[item.id].foto || "/placeholder.svg"}
                  alt="Evidencia"
                  className="mt-2 w-full h-32 object-cover rounded"
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Button className="mt-6" onClick={enviarValidaciones} disabled={Object.keys(validaciones).length !== itemsAtencion.length}>
        Enviar Validaciones del Turno {turnoActual}
      </Button>
    </div>
  )
}
