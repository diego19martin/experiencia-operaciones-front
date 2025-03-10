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
        minValor: 0,
        valoresDiarios: []
      };
    }
    
    // Ordenar registros por fecha (más antiguo primero para gráfico)
    const registrosOrdenados = [...registros].sort((a, b) => 
      new Date(a.record_date) - new Date(b.record_date)
    );
    
    // Preparar datos para gráfico: formato {fecha, valor}
    const valoresDiarios = registrosOrdenados.map(reg => ({
      fecha: new Date(reg.record_date).toLocaleDateString('es-ES', {day: '2-digit', month: '2-digit'}),
      valor: parseFloat(reg.value_achieved || 0)
    }));
    
    // Calcular según el tipo de medición
    if (objetivo.measurement_type === 'percentage') {
      // Para tipo porcentaje
      const valoresNumericos = registros
        .map(reg => parseFloat(reg.value_achieved || 0))
        .filter(val => !isNaN(val));
      
      if (valoresNumericos.length === 0) {
        return { 
          promedioMensual: 0, 
          tendencia: 'neutral', 
          ultimoValor: 0, 
          porcentajeCumplimiento: 0, 
          diasRegistrados: 0, 
          maxValor: 0, 
          minValor: 0,
          valoresDiarios
        };
      }
      
      const suma = valoresNumericos.reduce((acc, val) => acc + val, 0);
      const promedioMensual = suma / valoresNumericos.length;
      
      // Obtener último valor registrado (registros ordenados por fecha descendente)
      const registrosDesc = [...registros].sort((a, b) => 
        new Date(b.record_date) - new Date(a.record_date)
      );
      const ultimoValor = parseFloat(registrosDesc[0]?.value_achieved || 0);
      
      // Calcular tendencia comparando los últimos registros
      let tendencia = 'neutral';
      if (registrosDesc.length >= 2) {
        const cantidadParaAnalizar = Math.min(5, registrosDesc.length);
        const primeros = registrosDesc.slice(0, Math.ceil(cantidadParaAnalizar / 2));
        const ultimos = registrosDesc.slice(-Math.floor(cantidadParaAnalizar / 2));
        
        const promedioReciente = primeros.reduce((acc, reg) => 
          acc + parseFloat(reg.value_achieved || 0), 0) / primeros.length;
        const promedioAnterior = ultimos.reduce((acc, reg) => 
          acc + parseFloat(reg.value_achieved || 0), 0) / ultimos.length;
        
        if (promedioReciente > promedioAnterior + (promedioAnterior * 0.05)) {
          tendencia = 'positiva';
        } else if (promedioReciente < promedioAnterior - (promedioAnterior * 0.05)) {
          tendencia = 'negativa';
        }
      }
      
      // Calcular el porcentaje de cumplimiento (qué tanto del objetivo se ha alcanzado)
      const porcentajeCumplimiento = (promedioMensual / parseFloat(objetivo.target_percentage)) * 100;
      
      // Valores máximo y mínimo
      const maxValor = Math.max(...valoresNumericos);
      const minValor = Math.min(...valoresNumericos);
      
      return {
        promedioMensual: promedioMensual.toFixed(2),
        tendencia,
        ultimoValor,
        porcentajeCumplimiento: porcentajeCumplimiento.toFixed(2),
        diasRegistrados: registros.length,
        maxValor,
        minValor,
        valoresDiarios
      };
    } 
    else if (objetivo.measurement_type === 'value') {
      // Para tipo valor numérico
      const valoresNumericos = registros
        .map(reg => parseFloat(reg.value_achieved || 0))
        .filter(val => !isNaN(val));
      
      if (valoresNumericos.length === 0) {
        return { 
          promedioMensual: 0, 
          tendencia: 'neutral', 
          ultimoValor: 0, 
          porcentajeCumplimiento: 0, 
          diasRegistrados: 0, 
          maxValor: 0, 
          minValor: 0,
          valoresDiarios
        };
      }
      
      // Ordenar registros por fecha (más reciente primero)
      const registrosDesc = [...registros].sort((a, b) => 
        new Date(b.record_date) - new Date(a.record_date)
      );
      
      // Para valor numérico, usamos el último valor como referencia principal
      const ultimoValor = parseFloat(registrosDesc[0]?.value_achieved || 0);
      
      // Calcular tendencia
      let tendencia = 'neutral';
      if (registrosDesc.length >= 2) {
        const valorActual = parseFloat(registrosDesc[0]?.value_achieved || 0);
        const valorAnterior = parseFloat(registrosDesc[1]?.value_achieved || 0);
        
        if (valorActual > valorAnterior + (valorAnterior * 0.05)) {
          tendencia = 'positiva';
        } else if (valorActual < valorAnterior - (valorAnterior * 0.05)) {
          tendencia = 'negativa';
        }
      }
      
      // Calcular el porcentaje de cumplimiento
      const porcentajeCumplimiento = (ultimoValor / parseFloat(objetivo.target_value)) * 100;
      
      // Valores estadísticos
      const suma = valoresNumericos.reduce((acc, val) => acc + val, 0);
      const promedioMensual = suma / valoresNumericos.length;
      const maxValor = Math.max(...valoresNumericos);
      const minValor = Math.min(...valoresNumericos);
      
      return {
        promedioMensual: promedioMensual.toFixed(2),
        tendencia,
        ultimoValor,
        porcentajeCumplimiento: porcentajeCumplimiento.toFixed(2),
        diasRegistrados: registros.length,
        maxValor,
        minValor,
        valoresDiarios
      };
    }
    else {
      // Para tipo resolución (booleano)
      // Convertir valores booleanos a 0 y 1 para el gráfico
      const valoresDiariosResolucion = registrosOrdenados.map(reg => {
        const val = reg.value_achieved;
        const esCumplido = val === true || val === 1 || val === "true" || val === "1";
        return {
          fecha: new Date(reg.record_date).toLocaleDateString('es-ES', {day: '2-digit', month: '2-digit'}),
          valor: esCumplido ? 1 : 0
        };
      });
      
      const diasCompletados = registros.filter(reg => {
        const val = reg.value_achieved;
        return val === true || val === 1 || val === "true" || val === "1";
      }).length;
      
      const porcentajeCompletado = (diasCompletados / registros.length) * 100;
      
      // Ordenar registros por fecha (más reciente primero para información, no para gráfico)
      const registrosDesc = [...registros].sort((a, b) => 
        new Date(b.record_date) - new Date(a.record_date)
      );
      
      // Último valor (completado o no)
      const ultimoValorBool = registrosDesc[0]?.value_achieved === true || 
                            registrosDesc[0]?.value_achieved === 1 || 
                            registrosDesc[0]?.value_achieved === "true" || 
                            registrosDesc[0]?.value_achieved === "1";
      const ultimoValor = ultimoValorBool ? 1 : 0;
      
      // Calcular tendencia
      let tendencia = 'neutral';
      // Para resolución la tendencia la determinamos por el cambio en el porcentaje de días completados
      const cantidadParaAnalizar = Math.min(6, registrosDesc.length);
      if (cantidadParaAnalizar >= 2) {
        const mitad = Math.floor(cantidadParaAnalizar / 2);
        const recientes = registrosDesc.slice(0, mitad);
        const anteriores = registrosDesc.slice(mitad, cantidadParaAnalizar);
        
        const completadosRecientes = recientes.filter(reg => {
          const val = reg.value_achieved;
          return val === true || val === 1 || val === "true" || val === "1";
        }).length;
        
        const completadosAnteriores = anteriores.filter(reg => {
          const val = reg.value_achieved;
          return val === true || val === 1 || val === "true" || val === "1";
        }).length;
        
        const porcentajeReciente = completadosRecientes / recientes.length;
        const porcentajeAnterior = completadosAnteriores / anteriores.length;
        
        if (porcentajeReciente > porcentajeAnterior + 0.1) {
          tendencia = 'positiva';
        } else if (porcentajeReciente < porcentajeAnterior - 0.1) {
          tendencia = 'negativa';
        }
      }
      
      return {
        promedioMensual: porcentajeCompletado.toFixed(2),
        tendencia,
        ultimoValor,
        porcentajeCumplimiento: porcentajeCompletado.toFixed(2),
        diasRegistrados: registros.length,
        maxValor: 1,
        minValor: 0,
        valoresDiarios: valoresDiariosResolucion
      };
    }
  };
  
  const metricas = calcularMetricas();
  
  // Función para formatear el valor según el tipo de medición
  const formatearValor = (valor) => {
    if (!valor && valor !== 0) return "-";
    
    if (objetivo.measurement_type === 'percentage') {
      return `${parseFloat(valor).toFixed(1)}%`;
    } else if (objetivo.measurement_type === 'resolution') {
      // Para resolución, el valor puede ser booleano o interpretable como booleano
      const esCumplido = valor === true || valor === 1 || valor === "true" || valor === "1";
      return esCumplido ? 'Completado' : 'No completado';
    } else {
      return parseFloat(valor).toFixed(2);
    }
  };
  
  // Función para renderizar un gráfico de línea simple
  const renderizarGrafico = () => {
    const { valoresDiarios } = metricas;
    if (!valoresDiarios || valoresDiarios.length < 2) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">No hay suficientes datos para mostrar el gráfico</p>
        </div>
      );
    }
    
    // Determinar altura máxima del gráfico
    const maxValorGrafico = Math.max(...valoresDiarios.map(d => d.valor));
    const valorMeta = objetivo.measurement_type === 'percentage' 
      ? parseFloat(objetivo.target_percentage) 
      : objetivo.measurement_type === 'value'
        ? parseFloat(objetivo.target_value)
        : 1;
    
    // Asegurarnos de que el valor máximo del gráfico incluya la meta
    const alturaMaxima = Math.max(maxValorGrafico, valorMeta) * 1.1; // 10% más para espacio
    
    // Calcular datos para el gráfico
    const anchoTotal = valoresDiarios.length > 1 
      ? 100 / (valoresDiarios.length - 1) 
      : 100;
    
    return (
      <div className="w-full h-full relative">
        {/* Título del gráfico */}
        <div className="text-sm font-medium mb-2">Evolución de valores registrados</div>
        
        {/* Línea de meta */}
        {objetivo.measurement_type !== 'resolution' && (
          <div 
            className="absolute border-t border-dashed border-red-400 w-full z-10"
            style={{ 
              top: `${100 - (valorMeta / alturaMaxima * 100)}%`,
              height: '1px'
            }}
          >
            <span className="absolute right-0 transform -translate-y-4 bg-white px-1 text-xs text-red-500">
              Meta: {
                objetivo.measurement_type === 'percentage' 
                  ? `${objetivo.target_percentage}%` 
                  : objetivo.target_value
              }
            </span>
          </div>
        )}
        
        {/* Elemento SVG para el gráfico */}
        <div className="w-full h-56 mt-6 relative bg-white border rounded-lg overflow-hidden">
          {/* Líneas de cuadrícula horizontales */}
          <div className="absolute w-full h-full">
            {[0, 25, 50, 75, 100].map(percent => (
              <div 
                key={percent} 
                className="absolute w-full border-t border-gray-100"
                style={{ top: `${100 - percent}%` }}
              >
                <span className="absolute left-1 transform -translate-y-1/2 text-xs text-gray-400">
                  {Math.round((alturaMaxima * percent) / 100)}
                  {objetivo.measurement_type === 'percentage' ? '%' : ''}
                </span>
              </div>
            ))}
          </div>
          
          {/* Línea de tendencia */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polyline
              points={valoresDiarios.map((punto, index) => 
                `${index * anchoTotal},${100 - (punto.valor / alturaMaxima * 100)}`
              ).join(' ')}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          
          {/* Puntos en el gráfico */}
          <div className="absolute inset-0">
            {valoresDiarios.map((punto, index) => (
              <div 
                key={index}
                className="absolute w-2 h-2 bg-blue-600 rounded-full transform -translate-x-1 -translate-y-1"
                style={{
                  left: `${index * anchoTotal}%`,
                  top: `${100 - (punto.valor / alturaMaxima * 100)}%`
                }}
                title={`${punto.fecha}: ${formatearValor(punto.valor)}`}
              ></div>
            ))}
          </div>
          
          {/* Etiquetas de fechas en el eje X */}
          <div className="absolute bottom-0 w-full">
            {valoresDiarios.map((punto, index) => (
              <div 
                key={index}
                className="absolute text-xs text-gray-500 transform -translate-x-1/2"
                style={{
                  left: `${index * anchoTotal}%`,
                  bottom: '0'
                }}
              >
                {index % Math.max(1, Math.floor(valoresDiarios.length / 5)) === 0 ? punto.fecha : ''}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
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
        
        <p className="text-sm text-muted-foreground mb-4">{objetivo.description || ""}</p>
        
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
            if (porcentaje >= 100) return 'bg-green-50 text-green-700 border border-green-200';
            if (porcentaje >= 80) return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
            return 'bg-red-50 text-red-700 border border-red-200';
          })()} flex flex-col`}>
            <span className="text-xs mb-1">
              {objetivo.measurement_type === 'percentage' || objetivo.measurement_type === 'value' 
                ? 'Promedio' 
                : 'Cumplimiento'}
            </span>
            <span className="text-lg font-bold">
              {objetivo.measurement_type === 'percentage' 
                ? `${metricas.promedioMensual}%` 
                : objetivo.measurement_type === 'resolution'
                  ? `${metricas.promedioMensual}%`
                  : metricas.promedioMensual
              }
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
          {/* Gráfico de tendencia */}
          <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
            {renderizarGrafico()}
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