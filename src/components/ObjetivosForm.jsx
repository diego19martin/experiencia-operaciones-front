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

export default function ObjetivosForm() {
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
    targetResolution: ''
  })

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
  }, [])

  // Manejar cambios en inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          turnoId: calcularTurno(),
          fecha: new Date().toISOString().split('T')[0]
        })
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
          targetResolution: ''
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al crear objetivo')
      }
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

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Crear Nuevo Objetivo</CardTitle>
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
                {areas.filter(area => area && area.area_id).map(area => {
                  console.log('Renderizando área:', area);
                  return (
                    <SelectItem 
                      key={area.area_id}
                      value={area.area_id.toString()}
                    >
                      {area.name}
                    </SelectItem>
                  );
                })}
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

          {/* Campos de Meta según Tipo de Medición */}
          {formData.measurementType === 'percentage' && (
            <div>
              <Label>Porcentaje Objetivo</Label>
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
              <Label>Valor Objetivo</Label>
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
              <Label>Resolución Objetivo</Label>
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

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? 'Creando...' : 'Crear Objetivo'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}