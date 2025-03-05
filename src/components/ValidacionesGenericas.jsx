"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Star, AlertTriangle, Send, Clock } from "lucide-react"
import { ImageUpload } from "@/components/ImageUpload"
import { ValidationSummary } from "@/components/ValidationSummary"
import { calcularTurno } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import Swal from "sweetalert2"
import confetti from "canvas-confetti"

export default function ValidacionesGenericas({ areaId, titulo, textos }) {
  const [items, setItems] = useState([])
  const [validaciones, setValidaciones] = useState({})
  const [turnoActual, setTurnoActual] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [mensajeEspera, setMensajeEspera] = useState("")
  const [rejectedValidations, setRejectedValidations] = useState([])
  const [hasRejectedValidations, setHasRejectedValidations] = useState(false)
  const [tiempoRestante, setTiempoRestante] = useState(null)
  const [prevValidations, setPrevValidations] = useState([])
  const [canSubmitNewValidations, setCanSubmitNewValidations] = useState(true)

  const fetchItemsAndValidations = useCallback(async () => {
    try {
      const turnoId = calcularTurno()
      console.log("Turno Calculado:", turnoId)

      const itemsRes = await fetch(`http://localhost:3001/api/items/area/${areaId}`)
      const itemsData = await itemsRes.json()
      setItems(Array.isArray(itemsData) ? itemsData : [])

      const today = new Date().toISOString().split("T")[0]

      // Fetch all validations for the current day and turn
      const allValidationsRes = await fetch(
        `http://localhost:3001/api/validations?area_id=${areaId}&date=${today}&turno=${turnoId}`,
      )
      const allValidationsData = await allValidationsRes.json()
      const allValidations = Array.isArray(allValidationsData) ? allValidationsData : []

      const pendingValidations = allValidations.filter((v) => v.status === "pending")
      const rejectedValidations = allValidations.filter((v) => v.status === "rejected")

      setRejectedValidations(rejectedValidations)
      setHasRejectedValidations(rejectedValidations.length > 0)
      setPrevValidations(allValidations)

      if (allValidations.length > 0) {
        const lastValidation = allValidations.reduce(
          (latest, current) => (new Date(current.created_at) > new Date(latest.created_at) ? current : latest),
          allValidations[0],
        )

        const lastValidationTime = new Date(lastValidation.created_at)
        const currentTime = new Date()
        const diffInHours = (currentTime - lastValidationTime) / (1000 * 60 * 60)

        if (diffInHours < 2 && !hasRejectedValidations) {
          const remainingMinutes = Math.max(0, (2 - diffInHours) * 60)
          setTiempoRestante(remainingMinutes)
          const tiempo = formatearTiempoRestante(remainingMinutes)
          setMensajeEspera(`Tiempo restante para el próximo relevamiento: ${tiempo.texto}`)
          setCanSubmitNewValidations(false)
        } else {
          setTiempoRestante(null)
          setMensajeEspera("")
          setCanSubmitNewValidations(!hasRejectedValidations)
        }

        // Set turnoActual for the next relevamiento
        const maxRelevamiento = Math.max(...allValidations.map((v) => v.relevamiento))
        setTurnoActual(Math.min(maxRelevamiento + 1, 3))

        // Pre-fill validaciones state with existing validations
        const existingValidationsObj = {}
        allValidations.forEach((v) => {
          if (v && v.item_id) {
            existingValidationsObj[v.item_id] = {
              puntuacion: v.rating,
              foto: v.photo,
            }
          }
        })
        setValidaciones(existingValidationsObj)
      } else {
        setTurnoActual(1)
        setCanSubmitNewValidations(true)
      }
    } catch (error) {
      console.error("Error al cargar datos:", error)
      setItems([])
      setPrevValidations([])
      setRejectedValidations([])
      setMensajeEspera("Error al cargar los datos")
    } finally {
      setIsLoading(false)
    }
  }, [areaId, hasRejectedValidations])

  useEffect(() => {
    fetchItemsAndValidations()
  }, [fetchItemsAndValidations])

  const formatearTiempoRestante = useCallback((minutos) => {
    const horas = Math.floor(minutos / 60)
    const mins = Math.round(minutos % 60)
    return {
      horas,
      minutos: mins,
      texto: `${horas}h ${mins}m`,
    }
  }, [])

  const handleValidacion = (itemId, puntuacion, foto) => {
    setValidaciones((prev) => ({
      ...prev,
      [itemId]: {
        puntuacion,
        foto: foto || prev[itemId]?.foto,
      },
    }))
  }

  const enviarValidacionIndividual = async (validation) => {
    try {
      const turnoId = calcularTurno()
      const validacionData = {
        item_id: validation.item_id,
        area_id: areaId,
        rating: validaciones[validation.item_id]?.puntuacion || validation.rating,
        comment: "",
        photo: validaciones[validation.item_id]?.foto || validation.photo,
        turno_id: turnoId,
        relevamiento: validation.relevamiento,
        status: "pending", // Explicitly set status to pending
      }

      const response = await fetch(`http://localhost:3001/api/validations/${validation.validation_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validacionData),
      })

      if (!response.ok) {
        throw new Error("Error actualizando validación")
      }

      const updatedValidation = await response.json()

      // Update local state to reflect the change
      setRejectedValidations((prev) => prev.filter((v) => v.validation_id !== validation.validation_id))
      setPrevValidations((prev) =>
        prev.map((v) => (v.validation_id === validation.validation_id ? { ...v, status: "pending" } : v)),
      )

      // Check if there are any remaining rejected validations
      const remainingRejected = rejectedValidations.filter((v) => v.validation_id !== validation.validation_id)
      setHasRejectedValidations(remainingRejected.length > 0)

      await Swal.fire({
        title: "¡Validación Reenviada!",
        text: "La validación ha sido reenviada y está pendiente de aprobación.",
        icon: "success",
        confirmButtonText: "Cerrar",
      })

      // Only fetch if there are no more rejected validations
      if (remainingRejected.length === 0) {
        await fetchItemsAndValidations()
      }
    } catch (error) {
      console.error("Error al reenviar validación:", error)
      await Swal.fire({
        title: "Error",
        text: "Hubo un error al reenviar la validación",
        icon: "error",
        confirmButtonText: "Cerrar",
      })
    }
  }

  const enviarValidaciones = async () => {
    try {
      const turnoId = calcularTurno()
      const validacionesArray = items.map((item) => ({
        item_id: item.item_id,
        area_id: areaId,
        rating: validaciones[item.item_id]?.puntuacion || 0,
        comment: "",
        photo: validaciones[item.item_id]?.foto || "",
        turno_id: turnoId,
        relevamiento: turnoActual,
        status: "pending",
      }))

      const response = await fetch("http://localhost:3001/api/validations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validacionesArray),
      })

      if (!response.ok) {
        throw new Error("Error enviando validaciones")
      }

      await Swal.fire({
        title: "¡Validaciones Enviadas!",
        html: `
          <div class="space-y-4">
            <p>Las validaciones han sido enviadas con éxito.</p>
            <p class="text-gray-600">Quedan en proceso de aprobación del jefe de juego.</p>
          </div>
        `,
        icon: "success",
        confirmButtonText: "Cerrar",
        confirmButtonColor: "#3085d6",
      })

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      })

      fetchItemsAndValidations()
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

  if (isLoading) {
    return <div>Cargando...</div>
  }

  const renderValidationCards = () => {
    const cardsToRender = hasRejectedValidations ? rejectedValidations : items

    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {cardsToRender.map((item) => {
            const validation = hasRejectedValidations
              ? item
              : prevValidations.find((v) => v.item_id === item.item_id && v.relevamiento === turnoActual)
            const isRejected = validation?.status === "rejected"
            const isPending = validation?.status === "pending"
            const isApproved = validation?.status === "approved"
            const canEdit = hasRejectedValidations || (!isApproved && !isPending)

            return (
              <motion.div
                key={item.item_id || validation.validation_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className={`border shadow-sm overflow-hidden ${!canEdit ? "opacity-75 cursor-not-allowed" : ""}`}>
                  <CardHeader
                    className={`p-6 ${
                      isApproved
                        ? "bg-green-500"
                        : isRejected
                          ? "bg-red-500"
                          : isPending
                            ? "bg-yellow-500"
                            : "bg-gradient-to-r from-gray-900 to-gray-600"
                    }`}
                  >
                    <CardTitle className="text-lg font-medium text-white">
                      {hasRejectedValidations ? items.find((i) => i.item_id === item.item_id)?.name : item.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 p-6">
                    <p className="text-sm text-muted-foreground">
                      Instancia:{" "}
                      {hasRejectedValidations
                        ? items.find((i) => i.item_id === item.item_id)?.instancia?.replace("_", " ")
                        : item.instancia?.replace("_", " ") || textos.sinEspecificar}
                    </p>
                    <div className="flex gap-2 justify-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${!canEdit ? "cursor-not-allowed" : "cursor-pointer"} ${
                            star <= (validaciones[item.item_id]?.puntuacion || validation?.rating || 0)
                              ? "text-yellow-400"
                              : "text-gray-300"
                          }`}
                          strokeWidth={1.5}
                          fill="none"
                          onClick={() => canEdit && handleValidacion(item.item_id, star)}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Puntuación: {validaciones[item.item_id]?.puntuacion || validation?.rating || 0}
                      </span>
                      <ImageUpload
                        onImageUpload={(foto) =>
                          canEdit &&
                          handleValidacion(
                            item.item_id,
                            validaciones[item.item_id]?.puntuacion || validation?.rating || 0,
                            foto,
                          )
                        }
                      >
                        <Button variant="outline" className="text-sm font-normal" disabled={!canEdit}>
                          Subir foto
                        </Button>
                      </ImageUpload>
                    </div>
                    {(validaciones[item.item_id]?.foto || validation?.photo) && (
                      <motion.img
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        src={validaciones[item.item_id]?.foto || validation?.photo || "/placeholder.svg"}
                        alt="Evidencia"
                        className="w-full h-32 object-cover rounded-md"
                      />
                    )}
                  </CardContent>
                  {isRejected && (
                    <CardFooter className="bg-gray-50 p-4">
                      <Button
                        variant="default"
                        className="w-full"
                        onClick={() => enviarValidacionIndividual(validation)}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Volver a enviar
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">{titulo}</h1>

      {hasRejectedValidations && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
          <div className="flex">
            <div className="py-1">
              <AlertTriangle className="h-6 w-6 text-yellow-500 mr-4" />
            </div>
            <div>
              <p className="font-bold">Atención</p>
              <p>Tienes validaciones rechazadas que necesitan ser revisadas y reenviadas.</p>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {mensajeEspera && !hasRejectedValidations && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
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
      </AnimatePresence>

      <ValidationSummary
        totalValidations={items.length * 3}
        completedValidations={prevValidations.length}
        averageScore={prevValidations.reduce((sum, val) => sum + val.rating, 0) / prevValidations.length || 0}
      />

      <h2 className="text-2xl font-bold">
        {textos.turnoActual}: {turnoActual} de 3
      </h2>

      {renderValidationCards()}

      {canSubmitNewValidations && !hasRejectedValidations && (
        <div className="flex justify-center">
          <Button
            variant="default"
            className="px-8 py-2"
            onClick={enviarValidaciones}
            disabled={Object.keys(validaciones).length === 0}
          >
            {turnoActual < 3
              ? textos.enviarValidacionesTurno?.replace("{turnoActual}", turnoActual)
              : textos.enviarValidacionesFinales}
          </Button>
        </div>
      )}
    </div>
  )
}

