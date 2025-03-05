"use client"

import { useState, useEffect } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SelectorPeriodo({ 
  periodo, 
  onChange, 
  fechaInicio, 
  fechaFin,
  onFechaInicioChange,
  onFechaFinChange
}) {
  // Estado para mostrar/ocultar selector de fechas personalizado
  const [mostrarPersonalizado, setMostrarPersonalizado] = useState(periodo === 'personalizado');
  
  // Cuando cambia el periodo, actualizar visibilidad del selector personalizado
  useEffect(() => {
    setMostrarPersonalizado(periodo === 'personalizado');
  }, [periodo]);
  
  // Manejar cambio de periodo
  const handlePeriodoChange = (nuevoPeriodo) => {
    onChange(nuevoPeriodo);
    
    // Si se selecciona personalizado, inicializar fechas con valores predeterminados
    if (nuevoPeriodo === 'personalizado' && !fechaInicio) {
      const hoy = new Date();
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      onFechaInicioChange(inicioMes);
      onFechaFinChange(hoy);
    }
  };
  
  return (
    <div className="space-y-2">
      <Select value={periodo} onValueChange={handlePeriodoChange}>
        <SelectTrigger>
          <SelectValue placeholder="Seleccionar periodo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="actual">Mes actual</SelectItem>
          <SelectItem value="anterior">Mes anterior</SelectItem>
          <SelectItem value="personalizado">Periodo personalizado</SelectItem>
        </SelectContent>
      </Select>
      
      {mostrarPersonalizado && (
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="space-y-1">
            <Label className="text-xs">Desde</Label>
            <Input
              type="date"
              value={fechaInicio ? fechaInicio.toISOString().split('T')[0] : ''}
              onChange={(e) => onFechaInicioChange(new Date(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Hasta</Label>
            <Input
              type="date"
              value={fechaFin ? fechaFin.toISOString().split('T')[0] : ''}
              onChange={(e) => onFechaFinChange(new Date(e.target.value))}
              min={fechaInicio ? fechaInicio.toISOString().split('T')[0] : ''}
            />
          </div>
        </div>
      )}
    </div>
  );
}