"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardJuego() {
  const { user } = useAuth()
  const router = useRouter()

  // Verifica que sea "jefe_juego"
  useEffect(() => {
    if (!user) {
      router.replace("/login")
    } else if (user.role !== "jefe_juego") {
      router.replace("/login")
    }
  }, [user, router])

  if (!user || user.role !== "jefe_juego") return null

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Dashboard de Juego</h1>
      <p>Bienvenido, {user.name} (Rol: {user.role}).</p>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Resumen de Validaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Validaciones completadas hoy: 12 de 15</p>
        </CardContent>
      </Card>

      <div className="mt-4 space-y-2">
        <Button onClick={() => router.push("/areas/juego")}>
          Ir a Validaciones de Juego
        </Button>
        <Button onClick={() => router.push("/novedades")} variant="outline">
          Gestionar Novedades
        </Button>
      </div>
    </div>
  )
}