"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Star, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ImageUpload } from "@/components/ImageUpload"
import { guardarFoto } from "@/lib/db"
import { ValidationSummary } from "@/components/ValidationSummary"

const itemsJuego = [
  { id: 1, nombre: "Bienvenida y orientación", instancia: "ingreso" },
  { id: 2, nombre: "Verificación de identidad", instancia: "ingreso" },
  { id: 3, nombre: "Estado de las mesas de juego", instancia: "experiencia_en_maquina" },
  { id: 4, nombre: "Funcionamiento de máquinas tragamonedas", instancia: "experiencia_en_maquina" },
  { id: 5, nombre: "Desempeño de los croupiers", instancia: "experiencia_en_maquina" },
  { id: 6, nombre: "Atención en bares y restaurantes", instancia: "pausa" },
  { id: 7, nombre: "Limpieza de áreas de descanso", instancia: "pausa" },
  { id: 8, nombre: "Proceso de canje de fichas", instancia: "salida" },
  { id: 9, nombre: "Despedida y feedback", instancia: "salida" },
]

export default function DashboardJefePrincipalJuego() {
  const [turno, setTurno] = useState(1)
  const [validaciones, setValidaciones] = useState({})
  const [ultimoRelevamiento, setUltimoRelevamiento] = useState(null)
  const [puedeRelevar, setPuedeRelevar] = useState(true)
  const [tiempoRestante, setTiempoRestante] = useState(null)

  const totalValidaciones = 3 * itemsJuego.length // 3 turnos por día
  const validacionesCompletadas = Object.keys(validaciones).length
  const puntajePromedio =
    validacionesCompletadas > 0
      ? Object.values(validaciones).reduce((sum, val) => sum + val.puntuacion, 0) / validacionesCompletadas
      : 0

  useEffect(() => {
    const interval = setInterval(() => {
      if (ultimoRelevamiento) {
        const tiempoTranscurrido = new Date().getTime() - ultimoRelevamiento.getTime()
        const dosHorasEnMilisegundos = 2 * 60 * 60 * 1000
        const tiempoRestanteMs = Math.max(0, dosHorasEnMilisegundos - tiempoTranscurrido)
        setTiempoRestante(Math.ceil(tiempoRestanteMs / 60000)) // Convertir a minutos
        setPuedeRelevar(tiempoRestanteMs === 0)
      }
    }, 60000) // Actualizar cada minuto

    return () => clearInterval(interval)
  }, [ultimoRelevamiento])

  const handleValidacion = (id, puntuacion, foto) => {
    setValidaciones((prev) => ({
      ...prev,
      [id]: {
        puntuacion,
        foto: foto || prev[id]?.foto,
      },
    }))
    if (foto) {
      guardarFoto(id, foto)
    }
  }

  const enviarValidaciones = () => {
    console.log("Validaciones enviadas:", { turno, validaciones })
    alert("Validaciones enviadas con éxito")
    setUltimoRelevamiento(new Date())
    setPuedeRelevar(false)
    if (turno < 3) {
      setTurno((prev) => prev + 1)
    } else {
      // Reiniciar para el siguiente día
      setTurno(1)
    }
    setValidaciones({})
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
      <h1 className="text-3xl font-bold mb-6">Dashboard del Jefe Principal de Juego</h1>
      <ValidationSummary
        totalValidations={totalValidaciones}
        completedValidations={validacionesCompletadas}
        averageScore={puntajePromedio}
      />
      <div className="flex justify-between items-center mb-4 mt-8">
        <h2 className="text-2xl font-bold">Validaciones del Turno Actual</h2>
        <p className="text-lg">Turno actual: {turno} de 3</p>
      </div>
      <p className="mb-4">
        Último relevamiento: {ultimoRelevamiento ? ultimoRelevamiento.toLocaleString() : "No realizado"}
      </p>
      {!puedeRelevar && tiempoRestante !== null && (
        <Alert className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Tiempo de espera</AlertTitle>
          <AlertDescription>
            Debes esperar {tiempoRestante} minutos antes de realizar el próximo relevamiento.
          </AlertDescription>
        </Alert>
      )}
      <Tabs defaultValue="ingreso">
        <TabsList className="mb-4">
          <TabsTrigger value="ingreso">Ingreso</TabsTrigger>
          <TabsTrigger value="experiencia_en_maquina">Experiencia en Máquina</TabsTrigger>
          <TabsTrigger value="pausa">Pausa</TabsTrigger>
          <TabsTrigger value="salida">Salida</TabsTrigger>
        </TabsList>
        {["ingreso", "experiencia_en_maquina", "pausa", "salida"].map((instancia) => (
          <TabsContent key={instancia} value={instancia}>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {itemsJuego
                .filter((item) => item.instancia === instancia)
                .map((item) => (
                  <Card key={item.id}>
                    <CardHeader>
                      <CardTitle>{item.nombre}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex space-x-1 mb-4">{renderStars(item.id)}</div>
                      <p>Puntuación: {validaciones[item.id]?.puntuacion || 0}</p>
                      <ImageUpload
                        onImageUpload={(foto) =>
                          handleValidacion(item.id, validaciones[item.id]?.puntuacion || 0, foto)
                        }
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
          </TabsContent>
        ))}
      </Tabs>
      <Button
        onClick={enviarValidaciones}
        disabled={!puedeRelevar || Object.keys(validaciones).length !== itemsJuego.length}
        className="mt-6 w-full"
      >
        Enviar Validaciones del Turno {turno}
      </Button>
    </div>
  )
}

