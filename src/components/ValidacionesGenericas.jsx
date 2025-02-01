"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";
import { ValidationSummary } from "@/components/ValidationSummary";
import { calcularTurno } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function ValidacionesGenericas({ areaId, titulo, textos }) {
  const [items, setItems] = useState([]);
  const [validaciones, setValidaciones] = useState({});
  const [turnoActual, setTurnoActual] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [canProceed, setCanProceed] = useState(false);
  const [mensajeEspera, setMensajeEspera] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchItemsAndValidations = async () => {
      try {
        const turnoId = calcularTurno();
        console.log("Turno Calculado:", turnoId);
  
        // Cargar ítems específicos del área
        console.log(`Cargando ítems del área ${areaId}...`);
        const itemsRes = await fetch(`http://localhost:3001/api/items/area/${areaId}`);
        const itemsData = await itemsRes.json();
        setItems(itemsData);
        console.log("Ítems cargados:", itemsData);
  
        // Cargar validaciones previas
        console.log("Cargando validaciones previas...");
        const prevValidationsRes = await fetch(
          `http://localhost:3001/api/validations?status=pending&area_id=${areaId}&date=${new Date().toISOString().split("T")[0]}&turno=${turnoId}`
        );
        const prevValidationsData = await prevValidationsRes.json();
        console.log("Validaciones previas cargadas:", prevValidationsData);
  
        // Verificar tiempo restante desde la última validación
        if (prevValidationsData.length > 0) {
          const lastValidation = prevValidationsData.reduce((latest, current) =>
            new Date(current.created_at) > new Date(latest.created_at) ? current : latest
          );
  
          const lastValidationTime = new Date(lastValidation.created_at);
          const currentTime = new Date();
          const diffInHours = (currentTime - lastValidationTime) / (1000 * 60 * 60);
  
          if (diffInHours < 2) {
            const remainingMinutes = Math.max(0, (2 - diffInHours) * 60);
            const remainingHours = Math.floor(remainingMinutes / 60);
            const remainingMins = Math.round(remainingMinutes % 60);
  
            setCanProceed(false);
            setMensajeEspera(
              `Debes esperar ${remainingHours > 0 ? `${remainingHours} horas y ` : ""}${remainingMins} minutos para realizar las próximas validaciones.`
            );
          } else {
            setCanProceed(true);
            setMensajeEspera("");
          }
        } else {
          setCanProceed(true);
          setMensajeEspera("");
        }
  
        // Calcular relevamientos completos
        console.log("Calculando relevamientos completos...");
        const relevamientosCompletos = prevValidationsData.reduce((acc, val) => {
          acc[val.relevamiento] = (acc[val.relevamiento] || 0) + 1;
          return acc;
        }, {});
        console.log("Relevamientos completos procesados:", relevamientosCompletos);
  
        // Determinar relevamiento actual
        console.log("Determinando relevamiento pendiente...");
        let relevamientoPendiente = 1;
        for (let relevamiento = 1; relevamiento <= 3; relevamiento++) {
          if ((relevamientosCompletos[relevamiento] || 0) < itemsData.length) {
            relevamientoPendiente = relevamiento;
            break;
          }
        }
        setTurnoActual(relevamientoPendiente);
        console.log("Relevamiento pendiente identificado:", relevamientoPendiente);
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setIsLoading(false);
        console.log("Finalizada la carga de datos.");
      }
    };
  
    fetchItemsAndValidations();
  }, [areaId, turnoActual]); // Eliminado `user` de las dependencias
  

  const handleValidacion = (itemId, puntuacion, foto) => {
    setValidaciones((prev) => ({
      ...prev,
      [itemId]: {
        puntuacion,
        foto: foto || prev[itemId]?.foto,
      },
    }));
  };

  const enviarValidaciones = async () => {
    try {
      const turnoId = calcularTurno();
      for (const itemId in validaciones) {
        const { puntuacion, foto } = validaciones[itemId];
        const body = {
          item_id: Number.parseInt(itemId),
          area_id: areaId, // Usar `area_id` en lugar de `user_id`
          rating: puntuacion,
          comment: "",
          photo: foto || null,
          turno_id: turnoId,
          relevamiento: turnoActual,
        };
  
        const response = await fetch("http://localhost:3001/api/validations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Error enviando validaciones");
        }
      }
  
      setIsModalOpen(true); // Abrir modal después del envío exitoso
  
      if (turnoActual < 3) {
        setTurnoActual(turnoActual + 1);
      } else {
        alert("Todos los relevamientos del turno han sido completados.");
        setCanProceed(false);
      }
  
      setValidaciones({});
    } catch (error) {
      console.error("Error al enviar validaciones:", error.message);
      alert(error.message);
    }
  };
  

  return (
    <div className="container mx-auto p-4">
      {mensajeEspera && <div className="mb-4 p-4 border border-yellow-200 bg-yellow-50">{mensajeEspera}</div>}

      <h1 className="text-3xl font-bold mb-6">{titulo}</h1>

      <ValidationSummary
        totalValidations={3 * items.length}
        completedValidations={Object.keys(validaciones).length}
        averageScore={
          Object.values(validaciones).reduce((sum, val) => sum + val.puntuacion, 0) /
            Object.keys(validaciones).length || 0
        }
      />

      <h2 className="text-2xl font-bold mt-8 mb-4">
        {textos.turnoActual}: {turnoActual} de 3
      </h2>

      {isLoading ? (
        <p>{textos.cargandoItems}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
                <Card
                key={item.item_id}
                className={`transition-opacity ${
                    canProceed ? "opacity-100" : "opacity-50 pointer-events-none"
                }`}
                >
                <CardHeader>
                    <CardTitle>{item.name || textos.nombreNoDisponible}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="mb-2">
                    {textos.instancia}: {item.instancia?.replace("_", " ") || textos.sinEspecificar}
                    </p>
                    <div className="flex space-x-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                        key={star}
                        className={`cursor-pointer ${
                            star <= (validaciones[item.item_id]?.puntuacion || 0)
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }`}
                        onClick={() => canProceed && handleValidacion(item.item_id, star, null)}
                        />
                    ))}
                    </div>
                    <ImageUpload
                    onImageUpload={(foto) =>
                        canProceed &&
                        handleValidacion(item.item_id, validaciones[item.item_id]?.puntuacion || 0, foto)
                    }
                    />
                </CardContent>
                </Card>
            ))}
            </div>

      )}

      <Button
        className="mt-6"
        onClick={enviarValidaciones}
        disabled={!canProceed || Object.keys(validaciones).length !== items.length}
      >
        {turnoActual < 3
          ? textos.enviarValidacionesTurno.replace("{turnoActual}", turnoActual)
          : textos.enviarValidacionesFinales}
      </Button>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Validaciones Enviadas</DialogTitle>
            <DialogDescription>
              Las validaciones del relevamiento {turnoActual} han sido enviadas con éxito. Quedan en proceso de
              aprobación del jefe de juego.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setIsModalOpen(false)}>Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
