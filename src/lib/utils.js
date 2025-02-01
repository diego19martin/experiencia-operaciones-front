import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const calcularTurno = () => {
  const ahora = new Date(); // Hora actual
  const hora = ahora.getHours();

  // Lógica para determinar el turno
  if (hora >= 6 && hora < 14) {
    return 1; // Turno Mañana
  } else if (hora >= 14 && hora < 22) {
    return 2; // Turno Tarde
  } else {
    return 3; // Turno Noche
  }
};


