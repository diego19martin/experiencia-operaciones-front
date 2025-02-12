"use client"

import { createContext, useState, useContext, useEffect } from "react"
import { login as authLogin, logout as authLogout, getCurrentUser } from "@/lib/auth"

const AuthContext = createContext(undefined)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
    }
    setLoading(false)
  }, [])

  const login = async (token, userData) => {
    const loggedInUser = await authLogin(token, userData)
    setUser(loggedInUser)
    return loggedInUser
  }

  const logout = async () => {
    try {
      await authLogout() // Asumimos que authLogout es asíncrono o lo convertimos en una promesa
      setUser(null)
    } catch (error) {
      console.error("Error durante el logout:", error)
      throw error // Propagamos el error para manejarlo en el componente
    }
  }

  if (loading) {
    return null // O un componente de loading si lo prefieres
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>{children}</AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

