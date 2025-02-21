"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { AlertCircle, CheckCircle2, Clock, UserCheck, AlertTriangle, RotateCw } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "./ui/use-toast"

// Update API_URL construction
const API_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/news`
  : "http://localhost:3001/api/news"



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
      const response = await fetch(API_URL)
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)
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

  const updateIncidentStatus = async (id, endpoint, actionName) => {
    if (!user) return
    try {
      const response = await fetch(`${API_URL}/${id}/${endpoint}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          [actionName]: user.id,
        }),
      })

      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)

      toast({
        title: "Novedad actualizada",
        description: "La novedad se ha actualizado correctamente",
      })

      await fetchIncidents()
    } catch (error) {
      console.error("Error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: `Error al ${actionName} la novedad`,
      })
    }
  }

  const getStatusBadge = (incident) => {
    const { status, requires_attention, requires_work } = incident

    if (requires_attention) {
      return (
        <Badge variant="warning" className="flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          Requiere atención
        </Badge>
      )
    }

    if (requires_work) {
      return (
        <Badge variant="warning" className="flex items-center gap-1">
          <RotateCw className="w-4 h-4" />
          Requiere más trabajo
        </Badge>
      )
    }

    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            Pendiente
          </Badge>
        )
      case "in_process":
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" />
            En Proceso
          </Badge>
        )
      case "resolved":
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            Resuelta
          </Badge>
        )
      case "closed":
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <UserCheck className="w-4 h-4" />
            Cerrada
          </Badge>
        )
      default:
        return null
    }
  }

  const renderActionButtons = (incident) => {
    const { status, id } = incident

    switch (status) {
      case "pending":
        return (
          <Button
            onClick={() => updateIncidentStatus(id, "assign", "assignedTo")}
            className="w-full sm:w-auto"
            variant="outline"
          >
            <UserCheck className="mr-2 h-4 w-4" />
            Asignar
          </Button>
        )
      case "in_process":
        return (
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => updateIncidentStatus(id, "resolve", "resolvedBy")}
              className="w-full sm:w-auto"
              variant="outline"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Resolver
            </Button>
            <Button
              onClick={() => updateIncidentStatus(id, "needs-attention", "needsAttention")}
              className="w-full sm:w-auto"
              variant="warning"
            >
              <AlertCircle className="mr-2 h-4 w-4" />
              Requiere atención
            </Button>
            <Button
              onClick={() => updateIncidentStatus(id, "needs-work", "needsWork")}
              className="w-full sm:w-auto"
              variant="warning"
            >
              <RotateCw className="mr-2 h-4 w-4" />
              Requiere trabajo
            </Button>
          </div>
        )
      case "resolved":
        return (
          <Button
            onClick={() => updateIncidentStatus(id, "approve", "approvedBy")}
            className="w-full sm:w-auto"
            variant="outline"
          >
            <UserCheck className="mr-2 h-4 w-4" />
            Aprobar
          </Button>
        )
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
        <h2 className="text-2xl font-bold">Novedades</h2>
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
                {getStatusBadge(incident)}
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
              <div className="mt-4">{renderActionButtons(incident)}</div>
              {incident.resolved_at && (
                <p className="text-sm text-muted-foreground mt-2">
                  Resuelto el: {new Date(incident.resolved_at).toLocaleString()}
                </p>
              )}
              {incident.approved_at && (
                <p className="text-sm text-muted-foreground mt-2">
                  Cerrado el: {new Date(incident.approved_at).toLocaleString()}
                </p>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

