/// Funciones de utilidad para manejo de token
const TOKEN_KEY = "auth_token"
const USER_KEY = "auth_user"

// Función para inferir el área basada en el rol (nueva)
export function inferAreaFromRole(role) {
  if (!role) return null;
  
  if (role.includes('limpieza')) return 1; // Limpieza
  if (role.includes('atencion')) return 2; // Atención al Cliente
  if (role.includes('juego')) return 3; // Juego
  if (role.includes('operaciones')) return 4; // Operaciones
  
  return null;
}

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
        const user = JSON.parse(userStr)
        
        // Nuevo: Asegurarnos de que el área sea un número si existe
        if (user.area && typeof user.area === 'string') {
          user.area = parseInt(user.area, 10)
        }
        
        // Nuevo: Si no tiene área pero tiene un rol del que podemos inferirla
        if ((!user.area || user.area === undefined) && user.role) {
          const inferredArea = inferAreaFromRole(user.role)
          if (inferredArea) {
            console.log(`Inferida área ${inferredArea} basada en rol ${user.role}`)
            user.area = inferredArea
            
            // Actualizar en localStorage silenciosamente
            localStorage.setItem(USER_KEY, JSON.stringify(user))
          }
        }
        
        return user
      } catch (e) {
        console.error("Error parsing user data:", e)
        return null
      }
    }
  }
  return null
}

export async function login(token, userData) {
  // Nuevo: Intentar asignar área si no la tiene
  if (!userData.area && userData.role) {
    const inferredArea = inferAreaFromRole(userData.role)
    if (inferredArea) {
      userData.area = inferredArea
    }
  }
  
  // Nuevo: Asegurarnos de que el área sea un número
  if (userData.area && typeof userData.area === 'string') {
    userData.area = parseInt(userData.area, 10)
  }
  
  setAuthToken(token)
  localStorage.setItem(USER_KEY, JSON.stringify(userData))
  return userData
}

export function logout() {
  removeAuthToken()
  localStorage.removeItem(USER_KEY)
}