"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { Star, StarHalf, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { calcularTurno } from "@/lib/utils"

// Reemplazar la constante instanceImages con instanceEmojis
const instanceEmojis = {
  ingreso: "🚪",
  experiencia_en_maquina: "🎰",
  pausa: "🚽",
  salida: "🚶",
}

const JourneyRoad = ({ stages, averageScores }) => {
  const getEmotionIcon = (score) => {
    if (score > 4) return "😍"
    if (score >= 3) return "😊"
    if (score >= 2) return "😐"
    if (score >= 1) return "😕"
    return "😢"
  }

  const getEmotionColor = (score) => {
    if (score > 4) return "bg-green-50 border-green-200 text-green-700"
    if (score >= 3) return "bg-green-50 border-green-200 text-green-600"
    if (score >= 2) return "bg-yellow-50 border-yellow-200 text-yellow-700"
    return "bg-red-50 border-red-200 text-red-700"
  }

  return (
    <div className="relative mt-8 mb-12">
      <div className="absolute w-full h-4 bg-gray-300 top-1/2 transform -translate-y-1/2 rounded-full"></div>
      <div className="flex justify-between items-center relative z-10">
        {stages.map((stage, index) => (
          <div key={stage} className="flex flex-col items-center">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center ${getEmotionColor(averageScores[index])}`}
            >
              <span className="text-3xl" role="img" aria-label={stage}>
                {instanceEmojis[stage.replace(" ", "_")] || "❓"}
              </span>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white border-4 border-gray-200 -mt-4">
              <span className="text-2xl" role="img" aria-label={`Emotion for ${stage}`}>
                {getEmotionIcon(averageScores[index])}
              </span>
            </div>
            <p className="mt-2 text-sm font-medium text-center">{stage}</p>
            <p className="text-lg font-bold">{averageScores[index].toFixed(2)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function JourneyCustomerMap() {
  const [validaciones, setValidaciones] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pendientes, setPendientes] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const turnoActual = calcularTurno()
        const today = new Date().toISOString().split("T")[0]

        const [approvedRes, pendingRes] = await Promise.all([
          fetch(`http://localhost:3001/api/validations?status=approved&date=${today}&turno=${turnoActual}`),
          fetch(`http://localhost:3001/api/validations?status=pending&date=${today}&turno=${turnoActual}`),
        ])

        if (!approvedRes.ok || !pendingRes.ok) {
          throw new Error("Error al obtener las validaciones")
        }

        const [approvedData, pendingData] = await Promise.all([approvedRes.json(), pendingRes.json()])

        setValidaciones(Array.isArray(approvedData) ? approvedData : [])
        setPendientes(Array.isArray(pendingData) ? pendingData.length : 0)
      } catch (err) {
        console.error("Error:", err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const calcularPromediosPorArea = (area) => {
    if (!Array.isArray(validaciones) || validaciones.length === 0) return []

    const validacionesArea = validaciones.filter((v) => v.area === area)
    const instancias = ["ingreso", "experiencia_en_maquina", "pausa", "salida"]

    return instancias.map((instancia) => {
      const valInstancia = validacionesArea.filter((v) => v.instancia === instancia)
      const promedio =
        valInstancia.length > 0 ? valInstancia.reduce((acc, v) => acc + v.rating, 0) / valInstancia.length : 0

      return {
        name: instancia.replace("_", " "),
        puntuacion: Number(promedio.toFixed(2)),
      }
    })
  }

  const calcularPromediosGenerales = () => {
    if (!Array.isArray(validaciones) || validaciones.length === 0) return []

    const areas = ["Limpieza", "Atención al Cliente", "Juego"]
    const instancias = ["ingreso", "experiencia_en_maquina", "pausa", "salida"]

    return instancias.map((instancia) => {
      const promediosPorArea = areas.map((area) => {
        const val = validaciones.filter((v) => v.area === area && v.instancia === instancia)
        return val.length > 0 ? val.reduce((sum, v) => sum + v.rating, 0) / val.length : 0
      })

      const promedioGeneral = promediosPorArea.reduce((a, b) => a + b, 0) / areas.length

      return {
        name: instancia.replace("_", " "),
        promedio: Number(promedioGeneral.toFixed(2)),
      }
    })
  }

  // Actualizar las funciones getEmotionIcon y getEmotionText en el componente principal
  const getEmotionIcon = (score) => {
    if (score > 4) return "😍"
    if (score >= 3) return "😊"
    if (score >= 2) return "😐"
    if (score >= 1) return "😕"
    return "😢"
  }

  const getEmotionColor = (score) => {
    if (score > 4) return "bg-green-50 border-green-200 text-green-700"
    if (score >= 3) return "bg-green-50 border-green-200 text-green-600"
    if (score >= 2) return "bg-yellow-50 border-yellow-200 text-yellow-700"
    return "bg-red-50 border-red-200 text-red-700"
  }

  const getEmotionText = (score) => {
    if (score > 4) return "¡Excelente experiencia! 🌟"
    if (score >= 3) return "Buena experiencia 👍"
    if (score >= 2) return "Experiencia regular 🤔"
    return "Necesita mejoras urgentes 🚨"
  }

  // Actualizar el CustomTooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const score = payload[0].value
      return (
        <div className={`p-3 rounded-lg border ${getEmotionColor(score)}`}>
          <p className="font-medium">{label}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-lg font-bold">{score.toFixed(2)}</span>
            <span className="text-2xl" role="img" aria-label={`Emotion for ${label}`}>
              {getEmotionIcon(score)}
            </span>
          </div>
          <p className="text-sm mt-1">{getEmotionText(score)}</p>
        </div>
      )
    }
    return null
  }

  const renderStars = (puntuacion) => {
    if (typeof puntuacion !== "number") return null

    const stars = []
    const fullStars = Math.floor(puntuacion)
    const hasHalfStar = puntuacion % 1 >= 0.5

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} className="w-5 h-5 text-yellow-400 fill-yellow-400" />)
    }

    if (hasHalfStar) {
      stars.push(<StarHalf key="half" className="w-5 h-5 text-yellow-400 fill-yellow-400" />)
    }

    const emptyStars = 5 - stars.length
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-5 h-5 text-gray-300" />)
    }

    return <div className="flex gap-1">{stars}</div>
  }

  const renderAreaChart = (area) => {
    const data = calcularPromediosPorArea(area)
    const promedioArea = data.length > 0 ? data.reduce((acc, val) => acc + val.puntuacion, 0) / data.length : 0

    return (
      <Card className={`mb-8 ${getEmotionColor(promedioArea)}`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{area}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm">Promedio: {promedioArea.toFixed(2)}</span>
              <span className="text-2xl" role="img" aria-label={`Emotion for ${area}`}>
                {getEmotionIcon(promedioArea)}
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="w-full h-[300px]" />
          ) : (
            <>
              <JourneyRoad stages={data.map((d) => d.name)} averageScores={data.map((d) => d.puntuacion)} />
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fill: "#666" }} />
                  <YAxis domain={[0, 5]} tick={{ fill: "#666" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="puntuacion"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={(props) => {
                      if (!props.payload) return null
                      const score = props.payload.puntuacion
                      return (
                        <g transform={`translate(${props.cx},${props.cy})`}>
                          <circle r={6} fill="#8884d8" />
                          <g transform="translate(-12,-12) scale(0.75)">{getEmotionIcon(score)}</g>
                        </g>
                      )
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  const renderGeneralChart = () => {
    const data = calcularPromediosGenerales()
    const promedioGeneral = data.length > 0 ? data.reduce((acc, val) => acc + val.promedio, 0) / data.length : 0

    return (
      <Card className={`mb-8 ${getEmotionColor(promedioGeneral)}`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Promedio General</span>
            <div className="flex items-center gap-2">
              <span className="text-sm">Promedio: {promedioGeneral.toFixed(2)}</span>
              {getEmotionIcon(promedioGeneral)}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="w-full h-[300px]" />
          ) : (
            <>
              <JourneyRoad stages={data.map((d) => d.name)} averageScores={data.map((d) => d.promedio)} />
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="promedio"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    dot={(props) => {
                      if (!props.payload) return null
                      const score = props.payload.promedio
                      return (
                        <g transform={`translate(${props.cx},${props.cy})`}>
                          <circle r={6} fill="#82ca9d" />
                          <g transform="translate(-12,-12) scale(0.75)">{getEmotionIcon(score)}</g>
                        </g>
                      )
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  // Actualizar la función renderStageCard
  const renderStageCard = (stage) => {
    const score = stage.promedio
    return (
      <Card key={stage.name} className={`transition-all hover:shadow-lg ${getEmotionColor(score)}`}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            {stage.name}
            {getEmotionIcon(score)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="w-full h-[50px]" />
          ) : (
            <div className="space-y-2">
              <div className="text-6xl text-center" role="img" aria-label={stage.name}>
                {instanceEmojis[stage.name.replace(" ", "_")] || "❓"}
              </div>
              <p className="text-2xl font-bold text-center mt-4">{score.toFixed(2)}</p>
              <div className="flex justify-center">{renderStars(score)}</div>
              <p className="text-sm mt-2 text-center">{getEmotionText(score)}</p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Error al cargar los datos: {error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {pendientes > 0 && (
        <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Existen {pendientes} validaciones pendientes de aprobación. El mapa muestra únicamente las validaciones
            aprobadas.
          </AlertDescription>
        </Alert>
      )}

      <h1 className="text-3xl font-bold">Journey Customer Map</h1>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="limpieza">Limpieza</TabsTrigger>
          <TabsTrigger value="atencion">Atención</TabsTrigger>
          <TabsTrigger value="juego">Juego</TabsTrigger>
        </TabsList>

        <TabsContent value="general">{renderGeneralChart()}</TabsContent>
        <TabsContent value="limpieza">{renderAreaChart("Limpieza")}</TabsContent>
        <TabsContent value="atencion">{renderAreaChart("Atención al Cliente")}</TabsContent>
        <TabsContent value="juego">{renderAreaChart("Juego")}</TabsContent>
      </Tabs>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {calcularPromediosGenerales().map((stage) => renderStageCard(stage))}
      </div>
    </div>
  )
}

