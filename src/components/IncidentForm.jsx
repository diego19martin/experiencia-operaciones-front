"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useAuth } from "@/contexts/AuthContext"
import { calcularTurno } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { getRoleArea } from "@/lib/role-utils"

const API_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/news`
  : "http://localhost:3001/api/news"

const formSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  description: z.string().min(1, "La descripción es requerida"),
  is_scheduled: z.boolean().default(false),
  scheduled_start: z.string().optional(),
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
    },
  })

  const isScheduled = form.watch("is_scheduled")

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
      const payload = {
        ...values,
        created_by: user.email,
        area: getRoleArea(user.role),
        turno: calcularTurno(),
        status: "pending",
        scheduled_start: values.is_scheduled ? values.scheduled_start : null,
      }

      console.log("Enviando novedad:", payload)

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.message || "Error al crear la novedad")
      }

      toast({
        title: "Novedad registrada",
        description: values.is_scheduled
          ? "La novedad se ha programado correctamente"
          : "La novedad se ha registrado correctamente",
      })

      form.reset()
      router.refresh()
    } catch (error) {
      console.error("Error al crear novedad:", error)
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
                    <p className="text-sm text-muted-foreground">Programar para iniciar automáticamente</p>
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

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Enviando..." : "Registrar Novedad"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

