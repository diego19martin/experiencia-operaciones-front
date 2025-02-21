"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Star, Clock } from "lucide-react"
import { ImageUpload } from "@/components/ImageUpload"
import { ValidationSummary } from "@/components/ValidationSummary"
import { calcularTurno } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import Swal from "sweetalert2"
import dynamic from "next/dynamic"

const confetti = dynamic(() => import("canvas-confetti"), {
  ssr: false,
  loading: () => null,
})

export default function ValidacionesGenericas({ areaId, titulo, textos }) {
  const [items, setItems] = useState([])
  const [validaciones, setValidaciones] = useState({})
  const [turnoActual, setTurnoActual] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [canProceed, setCanProceed] = useState(false)
  const [mensajeEspera, setMensajeEspera] = useState("")
  const [tiempoRestante, setTiempoRestante] = useState(null)

  const formatearTiempoRestante = useCallback((minutos) => {
    const horas = Math.floor(minutos / 60)
    const mins = Math.round(minutos % 60)
    return {
      horas,
      minutos: mins,
      texto: `${horas > 0 ? `${horas}h ` : ""}${mins}m`,
    }
  }, [])

  useEffect(() => {
    let intervalo
    if (tiempoRestante && tiempoRestante > 0) {
      intervalo = setInterval(() => {
        setTiempoRestante((prev) => {
          const nuevo = prev - 1 / 60
          if (nuevo <= 0) {
            setCanProceed(true)
            setMensajeEspera("")
            return null
          }
          const tiempo = formatearTiempoRestante(nuevo)
          setMensajeEspera(`Tiempo restante para el próximo relevamiento: ${tiempo.texto}`)
          return nuevo
        })
      }, 1000)
    }
    return () => clearInterval(intervalo)
  }, [tiempoRestante, formatearTiempoRestante])

  useEffect(() => {
    const fetchItemsAndValidations = async () => {
      try {
        const turnoId = calcularTurno()
        console.log("Turno Calculado:", turnoId)

        const itemsRes = await fetch(`http://localhost:3001/api/items/area/${areaId}`)
        const itemsData = await itemsRes.json()
        setItems(itemsData)

        const prevValidationsRes = await fetch(
          `http://localhost:3001/api/validations?status=pending&area_id=${areaId}&date=${new Date().toISOString().split("T")[0]}&turno=${turnoId}`,
        )
        const prevValidationsData = await prevValidationsRes.json()

        if (prevValidationsData.length > 0) {
          const lastValidation = prevValidationsData.reduce((latest, current) =>
            new Date(current.created_at) > new Date(latest.created_at) ? current : latest,
          )

          const lastValidationTime = new Date(lastValidation.created_at)
          const currentTime = new Date()
          const diffInHours = (currentTime - lastValidationTime) / (1000 * 60 * 60)

          if (diffInHours < 2) {
            const remainingMinutes = Math.max(0, (2 - diffInHours) * 60)
            setTiempoRestante(remainingMinutes)
            setCanProceed(false)
            const tiempo = formatearTiempoRestante(remainingMinutes)
            setMensajeEspera(`Tiempo restante para el próximo relevamiento: ${tiempo.texto}`)
          } else {
            setCanProceed(true)
            setMensajeEspera("")
            setTiempoRestante(null)
          }
        } else {
          setCanProceed(true)
          setMensajeEspera("")
          setTiempoRestante(null)
        }

        const relevamientosCompletos = prevValidationsData.reduce((acc, val) => {
          acc[val.relevamiento] = (acc[val.relevamiento] || 0) + 1
          return acc
        }, {})

        let relevamientoPendiente = 1
        for (let relevamiento = 1; relevamiento <= 3; relevamiento++) {
          if ((relevamientosCompletos[relevamiento] || 0) < itemsData.length) {
            relevamientoPendiente = relevamiento
            break
          }
        }
        setTurnoActual(relevamientoPendiente)
      } catch (error) {
        console.error("Error al cargar datos:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchItemsAndValidations()
  }, [areaId, formatearTiempoRestante])

  const handleValidacion = (itemId, puntuacion, foto) => {
    setValidaciones((prev) => ({
      ...prev,
      [itemId]: {
        puntuacion,
        foto: foto || prev[itemId]?.foto,
      },
    }))
  }

  const enviarValidaciones = async () => {
    try {
      const turnoId = calcularTurno()
      const validacionesArray = Object.entries(validaciones).map(([itemId, data]) => ({
        item_id: Number.parseInt(itemId),
        area_id: areaId,
        rating: data.puntuacion,
        comment: "",
        photo: data.foto || null,
        turno_id: turnoId,
        relevamiento: turnoActual,
      }))

      const response = await fetch("http://localhost:3001/api/validations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validacionesArray),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error enviando validaciones")
      }

      // Trigger confetti animation after successful validation
      const confettiPromise = import("canvas-confetti").then((confettiModule) => {
        confettiModule.default({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        })
      })

      // Show SweetAlert2 modal
      await Promise.all([
        confettiPromise,
        Swal.fire({
          title: "¡Validaciones Enviadas!",
          html: `
            <div class="space-y-4">
              <p>Las validaciones del relevamiento ${turnoActual} han sido enviadas con éxito.</p>
              <p class="text-gray-600">Quedan en proceso de aprobación del jefe de juego.</p>
            </div>
          `,
          icon: "success",
          confirmButtonText: "Cerrar",
          confirmButtonColor: "#3085d6",
          customClass: {
            popup: "rounded-lg",
            confirmButton: "px-6 py-2",
          },
        }),
      ])

      if (turnoActual < 3) {
        setTurnoActual((prev) => prev + 1)
      } else {
        setCanProceed(false)
      }

      setValidaciones({})
    } catch (error) {
      console.error("Error al enviar validaciones:", error)
      await Swal.fire({
        title: "Error",
        text: error.message || "Hubo un error al enviar las validaciones",
        icon: "error",
        confirmButtonText: "Cerrar",
        confirmButtonColor: "#d33",
      })
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">{titulo}</h1>

      {mensajeEspera && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-6 py-4 rounded-lg flex items-center gap-3"
        >
          <Clock className="w-5 h-5" />
          <div className="flex flex-col">
            <span className="font-medium">{mensajeEspera}</span>
            {tiempoRestante && (
              <div className="h-1 w-full bg-yellow-200 rounded-full mt-2">
                <motion.div
                  className="h-1 bg-yellow-500 rounded-full"
                  initial={{ width: "100%" }}
                  animate={{ width: `${(tiempoRestante / 120) * 100}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
            )}
          </div>
        </motion.div>
      )}

      <ValidationSummary
        totalValidations={items.length * 3}
        completedValidations={Object.keys(validaciones).length}
        averageScore={
          Object.values(validaciones).reduce((sum, val) => sum + val.puntuacion, 0) /
            Object.keys(validaciones).length || 0
        }
      />

      <h2 className="text-2xl font-bold">
        {textos.turnoActual}: {turnoActual} de 3
      </h2>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.item_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className={`border shadow-sm overflow-hidden ${!canProceed ? "opacity-50" : ""}`}>
                <CardHeader className="bg-gradient-to-r from-gray-900 to-gray-600 p-6">
                  <CardTitle className="text-lg font-medium text-white">
                    {item.name || textos.nombreNoDisponible}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <p className="text-sm text-muted-foreground">
                    Instancia: {item.instancia?.replace("_", " ") || textos.sinEspecificar}
                  </p>
                  <div className="flex gap-2 justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 cursor-pointer ${
                          star <= (validaciones[item.item_id]?.puntuacion || 0) ? "text-yellow-400" : "text-gray-300"
                        }`}
                        strokeWidth={1.5}
                        fill="none"
                        onClick={() => canProceed && handleValidacion(item.item_id, star)}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Puntuación: {validaciones[item.item_id]?.puntuacion || 0}
                    </span>
                    <ImageUpload
                      onImageUpload={(foto) =>
                        canProceed && handleValidacion(item.item_id, validaciones[item.item_id]?.puntuacion || 0, foto)
                      }
                    >
                      <Button variant="outline" className="text-sm font-normal" disabled={!canProceed}>
                        Subir foto
                      </Button>
                    </ImageUpload>
                  </div>
                  {validaciones[item.item_id]?.foto && (
                    <motion.img
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      src={validaciones[item.item_id].foto || "/placeholder.svg"}
                      alt="Evidencia"
                      className="w-full h-32 object-cover rounded-md"
                    />
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex justify-center">
        <Button
          variant="default"
          className="px-8 py-2"
          disabled={!canProceed || Object.keys(validaciones).length !== items.length}
          onClick={enviarValidaciones}
        >
          {turnoActual < 3
            ? textos.enviarValidacionesTurno.replace("{turnoActual}", turnoActual)
            : textos.enviarValidacionesFinales}
        </Button>
      </div>
    </div>
  )
}

