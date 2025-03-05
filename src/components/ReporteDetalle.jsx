"use client"

import { useState } from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  Minus, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ReporteDetalle({ objetivo, registros }) {
  // Estado para expandir/colapsar detalles
  const [expandido, setExpandido] = useState(false);

  console.log("Objetivo", objetivo);
  console.log("Registros", registros);
  
  
  // Función para calcular las métricas del objetivo según los registros
  const calcularMetricas = () => {
    if (!registros || registros.length === 0) {
      return {
        promedioMensual: 0,
        tendencia: 'neutral',
        ultimoValor: 0,
        porcentajeCumplimiento: 0,
        diasRegistrados: 0,
        maxValor: 0,
        minValor: 0
      };
    }
    
    // Calcular promedio mensual
    const suma = registros.reduce((acc, reg) => acc + (reg.value_achieved || 0), 0);
    const promedioMensual = suma / registros.length;
    
    // Ordenar registros por fecha (más reciente primero)
    const registrosOrdenados = [...registros].sort((a, b) => 
      new Date(b.record_date) - new Date(a.record_date)
    );
    
    // Obtener último valor registrado
    const ultimoValor = registrosOrdenados[0]?.value_achieved || 0;
    
    // Calcular tendencia comparando los últimos registros
    let tendencia = 'neutral';
    if (registrosOrdenados.length >= 2) {
      const cantidadParaAnalizar = Math.min(5, registrosOrdenados.length);
      const primeros = registrosOrdenados.slice(0, Math.ceil(cantidadParaAnalizar / 2));
      const ultimos = registrosOrdenados.slice(-Math.floor(cantidadParaAnalizar / 2));
      
      const promedioReciente = primeros.reduce((acc, reg) => acc + (reg.value_achieved || 0), 0) / primeros.length;
      const promedioAnterior = ultimos.reduce((acc, reg) => acc + (reg.value_achieved || 0), 0) / ultimos.length;
      
      if (promedioReciente > promedioAnterior + (promedioAnterior * 0.05)) {
        tendencia = 'positiva';
      } else if (promedioReciente < promedioAnterior - (promedioAnterior * 0.05)) {
        tendencia = 'negativa';
      }
    }
    
    // Calcular el porcentaje de cumplimiento según el tipo de medición
    let porcentajeCumplimiento;
    if (objetivo.measurement_type === 'percentage') {
      porcentajeCumplimiento = (promedioMensual / objetivo.target_percentage) * 100;
    } else if (objetivo.measurement_type === 'value') {
      porcentajeCumplimiento = (promedioMensual / objetivo.target_value) * 100;
    } else {
      // Para tipo resolución, calcular porcentaje de días completados
      const diasCompletados = registros.filter(reg => reg.value_achieved).length;
      porcentajeCumplimiento = (diasCompletados / registros.length) * 100;
    }
    
    // Calcular valores máximo y mínimo
    const valores = registros.map(reg => reg.value_achieved || 0);
    const maxValor = Math.max(...valores);
    const minValor = Math.min(...valores);
    
    return {
      promedioMensual: promedioMensual.toFixed(2),
      tendencia,
      ultimoValor,
      porcentajeCumplimiento: porcentajeCumplimiento.toFixed(2),
      diasRegistrados: registros.length,
      maxValor,
      minValor
    };
  };
  
  const metricas = calcularMetricas();
  
  // Debug: Mostrar las métricas calculadas en consola
  console.debug("Métricas calculadas para", objetivo.name, ":", metricas);
  
  // Función para formatear el valor según el tipo de medición
  const formatearValor = (valor) => {
    if (objetivo.measurement_type === 'percentage') {
      return `${parseFloat(valor).toFixed(1)}%`;
    } else if (objetivo.measurement_type === 'resolution') {
      return valor ? 'Completado' : 'No completado';
    } else {
      return parseFloat(valor).toFixed(2);
    }
  };
  
  return (
    <Card className="overflow-hidden">
      {/* Cabecera del reporte */}
      <CardHeader className="bg-white p-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">{objetivo.name}</CardTitle>
          <Button 
            variant="ghost"
            size="sm"
            onClick={() => setExpandido(!expandido)}
            className="p-1 h-8 w-8"
          >
            {expandido ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">{objetivo.description}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Meta del objetivo */}
          <div className="rounded-lg p-3 bg-muted flex flex-col">
            <span className="text-xs text-muted-foreground mb-1">Meta</span>
            <span className="text-lg font-bold">
              {objetivo.measurement_type === 'percentage' 
                ? `${objetivo.target_percentage}%` 
                : objetivo.measurement_type === 'resolution'
                  ? 'Completado'
                  : objetivo.target_value
              }
            </span>
          </div>
          
          {/* Promedio actual */}
          <div className={`rounded-lg p-3 ${(() => {
            const porcentaje = parseFloat(metricas.porcentajeCumplimiento);
            if (porcentaje >= 100) return 'bg-green-50 text-green-700 border-green-200';
            if (porcentaje >= 80) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            return 'bg-red-50 text-red-700 border-red-200';
          })()} flex flex-col`}>
            <span className="text-xs mb-1">Promedio</span>
            <span className="text-lg font-bold">
              {formatearValor(metricas.promedioMensual)}
            </span>
          </div>
          
          {/* Último registro */}
          <div className="rounded-lg p-3 bg-blue-50 text-blue-700 border border-blue-200 flex flex-col">
            <span className="text-xs mb-1">Último registro</span>
            <span className="text-lg font-bold">
              {registros && registros.length > 0 
                ? formatearValor(metricas.ultimoValor)
                : '-'
              }
            </span>
          </div>
          
          {/* Tendencia */}
          <div className="rounded-lg p-3 bg-muted flex flex-col">
            <span className="text-xs text-muted-foreground mb-1">Tendencia</span>
            <div className="flex items-center">
              {metricas.tendencia === 'positiva' && (
                <>
                  <ArrowUp className="text-green-500 mr-1" size={16} />
                  <span className="text-green-600 font-medium">Positiva</span>
                </>
              )}
              {metricas.tendencia === 'negativa' && (
                <>
                  <ArrowDown className="text-red-500 mr-1" size={16} />
                  <span className="text-red-600 font-medium">Negativa</span>
                </>
              )}
              {metricas.tendencia === 'neutral' && (
                <>
                  <Minus className="text-gray-500 mr-1" size={16} />
                  <span className="text-gray-600 font-medium">Estable</span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      {/* Contenido expandible */}
      {expandido && (
        <CardContent className="p-4 pt-0 bg-gray-50">
          {/* Gráfico de tendencia - Placeholder */}
          <div className="mb-6 bg-white p-4 rounded-lg shadow-sm h-60 flex items-center justify-center">
            <p className="text-muted-foreground">
              Gráfico de tendencias no disponible - implementación en progreso
            </p>
          </div>
          
          {/* Tabla de registros diarios */}
          <div>
            <h3 className="text-lg font-medium mb-3">Registros diarios</h3>
            {registros && registros.length > 0 ? (
              <div className="border rounded-lg overflow-hidden bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Valor
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Comentario
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Registrado por
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {[...registros]
                        .sort((a, b) => new Date(b.record_date) - new Date(a.record_date))
                        .map((registro, index) => (
                          <tr key={registro.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              {new Date(registro.record_date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                              {formatearValor(registro.value_achieved)}
                            </td>
                            <td className="px-4 py-3 text-sm max-w-xs truncate">
                              {registro.comment || "-"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              {registro.user_name || "-"}
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-white rounded-lg border">
                <p className="text-muted-foreground">
                  No hay registros para este objetivo en el periodo seleccionado
                </p>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
