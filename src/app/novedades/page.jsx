"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { IncidentForm } from "@/components/IncidentForm"
import { IncidentList } from "@/components/IncidentList"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { getRoleArea } from "@/lib/role-utils"
import { Plus, X, ListPlus, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const API_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/news`
  : "http://localhost:3001/api/news"

export default function NovedadesPage() {
  const [incidents, setIncidents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    fetchIncidents()
  }, [])

  const fetchIncidents = async () => {
    try {
      setError("")
      setIsLoading(true)
      const response = await fetch(API_URL)
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)
      const data = await response.json()

      const filteredData = data.filter((incident) => {
        return user?.role === "jefe_juego" || incident.area === getRoleArea(user?.role)
      })

      console.log("Filtered data:", filteredData);
      

      setIncidents(filteredData)
    } catch (error) {
      console.error("Error:", error)
      setError("Error al cargar novedades")
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al cargar novedades. Por favor, intente nuevamente.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateIncidentStatus = async (id, newStatus) => {
    if (!user?.email) return
    try {
      setIsUpdating(true)
      const response = await fetch(`${API_URL}/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          status: newStatus === "active" ? "in_process" : newStatus,
          updated_by: user.email,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.details || "Error al actualizar la novedad")
      }

      toast({
        title: "Novedad actualizada",
        description: `La novedad se ha ${
          newStatus === "active" ? "iniciado" : newStatus === "resolved" ? "resuelto" : "aprobado"
        } correctamente`,
      })

      await fetchIncidents()
    } catch (error) {
      console.error("Error al actualizar:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Error al actualizar la novedad",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const currentTurno = calcularTurno()
  const pendingIncidents = incidents.filter((incident) => incident.status === "pending" && !incident.is_scheduled)
  const inProgressIncidents = incidents.filter((incident) => incident.status === "in_process")
  const scheduledIncidents = incidents.filter((incident) => incident.is_scheduled && incident.status === "pending")
  const pastIncidents = incidents.filter(
    (incident) => calcularTurno(incident.created_at) !== currentTurno && incident.status === "resolved",
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>{error}</p>
        <Button onClick={fetchIncidents} variant="outline" className="mt-2">
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Novedades</h1>
          <Button onClick={() => setShowForm(!showForm)} variant="outline" className="gap-2">
            {showForm ? (
              <>
                <X className="h-4 w-4" />
                Ocultar Formulario
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Nueva Novedad
              </>
            )}
          </Button>
        </div>

        {showForm && (
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <IncidentForm onSubmit={fetchIncidents} />
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6">
          <section>
            <div className="flex items-center gap-2 mb-6">
              <ListPlus className="h-5 w-5" />
              <h2 className="text-2xl font-semibold">Novedades Actuales</h2>
            </div>
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground"></span>
                  Pendientes ({pendingIncidents.length})
                </h3>
                <IncidentList
                  incidents={pendingIncidents}
                  updateIncidentStatus={updateIncidentStatus}
                  isUpdating={isUpdating}
                />
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-warning"></span>
                  Iniciadas ({inProgressIncidents.length})
                </h3>
                <IncidentList
                  incidents={inProgressIncidents}
                  updateIncidentStatus={updateIncidentStatus}
                  isUpdating={isUpdating}
                />
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary"></span>
                  Programadas ({scheduledIncidents.length})
                </h3>
                <IncidentList
                  incidents={scheduledIncidents}
                  updateIncidentStatus={updateIncidentStatus}
                  isUpdating={isUpdating}
                />
              </div>
            </div>
          </section>

          {pastIncidents.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-6">
                <Clock className="h-5 w-5" />
                <h2 className="text-2xl font-semibold">Novedades de Turnos Pasados ({pastIncidents.length})</h2>
              </div>
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                <IncidentList
                  incidents={pastIncidents}
                  updateIncidentStatus={updateIncidentStatus}
                  isUpdating={isUpdating}
                />
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

function calcularTurno(dateString) {
  try {
    if (!dateString) {
      const now = new Date()
      const currentHour = now.getHours()
      if (currentHour >= 6 && currentHour < 14) return "Mañana"
      if (currentHour >= 14 && currentHour < 22) return "Tarde"
      return "Noche"
    }

    const parsedDate = parseSpanishDateTime(dateString)
    if (!parsedDate) {
      console.error("Error al parsear fecha:", dateString)
      return "Mañana"
    }

    const { hours } = parsedDate

    if (hours >= 6 && hours < 14) {
      return "Mañana"
    } else if (hours >= 14 && hours < 22) {
      return "Tarde"
    } else {
      return "Noche"
    }
  } catch (error) {
    console.error("Error al calcular turno:", error)
    return "Mañana"
  }
}

function parseSpanishDateTime(dateString) {
  if (!dateString) return null

  try {
    if (dateString.includes("T") || dateString.includes("-")) {
      const date = new Date(dateString)
      if (!isNaN(date.getTime())) {
        return {
          hours: date.getHours(),
          minutes: date.getMinutes(),
          day: date.getDate(),
          month: date.getMonth(),
          year: date.getFullYear(),
        }
      }
    }

    const [datePart, timePart] = dateString.split(", ")
    if (!datePart || !timePart) return null

    const [day, month, year] = datePart.split("/")
    const [hours, minutes] = timePart.split(":")

    return {
      hours: Number.parseInt(hours, 10),
      minutes: Number.parseInt(minutes, 10),
      day: Number.parseInt(day, 10),
      month: Number.parseInt(month, 10) - 1,
      year: Number.parseInt(year, 10),
    }
  } catch (error) {
    console.error("Error parsing date:", error)
    return null
  }
}

