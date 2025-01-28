"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { Star, StarHalf } from "lucide-react"

/**
 * JourneyCustomerMap:
 * - Obtiene validaciones con `status=approved` (o ajústalo).
 * - Muestra alert si hay val. pendientes.
 * - Calcula promedios por área e instancia, renderiza en Recharts.
 * - Muestra tarjetas con promedios globales.
 * - (Opcional) Desglosa detalle por ítem y relevamiento.
 */
export default function JourneyCustomerMap() {
  const [validaciones, setValidaciones] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  // Para mostrar si hay pendientes
  const [pendientes, setPendientes] = useState(0)

  // 1) Cargamos sólo 'approved' para el mapa
  useEffect(() => {
    fetch("http://localhost:3001/api/validations?status=approved")
      .then((res) => res.json())
      .then((data) => {
        setValidaciones(data)
        setIsLoading(false)
      })
      .catch((err) => {
        console.error("Error al obtener validaciones aprobadas:", err)
        setIsLoading(false)
      })
  }, [])

  // 2) Revisa cuántas hay 'pending'
  useEffect(() => {
    fetch("http://localhost:3001/api/validations?status=pending")
      .then((res) => res.json())
      .then((data) => {
        setPendientes(data.length)
      })
      .catch((err) => console.error("Error revisando pendientes:", err))
  }, [])

  // 3) Calcula promedios para un área específica
  const calcularPromediosPorArea = (area) => {
    const validacionesArea = validaciones.filter((v) => v.area === area)
    const instancias = ["ingreso", "experiencia_en_maquina", "pausa", "salida"]

    return instancias.map((instancia) => {
      const valInstancia = validacionesArea.filter((v) => v.instancia === instancia)
      const promedio =
        valInstancia.reduce((acc, v) => acc + v.rating, 0) / (valInstancia.length || 1)

      return {
        name: instancia.replace("_", " "),
        puntuacion: promedio || 0,
      }
    })
  }

  // 4) Calcula promedios globales (Limpieza, Atención, Juego)
  const calcularPromediosGenerales = () => {
    const areas = ["Limpieza", "Atención al Cliente", "Juego"]
    const instancias = ["ingreso", "experiencia_en_maquina", "pausa", "salida"]

    return instancias.map((instancia) => {
      const sumaPorAreas = areas.reduce((acc, area) => {
        const val = validaciones.filter(
          (v) => v.area === area && v.instancia === instancia
        )
        const promArea =
          val.reduce((sum, v) => sum + v.rating, 0) / (val.length || 1)
        return acc + promArea
      }, 0)

      const promedioGeneral = sumaPorAreas / areas.length
      return {
        name: instancia.replace("_", " "),
        promedio: promedioGeneral || 0,
      }
    })
  }

  // 5) Renderiza estrellas
  const renderStars = (puntuacion) => {
    const stars = []
    const fullStars = Math.floor(puntuacion)
    const hasHalfStar = puntuacion % 1 >= 0.5

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} className="text-yellow-400 inline-block" />)
    }
    if (hasHalfStar) {
      stars.push(<StarHalf key="half" className="text-yellow-400 inline-block" />)
    }
    const emptyStars = 5 - stars.length
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="text-gray-300 inline-block" />)
    }
    return stars
  }

  // 6) Gráfico para un área específica
  const renderAreaChart = (area) => {
    const data = calcularPromediosPorArea(area)

    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{area}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="w-full h-[300px]" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="puntuacion"
                  stroke="#8884d8"
                  name="Puntuación"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    )
  }

  // 7) Gráfico de promedios generales
  const renderGeneralChart = () => {
    const data = calcularPromediosGenerales()

    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Promedio General</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="w-full h-[300px]" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="promedio"
                  stroke="#82ca9d"
                  name="Promedio General"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    )
  }

  // (Opcional) 8) Desglose por ítem y turno
  function agruparPorItemYTurno(valids) {
    const obj = {}
    valids.forEach((val) => {
      const { item_id, item, instancia, relevamiento, rating, photo } = val
      if (!obj[item_id]) {
        obj[item_id] = {
          item_id,
          itemName: item,
          instancia,
          turnos: {},
        }
      }
      obj[item_id].turnos[relevamiento] = { rating, photo }
    })
    return obj
  }

  const agrupacionItems = agruparPorItemYTurno(validaciones)

  return (
    <div className="container mx-auto p-4">
      {/* Alerta si hay pendientes */}
      {pendientes > 0 && (
        <div className="mb-4 p-4 border border-red-200 bg-red-50">
          Existen {pendientes} validaciones pendientes de aprobación. El mapa muestra
          únicamente las validaciones aprobadas.
        </div>
      )}

      <h1 className="text-3xl font-bold mb-6">Journey Customer Map</h1>

      {/* Tabs: General / Limpieza / Atención / Juego */}
      <Tabs defaultValue="general" className="mb-8">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="limpieza">Limpieza</TabsTrigger>
          <TabsTrigger value="atencion">Atención al Cliente</TabsTrigger>
          <TabsTrigger value="juego">Juego</TabsTrigger>
        </TabsList>

        <TabsContent value="general">{renderGeneralChart()}</TabsContent>
        <TabsContent value="limpieza">{renderAreaChart("Limpieza")}</TabsContent>
        <TabsContent value="atencion">
          {renderAreaChart("Atención al Cliente")}
        </TabsContent>
        <TabsContent value="juego">{renderAreaChart("Juego")}</TabsContent>
      </Tabs>

      {/* Tarjetas con promedios por instancia (ej. al final) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {calcularPromediosGenerales().map((stage) => (
          <Card key={stage.name}>
            <CardHeader>
              <CardTitle>{stage.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="w-full h-[50px]" />
              ) : (
                <div>
                  <p className="text-2xl font-bold mb-2">
                    {stage.promedio.toFixed(2)}
                  </p>
                  <div>{renderStars(stage.promedio)}</div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* (Opcional) Desglose por ítem y relevamiento */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Detalle por Ítem y Turno</h2>
        {isLoading ? (
          <Skeleton className="w-full h-[100px]" />
        ) : (
          Object.values(agrupacionItems).map((itemObj) => {
            const { item_id, itemName, instancia, turnos } = itemObj
            return (
              <Card key={item_id} className="mb-4">
                <CardHeader>
                  <CardTitle>
                    {itemName} - Instancia: {instancia}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {[1, 2, 3].map((t) => {
                    const dataTurno = turnos[t]
                    if (!dataTurno) {
                      return (
                        <div key={t} className="border-b mb-2 pb-2">
                          <p>Turno {t}: <em>Sin validación</em></p>
                        </div>
                      )
                    }
                    return (
                      <div key={t} className="border-b mb-2 pb-2">
                        <p>Turno {t}</p>
                        <p>Rating: {dataTurno.rating}</p>
                        <div>{renderStars(dataTurno.rating)}</div>
                        {dataTurno.photo && (
                          <img
                            src={dataTurno.photo}
                            alt="Foto"
                            className="w-32 h-32 object-cover mt-2"
                          />
                        )}
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
