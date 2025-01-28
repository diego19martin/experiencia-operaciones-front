"use client"

import React, { createContext, useState, useContext, useEffect } from "react"
import { login, logout, getCurrentUser } from "@/lib/auth"

const AuthContext = createContext(undefined)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
    }
  }, [])

  const contextLogin = (role) => {
    const loggedInUser = login(role)
    setUser(loggedInUser)
  }

  const contextLogout = () => {
    logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login: contextLogin, logout: contextLogout }}>{children}</AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

