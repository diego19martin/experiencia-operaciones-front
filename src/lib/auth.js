// Funciones de utilidad para manejo de token
const TOKEN_KEY = "auth_token"
const USER_KEY = "auth_user"

export function getAuthToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem(TOKEN_KEY)
  }
  return null
}

export function setAuthToken(token) {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token)
  }
}

export function removeAuthToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY)
  }
}

// Funciones principales de autenticación
export function getCurrentUser() {
  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem(USER_KEY)
    if (userStr) {
      try {
        return JSON.parse(userStr)
      } catch (e) {
        console.error("Error parsing user data:", e)
        return null
      }
    }
  }
  return null
}

export async function login(token, userData) {
  setAuthToken(token)
  localStorage.setItem(USER_KEY, JSON.stringify(userData))
  return userData
}

export function logout() {
  removeAuthToken()
  localStorage.removeItem(USER_KEY)
}

