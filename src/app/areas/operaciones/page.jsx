import ValidacionesGenericas from "@/components/ValidacionesGenericas";

export default function ValidacionesLimpieza() {
  return (
    <ValidacionesGenericas
      areaId={3}
      titulo="Validaciones de Operaciones"
      textos={{
        turnoActual: "Turno Actual",
        cargandoItems: "Cargando ítems de Operaciones...",
        nombreNoDisponible: "Nombre no disponible",
        instancia: "Instancia",
        sinEspecificar: "Sin especificar",
        enviarValidacionesTurno: "Enviar Validaciones del Relevamiento {turnoActual}",
        enviarValidacionesFinales: "Enviar Validaciones Finales",
      }}
    />
  );
}
