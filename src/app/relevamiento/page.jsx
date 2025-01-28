"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const areas = {
  "Atención al Cliente": {
    responsable: "Coordinador de Atención al Cliente",
    items: ["Atención en recepción", "Gestión de quejas", "Tiempo de espera"],
  },
  Limpieza: {
    responsable: "Jefe de Turno de Limpieza",
    items: ["Limpieza de baños", "Limpieza de áreas comunes", "Manejo de residuos"],
  },
  Juego: {
    responsable: "Jefe Principal de Juego",
    items: ["Estado de las mesas de juego", "Funcionamiento de máquinas", "Supervisión de croupiers"],
  },
}

export default function Relevamiento() {
  const [areaSeleccionada, setAreaSeleccionada] = useState("")
  const [turno, setTurno] = useState(1)
  const [relevamientos, setRelevamientos] = useState({})

  useEffect(() => {
    setAreaSeleccionada("Atención al Cliente")
  }, [])

  const actualizarRelevamiento = (item, valor) => {
    setRelevamientos((prev) => ({ ...prev, [item]: valor }))
  }

  const enviarRelevamiento = () => {
    console.log("Relevamiento enviado:", { area: areaSeleccionada, turno, relevamientos })
    alert("Relevamiento enviado con éxito")
    setTurno((prev) => Math.min(prev + 1, 3))
    setRelevamientos({})
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Relevamiento de {areaSeleccionada}</h1>
      <div className="flex justify-between items-center">
        <p>Responsable: {areas[areaSeleccionada]?.responsable}</p>
        <p>Turno actual: {turno} de 3</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {areas[areaSeleccionada]?.items.map((item) => (
          <Card key={item}>
            <CardHeader>
              <CardTitle>{item}</CardTitle>
            </CardHeader>
            <CardContent>
              <Select onValueChange={(value) => actualizarRelevamiento(item, value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a_mejorar">A mejorar</SelectItem>
                  <SelectItem value="en_condiciones">En condiciones</SelectItem>
                  <SelectItem value="sobresaliente">Sobresaliente</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        ))}
      </div>
      <Button
        onClick={enviarRelevamiento}
        disabled={Object.keys(relevamientos).length !== areas[areaSeleccionada]?.items.length}
      >
        Enviar Relevamiento
      </Button>
    </div>
  )
}

