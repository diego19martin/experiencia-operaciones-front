import ValidacionesGenericas from "@/components/ValidacionesGenericas";

export default function ValidacionesLimpieza() {
  return (
    <ValidacionesGenericas
      areaId={1}
      titulo="Validaciones de Limpieza"
      textos={{
        turnoActual: "Turno Actual",
        cargandoItems: "Cargando ítems de limpieza...",
        nombreNoDisponible: "Nombre no disponible",
        instancia: "Instancia",
        sinEspecificar: "Sin especificar",
        enviarValidacionesTurno: "Enviar Validaciones del Relevamiento {turnoActual}",
        enviarValidacionesFinales: "Enviar Validaciones Finales",
      }}
    />
  );
}
