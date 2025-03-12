import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Target, BarChart2, Clock, ChevronUp, ChevronDown, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ReporteDetalle = ({ objetivo, registros, turnoActual, esTurno, metaGlobal }) => {
  const [expandido, setExpandido] = useState(false);
  const [mostrarGrafico, setMostrarGrafico] = useState(false);
  
  // Función para formatear fechas
  const formatearFecha = (fechaStr) => {
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'short'
      });
    } catch (error) {
      return fechaStr;
    }
  };
  
  // Obtener los registros del turno actual si se especificó
  const registrosFiltrados = turnoActual 
    ? registros.filter(r => r.turno_name === turnoActual || r.turno_id === turnoActual)
    : registros;
  
  // Determinar si hay avance basado en registros recientes
  const calcularAvance = () => {
    if (registrosFiltrados.length < 2) return null;
    
    // Ordenar registros por fecha
    const registrosOrdenados = [...registrosFiltrados].sort((a, b) => new Date(a.record_date) - new Date(b.record_date));
    const ultimoRegistro = registrosOrdenados[registrosOrdenados.length - 1];
    const penultimoRegistro = registrosOrdenados[registrosOrdenados.length - 2];
    
    if (!ultimoRegistro || !penultimoRegistro) return null;
    
    const valorUltimo = parseFloat(ultimoRegistro.value_achieved);
    const valorPenultimo = parseFloat(penultimoRegistro.value_achieved);
    
    if (isNaN(valorUltimo) || isNaN(valorPenultimo)) return null;
    
    const diferencia = valorUltimo - valorPenultimo;
    return {
      valor: diferencia,
      porcentaje: valorPenultimo !== 0 ? (diferencia / valorPenultimo) * 100 : 0,
      positivo: diferencia >= 0
    };
  };
  
  const avance = calcularAvance();
  
  // Calcular el valor meta según el tipo de medición
  const getValorMeta = () => {
    if (objetivo.measurement_type === 'percentage') {
      return esTurno && objetivo.turno_target ? 
        objetivo.turno_target.target_percentage : 
        objetivo.target_percentage;
    } else if (objetivo.measurement_type === 'value') {
      return esTurno && objetivo.turno_target ? 
        objetivo.turno_target.target_value : 
        objetivo.target_value;
    } else {
      return esTurno && objetivo.turno_target?.target_resolution ? 
        objetivo.turno_target.target_resolution : 
        objetivo.target_resolution || 'Completado';
    }
  };
  
  const valorMeta = getValorMeta();
  
  // Calcular valor actual basado en registros
  const calcularValorActual = () => {
    if (registrosFiltrados.length === 0) return { valor: 0, porcentaje: 0 };
    
    let valor = 0;
    
    if (objetivo.measurement_type === 'percentage') {
      // Para porcentaje: calcular promedio
      const valoresNumericos = registrosFiltrados
        .map(r => parseFloat(r.value_achieved))
        .filter(v => !isNaN(v));
      
      if (valoresNumericos.length === 0) return { valor: 0, porcentaje: 0 };
      
      valor = valoresNumericos.reduce((sum, v) => sum + v, 0) / valoresNumericos.length;
      return {
        valor,
        porcentaje: valorMeta ? (valor / valorMeta) * 100 : 0
      };
      
    } else if (objetivo.measurement_type === 'value') {
      // Para valor: usar el último registro
      const registrosOrdenados = [...registrosFiltrados].sort((a, b) => 
        new Date(b.record_date) - new Date(a.record_date)
      );
      
      if (registrosOrdenados.length === 0) return { valor: 0, porcentaje: 0 };
      
      valor = parseFloat(registrosOrdenados[0].value_achieved) || 0;
      return {
        valor,
        porcentaje: valorMeta ? (valor / valorMeta) * 100 : 0
      };
      
    } else {
      // Para resolución: verificar si está completado
      const completado = registrosFiltrados.some(r => {
        const valor = r.value_achieved;
        return valor === true || valor === 1 || valor === "true" || valor === "1";
      });
      
      return {
        valor: completado ? 1 : 0,
        porcentaje: completado ? 100 : 0,
        completado
      };
    }
  };
  
  const valorActual = calcularValorActual();
  
  // Determinar el color del progreso
  const getColorProgreso = (porcentaje) => {
    if (porcentaje >= 100) return 'bg-green-500';
    if (porcentaje >= 75) return 'bg-blue-500';
    if (porcentaje >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };
  
  // Determinar la clase del borde según progreso
  const getBorderClass = (porcentaje) => {
    if (porcentaje >= 100) return 'border-l-green-500';
    if (porcentaje >= 75) return 'border-l-blue-500';
    if (porcentaje >= 50) return 'border-l-yellow-500';
    return 'border-l-red-500';
  };
  
  // Calcular la contribución al objetivo global (para objetivos de turno)
  const calcularContribucion = () => {
    if (!esTurno || !metaGlobal) return null;
    
    // Para tipo porcentaje
    if (objetivo.measurement_type === 'percentage') {
      const metaTurno = parseFloat(objetivo.turno_target?.target_percentage || objetivo.target_percentage);
      const metaGlobalValor = parseFloat(metaGlobal.target_percentage);
      
      if (isNaN(metaTurno) || isNaN(metaGlobalValor) || metaGlobalValor === 0) return null;
      
      // Contribución: qué porcentaje de la meta global representa la meta del turno
      return Math.min(100, Math.round((metaTurno / metaGlobalValor) * 100));
    } 
    // Para tipo valor
    else if (objetivo.measurement_type === 'value') {
      const metaTurno = parseFloat(objetivo.turno_target?.target_value || objetivo.target_value);
      const metaGlobalValor = parseFloat(metaGlobal.target_value);
      
      if (isNaN(metaTurno) || isNaN(metaGlobalValor) || metaGlobalValor === 0) return null;
      
      return Math.min(100, Math.round((metaTurno / metaGlobalValor) * 100));
    }
    
    return null;
  };
  
  const contribucion = calcularContribucion();
  
  // NUEVO: Calcular cuánto falta para la meta del turno actual
  const calcularFaltante = () => {
    if (!turnoActual) return null;
    
    // Filtrar solo registros del turno actual para este cálculo
    const registrosTurnoActual = registros.filter(r => 
      r.turno_name === turnoActual || r.turno_id === turnoActual
    );
    
    if (registrosTurnoActual.length === 0) return null;
    
    let valorActualTurno = 0;
    let metaTurno = 0;
    let unidad = '';
    
    // Calcular según tipo de medición
    if (objetivo.measurement_type === 'percentage') {
      // Calcular promedio de valores en turno actual
      const valores = registrosTurnoActual
        .map(r => parseFloat(r.value_achieved))
        .filter(v => !isNaN(v));
      
      if (valores.length === 0) return null;
      
      valorActualTurno = valores.reduce((sum, v) => sum + v, 0) / valores.length;
      metaTurno = esTurno && objetivo.turno_target ? 
        parseFloat(objetivo.turno_target.target_percentage) : 
        parseFloat(objetivo.target_percentage);
      unidad = '%';
    } 
    else if (objetivo.measurement_type === 'value') {
      // Usar último valor registrado
      const ultimoRegistro = [...registrosTurnoActual].sort((a, b) => 
        new Date(b.record_date) - new Date(a.record_date)
      )[0];
      
      valorActualTurno = parseFloat(ultimoRegistro.value_achieved) || 0;
      metaTurno = esTurno && objetivo.turno_target ? 
        parseFloat(objetivo.turno_target.target_value) : 
        parseFloat(objetivo.target_value);
    } 
    else {
      // Para tipo resolución
      const completado = registrosTurnoActual.some(r => {
        const valor = r.value_achieved;
        return valor === true || valor === 1 || valor === "true" || valor === "1";
      });
      
      return completado ? {
        porcentaje: 100,
        completado: true,
        faltante: 0,
        unidad: ''
      } : {
        porcentaje: 0,
        completado: false,
        faltante: 1, // Falta completar
        unidad: ''
      };
    }
    
    // Calcular porcentaje y faltante
    const porcentaje = Math.min(100, Math.round((valorActualTurno / metaTurno) * 100));
    const faltante = Math.max(0, metaTurno - valorActualTurno);
    
    return {
      valorActual: valorActualTurno,
      meta: metaTurno,
      porcentaje,
      faltante,
      unidad
    };
  };
  
  const faltanteTurno = calcularFaltante();
  
  return (
    <Card className={`border-l-4 ${getBorderClass(valorActual.porcentaje)} transition-shadow hover:shadow-md`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg flex items-center gap-2">
            {objetivo.measurement_type === 'percentage' ? (
              <BarChart2 className="h-5 w-5 text-blue-600" />
            ) : objetivo.measurement_type === 'resolution' ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <Target className="h-5 w-5 text-amber-600" />
            )}
            {objetivo.name}
          </CardTitle>
          
          {esTurno && (
            <Badge className="bg-amber-100 text-amber-800 border-amber-200">
              Meta de Turno
            </Badge>
          )}
          
          {registrosFiltrados.length > 0 && (
            <Badge className={
              valorActual.porcentaje >= 100 ? "bg-green-100 text-green-800 border-green-200" :
              valorActual.porcentaje >= 75 ? "bg-blue-100 text-blue-800 border-blue-200" :
              valorActual.porcentaje >= 50 ? "bg-amber-100 text-amber-800 border-amber-200" :
              "bg-red-100 text-red-800 border-red-200"
            }>
              {valorActual.porcentaje >= 100 ? "Completado" :
               valorActual.porcentaje >= 75 ? "Avanzado" :
               valorActual.porcentaje >= 50 ? "En progreso" :
               "Iniciado"}
            </Badge>
          )}
        </div>
        
        {objetivo.description && (
          <p className="text-sm text-muted-foreground mt-1">
            {objetivo.description}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Sección de Meta y Progreso */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Información de la Meta */}
            <div className="bg-gray-50 p-3 rounded-md space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm text-gray-700">Meta:</div>
                <div className="text-blue-700 font-medium">
                  {objetivo.measurement_type === 'percentage' ? (
                    <span>{valorMeta}%</span>
                  ) : objetivo.measurement_type === 'resolution' ? (
                    <span>{valorMeta}</span>
                  ) : (
                    <span>{valorMeta}</span>
                  )}
                </div>
              </div>
              
              {/* Mostrar meta global si es objetivo de turno */}
              {esTurno && metaGlobal && (
                <div className="flex items-center justify-between text-sm">
                  <div className="text-muted-foreground">Meta Global:</div>
                  <div>
                    {objetivo.measurement_type === 'percentage' ? (
                      <span>{metaGlobal.target_percentage}%</span>
                    ) : objetivo.measurement_type === 'resolution' ? (
                      <span>{metaGlobal.target_resolution || 'Completado'}</span>
                    ) : (
                      <span>{metaGlobal.target_value}</span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Mostrar contribución al objetivo global */}
              {esTurno && contribucion !== null && (
                <div className="mt-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600">
                      Contribución al objetivo global:
                    </span>
                    <span className={
                      contribucion >= 80 ? "text-green-600 font-medium" : 
                      contribucion >= 50 ? "text-blue-600 font-medium" : 
                      "text-amber-600 font-medium"
                    }>
                      {contribucion}%
                    </span>
                  </div>
                  <Progress 
                    value={contribucion}
                    className="h-1.5 mt-1"
                  />
                </div>
              )}
            </div>
            
            {/* Progreso Actual */}
            <div className="bg-gray-50 p-3 rounded-md space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm text-gray-700">Progreso:</div>
                <div className={
                  valorActual.porcentaje >= 100 ? "text-green-600 font-medium" :
                  valorActual.porcentaje >= 75 ? "text-blue-600 font-medium" :
                  valorActual.porcentaje >= 50 ? "text-amber-600 font-medium" :
                  "text-gray-600 font-medium"
                }>
                  {objetivo.measurement_type === 'percentage' ? (
                    <span>{valorActual.valor.toFixed(1)}%</span>
                  ) : objetivo.measurement_type === 'resolution' ? (
                    <span>{valorActual.completado ? 'Completado' : 'Pendiente'}</span>
                  ) : (
                    <span>{valorActual.valor.toFixed(1)}</span>
                  )}
                </div>
              </div>
              
              {/* Avance desde último registro */}
              {avance && (
                <div className="flex items-center justify-between text-sm">
                  <div className="text-muted-foreground">Último avance:</div>
                  <div className={avance.positivo ? "text-green-600 font-medium flex items-center" : "text-red-600 font-medium flex items-center"}>
                    {avance.positivo ? (
                      <>+{avance.valor.toFixed(1)} <ChevronUp className="h-3 w-3 ml-0.5" /></>
                    ) : (
                      <>{avance.valor.toFixed(1)} <ChevronDown className="h-3 w-3 ml-0.5" /></>
                    )}
                  </div>
                </div>
              )}
              
              {/* Barra de progreso */}
              <div className="mt-1">
                <Progress 
                  value={valorActual.porcentaje} 
                  className={`h-2.5 ${getColorProgreso(valorActual.porcentaje)}`}
                />
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-gray-500">0%</span>
                  <span className="text-gray-500">Objetivo: {valorActual.porcentaje.toFixed(0)}%</span>
                  <span className="text-gray-500">100%</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* NUEVO: Indicador de progreso para la meta del turno actual */}
          {turnoActual && faltanteTurno && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100 mt-4">
              <h4 className="text-base font-medium text-blue-700 flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4" />
                Progreso en turno {turnoActual}
              </h4>
              
              <div className="space-y-3">
                {objetivo.measurement_type !== 'resolution' ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">
                        Meta a alcanzar: 
                        <span className="ml-1 text-blue-700">{faltanteTurno.meta.toFixed(1)}{faltanteTurno.unidad}</span>
                      </span>
                      <span className="font-medium">
                        Valor actual: 
                        <span className={`ml-1 ${faltanteTurno.porcentaje >= 100 ? 'text-green-600' : 'text-amber-600'}`}>
                          {faltanteTurno.valorActual.toFixed(1)}{faltanteTurno.unidad}
                        </span>
                      </span>
                    </div>
                    
                    <div className="relative h-7 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`absolute h-full left-0 ${getColorProgreso(faltanteTurno.porcentaje)} transition-all duration-300 rounded-full`}
                        style={{ width: `${faltanteTurno.porcentaje}%` }}
                      >
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                          {faltanteTurno.porcentaje}%
                        </span>
                      </div>
                    </div>
                    
                    {faltanteTurno.porcentaje < 100 && (
                      <div className="text-center py-1.5 px-3 bg-amber-100 rounded-md text-sm text-amber-800 font-medium flex items-center justify-center gap-2 animate-pulse">
                        <AlertTriangle className="h-4 w-4" />
                        Te faltan <span className="font-bold">{faltanteTurno.faltante.toFixed(1)}{faltanteTurno.unidad}</span> para alcanzar la meta
                      </div>
                    )}
                    
                    {faltanteTurno.porcentaje >= 100 && (
                      <div className="text-center py-1.5 px-3 bg-green-100 rounded-md text-sm text-green-800 font-medium flex items-center justify-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        ¡Felicidades! Has alcanzado la meta de tu turno
                      </div>
                    )}
                  </>
                ) : (
                  // Para objetivos de tipo resolución
                  <div className="text-center py-3 px-4 bg-gray-100 rounded-md">
                    {faltanteTurno.completado ? (
                      <div className="flex items-center justify-center gap-2 text-green-700 font-medium">
                        <CheckCircle2 className="h-5 w-5" />
                        El objetivo ha sido completado
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-amber-700 font-medium">
                        <AlertTriangle className="h-5 w-5" />
                        El objetivo está pendiente de completar
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Botón para expandir/colapsar detalles */}
          {registrosFiltrados.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandido(!expandido)}
              className="w-full mt-2 text-muted-foreground"
            >
              {expandido ? (
                <>Ocultar detalles <ChevronUp className="ml-2 h-4 w-4" /></>
              ) : (
                <>Mostrar detalles <ChevronDown className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          )}
          
          {/* Detalles expandidos: Tabla de registros */}
          {expandido && registrosFiltrados.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-left">Fecha</th>
                    <th className="p-2 text-left">Turno</th>
                    <th className="p-2 text-right">Valor</th>
                    <th className="p-2 text-left">Comentario</th>
                  </tr>
                </thead>
                <tbody>
                  {registrosFiltrados.map((reg, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="p-2 border-t">{formatearFecha(reg.record_date)}</td>
                      <td className="p-2 border-t">{reg.turno_name || `Turno ${reg.turno_id}`}</td>
                      <td className="p-2 border-t text-right font-medium">
                        {objetivo.measurement_type === 'percentage' ? 
                          `${parseFloat(reg.value_achieved).toFixed(1)}%` : 
                          objetivo.measurement_type === 'resolution' ?
                            (reg.value_achieved ? 'Completado' : 'Pendiente') :
                            parseFloat(reg.value_achieved).toFixed(1)
                        }
                      </td>
                      <td className="p-2 border-t">{reg.comment || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReporteDetalle;