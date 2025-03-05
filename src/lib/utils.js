import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const calcularTurno = () => {
  const ahora = new Date() // Hora actual
  const hora = ahora.getHours()

  // Lógica para determinar el turno
  if (hora >= 6 && hora < 14) {
    return 1 // Turno Mañana
  } else if (hora >= 14 && hora < 22) {
    return 2 // Turno Tarde
  } else {
    return 3 // Turno Noche
  }
}

export function formatDateTime(dateString) {
  if (!dateString) return ""

  try {
    if (dateString.match(/^\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}$/)) {
      return dateString
    }

    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      console.error("Fecha inválida:", dateString)
      return ""
    }

    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")

    return `${day}/${month}/${year}, ${hours}:${minutes}`
  } catch (error) {
    console.error("Error al formatear fecha:", error)
    return ""
  }
}

