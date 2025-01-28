"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"

export default function DashboardLimpieza() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.replace("/login")
    } else if (user.role !== "jefe_limpieza") {
      router.replace("/login")
    }
  }, [user, router])

  if (!user || user.role !== "jefe_limpieza") return null

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Dashboard de Limpieza</h1>
      <p>Bienvenido, {user.name} (Rol: {user.role}).</p>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Resumen de Validaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Validaciones completadas hoy: 10 de 15</p>
        </CardContent>
      </Card>

      <Button className="mt-4" onClick={() => router.push("/areas/limpieza")}>
        Ir a Validaciones de Limpieza
      </Button>
    </div>
  )
}
