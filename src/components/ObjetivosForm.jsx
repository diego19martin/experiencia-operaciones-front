"use client"
import React from 'react';
import { useState, useEffect } from 'react'
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { calcularTurno } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ObjetivosForm({ objetivoId }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [areas, setAreas] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    area: '',
    measurementType: 'percentage',
    targetPercentage: '',
    targetValue: '',
    targetResolution: '',
    // Inicializar targets por turno
    turnoTargets: [
      { turno_id: 1, target_value: '', target_percentage: '', target_resolution: '' },
      { turno_id: 2, target_value: '', target_percentage: '', target_resolution: '' },
      { turno_id: 3, target_value: '', target_percentage: '', target_resolution: '' }
    ]
  })

  // Cargar objetivo si estamos editando
  useEffect(() => {
    if (objetivoId) {
      const fetchObjetivo = async () => {
        setIsLoading(true)
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/goals/${objetivoId}`)
          if (!response.ok) throw new Error('Error cargando objetivo')
          
          const data = await response.json()
          
          // Inicializar turnoTargets si no existen
          const turnoTargets = data.turnoTargets || [
            { turno_id: 1, target_value: '', target_percentage: '', target_resolution: '' },
            { turno_id: 2, target_value: '', target_percentage: '', target_resolution: '' },
            { turno_id: 3, target_value: '', target_percentage: '', target_resolution: '' }
          ];
          
          setFormData({
            name: data.name,
            description: data.description || '',
            area: data.area_id?.toString() || '',
            measurementType: data.measurement_type,
            targetPercentage: data.target_percentage?.toString() || '',
            targetValue: data.target_value?.toString() || '',
            targetResolution: data.target_resolution || '',
            turnoTargets
          })
        } catch (error) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive"
          })
        } finally {
          setIsLoading(false)
        }
      }
      
      fetchObjetivo()
    }
  }, [objetivoId, toast])

  // Cargar áreas
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const areasResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/areas`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        })

        if (!areasResponse.ok) {
          throw new Error('Error cargando áreas')
        }

        const areasData = await areasResponse.json()
        const validAreas = areasData.filter(area => area && area.area_id && area.name)
        setAreas(validAreas)

      } catch (error) {
        toast({
          title: "Error de Carga",
          description: error.message,
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [toast])

  // Manejar cambios en inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Manejar cambios en inputs de turno
  const handleTurnoInputChange = (turnoId, field, value) => {
    setFormData(prev => ({
      ...prev,
      turnoTargets: prev.turnoTargets.map(target => 
        target.turno_id === turnoId 
          ? { ...target, [field]: value }
          : target
      )
    }))
  }

  // Enviar formulario
const handleSubmit = async (e) => {
  e.preventDefault()
  setIsLoading(true)
  
  // Validaciones básicas
  if (!formData.area) {
    toast({
      title: "Error",
      description: "Debe seleccionar un área",
      variant: "destructive"
    })
    setIsLoading(false)
    return
  }

  try {
    // Preparar datos para el envío
    const payload = {
      name: formData.name,
      description: formData.description,
      area: formData.area,
      measurementType: formData.measurementType,
      targetPercentage: formData.targetPercentage,
      targetValue: formData.targetValue,
      targetResolution: formData.targetResolution,
      // Filtrar solo targets con valores
      turnoTargets: formData.turnoTargets.filter(target => 
        target.target_percentage || target.target_value || target.target_resolution
      )
    }

    console.log("Enviando datos:", payload);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/goals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (response.ok) {
      toast({
        title: "Objetivo Creado",
        description: "El objetivo se ha creado exitosamente",
      })
      
      // Resetear formulario
      setFormData({
        name: '',
        description: '',
        area: '',
        measurementType: 'percentage',
        targetPercentage: '',
        targetValue: '',
        targetResolution: '',
        turnoTargets: [
          { turno_id: 1, target_value: '', target_percentage: '', target_resolution: '' },
          { turno_id: 2, target_value: '', target_percentage: '', target_resolution: '' },
          { turno_id: 3, target_value: '', target_percentage: '', target_resolution: '' }
        ]
      })
    } else {
      const errorData = await response.json()
      throw new Error(errorData.message || errorData.error || 'Error al crear objetivo')
    }
  } catch (error) {
    console.error("Error en el frontend:", error);
    toast({
      title: "Error",
      description: error.message,
      variant: "destructive"
    })
  } finally {
    setIsLoading(false)
  }
}
  // Solo Jefe de Juego puede ver el formulario
  if (user?.role !== "jefe_juego") {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-muted-foreground">
          No tienes permisos para crear objetivos.
        </p>
      </div>
    )
  }

  // Función para obtener el nombre del turno
  const getTurnoName = (turnoId) => {
    switch (turnoId) {
      case 1: return 'Mañana';
      case 2: return 'Tarde';
      case 3: return 'Noche';
      default: return `Turno ${turnoId}`;
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{objetivoId ? "Editar Objetivo" : "Crear Nuevo Objetivo"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selector de Área */}
          <div>
            <Label>Área</Label>
            <Select 
              value={formData.area} 
              onValueChange={(value) => setFormData(prev => ({...prev, area: value}))}
              required
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un área" />
              </SelectTrigger>
              <SelectContent>
                {areas.filter(area => area && area.area_id).map(area => (
                  <SelectItem 
                    key={area.area_id}
                    value={area.area_id.toString()}
                  >
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nombre del Objetivo */}
          <div>
            <Label>Nombre del Objetivo</Label>
            <Input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Nombre descriptivo del objetivo"
              required
              disabled={isLoading}
            />
          </div>

          {/* Descripción */}
          <div>
            <Label>Descripción</Label>
            <Input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Descripción detallada del objetivo"
              disabled={isLoading}
            />
          </div>

          {/* Tipo de Medición */}
          <div>
            <Label>Tipo de Medición</Label>
            <Select 
              value={formData.measurementType}
              onValueChange={(value) => setFormData(prev => ({...prev, measurementType: value}))}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona tipo de medición" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Porcentaje</SelectItem>
                <SelectItem value="value">Valor Numérico</SelectItem>
                <SelectItem value="resolution">Resolución</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Campos de Meta Global según Tipo de Medición */}
          <div className="p-4 border rounded-md bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Meta Global</h3>
            
            {formData.measurementType === 'percentage' && (
              <div>
                <Label>Porcentaje Objetivo Global</Label>
                <Input
                  type="number"
                  name="targetPercentage"
                  value={formData.targetPercentage}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  placeholder="Porcentaje objetivo (0-100)"
                  required
                  disabled={isLoading}
                />
              </div>
            )}

            {formData.measurementType === 'value' && (
              <div>
                <Label>Valor Objetivo Global</Label>
                <Input
                  type="number"
                  name="targetValue"
                  value={formData.targetValue}
                  onChange={handleInputChange}
                  placeholder="Valor numérico objetivo"
                  required
                  disabled={isLoading}
                />
              </div>
            )}

            {formData.measurementType === 'resolution' && (
              <div>
                <Label>Resolución Objetivo Global</Label>
                <Input
                  type="text"
                  name="targetResolution"
                  value={formData.targetResolution}
                  onChange={handleInputChange}
                  placeholder="Descripción de la resolución"
                  required
                  disabled={isLoading}
                />
              </div>
            )}
          </div>

          {/* Sección de Metas por Turno */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Metas por Turno</h3>
              <p className="text-xs text-muted-foreground">Opcional</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Define valores específicos para cada turno. Si no se especifican valores, se utilizará la meta global proporcionalmente.
            </p>
            
            <Tabs defaultValue="1" className="w-full">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="1">Mañana</TabsTrigger>
                <TabsTrigger value="2">Tarde</TabsTrigger>
                <TabsTrigger value="3">Noche</TabsTrigger>
              </TabsList>
              
              {formData.turnoTargets.map(turnoTarget => (
                <TabsContent 
                  key={turnoTarget.turno_id} 
                  value={turnoTarget.turno_id.toString()} 
                  className="p-4 border rounded-md space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Configuración para: {getTurnoName(turnoTarget.turno_id)}</h4>
                  </div>
                  
                  {formData.measurementType === 'percentage' && (
                    <div>
                      <Label>Porcentaje Objetivo para {getTurnoName(turnoTarget.turno_id)}</Label>
                      <Input
                        type="number"
                        value={turnoTarget.target_percentage}
                        onChange={(e) => handleTurnoInputChange(
                          turnoTarget.turno_id, 
                          'target_percentage', 
                          e.target.value
                        )}
                        min="0"
                        max="100"
                        placeholder={`Porcentaje específico para ${getTurnoName(turnoTarget.turno_id)}`}
                        disabled={isLoading}
                      />
                    </div>
                  )}
                  
                  {formData.measurementType === 'value' && (
                    <div>
                      <Label>Valor Objetivo para {getTurnoName(turnoTarget.turno_id)}</Label>
                      <Input
                        type="number"
                        value={turnoTarget.target_value}
                        onChange={(e) => handleTurnoInputChange(
                          turnoTarget.turno_id, 
                          'target_value', 
                          e.target.value
                        )}
                        placeholder={`Valor específico para ${getTurnoName(turnoTarget.turno_id)}`}
                        disabled={isLoading}
                      />
                    </div>
                  )}
                  
                  {formData.measurementType === 'resolution' && (
                    <div>
                      <Label>Resolución Objetivo para {getTurnoName(turnoTarget.turno_id)}</Label>
                      <Input
                        type="text"
                        value={turnoTarget.target_resolution}
                        onChange={(e) => handleTurnoInputChange(
                          turnoTarget.turno_id, 
                          'target_resolution', 
                          e.target.value
                        )}
                        placeholder={`Descripción específica para ${getTurnoName(turnoTarget.turno_id)}`}
                        disabled={isLoading}
                      />
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? 'Procesando...' : objetivoId ? 'Actualizar Objetivo' : 'Crear Objetivo'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}