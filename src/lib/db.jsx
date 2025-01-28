// Simulación de una base de datos
const db = {
    fotos: {},
  }
  
  export const guardarFoto = (id, foto) => {
    db.fotos[id] = foto
    console.log(`Foto guardada para la validación ${id}`)
  }
  
  export const obtenerFoto = (id) => {
    return db.fotos[id]
  }
  
  