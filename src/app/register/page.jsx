"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/AuthContext"

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleRoleChange = (value) => {
    setForm({ ...form, role: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Asegurarse de que la URL coincida con el backend
      const res = await fetch("http://localhost:3001/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Agregar headers CORS si es necesario
          Accept: "application/json",
        },
        credentials: "include", // Importante para CORS
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.message || "Error al registrar usuario")

      toast({
        title: "Registro exitoso",
        description: "Tu cuenta ha sido creada correctamente",
      })
      router.push("/login?registered=true")
    } catch (err) {
      console.error("Error de registro:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Error al registrar usuario",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-[400px] mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Registro de Usuario</CardTitle>
        <CardDescription className="text-muted-foreground">Crea una nueva cuenta en el sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-foreground">
              Nombre Completo
            </label>
            <Input
              id="name"
              name="name"
              placeholder="Juan Pérez"
              onChange={handleChange}
              required
              className="border-input"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Correo Electrónico
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="correo@ejemplo.com"
              onChange={handleChange}
              required
              className="border-input"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Contraseña
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              onChange={handleChange}
              required
              className="border-input"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="role" className="text-sm font-medium text-foreground">
              Área
            </label>
            <Select onValueChange={handleRoleChange} required>
              <SelectTrigger className="border-input">
                <SelectValue placeholder="Seleccionar área" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jefe_limpieza">Jefe de Limpieza</SelectItem>
                <SelectItem value="jefe_atencion">Jefe de Atención al Cliente</SelectItem>
                <SelectItem value="jefe_operaciones">Jefe de Operaciones</SelectItem>
                <SelectItem value="jefe_juego">Jefe de Juego</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full bg-black hover:bg-gray-800 text-white" disabled={loading}>
            {loading ? "Registrando..." : "Registrarse"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Inicia sesión aquí
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}

