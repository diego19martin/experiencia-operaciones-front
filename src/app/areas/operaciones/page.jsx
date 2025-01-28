"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Star } from "lucide-react"
import { ImageUpload } from "@/components/ImageUpload"
import { guardarFoto } from "@/lib/db"

const itemsOperaciones = [
  { id: 1, nombre: "Estado de las mesas de juego", instancia: "experiencia_en_maquina" },
  { id: 2, nombre: "Funcionamiento de máquinas tragamonedas", instancia: "experiencia_en_maquina" },
  { id: 3, nombre: "Seguridad en el área de juego", instancia: "pausa" },
  { id: 4, nombre: "Gestión de fichas y dinero", instancia: "ingreso" },
  { id: 5, nombre: "Cumplimiento de normas de juego", instancia: "salida" },
]

export default function JefeOperaciones() {
  const [validaciones, setValidaciones] = useState({})
  const [turnoActual, setTurnoActual] = useState(1)

  const handleValidacion = (itemId, puntuacion, foto) => {
    setValidaciones((prev) => ({
      ...prev,
      [itemId]: {
        puntuacion,
        foto: foto || prev[itemId]?.foto,
      },
    }))
    if (foto) {
      guardarFoto(itemId, foto)
    }
  }

  const enviarValidaciones = () => {
    console.log("Validaciones enviadas:", validaciones)
    // Aquí iría la lógica para enviar las validaciones al backend
    alert("Validaciones enviadas con éxito")
    if (turnoActual < 3) {
      setTurnoActual((prev) => prev + 1)
      setValidaciones({})
    } else {
      // Lógica para finalizar el día de validaciones
      alert("Has completado todas las validaciones del día")
    }
  }

  const renderStars = (itemId) => {
    const puntuacion = validaciones[itemId]?.puntuacion || 0
    return [1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`cursor-pointer ${star <= puntuacion ? "text-yellow-400" : "text-gray-300"}`}
        onClick={() => handleValidacion(itemId, star, null)}
      />
    ))
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Validaciones del Jefe de Operaciones</h1>
      <p className="text-lg mb-4">Turno actual: {turnoActual} de 3</p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {itemsOperaciones.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle>{item.nombre}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-2">Instancia: {item.instancia.replace("_", " ")}</p>
              <div className="flex space-x-1 mb-4">{renderStars(item.id)}</div>
              <p>Puntuación: {validaciones[item.id]?.puntuacion || 0}</p>
              <ImageUpload
                onImageUpload={(foto) => handleValidacion(item.id, validaciones[item.id]?.puntuacion || 0, foto)}
              />
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
      <Button
        onClick={enviarValidaciones}
        className="mt-6"
        disabled={Object.keys(validaciones).length !== itemsOperaciones.length}
      >
        Enviar Validaciones del Turno {turnoActual}
      </Button>
    </div>
  )
}

