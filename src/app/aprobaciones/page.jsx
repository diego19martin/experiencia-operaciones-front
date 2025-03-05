"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Star, MessageCircle, Clock, CheckCircle, XCircle, Camera } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import Swal from "sweetalert2"

export default function AprobacionesJefeJuego() {
  const [validaciones, setValidaciones] = useState([])
  const [validacionesAprobadas, setValidacionesAprobadas] = useState([])
  const [validacionesRechazadas, setValidacionesRechazadas] = useState([])
  const [filtroArea, setFiltroArea] = useState("todas")
  const [comentarioDialogOpen, setComentarioDialogOpen] = useState(false)
  const [comentarioActual, setComentarioActual] = useState("")
  const [currentTurno, setCurrentTurno] = useState(null)
  const [imagenDialogOpen, setImagenDialogOpen] = useState(false)
  const [imagenActual, setImagenActual] = useState("")
  const [resumenValidaciones, setResumenValidaciones] = useState({})

  // Función para renderizar las estrellas según el rating
  const renderStars = (rating) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(<Star key={i} className={`w-4 h-4 ${i <= rating ? "text-yellow-500" : "text-gray-300"}`} />)
    }
    return stars
  }

  // Calcular el turno actual
  useEffect(() => {
    const calcularTurno = () => {
      const now = new Date()
      const currentHour = now.getHours()

      if (currentHour >= 6 && currentHour < 14) {
        return 1 // Mañana
      } else if (currentHour >= 14 && currentHour < 22) {
        return 2 // Tarde
      } else {
        return 3 // Noche
      }
    }

    const updateTurno = () => {
      setCurrentTurno(calcularTurno())
    }

    updateTurno()
    const interval = setInterval(updateTurno, 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  // Fetch de validaciones
  useEffect(() => {
    if (currentTurno === null) return

    const fetchValidaciones = async () => {
      try {
        const today = new Date().toISOString().split("T")[0]
        const areaParam = filtroArea !== "todas" ? `&area_id=${filtroArea}` : ""

        // Fetch validaciones pendientes
        const resPending = await fetch(
          `http://localhost:3001/api/validations?status=pending&turno=${currentTurno}&date=${today}${areaParam}`,
        )
        if (!resPending.ok) throw new Error(`Error en la solicitud: ${resPending.status}`)
        const pendingData = await resPending.json()
        setValidaciones(Array.isArray(pendingData) ? pendingData : [])

        // Fetch validaciones aprobadas
        const resApproved = await fetch(
          `http://localhost:3001/api/validations?status=approved&turno=${currentTurno}&date=${today}${areaParam}`,
        )
        const approvedData = resApproved.ok ? await resApproved.json() : []
        setValidacionesAprobadas(Array.isArray(approvedData) ? approvedData : [])

        // Fetch validaciones rechazadas
        const resRejected = await fetch(
          `http://localhost:3001/api/validations?status=rejected&turno=${currentTurno}&date=${today}${areaParam}`,
        )
        const rejectedData = resRejected.ok ? await resRejected.json() : []
        setValidacionesRechazadas(Array.isArray(rejectedData) ? rejectedData : [])

        // Actualizar resumen con todas las validaciones
        const todasLasValidaciones = [...pendingData, ...approvedData, ...rejectedData]
        actualizarResumen(todasLasValidaciones)
      } catch (err) {
        console.error("Error al obtener validaciones:", err)
        setValidaciones([])
        setValidacionesAprobadas([])
        setValidacionesRechazadas([])
      }
    }

    fetchValidaciones()
  }, [filtroArea, currentTurno])

  const actualizarResumen = (validaciones) => {
    const resumen = validaciones.reduce((acc, val) => {
      if (!acc[val.area]) {
        acc[val.area] = { total: 0, aprobadas: 0, rechazadas: 0, pendientes: 0 }
      }
      acc[val.area].total++
      if (val.status === "approved") acc[val.area].aprobadas++
      else if (val.status === "rejected") acc[val.area].rechazadas++
      else acc[val.area].pendientes++
      return acc
    }, {})
    setResumenValidaciones(resumen)
  }

  const checkAllApproved = (area) => {
    const areaValidaciones = validaciones.filter((v) => v.area === area)
    if (areaValidaciones.length === 0) return false

    Swal.fire({
      title: "¡Todas las validaciones aprobadas!",
      html: `<p>Todas las validaciones del área <strong>${area}</strong> han sido aprobadas.</p>`,
      icon: "success",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ver Customer Journey Map",
      cancelButtonText: "Cerrar",
    }).then((result) => {
      if (result.isConfirmed) {
        // Navigate to the Journey Map page
        window.location.href = "/journey-map"
      }
    })
  }

  const aprobarValidacion = async (validationId, area) => {
    try {
      await fetch(`http://localhost:3001/api/validations/${validationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      })

      // Mover la validación de pendientes a aprobadas
      const validacionAprobada = validaciones.find((v) => v.validation_id === validationId)
      if (validacionAprobada) {
        setValidacionesAprobadas((prev) => [...prev, { ...validacionAprobada, status: "approved" }])
        setValidaciones((prev) => prev.filter((v) => v.validation_id !== validationId))

        // Actualizar resumen
        const todasLasValidaciones = [
          ...validaciones.filter((v) => v.validation_id !== validationId),
          ...validacionesAprobadas,
          { ...validacionAprobada, status: "approved" },
          ...validacionesRechazadas,
        ]
        actualizarResumen(todasLasValidaciones)
      }

      if (validaciones.filter((v) => v.area === area).length === 1) {
        checkAllApproved(area)
      }
    } catch (error) {
      console.error("Error al aprobar validación:", error)
    }
  }

  const rechazarValidacion = async (validationId) => {
    try {
      await fetch(`http://localhost:3001/api/validations/${validationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      })

      // Mover la validación de pendientes a rechazadas
      const validacionRechazada = validaciones.find((v) => v.validation_id === validationId)
      if (validacionRechazada) {
        setValidacionesRechazadas((prev) => [...prev, { ...validacionRechazada, status: "rejected" }])
        setValidaciones((prev) => prev.filter((v) => v.validation_id !== validationId))

        // Actualizar resumen
        const todasLasValidaciones = [
          ...validaciones.filter((v) => v.validation_id !== validationId),
          ...validacionesAprobadas,
          ...validacionesRechazadas,
          { ...validacionRechazada, status: "rejected" },
        ]
        actualizarResumen(todasLasValidaciones)
      }
    } catch (error) {
      console.error("Error al rechazar validación:", error)
    }
  }

  const mostrarComentario = (comentario) => {
    setComentarioActual(comentario)
    setComentarioDialogOpen(true)
  }

  const mostrarImagen = (imagen) => {
    setImagenActual(imagen)
    setImagenDialogOpen(true)
  }

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }
    return new Date(dateString).toLocaleDateString("es-ES", options)
  }

  const renderValidacionesPorInstancia = (relevamiento, instancia) => {
    // Combinar todas las validaciones para esta instancia y relevamiento
    const todasLasValidaciones = [...validaciones, ...validacionesAprobadas, ...validacionesRechazadas].filter(
      (v) => v.relevamiento === relevamiento && v.instancia === instancia,
    )

    return (
      <div className="space-y-4 mb-8">
        <h3 className="text-xl font-semibold capitalize bg-gradient-to-r from-gray-100 to-gray-200 p-3 rounded-lg shadow-sm">
          {instancia.replace("_", " ")}
        </h3>
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {todasLasValidaciones.map((validacion) => (
              <motion.div
                key={validacion.validation_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card
                  className={`overflow-hidden transition-all duration-300 hover:shadow-lg ${
                    validacion.status === "approved"
                      ? "bg-green-50"
                      : validacion.status === "rejected"
                        ? "bg-red-50"
                        : ""
                  }`}
                >
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4">
                    <CardTitle className="flex justify-between items-center">
                      <span className="text-lg font-semibold truncate">{validacion.item}</span>
                      <Badge variant="secondary" className="ml-2">
                        {validacion.rating}/5
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Área: {validacion.area}</span>
                      <div className="flex">{renderStars(validacion.rating)}</div>
                    </div>
                    <p className="text-sm text-gray-500 flex items-center">
                      <Clock className="w-4 h-4 mr-1" /> {formatDate(validacion.created_at)}
                    </p>
                    {validacion.comment && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-blue-600 hover:text-blue-700"
                        onClick={() => mostrarComentario(validacion.comment)}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" /> Ver Comentario
                      </Button>
                    )}
                    {validacion.photo && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-green-600 hover:text-green-700"
                        onClick={() => mostrarImagen(validacion.photo)}
                      >
                        <Camera className="w-4 h-4 mr-2" /> Ver Foto
                      </Button>
                    )}
                  </CardContent>
                  <CardFooter className="bg-gray-50 p-4 flex justify-between">
                    {validacion.status === "pending" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 mr-2 text-green-600 hover:bg-green-50"
                          onClick={() => aprobarValidacion(validacion.validation_id, validacion.area)}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" /> Aprobar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 ml-2 text-red-600 hover:bg-red-50"
                          onClick={() => rechazarValidacion(validacion.validation_id)}
                        >
                          <XCircle className="w-4 h-4 mr-2" /> Rechazar
                        </Button>
                      </>
                    )}
                    {validacion.status === "approved" && (
                      <Badge variant="success" className="w-full justify-center">
                        Aprobada
                      </Badge>
                    )}
                    {validacion.status === "rejected" && (
                      <Badge variant="destructive" className="w-full justify-center">
                        Rechazada
                      </Badge>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Aprobaciones del Jefe de Juego</h1>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-2 sm:space-y-0">
        <Select onValueChange={setFiltroArea} value={filtroArea}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filtrar por área" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las áreas</SelectItem>
            <SelectItem value="1">Limpieza</SelectItem>
            <SelectItem value="2">Atención al Cliente</SelectItem>
            <SelectItem value="3">Juego</SelectItem>
            <SelectItem value="4">Operaciones</SelectItem>
          </SelectContent>
        </Select>

        <div className="text-lg font-semibold bg-blue-100 text-blue-800 px-4 py-2 rounded-full">
          Turno Actual: {currentTurno === 1 ? "Mañana" : currentTurno === 2 ? "Tarde" : "Noche"}
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Resumen de Validaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(resumenValidaciones).map(([area, stats]) => (
              <Card key={area}>
                <CardHeader>
                  <CardTitle className="text-lg">{area}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Total: {stats.total}</p>
                  <p className="text-green-600">Aprobadas: {stats.aprobadas}</p>
                  <p className="text-red-600">Rechazadas: {stats.rechazadas}</p>
                  <p className="text-yellow-600">Pendientes: {stats.pendientes}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="relevamiento1" className="space-y-4">
        <TabsList className="w-full sm:w-auto grid grid-cols-3 gap-4">
          <TabsTrigger value="relevamiento1" className="w-full">
            Relevamiento 1
          </TabsTrigger>
          <TabsTrigger value="relevamiento2" className="w-full">
            Relevamiento 2
          </TabsTrigger>
          <TabsTrigger value="relevamiento3" className="w-full">
            Relevamiento 3
          </TabsTrigger>
        </TabsList>

        {[1, 2, 3].map((relevamiento) => (
          <TabsContent key={relevamiento} value={`relevamiento${relevamiento}`}>
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">Relevamiento {relevamiento}</h2>
            {renderValidacionesPorInstancia(relevamiento, "ingreso")}
            {renderValidacionesPorInstancia(relevamiento, "experiencia_en_maquina")}
            {renderValidacionesPorInstancia(relevamiento, "pausa")}
            {renderValidacionesPorInstancia(relevamiento, "salida")}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={comentarioDialogOpen} onOpenChange={setComentarioDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Comentario del Responsable de Área</DialogTitle>
          </DialogHeader>
          <DialogDescription>{comentarioActual}</DialogDescription>
          <Button onClick={() => setComentarioDialogOpen(false)}>Cerrar</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={imagenDialogOpen} onOpenChange={setImagenDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Imagen de la Validación</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <img src={imagenActual || "/placeholder.svg"} alt="Validación" className="w-full h-auto rounded-lg" />
          </div>
          <Button onClick={() => setImagenDialogOpen(false)}>Cerrar</Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}

