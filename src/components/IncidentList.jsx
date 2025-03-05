"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  CheckCheck,
  Calendar,
  Timer,
  ArrowRight,
  Target,
  BarChart,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"

const API_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/news`
  : "http://localhost:3001/api/news"

const STATUS_BADGES = {
  pending: { label: "Pendiente", variant: "outline", icon: Clock },
  active: { label: "En Proceso", variant: "warning", icon: AlertCircle },
  in_process: { label: "En Proceso", variant: "warning", icon: AlertCircle },
  resolved: { label: "Resuelto", variant: "success", icon: CheckCircle2 },
  closed: { label: "Aprobado", variant: "default", icon: CheckCheck },
}

// Remove or comment out this import if it exists
// import { formatDateTime } from "@/lib/utils"

// Keep using the local formatDateTime function that was working before
function formatDateTime(dateString) {
  if (!dateString) return ""

  try {
    if (dateString.match(/^\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}$/)) {
      return dateString
    }

    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      console.error("Fecha inválida:", dateString)
      return ""
    }

    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")

    return `${day}/${month}/${year}, ${hours}:${minutes}`
  } catch (error) {
    console.error("Error al formatear fecha:", error)
    return ""
  }
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

function shouldShowAttention(incident) {
  if (incident.is_scheduled && incident.status === "pending") {
    const scheduledDate = parseSpanishDateTime(incident.scheduled_start)
    if (!scheduledDate) return false

    const now = new Date()
    const scheduledDateTime = new Date(
      scheduledDate.year,
      scheduledDate.month,
      scheduledDate.day,
      scheduledDate.hours,
      scheduledDate.minutes,
    )

    return now.getTime() >= scheduledDateTime.getTime()
  }

  return false
}

function GoalBadge({ goal }) {
  if (!goal) return null

  const getGoalValue = () => {
    if (goal.measurement_type === "percentage") {
      return `${goal.target_percentage}%`
    }
    if (goal.measurement_type === "value") {
      return goal.target_value
    }
    return goal.target_resolution
  }

  const getGoalIcon = () => {
    switch (goal.measurement_type) {
      case "percentage":
        return <BarChart className="w-4 h-4" />
      case "value":
        return <Target className="w-4 h-4" />
      default:
        return <CheckCircle2 className="w-4 h-4" />
    }
  }

  return (
    <div className="flex items-center gap-2">
      {getGoalIcon()}
      <div>
        <div className="font-medium">Objetivo: {getGoalValue()}</div>
        <div className="text-sm text-muted-foreground">{goal.description}</div>
      </div>
    </div>
  )
}

export function IncidentList({ incidents, updateIncidentStatus, isUpdating }) {
  const { user } = useAuth()

  if (incidents.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center text-muted-foreground flex flex-col items-center gap-2">
          <div className="rounded-full bg-muted p-3">
            <Clock className="h-6 w-6" />
          </div>
          <p>No hay novedades para mostrar</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-3">
      {incidents.map((incident) => {
        const statusConfig = STATUS_BADGES[incident.status] || STATUS_BADGES.pending
        const StatusIcon = statusConfig.icon
        const isTaskOverdue =
          incident.is_scheduled && incident.status === "pending" && new Date(incident.scheduled_start) < new Date()
        const needsAttention = shouldShowAttention(incident)

        return (
          <Card
            key={incident.id}
            className={cn("relative transition-all duration-200 hover:shadow-md", {
              "bg-status-active border-warning/50": incident.status === "in_process",
              "bg-status-resolved border-success/50": incident.status === "resolved",
              "blink-overdue border-destructive/50": isTaskOverdue,
            })}
          >
            <CardHeader className="p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-medium line-clamp-1">{incident.title}</CardTitle>
                    <Badge variant={statusConfig.variant} className="flex items-center gap-1.5 px-2 py-0.5">
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig.label}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      {formatDateTime(incident.created_at)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      <span>Turno: {calcularTurno(incident.created_at)}</span>
                    </div>
                    {incident.is_scheduled && (
                      <Badge
                        variant={isTaskOverdue ? "destructive" : "secondary"}
                        className="flex items-center gap-1.5"
                      >
                        <Timer className="w-3 h-3" />
                        <span>Programada: {formatDateTime(incident.scheduled_start)}</span>
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            {incident.goal && (
              <div className="px-4 py-2 bg-muted/20 border-t border-b">
                <GoalBadge goal={incident.goal} />
                {incident.goal.progress_percentage !== null && (
                  <div className="mt-2">
                    <div className="text-xs font-medium mb-1">Progreso del objetivo:</div>
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div
                        className="bg-primary h-2.5 rounded-full"
                        style={{ width: `${incident.goal.progress_percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <CardContent className="p-4 pt-0">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{incident.description}</p>
                {incident.resolution_notes && (
                  <div className="text-sm bg-muted/50 p-3 rounded-lg">
                    <p className="font-medium text-xs mb-1">Notas de resolución:</p>
                    <p className="text-muted-foreground">{incident.resolution_notes}</p>
                  </div>
                )}
                <div className="flex flex-wrap justify-end gap-2 pt-2">
                  {(incident.status === "pending" || (incident.is_scheduled && isTaskOverdue)) && (
                    <Button
                      onClick={() => updateIncidentStatus(incident.id, "active")}
                      size="sm"
                      variant={isTaskOverdue ? "destructive" : "default"}
                      disabled={isUpdating}
                      className={cn("transition-all duration-300 gap-2", {
                        "animate-attention": needsAttention,
                      })}
                    >
                      Iniciar
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                  {incident.status === "in_process" && (
                    <Button
                      onClick={() => updateIncidentStatus(incident.id, "resolved")}
                      size="sm"
                      disabled={isUpdating}
                      className="gap-2"
                    >
                      Resolver
                      <CheckCircle2 className="w-4 h-4" />
                    </Button>
                  )}
                  {incident.status === "resolved" && user?.role === "jefe_juego" && (
                    <Button
                      onClick={() => updateIncidentStatus(incident.id, "closed")}
                      size="sm"
                      disabled={isUpdating}
                      className="gap-2"
                    >
                      Aprobar
                      <CheckCheck className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

