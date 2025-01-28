"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Star } from "lucide-react"
import { ImageUpload } from "@/components/ImageUpload"
import { guardarFoto } from "@/lib/db"
import { ValidationSummary } from "@/components/ValidationSummary"

export default function DashboardJefeLimpieza() {
  // Ítems reales de la BD (área Limpieza => area_id=1)
  const [items, setItems] = useState([])

  // Objeto que guarda { [itemId]: { puntuacion, foto } }
  const [validaciones, setValidaciones] = useState({})

  // Turno actual (1,2,3)
  const [turnoActual, setTurnoActual] = useState(1)

  // Al montar, obtenemos los ítems de Limpieza
  useEffect(() => {
    fetch("http://localhost:3001/api/items/area/1")
      .then(res => res.json())
      .then(data => setItems(data))
      .catch(err => console.error("Error al traer ítems de limpieza:", err))
  }, [])

  // Cálculo de estadísticas
  const totalValidaciones = 3 * items.length // 3 relevamientos * #de ítems
  const validacionesCompletadas = Object.keys(validaciones).length
  const puntajePromedio =
    validacionesCompletadas > 0
      ? Object.values(validaciones).reduce((sum, val) => sum + val.puntuacion, 0) / validacionesCompletadas
      : 0

  // Manejo de clic en estrellas/foto
  const handleValidacion = (itemId, puntuacion, foto) => {
    setValidaciones(prev => ({
      ...prev,
      [itemId]: {
        puntuacion,
        foto: foto || prev[itemId]?.foto,
      },
    }))
    if (foto) {
      // Ejemplo local, si guardas la foto aparte
      guardarFoto(itemId, foto)
    }
  }

  // Enviar validaciones a la BD
  const enviarValidaciones = async () => {
    try {
      // Por cada itemId validado, creamos una validación en la BD
      for (const itemId in validaciones) {
        const { puntuacion, foto } = validaciones[itemId]

        // user_id: El id del jefe Limpieza. Ajusta a tu autenticación
        // turno_id / relevamiento si lo manejas
        const body = {
          item_id: parseInt(itemId),
          user_id: 1,              // Ejemplo: user_id=2 => Jefe Limpieza
          rating: puntuacion,
          comment: "",             // Podrías capturar un comentario
          photo: foto || null,
          turno_id: null,          // Si usas una tabla "turnos", pon el ID
          relevamiento: turnoActual
        }

        await fetch("http://localhost:3001/api/validations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      }

      alert("Validaciones enviadas con éxito a la BD")

      // Manejo de turnos
      if (turnoActual < 3) {
        setTurnoActual(prev => prev + 1)
        setValidaciones({})
      } else {
        alert("Has completado todas las validaciones del día")
      }
    } catch (error) {
      console.error("Error al enviar validaciones:", error)
      alert("Error enviando validaciones")
    }
  }

  // Renderiza las estrellas
  const renderStars = (itemId) => {
    const puntuacion = validaciones[itemId]?.puntuacion || 0
    return [1, 2, 3, 4, 5].map(star => (
      <Star
        key={star}
        className={`cursor-pointer ${star <= puntuacion ? "text-yellow-400" : "text-gray-300"}`}
        onClick={() => handleValidacion(itemId, star, null)}
      />
    ))
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Dashboard del Jefe de Limpieza</h1>

      <ValidationSummary
        totalValidations={totalValidaciones}
        completedValidations={validacionesCompletadas}
        averageScore={puntajePromedio}
      />

      <h2 className="text-2xl font-bold mt-8 mb-4">Validaciones del Turno Actual</h2>
      <p className="text-lg mb-4">Turno actual: {turnoActual} de 3</p>

      {/* Muestra los ítems traídos de la BD */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map(item => (
          <Card key={item.item_id}>
            <CardHeader>
              <CardTitle>{item.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-2">Instancia: {item.instancia.replace("_", " ")}</p>
              <div className="flex space-x-1 mb-4">
                {renderStars(item.item_id)}
              </div>
              <p>Puntuación: {validaciones[item.item_id]?.puntuacion || 0}</p>

              <ImageUpload
                onImageUpload={foto =>
                  handleValidacion(item.item_id, validaciones[item.item_id]?.puntuacion || 0, foto)
                }
              />
              {validaciones[item.item_id]?.foto && (
                <img
                  src={validaciones[item.item_id].foto || "/placeholder.svg"}
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
        disabled={Object.keys(validaciones).length !== items.length}
      >
        Enviar Validaciones del Turno {turnoActual}
      </Button>
    </div>
  )
}
