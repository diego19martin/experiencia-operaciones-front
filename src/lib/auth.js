// Ejemplo muy básico:
let currentUser = null

export const login = (role) => {
  const user = {
    id: "1",
    name: `Usuario con rol ${role}`,
    role: role,
  }
  currentUser = user
  return user
}

export const logout = () => {
  currentUser = null
}

export const getCurrentUser = () => {
  return currentUser
}

