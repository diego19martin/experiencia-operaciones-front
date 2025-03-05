import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const GraficaTendencia = ({ registros, objetivo }) => {
  // Preparar datos para gráfico
  const datosGrafico = useMemo(() => {
    if (!registros || registros.length === 0) return [];
    
    // Ordenar por fecha
    return [...registros]
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
      .map(reg => ({
        fecha: new Date(reg.fecha).toLocaleDateString('es-ES', { 
          day: '2-digit', 
          month: 'short' 
        }),
        valor: reg.valorAlcanzado,
        comentario: reg.comentario
      }));
  }, [registros]);
  
  // Calcular el promedio de los valores
  const promedio = useMemo(() => {
    if (!registros || registros.length === 0) return 0;
    
    const suma = registros.reduce((acc, reg) => acc + reg.valorAlcanzado, 0);
    return (suma / registros.length).toFixed(2);
  }, [registros]);
  
  // Determinar el tipo de visualización según tipoMedicion
  const configurarGrafico = () => {
    if (objetivo.tipoMedicion === 'porcentaje') {
      return {
        yAxisDomain: [0, 100],
        yAxisLabel: '% Cumplimiento',
        referenciaY: objetivo.valorObjetivo
      };
    } else if (objetivo.tipoMedicion === 'valor') {
      return {
        yAxisDomain: [0, 'auto'], // El mínimo es 0, el máximo se calcula automáticamente
        yAxisLabel: 'Valor',
        referenciaY: objetivo.valorObjetivo
      };
    } else {
      return {
        yAxisDomain: [0, 1], // Para valores booleanos (0 o 1)
        yAxisLabel: 'Completado',
        referenciaY: 1 // La referencia es siempre 1 (completado)
      };
    }
  };
  
  const configuracion = configurarGrafico();
  
  // Personalizar el tooltip para mostrar más detalles
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-blue-600">
            Valor: {payload[0].value}
            {objetivo.tipoMedicion === 'porcentaje' ? '%' : ''}
          </p>
          {payload[0].payload.comentario && (
            <p className="text-gray-600 text-sm mt-1">
              "{payload[0].payload.comentario}"
            </p>
          )}
        </div>
      );
    }
    return null;
  };
  
  if (datosGrafico.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500">No hay datos disponibles para el período seleccionado</p>
      </div>
    );
  }
  
  return (
    <div className="h-full w-full">
      <div className="mb-2 flex justify-between items-center">
        <h3 className="text-sm font-medium">Tendencia de cumplimiento</h3>
        <div className="text-sm text-gray-500">
          Promedio: <span className="font-medium">
            {promedio}{objetivo.tipoMedicion === 'porcentaje' ? '%' : ''}
          </span>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={datosGrafico}
          margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="fecha" 
            tick={{ fontSize: 12 }} 
            angle={-45} 
            textAnchor="end"
            height={50}
          />
          <YAxis 
            domain={configuracion.yAxisDomain}
            label={{ 
              value: configuracion.yAxisLabel, 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle' }
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {/* Línea de referencia para el objetivo */}
          <ReferenceLine 
            y={configuracion.referenciaY} 
            stroke="#FF8042" 
            strokeDasharray="3 3"
            label={{ 
              value: 'Objetivo', 
              position: 'insideBottomRight',
              fill: '#FF8042'
            }} 
          />
          
          <Line 
            type="monotone" 
            dataKey="valor" 
            name="Valor diario" 
            stroke="#3B82F6" 
            dot={{ r: 4 }}
            activeDot={{ r: 6, stroke: '#2563EB', strokeWidth: 2 }}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GraficaTendencia;