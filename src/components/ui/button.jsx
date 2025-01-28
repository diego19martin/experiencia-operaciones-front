import React from "react"
import { cn } from "../../lib/utils"

// Ejemplo de un componente Button muy sencillo con variantes de estilos
export function Button({ children, variant = "default", className = "", ...props }) {
  // Define distintas clases según el "variant"
  const variants = {
    default: "bg-blue-500 text-white hover:bg-blue-600",
    secondary: "bg-gray-500 text-white hover:bg-gray-600",
    // Agrega más variantes si lo necesitas
  }

  const buttonClass = cn(
    "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors",
    variants[variant],
    className
  )

  return (
    <button className={buttonClass} {...props}>
      {children}
    </button>
  )
}
