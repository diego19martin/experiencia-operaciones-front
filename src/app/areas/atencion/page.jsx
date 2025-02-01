import ValidacionesGenericas from "@/components/ValidacionesGenericas";

export default function ValidacionesAtencion() {
  return (
    <ValidacionesGenericas
      areaId={2}
      titulo="Validaciones de Atención al Cliente"
      textos={{
        turnoActual: "Turno Actual",
        cargandoItems: "Cargando ítems de atención...",
        nombreNoDisponible: "Nombre no disponible",
        instancia: "Instancia",
        sinEspecificar: "Sin especificar",
        enviarValidacionesTurno: "Enviar Validaciones del Relevamiento {turnoActual}",
        enviarValidacionesFinales: "Enviar Validaciones Finales",
      }}
    />
  );
}
