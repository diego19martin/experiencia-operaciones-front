"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardAtencion() {
  const { user } = useAuth()
  const router = useRouter()

  // Verifica que sea "coordinador_atencion"
  useEffect(() => {
    if (!user) {
      router.replace("/login")
    } else if (user.role !== "coordinador_atencion") {
      router.replace("/login")
    }
  }, [user, router])

  if (!user || user.role !== "coordinador_atencion") return null

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Dashboard de Atención</h1>
      <p>Bienvenido, {user.name} (Rol: {user.role}).</p>

      {/* Ejemplo de un Card de resumen */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Resumen de Validaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Validaciones completadas hoy: 5 de 8</p>
        </CardContent>
      </Card>

      {/* Botón para ir a la ruta de validaciones de Atención */}
      <Button className="mt-4" onClick={() => router.push("/areas/atencion")}>
        Ir a Validaciones de Atención
      </Button>
    </div>
  )
}
