"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle, Pencil, Trash2 } from "lucide-react"

export default function ConfiguracionJefeJuego() {
  const [areas, setAreas] = useState([])
  const [areaActual, setAreaActual] = useState(null)

  const [nuevoItem, setNuevoItem] = useState("")
  const [nuevaInstancia, setNuevaInstancia] = useState("ingreso")
  const [editandoItem, setEditandoItem] = useState(null)

  // 1) Cargar las áreas + items desde el backend
  useEffect(() => {
    fetch("http://localhost:3001/api/areas")
      .then(res => res.json())
      .then(data => {
        setAreas(data)
        setAreaActual(data[0]) // por defecto la primera
      })
      .catch(err => console.error(err))
  }, [])

  // 2) Función para cambiar el Tab
  const cambiarArea = (areaNombre) => {
    const nuevaArea = areas.find((a) => a.name === areaNombre)
    setAreaActual(nuevaArea)
    setEditandoItem(null)
    setNuevoItem("")
    setNuevaInstancia("ingreso")
  }

  // 3) Agregar un ítem => POST /api/items
  const agregarItem = async () => {
    if (!nuevoItem || !nuevaInstancia) return
    try {
      const body = {
        area_id: areaActual.area_id,
        name: nuevoItem,
        instancia: nuevaInstancia
      }
      const res = await fetch("http://localhost:3001/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })
      const newItem = await res.json()

      // Actualizar el estado local
      const updatedAreas = areas.map(area => {
        if (area.area_id === areaActual.area_id) {
          return {
            ...area,
            items: [...area.items, newItem]
          }
        }
        return area
      })
      setAreas(updatedAreas)

      // Reset del formulario
      setNuevoItem("")
      setNuevaInstancia("ingreso")

    } catch (error) {
      console.error("Error creando ítem:", error)
    }
  }

  // 4) Editar Ítem => guardamos en state y luego PUT
  const editarItem = (item) => {
    setEditandoItem(item)
    setNuevoItem(item.name)
    setNuevaInstancia(item.instancia)
  }

  const guardarEdicion = async () => {
    if (!editandoItem) return
    try {
      const body = {
        name: nuevoItem,
        instancia: nuevaInstancia
      }
      await fetch(`http://localhost:3001/api/items/${editandoItem.item_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })

      // Actualizar estado local
      const updatedAreas = areas.map(area => {
        if (area.area_id === areaActual.area_id) {
          return {
            ...area,
            items: area.items.map(item => {
              if (item.item_id === editandoItem.item_id) {
                return { ...item, name: nuevoItem, instancia: nuevaInstancia }
              }
              return item
            })
          }
        }
        return area
      })
      setAreas(updatedAreas)

      // Reset
      setEditandoItem(null)
      setNuevoItem("")
      setNuevaInstancia("ingreso")
    } catch (error) {
      console.error("Error editando ítem:", error)
    }
  }

  // 5) Eliminar Ítem => DELETE
  const eliminarItem = async (itemId) => {
    try {
      await fetch(`http://localhost:3001/api/items/${itemId}`, { method: "DELETE" })
      // Actualizar estado local
      const updatedAreas = areas.map(area => {
        if (area.area_id === areaActual.area_id) {
          return {
            ...area,
            items: area.items.filter(item => item.item_id !== itemId)
          }
        }
        return area
      })
      setAreas(updatedAreas)
    } catch (error) {
      console.error("Error eliminando ítem:", error)
    }
  }

  if (!areaActual) {
    return <p>Cargando Áreas...</p>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Configuración de Ítems a Relevar</h1>

      <Tabs defaultValue={areaActual.name} onValueChange={cambiarArea}>
        <TabsList className="grid w-full grid-cols-3">
          {areas.map((area) => (
            <TabsTrigger key={area.area_id} value={area.name}>
              {area.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {areas.map((area) => (
          <TabsContent key={area.area_id} value={area.name}>
            <Card>
              <CardHeader>
                <CardTitle>{area.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* FORM para agregar/editar ítem */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="item-nombre">Nombre del ítem</Label>
                      <Input
                        id="item-nombre"
                        value={nuevoItem}
                        onChange={(e) => setNuevoItem(e.target.value)}
                        placeholder="Ingrese el nombre del ítem"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="item-instancia">Instancia del viaje</Label>
                      <Select value={nuevaInstancia} onValueChange={setNuevaInstancia}>
                        <SelectTrigger id="item-instancia">
                          <SelectValue placeholder="Seleccione la instancia" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ingreso">Ingreso</SelectItem>
                          <SelectItem value="experiencia_en_maquina">Experiencia en máquina</SelectItem>
                          <SelectItem value="pausa">Pausa</SelectItem>
                          <SelectItem value="salida">Salida</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      {editandoItem ? (
                        <Button onClick={guardarEdicion} className="w-full">
                          Guardar Cambios
                        </Button>
                      ) : (
                        <Button onClick={agregarItem} className="w-full">
                          <PlusCircle className="mr-2 h-4 w-4" /> Agregar Ítem
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* LISTADO de Ítems */}
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Ítems Configurados</h3>
                    {area.items.length === 0 ? (
                      <p className="text-muted-foreground">No hay ítems configurados para esta área.</p>
                    ) : (
                      <ul className="space-y-2">
                        {area.items.map((item) => (
                          <li
                            key={item.item_id}
                            className="flex justify-between items-center p-2 bg-muted rounded-md"
                          >
                            <span>
                              {item.name} -{" "}
                              <span className="text-muted-foreground">
                                {item.instancia.replace("_", " ")}
                              </span>
                            </span>
                            <div>
                              <Button variant="ghost" size="sm" onClick={() => editarItem(item)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => eliminarItem(item.item_id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
