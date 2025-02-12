"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Clock, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "./ui/use-toast"

// Asegurarnos de usar el puerto correcto del backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export function IncidentsList() {
  const [incidents, setIncidents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    fetchIncidents()
  }, [])

  const fetchIncidents = async () => {
    try {
      setError("")
      setIsLoading(true)

      const response = await fetch(`${API_URL}/api/incidents`)

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setIncidents(data)
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

  const resolveIncident = async (id) => {
    if (!user) return

    try {
      const response = await fetch(`${API_URL}/api/incidents/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "resolved",
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      toast({
        title: "Novedad resuelta",
        description: "La novedad se ha marcado como resuelta",
      })

      await fetchIncidents()
    } catch (error) {
      console.error("Error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al resolver la novedad",
      })
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return <Badge variant="destructive">Activo</Badge>
      case "in_progress":
        return <Badge variant="warning">En Progreso</Badge>
      case "resolved":
        return <Badge variant="success">Resuelto</Badge>
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">{error}</p>
        <Button onClick={fetchIncidents} className="mt-2">
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Novedades Activas</h2>
        <Button onClick={fetchIncidents} variant="ghost" size="sm">
          Actualizar
        </Button>
      </div>

      {incidents.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">No hay novedades registradas</CardContent>
        </Card>
      ) : (
        incidents.map((incident) => (
          <Card key={incident.id} className="relative">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>{incident.title}</CardTitle>
                {getStatusBadge(incident.status)}
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4 whitespace-pre-wrap">{incident.description}</p>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm text-muted-foreground gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {new Date(incident.created_at).toLocaleString()}
                </div>
                <div>Área: {incident.area}</div>
              </div>
              {incident.status !== "resolved" && (
                <Button
                  onClick={() => resolveIncident(incident.id)}
                  className="mt-4 w-full sm:w-auto"
                  variant="outline"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Marcar como resuelto
                </Button>
              )}
              {incident.resolved_at && (
                <p className="text-sm text-muted-foreground mt-2">
                  Resuelto el: {new Date(incident.resolved_at).toLocaleString()}
                </p>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

