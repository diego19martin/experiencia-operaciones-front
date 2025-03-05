"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useAuth } from "@/contexts/AuthContext"
import { calcularTurno } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { getRoleArea } from "@/lib/role-utils"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

const formSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  description: z.string().min(1, "La descripción es requerida"),
  is_scheduled: z.boolean().default(false),
  scheduled_start: z.string().optional(),
  has_goal: z.boolean().default(false),
  goal_type: z.enum(["percentage", "resolution", "value"]).optional(), // Added "value" type
  goal_value: z.string().optional(),
  goal_description: z.string().optional(),
})

export function IncidentForm() {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      is_scheduled: false,
      scheduled_start: "",
      has_goal: false,
      goal_type: undefined,
      goal_value: "",
      goal_description: "",
    },
  })

  const isScheduled = form.watch("is_scheduled")
  const hasGoal = form.watch("has_goal")
  const goalType = form.watch("goal_type")

  async function onSubmit(values) {
    if (!user?.email) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo obtener la información del usuario",
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Primero creamos la novedad
      const newsPayload = {
        title: values.title,
        description: values.description,
        created_by: user.email,
        area: getRoleArea(user.role),
        turno: calcularTurno(),
        status: "pending",
        scheduled_start: values.is_scheduled ? values.scheduled_start : null,
      }

      const newsResponse = await fetch(`${API_URL}/api/news`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newsPayload),
      })

      if (!newsResponse.ok) {
        throw new Error("Error al crear la novedad")
      }

      const newsData = await newsResponse.json()

      // Si se definió un objetivo, lo creamos y lo asociamos
      if (values.has_goal && values.goal_type) {
        // Validamos que tengamos los datos necesarios según el tipo
        if (values.goal_type === "percentage") {
          if (!values.goal_value || isNaN(Number.parseInt(values.goal_value))) {
            throw new Error("Por favor ingrese un valor porcentual válido")
          }
        } else if (values.goal_type === "value") {
          if (!values.goal_value || isNaN(Number(values.goal_value))) {
            throw new Error("Por favor ingrese un valor numérico válido")
          }
        } else if (!values.goal_value?.trim()) {
          throw new Error("Por favor ingrese un valor de resolución")
        }

        // Construimos el payload según el tipo de objetivo
        const goalPayload = {
          name: `Objetivo para: ${values.title}`,
          description: values.goal_description || `Objetivo asociado a la novedad: ${values.title}`,
          measurement_type: values.goal_type,
          target_percentage: values.goal_type === "percentage" ? Number.parseInt(values.goal_value) : null,
          target_resolution: values.goal_type === "resolution" ? values.goal_value : null,
          target_value: values.goal_type === "value" ? Number(values.goal_value) : null,
        }

        const goalResponse = await fetch(`${API_URL}/api/goals`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(goalPayload),
        })

        if (!goalResponse.ok) {
          const errorData = await goalResponse.json()
          throw new Error(errorData.error || "Error al crear el objetivo")
        }

        const goalData = await goalResponse.json()

        // Asociamos el objetivo a la novedad
        const assignResponse = await fetch(`${API_URL}/api/news/${newsData.id}/assign-goal`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            goalId: goalData.id,
          }),
        })

        if (!assignResponse.ok) {
          throw new Error("Error al asignar el objetivo")
        }
      }

      toast({
        title: "Novedad registrada",
        description: "La novedad y sus objetivos se han registrado correctamente",
      })

      form.reset()
      router.refresh()
    } catch (error) {
      console.error("Error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Error al crear la novedad",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar Nueva Novedad</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Sector 3 cerrado por mantenimiento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe la novedad en detalle..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_scheduled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Tarea Programada</FormLabel>
                    <FormDescription>Programar para iniciar automáticamente</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {isScheduled && (
              <FormField
                control={form.control}
                name="scheduled_start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha y hora de inicio</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="has_goal"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Definir Objetivo</FormLabel>
                    <FormDescription>Establecer un objetivo medible para esta novedad</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {hasGoal && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="goal_type"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Tipo de Objetivo</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="percentage" />
                            </FormControl>
                            <FormLabel className="font-normal">Porcentaje</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="value" />
                            </FormControl>
                            <FormLabel className="font-normal">Valor Numérico</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="resolution" />
                            </FormControl>
                            <FormLabel className="font-normal">Resolución</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="goal_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Objetivo</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type={goalType === "resolution" ? "text" : "number"}
                          placeholder={
                            goalType === "percentage"
                              ? "Ej: 90"
                              : goalType === "value"
                                ? "Ej: 1000"
                                : "Ej: Completar limpieza"
                          }
                          {...(goalType === "percentage"
                            ? {
                                min: 0,
                                max: 100,
                              }
                            : goalType === "value"
                              ? {
                                  min: 0,
                                }
                              : {})}
                        />
                      </FormControl>
                      <FormDescription>
                        {goalType === "percentage"
                          ? "Ingrese un porcentaje entre 0 y 100"
                          : goalType === "value"
                            ? "Ingrese un valor numérico"
                            : "Describa el objetivo a alcanzar"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="goal_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción del Objetivo</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe los detalles del objetivo..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Enviando..." : "Registrar Novedad"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

