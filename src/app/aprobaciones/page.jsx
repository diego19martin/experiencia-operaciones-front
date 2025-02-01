"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, MessageCircle, Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function AprobacionesJefeJuego() {
  const [validaciones, setValidaciones] = useState([]);
  const [filtroArea, setFiltroArea] = useState("todas");
  const [comentarioDialogOpen, setComentarioDialogOpen] = useState(false);
  const [comentarioActual, setComentarioActual] = useState("");
  const [currentTurno, setCurrentTurno] = useState(null); // Inicializado como null

  // Calcular el turno actual
  useEffect(() => {
    const calcularTurno = () => {
      const now = new Date();
      const currentHour = now.getHours();

      if (currentHour >= 6 && currentHour < 14) {
        return 1; // Mañana
      } else if (currentHour >= 14 && currentHour < 22) {
        return 2; // Tarde
      } else {
        return 3; // Noche
      }
    };

    const updateTurno = () => {
      setCurrentTurno(calcularTurno());
    };

    updateTurno(); // Inicializa el turno actual
    const interval = setInterval(updateTurno, 60 * 1000); // Actualiza el turno cada minuto

    return () => clearInterval(interval);
  }, []);

  // Fetch de validaciones
  useEffect(() => {
    if (currentTurno === null) return; // Evita fetch si currentTurno no está definido aún

    const fetchValidaciones = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const areaParam = filtroArea !== "todas" ? `&area_id=${filtroArea}` : "";
        const res = await fetch(
          `http://localhost:3001/api/validations?status=pending&turno=${currentTurno}&date=${today}${areaParam}`
        );
        if (!res.ok) {
          throw new Error(`Error en la solicitud: ${res.status}`);
        }
        const data = await res.json();
        setValidaciones(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error al obtener validaciones pendientes:", err);
        setValidaciones([]);
      }
    };

    fetchValidaciones();
  }, [filtroArea, currentTurno]);

  const renderStars = (puntuacion) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <Star key={star} className={`${star <= puntuacion ? "text-yellow-400" : "text-gray-300"} inline-block`} />
    ));
  };

  const aprobarValidacion = async (validationId) => {
    try {
      await fetch(`http://localhost:3001/api/validations/${validationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      setValidaciones((prev) => prev.filter((v) => v.validation_id !== validationId));
    } catch (error) {
      console.error("Error al aprobar validación:", error);
    }
  };

  const rechazarValidacion = async (validationId) => {
    try {
      await fetch(`http://localhost:3001/api/validations/${validationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });
      setValidaciones((prev) => prev.filter((v) => v.validation_id !== validationId));
    } catch (error) {
      console.error("Error al rechazar validación:", error);
    }
  };

  const mostrarComentario = (comentario) => {
    setComentarioActual(comentario);
    setComentarioDialogOpen(true);
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" };
    return new Date(dateString).toLocaleDateString("es-ES", options);
  };

  const renderValidacionesPorInstancia = (validacionesFiltradas, instancia) => {
    const validacionesInstancia = validacionesFiltradas.filter((v) => v.instancia === instancia);
    return (
      <div className="space-y-4 mb-8">
        <h3 className="text-xl font-semibold capitalize bg-gray-100 p-2 rounded">{instancia.replace("_", " ")}</h3>
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {validacionesInstancia.map((validacion) => (
            <Card key={validacion.validation_id} className="hover:shadow-lg">
              <CardHeader>
                <CardTitle>
                  {validacion.item}
                  <Badge>{validacion.rating}/5</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  <strong>Área:</strong> {validacion.area}
                </p>
                <div>{renderStars(validacion.rating)}</div>
                <p>{formatDate(validacion.created_at)}</p>
                <Button onClick={() => aprobarValidacion(validacion.validation_id)}>Aprobar</Button>
                <Button onClick={() => rechazarValidacion(validacion.validation_id)}>Rechazar</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Aprobaciones del Jefe de Juego</h1>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-2 sm:space-y-0">
        <Select onValueChange={setFiltroArea}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filtrar por área" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las áreas</SelectItem>
            <SelectItem value="1">Limpieza</SelectItem>
            <SelectItem value="2">Atención al Cliente</SelectItem>
            <SelectItem value="3">Juego</SelectItem>
            <SelectItem value="4">Operaciones</SelectItem>
          </SelectContent>
        </Select>

        <div className="text-lg font-semibold">
          Turno Actual: {currentTurno === 1 ? "Mañana" : currentTurno === 2 ? "Tarde" : "Noche"}
        </div>
      </div>

      <Tabs defaultValue="relevamiento1" className="space-y-4">
        <TabsList className="w-full sm:w-auto grid grid-cols-3 gap-4">
          <TabsTrigger value="relevamiento1" className="w-full">
            Relevamiento 1
          </TabsTrigger>
          <TabsTrigger value="relevamiento2" className="w-full">
            Relevamiento 2
          </TabsTrigger>
          <TabsTrigger value="relevamiento3" className="w-full">
            Relevamiento 3
          </TabsTrigger>
        </TabsList>

        {[1, 2, 3].map((relevamiento) => (
          <TabsContent key={relevamiento} value={`relevamiento${relevamiento}`}>
            <h2 className="text-2xl font-semibold mb-4">Relevamiento {relevamiento}</h2>
            {renderValidacionesPorInstancia(
              validaciones.filter((v) => v.relevamiento === relevamiento),
              "ingreso"
            )}
            {renderValidacionesPorInstancia(
              validaciones.filter((v) => v.relevamiento === relevamiento),
              "experiencia_en_maquina"
            )}
            {renderValidacionesPorInstancia(
              validaciones.filter((v) => v.relevamiento === relevamiento),
              "pausa"
            )}
            {renderValidacionesPorInstancia(
              validaciones.filter((v) => v.relevamiento === relevamiento),
              "salida"
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={comentarioDialogOpen} onOpenChange={setComentarioDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Comentario del Responsable de Área</DialogTitle>
          </DialogHeader>
          <DialogDescription>{comentarioActual}</DialogDescription>
          <Button onClick={() => setComentarioDialogOpen(false)}>Cerrar</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
