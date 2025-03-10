"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { 
  Star, 
  AlertTriangle, 
  Send, 
  Clock, 
  Camera, 
  CheckCircle, 
  X, 
  Lock,
  Calendar,
  MessageCircle  // Añade este import
} from "lucide-react"
import { ImageUpload } from "@/components/ImageUpload"
import { ValidationSummary } from "@/components/ValidationSummary"
import { calcularTurno } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import Swal from 'sweetalert2';



export default function ValidacionesGenericas({ areaId, titulo, textos }) {
  // Estados base
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
  
  // Estados adicionales para mejoras de UI
  const [instanciaSeleccionada, setInstanciaSeleccionada] = useState("todas")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tiempoRestanteSegundos, setTiempoRestanteSegundos] = useState(null)
  const [showImagePreview, setShowImagePreview] = useState(null)
  const [relevamientoSeleccionado, setRelevamientoSeleccionado] = useState(1)
  const [isImageUploading, setIsImageUploading] = useState({})
  
  // Referencia para el timer
  const timerRef = useRef(null)

  // Añadir después de tus declaraciones de estados:
  const fileInputRefs = useRef({});
  
  // Determinar si la interfaz debe estar bloqueada
  const isBlocked = !canSubmitNewValidations && !hasRejectedValidations;

  const formatearTiempoRestante = useCallback((minutos) => {
    const horas = Math.floor(minutos / 60)
    const mins = Math.round(minutos % 60)
    return {
      horas,
      minutos: mins,
      texto: `${horas}h ${mins}m`,
    }
  }, [])
  
  // Modifica la función fetchItemsAndValidations para mejorar la detección de validaciones recientes

  const fetchItemsAndValidations = useCallback(async () => {
    try {
      const turnoId = calcularTurno()
      console.log("Turno Calculado:", turnoId)

      const itemsRes = await fetch(`http://localhost:3001/api/items/area/${areaId}`)
      const itemsData = await itemsRes.json()
      setItems(Array.isArray(itemsData) ? itemsData : [])

      const today = new Date().toISOString().split("T")[0]

      console.log("Fecha actual:", today);
      

      // Fetch all validations for the current day and turn
      const allValidationsRes = await fetch(
        `http://localhost:3001/api/validations?area_id=${areaId}&date=${today}&turno=${turnoId}`,
      )
      const allValidationsData = await allValidationsRes.json()
      const allValidations = Array.isArray(allValidationsData) ? allValidationsData : []

      // Log para depuración
      console.log("Validaciones obtenidas:", allValidations);

      const pendingValidations = allValidations.filter((v) => v.status === "pending")
      const rejectedValidations = allValidations.filter((v) => v.status === "rejected")

      setRejectedValidations(rejectedValidations)
      setHasRejectedValidations(rejectedValidations.length > 0)
      setPrevValidations(allValidations)

      // Determinar el relevamiento actual basado en las validaciones existentes
      let nextRelevamiento = 1; // Por defecto, comenzar con el primer relevamiento

      if (allValidations.length > 0) {
        // Obtener todos los relevamientos completados (sea pendiente, aprobado o rechazado)
        const completedRelevamientos = [...new Set(allValidations.map(v => v.relevamiento))];
        
        // Si tiene relevamientos completados, el siguiente es el máximo + 1 (limitado a 3)
        if (completedRelevamientos.length > 0) {
          const maxCompletedRelevamiento = Math.max(...completedRelevamientos);
          nextRelevamiento = Math.min(maxCompletedRelevamiento + 1, 3);
        }

        console.log("Relevamientos completados:", completedRelevamientos);
        console.log("Siguiente relevamiento:", nextRelevamiento);

        // CAMBIO: Filtramos validaciones del turno actual para obtener la más reciente
        const currentTurnValidations = allValidations.filter(v => v.turno_id === turnoId);
        
        if (currentTurnValidations.length > 0) {
          // Ordenar por fecha de creación (más reciente primero)
          currentTurnValidations.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          
          const lastValidation = currentTurnValidations[0];
          console.log("Última validación:", lastValidation);
          
          // Forzar la fecha al formato correcto para la comparación
          const lastValidationTime = new Date(lastValidation.created_at);
          const currentTime = new Date();
          
          // Log para depuración
          console.log("Hora actual:", currentTime);
          console.log("Hora última validación:", lastValidationTime);
          
          // Calcular diferencia en horas
          const diffInHours = (currentTime.getTime() - lastValidationTime.getTime()) / (1000 * 60 * 60);
          console.log("Diferencia en horas:", diffInHours);

          // Forzar un pequeño tiempo de espera para pruebas (10 segundos)
          // Cambia a 2 para las 2 horas reales
          const horasDeEspera = 2;
          
          if (diffInHours < horasDeEspera && !hasRejectedValidations) {
            const remainingMinutes = Math.max(0, (horasDeEspera - diffInHours) * 60);
            setTiempoRestante(remainingMinutes);
            
            // Convertir a segundos para la cuenta regresiva
            const remainingSeconds = Math.floor(remainingMinutes * 60);
            setTiempoRestanteSegundos(remainingSeconds);
            
            const tiempo = formatearTiempoRestante(remainingMinutes);
            setMensajeEspera(`Tiempo restante para el próximo relevamiento: ${tiempo.texto}`);
            setCanSubmitNewValidations(false);
            
            console.log("Bloqueando validaciones. Tiempo restante:", tiempo.texto);
          } else {
            setTiempoRestante(null);
            setTiempoRestanteSegundos(null);
            setMensajeEspera("");
            setCanSubmitNewValidations(!hasRejectedValidations);
            
            console.log("Permitiendo validaciones.");
          }
        }

        // Establecer el turnoActual al siguiente relevamiento que debe realizarse
        setTurnoActual(nextRelevamiento);

        // Solo cargar validaciones del relevamiento actual (no mezclar con anteriores)
        const existingValidationsObj = {}
        allValidations
          .filter(v => v.relevamiento === nextRelevamiento) // Filtrar por relevamiento actual
          .forEach((v) => {
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
  }, [areaId, hasRejectedValidations, formatearTiempoRestante])
    // Inicialización y carga de datos
    useEffect(() => {
      fetchItemsAndValidations()
    }, [fetchItemsAndValidations])
  
  // Temporizador con segundos
  useEffect(() => {
    if (tiempoRestanteSegundos !== null && tiempoRestanteSegundos > 0) {
      // Limpia el timer anterior si existe
      if (timerRef.current) clearInterval(timerRef.current)
      
      // Crea un nuevo timer para actualizar cada segundo
      timerRef.current = setInterval(() => {
        setTiempoRestanteSegundos(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            // Verificar si podemos habilitar el envío
            setCanSubmitNewValidations(true)
            setMensajeEspera("")
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
      // Limpieza al desmontar
      return () => {
        if (timerRef.current) clearInterval(timerRef.current)
      }
    }
  }, [tiempoRestanteSegundos])

 
  
  // Formatear segundos en formato hh:mm:ss
  const formatearSegundos = (segundos) => {
    if (segundos === null) return "00:00:00"
    
    const hours = Math.floor(segundos / 3600)
    const minutes = Math.floor((segundos % 3600) / 60)
    const secs = segundos % 60
    
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':')
  }

  const handleValidacion = (itemId, puntuacion, foto) => {
    // No permitir cambios durante el tiempo de espera
    if (isBlocked) return;
    
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
      setIsSubmitting(true)
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

      // Update local state to reflect the change
      setRejectedValidations((prev) => prev.filter((v) => v.validation_id !== validation.validation_id))
      setPrevValidations((prev) =>
        prev.map((v) => (v.validation_id === validation.validation_id ? { ...v, status: "pending" } : v)),
      )

      // Check if there are any remaining rejected validations
      const remainingRejected = rejectedValidations.filter((v) => v.validation_id !== validation.validation_id)
      setHasRejectedValidations(remainingRejected.length > 0)

      Swal.fire({
        title: "Validación reenviada",
        text: "La validación ha sido reenviada y está pendiente de aprobación.",
        icon: "success",
        confirmButtonText: "Entendido"
      });
      

      // Only fetch if there are no more rejected validations
      if (remainingRejected.length === 0) {
        await fetchItemsAndValidations()
      }
    } catch (error) {
      console.error("Error al reenviar validación:", error)
      Swal.fire({
        title: "Error",
        text: "Hubo un error al reenviar la validación.",
        icon: "error",
        confirmButtonText: "Entendido"
      });
      
    } finally {
      setIsSubmitting(false)
    }
  }

  // Modificación adicional para la función enviarValidaciones 
// para garantizar que el estado se actualice correctamente después del envío

const enviarValidaciones = async () => {
  try {
    setIsSubmitting(true)
    const turnoId = calcularTurno()
    
    // Obtener los ítems a validar según el filtro
    const itemsToValidate = instanciaSeleccionada === "todas" 
      ? items 
      : items.filter(item => item.instancia === instanciaSeleccionada)
    
    // Solo verificar la puntuación, hacer la foto opcional
    const itemsIncompletos = itemsToValidate.filter(item => 
      !validaciones[item.item_id] || 
      !validaciones[item.item_id].puntuacion
    )

    if (itemsIncompletos.length > 0) {
      Swal.fire({
        title: "Validaciones incompletas",
        text: `Faltan ${itemsIncompletos.length} validaciones por completar. Por favor, asigná una puntuación a todas.`,
        icon: "warning",
        confirmButtonText: "Entendido"
      });    

      setIsSubmitting(false)
      return
    }

    const validacionesArray = itemsToValidate.map((item) => ({
      item_id: item.item_id,
      area_id: areaId,
      rating: validaciones[item.item_id]?.puntuacion || 0,
      comment: "",
      photo: validaciones[item.item_id]?.foto || "",
      turno_id: turnoId,
      relevamiento: turnoActual, // Importante: usar el turnoActual para identificar el relevamiento
      status: "pending",
    }))

    console.log(`Enviando validaciones para relevamiento ${turnoActual}`);
    
    const response = await fetch("http://localhost:3001/api/validations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validacionesArray),
    })

    if (!response.ok) {
      throw new Error("Error enviando validaciones")
    }

    // Notificar éxito
    Swal.fire({
      title: "¡Éxito!",
      text: `Las validaciones del relevamiento ${turnoActual} se enviaron correctamente.`,
      icon: "success",
      confirmButtonText: "Ok"
    });
    
    
    // IMPORTANTE: Resetear para preparar el siguiente relevamiento
    setValidaciones({});
    
    // Mostrar mensaje explicativo según el relevamiento
    if (turnoActual < 3) {
      Swal.fire({
        title: "Relevamiento completado",
        text: `Completaste el relevamiento ${turnoActual}. Deberás esperar 2 horas para realizar el relevamiento ${turnoActual + 1}.`,
        icon: "info",
        confirmButtonText: "Entendido"
      });
      
    } else {
      Swal.fire({
        title: "¡Excelente!",
        text: "Completaste todos los relevamientos del turno.",
        icon: "success",
        confirmButtonText: "Entendido"
      });
      
    }

    // NUEVO: Forzar una actualización inmediata de estado
    // Esto es clave para que el sistema reconozca inmediatamente el cambio
    if (turnoActual < 3) {
      // Simulamos que hay un tiempo de espera activo inmediatamente después del envío
      setCanSubmitNewValidations(false);
      setTiempoRestante(120); // 120 minutos = 2 horas
      setTiempoRestanteSegundos(120 * 60); // Convertir a segundos
      const tiempo = formatearTiempoRestante(120);
      setMensajeEspera(`Tiempo restante para el próximo relevamiento: ${tiempo.texto}`);
    }

    // Recargar datos para actualizar el estado
    await fetchItemsAndValidations();
    
    // IMPORTANTE: Segunda verificación para asegurar que el estado se ha actualizado
    // Esto se ejecuta después de fetchItemsAndValidations, en caso de que la recarga de datos no haya
    // detectado correctamente las nuevas validaciones
    setTimeout(() => {
      if (canSubmitNewValidations && turnoActual < 3) {
        console.log("Aplicando bloqueo forzado después del envío");
        setCanSubmitNewValidations(false);
        setTiempoRestante(120);
        setTiempoRestanteSegundos(120 * 60);
        const tiempo = formatearTiempoRestante(120);
        setMensajeEspera(`Tiempo restante para el próximo relevamiento: ${tiempo.texto}`);
      }
    }, 1000);
    
  } catch (error) {
    console.error("Error al enviar validaciones:", error)
    Swal.fire({
      title: "Error",
      text: "Ocurrió un problema al enviar las validaciones. Intentalo nuevamente.",
      icon: "error",
      confirmButtonText: "Entendido"
    });
    
  } finally {
    setIsSubmitting(false)
  }
}

const handleReemplazarClick = (itemId) => {
  console.log("Intentando click en input con id:", itemId, fileInputRefs.current);
  if (fileInputRefs.current[itemId]) {
    fileInputRefs.current[itemId].click();
  } else {
    console.error("Referencia no encontrada para itemId:", itemId);
    Swal.fire({
      title: "Error",
      text: "No se pudo acceder al selector de imágenes.",
      icon: "error"
    });
  }
};


  // Nueva función corregida para mostrar comentarios de rechazo
const mostrarComentarioRechazo = (itemId) => {
  // Obtener la validación rechazada
  const validation = rejectedValidations.find(v => v.item_id === itemId);
  console.log("Validación encontrada:", validation);
  
  // Buscar el comentario en varias posibles propiedades
  const comentario = validation?.rejection_comment || 
                    validation?.comment || 
                    validation?.rejection_reason || 
                    validation?.rejection_notes ||
                    "";
  
  if (!comentario || comentario.trim() === "") {
    Swal.fire({
      title: "Sin comentarios",
      text: "No hay comentarios detallados para esta validación rechazada.",
      icon: "warning",
      confirmButtonText: "Entendido"
    });
    
    return;
  }
  
  // Mostrar el comentario en un alert
  Swal.fire({
    title: "Motivo del rechazo",
    text: comentario,
    icon: "info",
    confirmButtonText: "Cerrar"
  });
  
};


  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-16 h-16">
            <div className="absolute w-16 h-16 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            <div className="absolute w-16 h-16 rounded-full border-4 border-t-transparent border-r-transparent border-b-primary border-l-transparent animate-spin animation-delay-500"></div>
          </div>
          <p className="text-primary font-medium">{textos.cargandoItems || "Cargando validaciones..."}</p>
        </div>
      </div>
    )
  }

  // Obtener los items filtrados según la instancia seleccionada
  const getFilteredItems = () => {
    if (hasRejectedValidations) {
      return rejectedValidations;
    }
    
    if (instanciaSeleccionada === "todas") {
      return items;
    } else {
      return items.filter(item => item.instancia === instanciaSeleccionada);
    }
  }
  
  // Renderizar el temporizador de cuenta regresiva circular
  const renderTimerCountdown = () => {
    if (tiempoRestanteSegundos === null || tiempoRestanteSegundos <= 0) return null;
    
    // Calcular ángulo para el temporizador
    const totalSeconds = 2 * 60 * 60; // 2 horas en segundos
    const progress = (tiempoRestanteSegundos / totalSeconds) * 100;
    const dashValue = 283 - (283 * progress) / 100; // 283 es aproximadamente 2π*45
    
    // Determinar color basado en tiempo restante
    const timerColor = tiempoRestanteSegundos > 3600 
      ? "#22c55e"  // > 1 hora: verde
      : tiempoRestanteSegundos > 1800 
        ? "#f59e0b"  // > 30 min: amarillo
        : "#ef4444";  // < 30 min: rojo
    
    return (
      <Card className="border-orange-300 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20">
              {/* Círculo base */}
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                <circle 
                  cx="50" cy="50" r="45" 
                  fill="none" 
                  stroke="#e6e6e6" 
                  strokeWidth="8"
                />
                <circle 
                  cx="50" cy="50" r="45" 
                  fill="none" 
                  stroke={timerColor} 
                  strokeWidth="8"
                  strokeDasharray="283"
                  strokeDashoffset={dashValue}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Clock className="w-8 h-8 text-gray-700" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium">Tiempo de espera obligatorio</h3>
              <p className="text-sm text-gray-600 mb-1">Próximo relevamiento disponible en:</p>
              <p className="text-2xl font-mono font-bold">{formatearSegundos(tiempoRestanteSegundos)}</p>
              
              {/* Mensaje explicativo */}
              <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>Durante este período, no se pueden realizar nuevas validaciones</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // Renderizar la barra de progreso de relevamientos
  const renderProgresoRelevamientos = () => {
    // Obtener los relevamientos completados
    const relevamientosCompletados = [1, 2, 3].filter(rel => 
      prevValidations.some(v => v.relevamiento === rel && (v.status === "approved" || v.status === "pending"))
    );
    
    // Calcular porcentaje de compleción general
    const porcentajeTotal = (relevamientosCompletados.length / 3) * 100;
    
    return (
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Progreso de Relevamientos
            </h3>
            <div className="text-sm font-medium bg-primary/10 text-primary px-2 py-1 rounded">
              {relevamientosCompletados.length}/3 completados
            </div>
          </div>
          
          {/* Barra de progreso general */}
          <div className="w-full h-2 bg-gray-200 rounded-full mb-4">
            <div 
              className="h-2 bg-primary rounded-full transition-all duration-1000" 
              style={{ width: `${porcentajeTotal}%` }}
            ></div>
          </div>
          
          {/* Timeline de relevamientos */}
          <div className="relative pt-2">
            <div className="absolute left-0 right-0 top-5 h-1 bg-gray-200"></div>
            <div className="flex justify-between relative">
              {[1, 2, 3].map((rel) => {
                const completado = relevamientosCompletados.includes(rel);
                const activo = rel === turnoActual;
                const isPast = relevamientosCompletados.includes(rel - 1);
                
                return (
                  <button 
                    key={rel}
                    className={`relative z-10 flex flex-col items-center cursor-pointer ${activo ? 'scale-110' : ''} transition-all`}
                    onClick={() => setRelevamientoSeleccionado(rel)}
                  >
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        completado 
                          ? 'bg-primary text-white' 
                          : activo 
                            ? 'bg-primary/20 border-2 border-primary text-primary' 
                            : isPast
                              ? 'bg-gray-300 text-gray-600'
                              : 'bg-gray-200 text-gray-500'
                      } transition-colors`}
                    >
                      {rel}
                    </div>
                    <span className={`text-xs mt-1 font-medium ${
                      completado 
                        ? 'text-primary' 
                        : activo 
                          ? 'text-primary' 
                          : 'text-gray-500'
                    }`}>
                      {completado ? 'Completado' : activo ? 'Actual' : 'Pendiente'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // Renderizar los selectores de instancia (tabs mejorados)
  const renderInstanciaTabs = () => {
    if (hasRejectedValidations) return null;
    
    const instancias = [
      { id: "todas", label: "Todas", icon: null },
      { id: "ingreso", label: "Ingreso", icon: null },
      { id: "experiencia_en_maquina", label: "Experiencia", icon: null },
      { id: "pausa", label: "Pausa", icon: null },
      { id: "salida", label: "Salida", icon: null },
    ];
    
    // Contar validaciones por instancia para mostrar badges
    const contarPorInstancia = (instancia) => {
      if (instancia === "todas") return items.length;
      return items.filter(item => item.instancia === instancia).length;
    };
    
    // Contar completadas por instancia
    const completadasPorInstancia = (instancia) => {
      if (instancia === "todas") {
        return Object.keys(validaciones).length;
      }
      
      const itemsInstancia = items.filter(item => item.instancia === instancia).map(item => item.item_id);
      return Object.keys(validaciones).filter(id => itemsInstancia.includes(parseInt(id))).length;
    };
    
    return (
      <div className="flex flex-col space-y-1">
        <div className="text-sm font-medium mb-1">Filtrar por instancia:</div>
        <div className="flex flex-wrap gap-2 mb-2">
          {instancias.map((instancia) => {
            const isActive = instanciaSeleccionada === instancia.id;
            const count = contarPorInstancia(instancia.id);
            const completed = completadasPorInstancia(instancia.id);
            
            return (
              <button
                key={instancia.id}
                onClick={() => setInstanciaSeleccionada(instancia.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  isActive 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {instancia.icon && <instancia.icon className="w-4 h-4" />}
                <span>{instancia.label}</span>
                {count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isActive 
                      ? 'bg-white text-primary' 
                      : completed === count 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-200 text-gray-700'
                  }`}>
                    {completed}/{count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };
  
  // Renderizar la sección de validaciones rechazadas
  const renderRejectedAlert = () => {
    if (!hasRejectedValidations) return null;
    
    return (
      <div className="bg-red-50 border-l-4 border-red-500 rounded p-4 shadow-sm mb-6">
        <div className="flex items-start gap-3">
          <div className="bg-red-100 rounded-full p-2">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-red-800">Validaciones Rechazadas</h3>
            <p className="text-red-700">
              Se han rechazado {rejectedValidations.length} validaciones que requieren tu atención. Revisa las observaciones, corrige y reenvía.
            </p>
          </div>
        </div>
      </div>
    );
  };
  
  // Renderizar un mensaje de interface bloqueada cuando hay tiempo de espera
  const renderInterfaceBloqueadaMessage = () => {
    if (!isBlocked) return null;
    
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-center gap-2">
        <Lock className="h-6 w-6 text-blue-500" />
        <div>
          <h3 className="font-medium text-blue-700">Interfaz bloqueada temporalmente</h3>
          <p className="text-blue-600 text-sm">
            Durante el tiempo de espera, no puedes realizar nuevas validaciones. 
            Las estrellas y la subida de fotos se habilitarán cuando el tiempo de espera termine.
          </p>
        </div>
      </div>
    );
  };
  
  // Renderizar las tarjetas de validación
  const renderValidationCards = () => {
    const filteredItems = getFilteredItems();
    
    if (filteredItems.length === 0) {
      return (
        <div className="p-12 text-center bg-gray-50 rounded-lg border border-dashed">
          <p className="text-gray-500">No hay validaciones disponibles para esta selección</p>
        </div>
      );
    }
    
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item) => {
            const validation = hasRejectedValidations
              ? item
              : prevValidations.find((v) => v.item_id === item.item_id && v.relevamiento === turnoActual)
            const isRejected = validation?.status === "rejected"
            const isPending = validation?.status === "pending"
            const isApproved = validation?.status === "approved"
            
            // NUEVO: Considerar también el tiempo de espera para determinar si se puede editar
            const canEdit = (hasRejectedValidations || (!isApproved && !isPending)) && !isBlocked;
            
            // Obtener la puntuación actual
            const currentRating = validaciones[item.item_id]?.puntuacion || validation?.rating || 0;
            // Verificar si hay foto
            const hasPhoto = !!(validaciones[item.item_id]?.foto || validation?.photo);
            // URL de la foto
            const photoUrl = validaciones[item.item_id]?.foto || validation?.photo;

            // console.log(validation);
            

            return (
              <motion.div
                key={hasRejectedValidations ? validation.validation_id : item.item_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                layout
              >
                <Card className={`overflow-hidden ${
                  isBlocked
                    ? 'opacity-75 border-gray-300'
                    : isRejected 
                      ? 'border-red-300 shadow-sm shadow-red-100' 
                      : isApproved 
                        ? 'border-green-300 shadow-sm shadow-green-100'
                        : isPending 
                          ? 'border-yellow-300 shadow-sm shadow-yellow-100'
                          : hasPhoto && currentRating > 0 
                            ? 'border-blue-300 shadow-sm shadow-blue-100'
                            : 'border-gray-200'
                } transition-all hover:shadow-md`}>
                  <CardHeader className={`flex flex-row justify-between items-start p-4 ${
                    isRejected
                      ? 'bg-red-500'
                      : isApproved
                        ? 'bg-green-500'
                        : isPending
                          ? 'bg-yellow-500'
                          : 'bg-gradient-to-r from-blue-600 to-blue-800'
                  }`}>
                    <CardTitle className="text-white">
                      {hasRejectedValidations ? items.find((i) => i.item_id === item.item_id)?.name : item.name}
                    </CardTitle>
                    {(isRejected || isPending || isApproved) && (
                      <div className={`rounded-full text-xs px-2 py-1 flex items-center gap-1 ${
                        isRejected 
                          ? 'bg-red-100 text-red-800' 
                          : isApproved 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {isRejected && <X className="w-3 h-3" />}
                        {isApproved && <CheckCircle className="w-3 h-3" />}
                        {isPending && <Clock className="w-3 h-3" />}
                        <span>
                          {isRejected ? 'Rechazada' : isApproved ? 'Aprobada' : 'Pendiente'}
                        </span>
                      </div>
                    )}
                    
                    {/* Indicador de bloqueo por tiempo de espera */}
                    {isBlocked && (
                      <div className="rounded-full bg-blue-100 text-blue-800 px-2 py-1 text-xs flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        <span>Bloqueado</span>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-3 text-sm">
                      <span className="text-gray-600">
                        Instancia: <span className="font-medium capitalize">
                          {hasRejectedValidations
                            ? items.find((i) => i.item_id === item.item_id)?.instancia?.replace("_", " ")
                            : item.instancia?.replace("_", " ") || textos.sinEspecificar}
                        </span>
                      </span>
                      
                      {/* Estado de completitud - solo depende de la puntuación */}
                        {!isRejected && !isPending && !isApproved && (
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            currentRating > 0 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {currentRating > 0 ? 'Completa' : 'Incompleta'}
                          </span>
                        )}
                    </div>
                    
                    {/* Sección de puntuación con estrellas */}
                    <div className="mb-4">
                      <div className="flex justify-between mb-1">
                        <label className="text-sm font-medium">Puntuación:</label>
                        <span className={`text-sm font-medium ${currentRating > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                          {currentRating}/5
                        </span>
                      </div>
                      <div className="flex justify-center gap-1 relative">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            onClick={() => canEdit && handleValidacion(
                              hasRejectedValidations ? item.item_id : item.item_id, 
                              star, 
                              validaciones[item.item_id]?.foto
                            )}
                            className={`w-8 h-8 p-1 transition-colors duration-200 ${!canEdit ? "opacity-60 cursor-not-allowed" : "cursor-pointer"} ${
                              star <= currentRating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                        
                        {/* Overlay de bloqueo */}
                        {isBlocked && (
                          <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded">
                            <Lock className="w-5 h-5 text-gray-500" />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Sección de foto */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium">Evidencia fotográfica (opcional):</label>
                        {isImageUploading[item.item_id] && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full animate-pulse">
                            Subiendo...
                          </span>
                        )}
                      </div>
                      
                      {hasPhoto ? (
                        <div className="relative group">
                          <img
                            src={photoUrl}
                            alt="Evidencia"
                            className="w-full h-40 object-cover rounded cursor-pointer border shadow-sm"
                            onClick={() => setShowImagePreview(photoUrl)}
                          />
                          
                          {/* Barra permanentemente visible en la parte inferior para reemplazar foto */}
                          {canEdit && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-white font-medium">Foto cargada</span>
                                {/* Botón Reemplazar que llama a la función handleReemplazarClick */}
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="bg-white/90 hover:bg-white text-xs py-1 h-7"
                                  onClick={() => handleReemplazarClick(item.item_id)}
                                >
                                  <Camera className="w-3 h-3 mr-1" />
                                  Reemplazar
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {/* Input de archivo oculto con referencia */}
                          <input
                            ref={(el) => (fileInputRefs.current[item.item_id] = el)}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setIsImageUploading((prev) => ({ ...prev, [item.item_id]: true }));

                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  handleValidacion(
                                    item.item_id, 
                                    validaciones[item.item_id]?.puntuacion || 0, 
                                    reader.result
                                  );
                                  setIsImageUploading(prev => ({ ...prev, [item.item_id]: false }));
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />


                          
                          {/* Overlay de bloqueo para la foto */}
                          {isBlocked && (
                            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                              <div className="bg-white/80 p-2 rounded-lg shadow-sm flex items-center gap-2">
                                <Lock className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-700">Bloqueado</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                      <div className="relative">
                        <ImageUpload
                          itemId={item.item_id} // <-- aquí lo agregás claramente
                          onImageUpload={(foto, id) => { // <-- agregás id como parámetro
                            if (isBlocked) return;

                            setIsImageUploading(prev => ({ ...prev, [id]: true }));

                            setTimeout(() => {
                              handleValidacion(
                                id,
                                validaciones[id]?.puntuacion || 0,
                                foto
                              );

                              setIsImageUploading(prev => ({ ...prev, [id]: false }));
                            }, 500);
                          }}
                        >

                          <div className={`w-full h-40 border-2 border-dashed rounded flex flex-col items-center justify-center bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors ${
                            !canEdit ? "opacity-50 cursor-not-allowed" : ""
                          }`}>
                            <Camera className="w-8 h-8 text-gray-400 mb-2" />
                            <span className="text-sm text-gray-500 font-medium">Subir foto</span>
                            <span className="text-xs text-gray-400 mt-1">Haz clic para seleccionar</span>
                          </div>
                        </ImageUpload>
                        
                        {/* Overlay de bloqueo para la subida de foto */}
                        {isBlocked && (
                          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                            <div className="bg-white/80 p-2 rounded-lg shadow-sm flex items-center gap-2">
                              <Lock className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-700">Bloqueado por tiempo de espera</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Botón para ver motivo del rechazo - mostrarlo siempre si está rechazada */}
                      {isRejected && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full mt-3 text-red-600"
                          onClick={() => mostrarComentarioRechazo(item.item_id)}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Ver motivo del rechazo
                        </Button>
                      )}
                     
                    </div>

                  </CardContent>
                  {isRejected && (
                    <CardFooter className="bg-gray-50 p-4 border-t">
                      <Button
                        variant="default"
                        className="w-full bg-primary hover:bg-primary/90"
                        onClick={() => enviarValidacionIndividual(validation)}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 rounded-full border-2 border-t-transparent border-white animate-spin mr-2"></div>
                            Procesando...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Reenviar validación
                          </>
                        )}
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
  
  // Modal para vista previa de imágenes
  const renderImagePreviewModal = () => {
    if (!showImagePreview) return null;
    
    return (
      <div 
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
        onClick={() => setShowImagePreview(null)}
      >
        <div className="max-w-4xl max-h-full" onClick={e => e.stopPropagation()}>
          <img 
            src={showImagePreview} 
            alt="Vista previa" 
            className="max-w-full max-h-[80vh] object-contain rounded shadow-lg"
          />
          <button 
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 rounded-full p-2 text-white"
            onClick={() => setShowImagePreview(null)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>
    );
  };
  
  // Resumen de validaciones visuales
  const renderResumenCards = () => {
    // Calcular estadísticas
    const totalValidaciones = items.length * 3; // 3 relevamientos
    const completadas = prevValidations.length;
    const pendientesAprobacion = prevValidations.filter(v => v.status === "pending").length;
    const rechazadas = prevValidations.filter(v => v.status === "rejected").length;
    const aprobadas = prevValidations.filter(v => v.status === "approved").length;
    
    const avgScore = prevValidations.length > 0
      ? prevValidations.reduce((sum, val) => sum + val.rating, 0) / prevValidations.length
      : 0;
    
    return (
      <div className="grid gap-5 md:grid-cols-3 mb-6">
        {/* Tarjeta de Progreso General */}
        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              Progreso General
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium mb-2 flex justify-between items-baseline">
              <span>Completadas vs. Total</span>
              <span className="text-lg text-blue-600">{Math.round((completadas / totalValidaciones) * 100)}%</span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full mb-3">
              <div 
                className="h-2 bg-blue-500 rounded-full transition-all duration-700"
                style={{ width: `${(completadas / totalValidaciones) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <div className="text-center">
                <span className="block text-xl font-bold">{completadas}</span>
                <span className="text-xs text-gray-500">Realizadas</span>
              </div>
              <div className="text-center">
                <span className="block text-xl font-bold">{totalValidaciones - completadas}</span>
                <span className="text-xs text-gray-500">Restantes</span>
              </div>
              <div className="text-center">
                <span className="block text-xl font-bold">{totalValidaciones}</span>
                <span className="text-xs text-gray-500">Total</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Tarjeta de Estado de Validaciones */}
        <Card className="shadow-sm border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-purple-500" />
              Estado de Validaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-12 h-2 bg-green-500 rounded-full"></div>
                <div className="flex justify-between w-full text-sm">
                  <span>Aprobadas</span>
                  <span className="font-medium">{aprobadas}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-12 h-2 bg-yellow-500 rounded-full"></div>
                <div className="flex justify-between w-full text-sm">
                  <span>Pendientes</span>
                  <span className="font-medium">{pendientesAprobacion}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-12 h-2 bg-red-500 rounded-full"></div>
                <div className="flex justify-between w-full text-sm">
                  <span>Rechazadas</span>
                  <span className="font-medium">{rechazadas}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Tarjeta de Puntaje Promedio */}
        <Card className="shadow-sm border-l-4 border-l-amber-500 bg-gradient-to-br from-slate-800 to-slate-900 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2 text-amber-300">
              <Star className="w-5 h-5 fill-amber-300" />
              Puntaje Promedio
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex items-center justify-center">
              <span className="text-4xl font-bold">{avgScore.toFixed(1)}</span>
              <span className="text-xl text-gray-400 ml-1">/5</span>
            </div>
            <div className="flex justify-center my-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-6 h-6 ${
                    star <= Math.round(avgScore) 
                      ? "text-yellow-400 fill-yellow-400" 
                      : "text-gray-600"
                  }`}
                />
              ))}
            </div>
            <p className="text-center text-xs text-gray-400 mt-1">
              Basado en {completadas} validaciones
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 gap-4">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          {titulo}
          {hasRejectedValidations && (
            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Correcciones pendientes
            </span>
          )}
          {isBlocked && (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
              <Lock className="w-3 h-3 mr-1" />
              Tiempo de espera
            </span>
          )}
        </h1>
        
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <span className="text-sm font-medium bg-blue-50 text-blue-700 px-3 py-1 rounded-full flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            Turno Actual: Noche
          </span>
        </div>
      </div>
      
      {/* Alerta de validaciones rechazadas */}
      {renderRejectedAlert()}
      
      {/* Mensaje de interfaz bloqueada */}
      {renderInterfaceBloqueadaMessage()}
      
      {/* Temporizador con cuenta regresiva */}
      {renderTimerCountdown()}
      
      {/* Dashboard de resumen de validaciones */}
      {renderResumenCards()}
      
      {/* Progreso de relevamientos */}
      {!hasRejectedValidations && renderProgresoRelevamientos()}
      
      <div className="flex flex-wrap items-center justify-between gap-3 my-6">
        <h2 className="text-xl font-bold text-gray-800">
          {hasRejectedValidations 
            ? "Validaciones Rechazadas" 
            : `${textos.turnoActual}: ${turnoActual} de 3`}
        </h2>
      </div>
      
      {/* Filtros de instancia */}
      {renderInstanciaTabs()}
      
      {/* Tarjetas de validación */}
      {renderValidationCards()}
      
      {/* Botón para enviar validaciones */}
      {canSubmitNewValidations && !hasRejectedValidations && (
        <div className="flex justify-center mt-8">
          <Button
            variant="default"
            className="px-8 py-6 text-lg shadow-lg bg-primary hover:bg-primary/90 relative overflow-hidden group"
            onClick={enviarValidaciones}
            disabled={isSubmitting || Object.keys(validaciones).length === 0}
          >.
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 rounded-full border-2 border-t-transparent border-white animate-spin mr-2"></div>
                Procesando...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" />
                {turnoActual < 3
                  ? textos.enviarValidacionesTurno?.replace("{turnoActual}", turnoActual)
                  : textos.enviarValidacionesFinales}
                
                {/* Efecto de brillo al pasar el mouse */}
                <span className="absolute inset-0 overflow-hidden rounded-md">
                  <span className="absolute left-0 top-0 h-full w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer"></span>
                </span>
              </>
            )}
          </Button>
        </div>
      )}
      
      {/* Modal de vista previa de imágenes */}
      {renderImagePreviewModal()}
    </div>
  )
}