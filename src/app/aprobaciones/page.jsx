"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card"
import { 
  Star, 
  MessageCircle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Camera, 
  Filter, 
  BarChart2,
  ChevronDown,
  ChevronUp,
  Search,
  Calendar,
  CheckCheck,
  AlertTriangle,
  Image,
  RefreshCw
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input" 
import Swal from "sweetalert2"

export default function AprobacionesJefeJuego() {
  // Estados principales
  const [validaciones, setValidaciones] = useState([])
  const [validacionesAprobadas, setValidacionesAprobadas] = useState([])
  const [validacionesRechazadas, setValidacionesRechazadas] = useState([])
  const [filtroArea, setFiltroArea] = useState("todas")
  const [comentarioDialogOpen, setComentarioDialogOpen] = useState(false)
  const [comentarioActual, setComentarioActual] = useState("")
  const [comentarioValidacionId, setComentarioValidacionId] = useState(null)
  const [currentTurno, setCurrentTurno] = useState(null)
  const [imagenDialogOpen, setImagenDialogOpen] = useState(false)
  const [imagenActual, setImagenActual] = useState("")
  const [resumenValidaciones, setResumenValidaciones] = useState({})
  
  // Estados adicionales para mejorar UX
  const [isProcessing, setIsProcessing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedInstancia, setSelectedInstancia] = useState("todas")
  const [expandedAreas, setExpandedAreas] = useState({})
  const [showInfoMetrics, setShowInfoMetrics] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [comentarioRechazo, setComentarioRechazo] = useState("")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  
  // Función para renderizar las estrellas según el rating
  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star 
            key={i} 
            className={`w-4 h-4 ${i <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} 
          />
        ))}
      </div>
    )
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
  const fetchValidaciones = async (showSpinner = true) => {
    if (currentTurno === null) return
    
    if (showSpinner) {
      setIsRefreshing(true)
    }
    
    try {
      const today = selectedDate
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
      
      // Actualizar timestamp de última actualización
      setLastUpdated(new Date())
    } catch (err) {
      console.error("Error al obtener validaciones:", err)
      setValidaciones([])
      setValidacionesAprobadas([])
      setValidacionesRechazadas([])
      
      // Notificar error
      Swal.fire({
        title: "Error",
        text: "No se pudieron cargar las validaciones. Intente nuevamente.",
        icon: "error",
        confirmButtonText: "Entendido"
      })
    } finally {
      setIsRefreshing(false)
    }
  }
  
  // Efecto para recargar cuando cambian filtros
  useEffect(() => {
    fetchValidaciones()
  }, [filtroArea, currentTurno, selectedDate])

  // Actualizar resumen de validaciones
  const actualizarResumen = (validaciones) => {
    // Agrupar por área
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
    
    // Expandir automáticamente las áreas con validaciones pendientes
    const nuevasAreasExpandidas = {}
    Object.entries(resumen).forEach(([area, stats]) => {
      if (stats.pendientes > 0) {
        nuevasAreasExpandidas[area] = true
      }
    })
    setExpandedAreas(nuevasAreasExpandidas)
  }

  // Verificar si todas las validaciones de un área han sido aprobadas
  const checkAllApproved = (area) => {
    const areaValidaciones = validaciones.filter((v) => v.area === area)
    if (areaValidaciones.length === 0) return false

    Swal.fire({
      title: "¡Todas las validaciones aprobadas!",
      html: `
        <div class="text-center">
          <div class="mb-4">
            <svg class="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <p>Todas las validaciones del área <strong>${area}</strong> han sido aprobadas.</p>
          <p class="text-sm text-gray-500 mt-2">Puede visualizar los resultados en el Journey Map</p>
        </div>
      `,
      icon: "success",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ver Customer Journey Map",
      cancelButtonText: "Continuar aquí",
    }).then((result) => {
      if (result.isConfirmed) {
        // Navigate to the Journey Map page
        window.location.href = "/journey-map"
      }
    })
  }

  // Aprobar una validación
  const aprobarValidacion = async (validationId, area) => {
    try {
      setIsProcessing(true)
      await fetch(`http://localhost:3001/api/validations/${validationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "approved",
          approved_by: "jefe_juego", // Agregar quien aprueba
          approved_at: new Date().toISOString() // Agregar cuando
        }),
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
        
        // Mostrar toast de éxito
        Swal.fire({
          title: "¡Aprobada!",
          text: "La validación ha sido aprobada correctamente",
          icon: "success",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          background: "#10B981",
          iconColor: "#ffffff",
          customClass: {
            title: "text-white",
            popup: "colored-toast",
            content: "text-white" 
          }
        })
      }

      // Verificar si se aprobaron todas las validaciones del área
      if (validaciones.filter((v) => v.area === area).length === 1) {
        checkAllApproved(area)
      }
    } catch (error) {
      console.error("Error al aprobar validación:", error)
      Swal.fire({
        title: "Error",
        text: "No se pudo aprobar la validación",
        icon: "error",
        confirmButtonText: "Entendido"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Rechazar una validación
  const rechazarValidacion = async (validationId, comentario = "") => {
    try {
      setIsProcessing(true)
      
      // Pedir confirmación con opción de comentario si no hay uno
      if (!comentario) {
        const result = await Swal.fire({
          title: "Rechazar validación",
          input: "textarea",
          inputLabel: "¿Por qué estás rechazando esta validación?",
          inputPlaceholder: "Indique el motivo del rechazo...",
          inputAttributes: {
            "aria-label": "Motivo del rechazo"
          },
          showCancelButton: true,
          confirmButtonText: "Rechazar",
          cancelButtonText: "Cancelar",
          confirmButtonColor: "#EF4444",
          showClass: {
            popup: 'animate__animated animate__fadeInDown'
          },
          hideClass: {
            popup: 'animate__animated animate__fadeOutUp'
          }
        })
        
        if (result.isDismissed) {
          setIsProcessing(false)
          return
        }
        
        comentario = result.value || "Validación rechazada sin comentarios"
      }
      
      await fetch(`http://localhost:3001/api/validations/${validationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "rejected",
          rejected_by: "jefe_juego", // Agregar quien rechaza
          rejected_at: new Date().toISOString(), // Agregar cuando
          comment: comentario 
        }),
      })

      // Mover la validación de pendientes a rechazadas
      const validacionRechazada = validaciones.find((v) => v.validation_id === validationId)
      if (validacionRechazada) {
        setValidacionesRechazadas((prev) => [...prev, { 
          ...validacionRechazada, 
          status: "rejected",
          rejection_reason: comentario
        }])
        setValidaciones((prev) => prev.filter((v) => v.validation_id !== validationId))

        // Actualizar resumen
        const todasLasValidaciones = [
          ...validaciones.filter((v) => v.validation_id !== validationId),
          ...validacionesAprobadas,
          ...validacionesRechazadas,
          { ...validacionRechazada, status: "rejected", rejection_reason: comentario },
        ]
        actualizarResumen(todasLasValidaciones)
        
        // Mostrar toast de rechazo
        Swal.fire({
          title: "Rechazada",
          text: "La validación ha sido rechazada",
          icon: "info",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          background: "#EF4444",
          iconColor: "#ffffff",
          customClass: {
            title: "text-white",
            popup: "colored-toast",
            content: "text-white" 
          }
        })
      }
    } catch (error) {
      console.error("Error al rechazar validación:", error)
      Swal.fire({
        title: "Error",
        text: "No se pudo rechazar la validación",
        icon: "error",
        confirmButtonText: "Entendido"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Mostrar comentario de validación
  const mostrarComentario = (comentario, validacionId = null) => {
    setComentarioActual(comentario)
    setComentarioValidacionId(validacionId)
    setComentarioDialogOpen(true)
  }

  // Mostrar imagen de validación
  const mostrarImagen = (imagen) => {
    setImagenActual(imagen)
    setImagenDialogOpen(true)
  }

  // Formatear fecha
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }
    return new Date(dateString).toLocaleDateString("es-ES", options)
  }

  // Aprobar validaciones en lote
  const aprobarValidacionesEnLote = async (validaciones) => {
    try {
      // Mostrar confirmación
      const confirmResult = await Swal.fire({
        title: "¿Aprobar todas las validaciones seleccionadas?",
        text: `Vas a aprobar ${validaciones.length} validaciones. Esta acción no se puede deshacer.`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Sí, aprobar todas",
        cancelButtonText: "Cancelar"
      })
      
      if (!confirmResult.isConfirmed) return;
      
      setIsProcessing(true)
      
      // Aprobar cada validación
      const promises = validaciones.map(val => 
        fetch(`http://localhost:3001/api/validations/${val.validation_id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            status: "approved",
            approved_by: "jefe_juego",
            approved_at: new Date().toISOString()
          }),
        })
      );
      
      await Promise.all(promises);
      
      // Actualizar la UI
      const newApproved = [...validacionesAprobadas, ...validaciones.map(v => ({...v, status: "approved"}))];
      setValidacionesAprobadas(newApproved);
      setValidaciones(prev => prev.filter(v => !validaciones.some(approved => approved.validation_id === v.validation_id)));
      
      // Actualizar resumen
      const todasLasValidaciones = [
        ...validaciones.filter(v => !validaciones.some(approved => approved.validation_id === v.validation_id)),
        ...newApproved,
        ...validacionesRechazadas
      ];
      actualizarResumen(todasLasValidaciones);
      
      // Notificar éxito
      Swal.fire({
        title: "¡Aprobación masiva exitosa!",
        text: `Se han aprobado ${validaciones.length} validaciones correctamente`,
        icon: "success",
        confirmButtonText: "Entendido"
      });
      
    } catch (error) {
      console.error("Error en aprobación masiva:", error);
      Swal.fire({
        title: "Error",
        text: "No se pudieron aprobar todas las validaciones",
        icon: "error",
        confirmButtonText: "Entendido"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Renderizar validaciones por instancia
  const renderValidacionesPorInstancia = (relevamiento, instancia) => {
    // Combinar todas las validaciones para esta instancia y relevamiento

  const todasLasValidaciones = [...validaciones, ...validacionesAprobadas, ...validacionesRechazadas].filter(
    (v) => v.relevamiento === relevamiento && v.instancia === instancia
  )
    
    // Filtrar por término de búsqueda si existe
    const validacionesFiltradas = searchTerm 
      ? todasLasValidaciones.filter(v => 
          v.item?.toLowerCase().includes(searchTerm.toLowerCase()) || 
          v.area?.toLowerCase().includes(searchTerm.toLowerCase()))
      : todasLasValidaciones
    
    if (validacionesFiltradas.length === 0) return null
    
    // Agrupar por área
    const areaGroups = validacionesFiltradas.reduce((groups, validacion) => {
      if (!groups[validacion.area]) {
        groups[validacion.area] = []
      }
      groups[validacion.area].push(validacion)
      return groups
    }, {})
    
    // Renderizar por áreas
    return (
      <div className="space-y-6 mb-8 animate-fadeIn">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold capitalize px-3 py-2 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            {instancia.replace("_", " ")}
          </h3>
          
          {/* Botón para aprobar todo si hay pendientes */}
          {validacionesFiltradas.some(v => v.status === "pending") && (
            <Button 
              variant="outline" 
              size="sm" 
              className="text-green-600 border-green-200 hover:bg-green-50"
              onClick={() => aprobarValidacionesEnLote(validacionesFiltradas.filter(v => v.status === "pending"))}
              disabled={isProcessing}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Aprobar todas
            </Button>
          )}
        </div>
        
        {Object.entries(areaGroups).map(([area, validacionesArea]) => {
          const isExpanded = expandedAreas[area] || false
          const pendingCount = validacionesArea.filter(v => v.status === "pending").length
          
          return (
            <div key={area} className="border rounded-lg shadow-sm overflow-hidden mb-6">
              {/* Cabecera de área */}
              <div 
                className={`p-3 flex justify-between items-center cursor-pointer transition-colors ${
                  pendingCount > 0 
                    ? "bg-yellow-50 border-b border-yellow-200" 
                    : "bg-gray-50 border-b border-gray-200"
                }`}
                onClick={() => setExpandedAreas({...expandedAreas, [area]: !isExpanded})}
              >
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-800">{area}</h4>
                  {pendingCount > 0 && (
                    <Badge variant="warning" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                      {pendingCount} pendientes
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-white">
                    {validacionesArea.length} validaciones
                  </Badge>
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>
              
              {/* Contenido de área (expandible) */}
              {isExpanded && (
                <div className="grid gap-4 p-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  <AnimatePresence>
                    {validacionesArea.map((validacion) => (
                      <motion.div
                        key={validacion.validation_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card
                          className={`overflow-hidden border transition-all duration-300 hover:shadow-md ${
                            validacion.status === "approved"
                              ? "border-green-200 shadow-sm shadow-green-50"
                              : validacion.status === "rejected"
                                ? "border-red-200 shadow-sm shadow-red-50"
                                : "border-yellow-200 shadow-sm shadow-yellow-50"
                          }`}
                        >
                          <CardHeader className={`p-4 ${
                            validacion.status === "approved"
                              ? "bg-gradient-to-r from-green-500 to-emerald-600"
                              : validacion.status === "rejected"
                                ? "bg-gradient-to-r from-red-500 to-rose-600"
                                : "bg-gradient-to-r from-amber-500 to-yellow-600"
                          } text-white`}>
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-base font-medium truncate flex-1">{validacion.item}</CardTitle>
                              <Badge variant="secondary" className="ml-2 bg-white/20 text-white">
                                {validacion.rating}/5
                              </Badge>
                            </div>
                            <CardDescription className="text-white/80 mt-1 text-xs">
                              ID: {validacion.validation_id.toString().substring(0, 8)}...
                            </CardDescription>
                          </CardHeader>
                          
                          <CardContent className="p-4 space-y-4">
                            <div className="flex flex-col gap-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-500">Calificación:</span>
                                <div className="flex">{renderStars(validacion.rating)}</div>
                              </div>
                              
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-500">Fecha:</span>
                                <span className="text-sm text-gray-700">{formatDate(validacion.created_at)}</span>
                              </div>
                              
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-500">Estado:</span>
                                <Badge variant={
                                  validacion.status === "approved" 
                                    ? "success" 
                                    : validacion.status === "rejected" 
                                      ? "destructive" 
                                      : "outline"
                                } className={
                                  validacion.status === "approved"
                                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                                    : validacion.status === "rejected"
                                      ? "bg-red-100 text-red-800 hover:bg-red-200"
                                      : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                }>
                                  {validacion.status === "approved" 
                                    ? "Aprobada" 
                                    : validacion.status === "rejected" 
                                      ? "Rechazada" 
                                      : "Pendiente"}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="flex flex-col gap-2">
                              {validacion.comment && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                                  onClick={() => mostrarComentario(validacion.comment, validacion.validation_id)}
                                >
                                  <MessageCircle className="w-4 h-4 mr-2" /> Ver Comentario
                                </Button>
                              )}
                              
                              {validacion.rejection_reason && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                  onClick={() => mostrarComentario(validacion.rejection_reason, validacion.validation_id)}
                                >
                                  <AlertTriangle className="w-4 h-4 mr-2" /> Motivo de Rechazo
                                </Button>
                              )}
                              
                              {validacion.photo && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                                    onClick={() => mostrarImagen(validacion.photo)}
                                  >
                                    <Camera className="w-4 h-4 mr-2" /> Ver Foto
                                  </Button>
                                  
                                  <div 
                                    className="mt-2 relative w-full h-24 bg-gray-100 rounded cursor-pointer overflow-hidden border border-gray-200"
                                    onClick={() => mostrarImagen(validacion.photo)}
                                  >
                                    <img 
                                      src={validacion.photo} 
                                      alt="Foto de validación" 
                                      className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                                      <span className="text-white text-xs font-medium">Ampliar</span>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </CardContent>
                          
                          {validacion.status === "pending" && (
                            <CardFooter className="bg-gray-50 p-3 border-t border-gray-100 flex justify-between gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                onClick={() => aprobarValidacion(validacion.validation_id, validacion.area)}
                                disabled={isProcessing}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" /> 
                                {isProcessing ? "Procesando..." : "Aprobar"}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                onClick={() => rechazarValidacion(validacion.validation_id)}
                                disabled={isProcessing}
                              >
                                <XCircle className="w-4 h-4 mr-2" /> 
                                {isProcessing ? "Procesando..." : "Rechazar"}
                              </Button>
                            </CardFooter>
                          )}
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // Renderizar resumen visual
  const renderResumenVisual = () => {
    if (!showInfoMetrics) return null;
    
    // Calcular estadísticas generales
    const totalValidaciones = Object.values(resumenValidaciones).reduce(
      (sum, stats) => sum + stats.total, 0
    );
    const totalAprobadas = Object.values(resumenValidaciones).reduce(
      (sum, stats) => sum + stats.aprobadas, 0
    );
    const totalRechazadas = Object.values(resumenValidaciones).reduce(
      (sum, stats) => sum + stats.rechazadas, 0
    );
    const totalPendientes = Object.values(resumenValidaciones).reduce(
      (sum, stats) => sum + stats.pendientes, 0
    );
    
    // Calcular porcentajes
    const pctAprobadas = totalValidaciones > 0 ? Math.round((totalAprobadas / totalValidaciones) * 100) : 0;
    const pctRechazadas = totalValidaciones > 0 ? Math.round((totalRechazadas / totalValidaciones) * 100) : 0;
    const pctPendientes = totalValidaciones > 0 ? Math.round((totalPendientes / totalValidaciones) * 100) : 0;
    
    // Crear datos para gráfico circular
    const stats = [
      { label: "Aprobadas", value: totalAprobadas, percentage: pctAprobadas, color: "bg-green-500" },
      { label: "Rechazadas", value: totalRechazadas, percentage: pctRechazadas, color: "bg-red-500" },
      { label: "Pendientes", value: totalPendientes, percentage: pctPendientes, color: "bg-yellow-500" },
    ];
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Métricas Principales */}
        <Card className="lg:col-span-8 shadow-sm">
          <CardHeader className="pb-2 border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-medium">Resumen de Validaciones</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => fetchValidaciones()}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="sr-only">Actualizar</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total de Validaciones */}
              <div className="flex flex-col">
                <div className="text-sm font-medium text-gray-500 mb-1">Total</div>
                <div className="text-3xl font-bold">{totalValidaciones}</div>
                <div className="text-xs text-gray-500 mt-1">Validaciones registradas</div>
                <Progress 
                  value={100} 
                  className="h-1.5 mt-2" 

                />
              </div>
              
              {/* Validaciones Pendientes */}
              <div className="flex flex-col">
                <div className="text-sm font-medium text-amber-600 mb-1">Pendientes</div>
                <div className="text-3xl font-bold text-amber-600">{totalPendientes}</div>
                <div className="text-xs text-gray-500 mt-1">Esperando aprobación</div>
                <Progress 
                  value={pctPendientes} 
                  className="h-1.5 mt-2" 
                />
              </div>
              
              {/* Validaciones Aprobadas */}
              <div className="flex flex-col">
                <div className="text-sm font-medium text-green-600 mb-1">Aprobadas</div>
                <div className="text-3xl font-bold text-green-600">{totalAprobadas}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {pctAprobadas}% del total
                </div>
                <Progress 
                  value={pctAprobadas} 
                  className="h-1.5 mt-2" 
                />
              </div>
            </div>
            
            {/* Gráfico de barras por área */}
            <div className="mt-6 space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Distribución por Área</h3>
              
              {Object.entries(resumenValidaciones).map(([area, stats]) => {
                if (stats.total === 0) return null;
                
                const pctAreaAprobadas = Math.round((stats.aprobadas / stats.total) * 100);
                const pctAreaRechazadas = Math.round((stats.rechazadas / stats.total) * 100);
                const pctAreaPendientes = Math.round((stats.pendientes / stats.total) * 100);
                
                return (
                  <div key={area} className="space-y-1">
                    <div className="flex justify-between text-sm mb-1">
                      <div className="font-medium">{area}</div>
                      <div className="text-gray-500">{stats.total} validaciones</div>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden flex">
                      {stats.aprobadas > 0 && (
                        <div 
                          className="h-full bg-green-500" 
                          style={{ width: `${pctAreaAprobadas}%` }}
                          title={`${stats.aprobadas} aprobadas (${pctAreaAprobadas}%)`}
                        />
                      )}
                      {stats.pendientes > 0 && (
                        <div 
                          className="h-full bg-yellow-500" 
                          style={{ width: `${pctAreaPendientes}%` }}
                          title={`${stats.pendientes} pendientes (${pctAreaPendientes}%)`}
                        />
                      )}
                      {stats.rechazadas > 0 && (
                        <div 
                          className="h-full bg-red-500" 
                          style={{ width: `${pctAreaRechazadas}%` }}
                          title={`${stats.rechazadas} rechazadas (${pctAreaRechazadas}%)`}
                        />
                      )}
                    </div>
                    <div className="flex text-xs text-gray-500 gap-4">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                        {stats.aprobadas} aprobadas
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></div>
                        {stats.pendientes} pendientes
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-red-500 mr-1"></div>
                        {stats.rechazadas} rechazadas
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
        
        {/* Acciones Rápidas */}
        <Card className="lg:col-span-4 shadow-sm">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-lg font-medium">Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Filtro de Fecha */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha</label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full"
                />
              </div>
              
              {/* Filtro de Área */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Filtrar por Área</label>
                <Select onValueChange={setFiltroArea} value={filtroArea}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todas las áreas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas las áreas</SelectItem>
                    <SelectItem value="1">Limpieza</SelectItem>
                    <SelectItem value="2">Atención al Cliente</SelectItem>
                    <SelectItem value="3">Juego</SelectItem>
                    <SelectItem value="4">Operaciones</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Filtro de Instancia */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Filtrar por Instancia</label>
                <Select onValueChange={setSelectedInstancia} value={selectedInstancia}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todas las instancias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas las instancias</SelectItem>
                    <SelectItem value="ingreso">Ingreso</SelectItem>
                    <SelectItem value="experiencia_en_maquina">Experiencia en Máquina</SelectItem>
                    <SelectItem value="pausa">Pausa</SelectItem>
                    <SelectItem value="salida">Salida</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Búsqueda */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Buscar Validación</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Buscar por nombre o área..."
                    className="pl-9 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Estadísticas de Turno */}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <span className="font-medium text-blue-700">Turno Actual</span>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                    {currentTurno === 1 ? "Mañana" : currentTurno === 2 ? "Tarde" : "Noche"}
                  </Badge>
                </div>
                
                {lastUpdated && (
                  <div className="text-xs text-blue-600 mt-2">
                    Última actualización: {lastUpdated.toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Aprobaciones del Jefe de Juego</h1>
          <p className="text-gray-500 mt-1">
            Gestiona las validaciones enviadas por los coordinadores de área
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className={`${showInfoMetrics ? 'bg-blue-50 text-blue-700' : ''}`}
            onClick={() => setShowInfoMetrics(!showInfoMetrics)}
          >
            <BarChart2 className="w-4 h-4 mr-2" />
            {showInfoMetrics ? 'Ocultar Métricas' : 'Mostrar Métricas'}
          </Button>
          
          <Button 
            onClick={() => fetchValidaciones()} 
            variant="outline" 
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Dashboard de métricas */}
      {renderResumenVisual()}

      {/* Navegación por relevamientos */}
      <Tabs defaultValue="relevamiento1" className="space-y-8">
        <TabsList className="w-full grid grid-cols-3 gap-2 p-1 bg-muted rounded-xl">
          <TabsTrigger value="relevamiento1" className="rounded-lg data-[state=active]:bg-white">
            <div className="flex flex-col items-center py-1">
              <span className="text-lg font-medium">Relevamiento 1</span>
              <span className="text-xs text-muted-foreground">Inicio de turno</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="relevamiento2" className="rounded-lg data-[state=active]:bg-white">
            <div className="flex flex-col items-center py-1">
              <span className="text-lg font-medium">Relevamiento 2</span>
              <span className="text-xs text-muted-foreground">Mitad de turno</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="relevamiento3" className="rounded-lg data-[state=active]:bg-white">
            <div className="flex flex-col items-center py-1">
              <span className="text-lg font-medium">Relevamiento 3</span>
              <span className="text-xs text-muted-foreground">Fin de turno</span>
            </div>
          </TabsTrigger>
        </TabsList>

        {[1, 2, 3].map((relevamiento) => (
          <TabsContent key={relevamiento} value={`relevamiento${relevamiento}`} className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold text-gray-800">
                Relevamiento {relevamiento}
              </h2>
              

              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-sm font-medium mr-1">Ver instancias:</span>
                {["todas", "ingreso", "experiencia_en_maquina", "pausa", "salida"].map((instancia) => (
                  <button
                    key={instancia}
                    className={`px-3 py-1.5 text-xs md:text-sm font-medium rounded-full transition-colors ${
                      selectedInstancia === instancia
                        ? "bg-primary text-white shadow-sm"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    onClick={() => setSelectedInstancia(instancia)}
                  >
                    {instancia === "todas" 
                      ? "Todas" 
                      : instancia === "experiencia_en_maquina" 
                        ? "Experiencia" 
                        : instancia.charAt(0).toUpperCase() + instancia.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            

            {selectedInstancia === "todas" 
              ? (
                <>
                  {renderValidacionesPorInstancia(relevamiento, "ingreso")}
                  {renderValidacionesPorInstancia(relevamiento, "experiencia_en_maquina")}
                  {renderValidacionesPorInstancia(relevamiento, "pausa")}
                  {renderValidacionesPorInstancia(relevamiento, "salida")}
                </>
              )
              : renderValidacionesPorInstancia(relevamiento, selectedInstancia)}
          </TabsContent>
        ))}
      </Tabs>

      {/* Diálogo para ver comentarios */}
      <Dialog open={comentarioDialogOpen} onOpenChange={setComentarioDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {comentarioValidacionId ? (
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  Comentario de la Validación
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  Comentario del Responsable de Área
                </div>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 bg-gray-50 rounded-md border border-gray-200 mt-2">
            <p className="whitespace-pre-wrap">{comentarioActual || "Sin comentarios"}</p>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={() => setComentarioDialogOpen(false)}>Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo para ver imágenes */}
      <Dialog open={imagenDialogOpen} onOpenChange={setImagenDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Image className="h-5 w-5 text-primary" />
              Vista previa de la imagen
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2 relative overflow-hidden rounded-lg">
            <img 
              src={imagenActual || "/placeholder.svg"} 
              alt="Validación" 
              className="w-full h-auto rounded-lg object-contain max-h-[70vh]" 
            />
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={() => setImagenDialogOpen(false)}>Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}