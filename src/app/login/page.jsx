"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"
import Swal from "sweetalert2"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: "", password: "" })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const getDashboardRoute = (role) => {
    const routes = {
      jefe_juego: "/dashboard/juego",
      jefe_limpieza: "/dashboard/limpieza",
      jefe_atencion: "/dashboard/atencion",
      jefe_operaciones: "/dashboard/operaciones",
    }
    return routes[role] || "/dashboard"
  }

  const showErrorAlert = (message) => {
    Swal.fire({
      title: "Error",
      text: message,
      icon: "error",
      confirmButtonText: "Aceptar",
      confirmButtonColor: "#000",
      background: "#fff",
      customClass: {
        confirmButton: "px-4 py-2 bg-black text-white rounded hover:bg-gray-800",
      },
    })
  }

  const showSuccessAlert = (user) => {
    Swal.fire({
      title: "¡Bienvenido!",
      text: `Inicio de sesión exitoso como ${user.name}`,
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
      background: "#fff",
      didClose: () => {
        router.push(getDashboardRoute(user.role))
      },
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 401) {
          showErrorAlert("Contraseña incorrecta. Por favor, verifica tus credenciales.")
          return
        }
        throw new Error(data.message || "Error al iniciar sesión")
      }

      if (data.token && data.user) {
        await login(data.token, data.user)
        showSuccessAlert(data.user)
      }
    } catch (err) {
      console.error("Error de login:", err)
      showErrorAlert(err.message || "Error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-[400px] mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Iniciar Sesión</CardTitle>
        <CardDescription className="text-muted-foreground">
          Ingresa tus credenciales para acceder al sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <Button type="submit" className="w-full bg-black hover:bg-gray-800 text-white" disabled={loading}>
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            ¿No tienes una cuenta?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Regístrate aquí
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}

