"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function Login() {
  const [selectedRole, setSelectedRole] = useState(undefined)
  const { login } = useAuth()
  const router = useRouter()

  const handleLogin = (role) => {
    login(role)
    switch (role) {
      case "jefe_operaciones":       // <- Nuevo nombre para el rol intermedio
        router.push("/dashboard/operaciones")
        break
      case "jefe_limpieza":
        router.push("/dashboard/limpieza")
        break
      case "coordinador_atencion":
        router.push("/dashboard/atencion")
        break
      case "jefe_juego":            // <- El nuevo rol de mayor perfil
        router.push("/dashboard/juego") 
        break
      default:
        router.push("/dashboard") // o una ruta por defecto
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Iniciar Sesión</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleLogin(selectedRole)
            }}
          >
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Select onValueChange={setSelectedRole}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Selecciona tu rol" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="jefe_operaciones">Jefe de Operaciones</SelectItem>
                    <SelectItem value="jefe_limpieza">Jefe de Limpieza</SelectItem>
                    <SelectItem value="coordinador_atencion">Coordinador de Atención</SelectItem>
                    <SelectItem value="jefe_juego">Jefe de Juego</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={!selectedRole}>
                Iniciar Sesión
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
