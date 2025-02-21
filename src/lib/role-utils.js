export const ROLES = {
    JEFE_JUEGO: "jefe_juego",
    JEFE_ATENCION: "jefe_atencion",
    JEFE_LIMPIEZA: "jefe_limpieza",
    JEFE_OPERACIONES: "jefe_operaciones",
  }
  
  export function canAccessIncident(user, incident, action) {
    if (!user) return false
  
    // Solo jefe_juego puede aprobar
    if (action === "approve") {
      return user.role === ROLES.JEFE_JUEGO && incident.status === "resolved"
    }
  
    // Coordinadores pueden iniciar y resolver sus propias novedades
    const userArea = getRoleArea(user.role)
    const matchesArea = incident.area.toLowerCase() === userArea.toLowerCase()
  
    if (action === "initiate") {
      return matchesArea && incident.status === "pending"
    }
  
    if (action === "resolve") {
      return matchesArea && incident.status === "active"
    }
  
    return false
  }
  
  export function getRoleArea(role) {
    const areaMap = {
      jefe_juego: "Juego",
      jefe_atencion: "Atencion",
      jefe_limpieza: "Limpieza",
      jefe_operaciones: "Operaciones",
    }
  
    return areaMap[role?.toLowerCase()] || role
  }
  
  