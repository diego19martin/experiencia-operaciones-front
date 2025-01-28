"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardOperaciones() {
  const { user } = useAuth()
  const router = useRouter()

  // Verifica que sea "jefe_operaciones"
  useEffect(() => {
    if (!user) {
      router.replace("/login")
    } else if (user.role !== "jefe_operaciones") {
      router.replace("/login")
    }
  }, [user, router])

  if (!user || user.role !== "jefe_operaciones") return null

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Dashboard de Operaciones</h1>
      <p>Bienvenido, {user.name} (Rol: {user.role}).</p>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Resumen Global</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Validaciones totales hoy: 40 de 50</p>
          <p>Áreas cubiertas: Limpieza, Atención, Juego</p>
        </CardContent>
      </Card>

      <Button className="mt-4" onClick={() => router.push("/areas/operaciones")}>
        Ir a Validaciones de Operaciones
      </Button>
      {/* O links a otras vistas, como Journey Map, etc. */}
    </div>
  )
}
