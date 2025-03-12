"use client"

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Filter, BarChart2, Clock, CheckCircle2, Target, ArrowUp, ArrowDown, Minus, Bug, AlertTriangle } from 'lucide-react';
import ReporteDetalle from '@/components/ReporteDetalle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

const API_URL = typeof window !== 'undefined' 
  ? (window.ENV?.NEXT_PUBLIC_API_URL || "http://localhost:3001")
  : "http://localhost:3001"

// Tarjeta de métrica para mostrar estadísticas de objetivos
const MetricaCard = ({ icon: Icon, title, value, bgColor, textColor, tendencia = null }) => {
  return (
    <Card className="overflow-hidden border-0 shadow-md">
      <div className={`${bgColor} h-1`}></div>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`${bgColor} ${textColor} p-3 rounded-full`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{title}</p>
              <div className="flex items-center mt-1">
                <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
                {tendencia && (
                  <div className="ml-2">
                    {tendencia === 'up' && <ArrowUp className="text-green-500 h-5 w-5" />}
                    {tendencia === 'down' && <ArrowDown className="text-red-500 h-5 w-5" />}
                    {tendencia === 'neutral' && <Minus className="text-gray-500 h-5 w-5" />}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Componente mejorado para mostrar el progreso hacia la meta del turno
const ProgresoTurnoIndicator = ({ objetivo, turnoActual, registros }) => {
  // Función para mapear entre nombre de turno e ID
  const mapearTurnoId = (turno) => {
    switch(turno) {
      case "Mañana": return 1;
      case "Tarde": return 2;
      case "Noche": return 3;
      default: return null;
    }
  };
  
  // Verificar si hay registros
  if (!registros || registros.length === 0) {
    console.log(`No hay registros para objetivo ${objetivo.id || objetivo.goal_id}`);
    return null;
  }
  
  console.log(`Analizando objetivo ${objetivo.name} con ${registros.length} registros`);
  console.log('Registros disponibles:', registros);
  
  // Obtener los registros del turno actual
  const turnoId = mapearTurnoId(turnoActual);
  const registrosTurno = registros.filter(r => 
    Number(r.turno_id) === turnoId || r.turno_name === turnoActual
  );
  
  console.log(`Registros filtrados para turno ${turnoActual} (${turnoId}):`, registrosTurno);
  
  if (registrosTurno.length === 0) {
    console.log('No hay registros para este turno');
    return null;
  }
  
  // Calcular progreso según tipo de medición
  let valorActual = 0;
  let metaValor = 0;
  let unidad = '';
  
  if (objetivo.measurement_type === 'percentage') {
    // Calcular promedio
    valorActual = registrosTurno.reduce((sum, r) => sum + parseFloat(r.value_achieved || 0), 0) / registrosTurno.length;
    metaValor = parseFloat(objetivo.turno_target?.target_percentage || objetivo.target_percentage);
    unidad = '%';
  } else if (objetivo.measurement_type === 'value') {
    // CORRECCIÓN IMPORTANTE: Para tipo "value", usar el último valor registrado
    const registrosOrdenados = [...registrosTurno].sort((a, b) => 
      new Date(b.record_date) - new Date(a.record_date)
    );
    
    // Es crucial convertir a número para evitar errores de comparación de tipo
    valorActual = parseFloat(registrosOrdenados[0]?.value_achieved || 0);
    metaValor = parseFloat(objetivo.turno_target?.target_value || objetivo.target_value);
    
    console.log(`Valor actual: ${valorActual}, Meta: ${metaValor}, Tipo: ${typeof valorActual}`);
  } else {
    // Tipo resolución
    valorActual = registrosTurno.some(r => {
      const val = r.value_achieved;
      return val === true || val === 1 || val === "true" || val === "1" || val === 1;
    }) ? 100 : 0;
    metaValor = 100;
    unidad = '%';
  }
  
  // CORRECCIÓN CRUCIAL: Garantizar que las comparaciones sean numéricas
  const valorActualNum = Number(valorActual);
  const metaValorNum = Number(metaValor);
  
  // Calcular porcentaje de progreso
  const porcentajeProgreso = Math.min(100, Math.round((valorActualNum / metaValorNum) * 100) || 0);
  
  // CORRECCIÓN FINAL: Verificar si el objetivo ha sido alcanzado con tolerancia
  // Para valores numéricos, comparar con una pequeña tolerancia para evitar problemas de punto flotante
  const objetivoAlcanzado = objetivo.measurement_type === 'resolution' 
    ? valorActualNum >= 100 
    : valorActualNum >= metaValorNum || Math.abs(valorActualNum - metaValorNum) < 0.01;
  
  console.log(`Objetivo alcanzado: ${objetivoAlcanzado} (${valorActualNum} >= ${metaValorNum})`);
  
  const faltante = objetivoAlcanzado ? 0 : Math.max(0, metaValorNum - valorActualNum);
  
  // Determinar color según progreso
  const getProgressColor = () => {
    if (objetivoAlcanzado) return 'bg-green-500';
    if (porcentajeProgreso >= 75) return 'bg-blue-500';
    if (porcentajeProgreso >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };
  
  return (
    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
      <h4 className="text-lg font-medium text-blue-700 flex items-center gap-2 mb-3">
        <Target className="h-5 w-5" />
        Progreso de tu turno
      </h4>
      
      <div className="space-y-3">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium">Meta a alcanzar: 
            <span className="ml-1 text-blue-700 font-bold">{metaValorNum.toFixed(1)}{unidad}</span>
          </span>
          <span className="font-medium">Valor actual: 
            <span className={`ml-1 font-bold ${objetivoAlcanzado ? 'text-green-600' : 'text-amber-600'}`}>
              {valorActualNum.toFixed(1)}{unidad}
            </span>
          </span>
        </div>
        
        <div className="relative h-8 w-full bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`absolute h-full left-0 ${getProgressColor()} transition-all duration-500 rounded-full`}
            style={{ width: `${porcentajeProgreso || 0}%` }}
          >
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
              {porcentajeProgreso || 0}%
            </span>
          </div>
        </div>
        
        {!objetivoAlcanzado && (
          <div className="text-center mt-2 py-2 px-3 bg-amber-100 rounded-md text-sm text-amber-800 font-medium animate-pulse flex items-center justify-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Te faltan <span className="font-bold">{faltante.toFixed(1)}{unidad}</span> para alcanzar la meta de tu turno
          </div>
        )}
        
        {objetivoAlcanzado && (
          <div className="text-center mt-2 py-2 px-3 bg-green-100 rounded-md text-green-800 font-medium flex items-center justify-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-bold">¡Felicidades!</span> Has alcanzado la meta de tu turno
          </div>
        )}
      </div>
    </div>
  );
};

export default function SeguimientoPage() {
  const [objetivos, setObjetivos] = useState([]);
  const [objetivosTurno, setObjetivosTurno] = useState([]);
  const [registros, setRegistros] = useState({});
  const [registrosTurno, setRegistrosTurno] = useState({});
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('actual');
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [turnoSeleccionado, setTurnoSeleccionado] = useState('');
  const [turnoActual, setTurnoActual] = useState('');
  // MODIFICADO: Por defecto, mostrar siempre pestaña de turno
  const [tabValue, setTabValue] = useState("turno");
  const [cargando, setCargando] = useState(true);
  const [debug, setDebug] = useState({});
  const [mostrarDebug, setMostrarDebug] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Obtener fecha en formato ISO con ajuste para zona horaria local
  const obtenerFechaISO = (fecha) => {
    // Crear una copia de la fecha para no mutar la original
    const fechaCopia = new fecha.constructor(fecha.getTime());
    
    // Ajustar a medianoche en la zona horaria local
    fechaCopia.setHours(0, 0, 0, 0);
    
    // Formatear como YYYY-MM-DD sin considerar timezone en la conversión
    const año = fechaCopia.getFullYear();
    const mes = String(fechaCopia.getMonth() + 1).padStart(2, '0');
    const dia = String(fechaCopia.getDate()).padStart(2, '0');
    
    return `${año}-${mes}-${dia}`;
  };
  
  // Determinar el turno actual
  useEffect(() => {
    const calcularTurno = () => {
      const now = new Date()
      const currentHour = now.getHours()
      if (currentHour >= 6 && currentHour < 14) {
        setTurnoActual("Mañana")
      } else if (currentHour >= 14 && currentHour < 22) {
        setTurnoActual("Tarde")
      } else {
        setTurnoActual("Noche")
      }
    }
    calcularTurno()
  }, []);
  
  // Función para mapear entre nombre de turno e ID
  const mapearTurnoId = (turno) => {
    switch(turno) {
      case "Mañana": return 1;
      case "Tarde": return 2;
      case "Noche": return 3;
      default: return null;
    }
  };
  
  const mapearIdTurno = (id) => {
    switch(parseInt(id)) {
      case 1: return "Mañana";
      case 2: return "Tarde";
      case 3: return "Noche";
      default: return "Desconocido";
    }
  };
  
  // MODIFICADO: Al iniciar, siempre usar el turno actual del usuario
  useEffect(() => {
    // Siempre usar el turno actual del usuario
    const turnoId = mapearTurnoId(turnoActual);
    if (turnoId) {
      setTurnoSeleccionado(turnoId.toString());
    }
    
    // Siempre mostrar por defecto la vista de turno
    setTabValue('turno');
  }, [turnoActual]);
  
  // Cargar objetivos y registros cuando cambia la fecha seleccionada
  useEffect(() => {
    if (fechaSeleccionada) {
      const rango = obtenerRangoFechas();
      console.log(`Fecha de inicio: ${rango.inicioStr}, Fecha fin: ${rango.finStr}`);
      cargarDatos(rango.inicioStr, rango.finStr);
    }
  }, [fechaSeleccionada, periodoSeleccionado, turnoSeleccionado, user, turnoActual]);
  
  // Obtener rango de fechas según el periodo seleccionado
  const obtenerRangoFechas = () => {
    const hoy = new Date();
    let inicio, fin;
    
    if (periodoSeleccionado === 'actual') {
      inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    } else if (periodoSeleccionado === 'anterior') {
      inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
      fin = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
    } else if (periodoSeleccionado === 'personalizado') {
      inicio = fechaInicio || new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      fin = fechaFin || new Date();
    } else {
      // Si es "hoy" o cualquier otro valor no reconocido
      inicio = fechaSeleccionada;
      fin = fechaSeleccionada;
    }
    
    return {
      inicio,
      fin,
      inicioStr: obtenerFechaISO(inicio),
      finStr: obtenerFechaISO(fin)
    };
  };
  
  // Cargar objetivos y registros según filtros - Función corregida
  const cargarDatos = async (inicioStr, finStr) => {
    if (!user?.area) {
      toast({
        title: "Error",
        description: "No tiene un área asignada",
        variant: "destructive"
      });
      setCargando(false);
      return;
    }
    
    setCargando(true);
    const debugData = { logs: [] };
    
    try {
      // Asegurar que el área es un número
      const areaId = typeof user.area === 'string' ? parseInt(user.area, 10) : user.area;
      
      // 1. Cargar objetivos globales según el área del usuario
      const url = `${API_URL}/api/goals/area/${areaId}`;
      debugData.logs.push(`URL objetivos globales: ${url}`);
      
      const objetivosRes = await fetch(url);
      if (!objetivosRes.ok) {
        throw new Error("Error al cargar objetivos");
      }
      const objetivosData = await objetivosRes.json();
      debugData.logs.push(`Objetivos globales cargados: ${objetivosData.length}`);
      setObjetivos(objetivosData);
      
      // 2. Cargar objetivos específicos de turno - PRIORITARIO
      if (turnoActual) {
        const turnoId = mapearTurnoId(turnoActual);
        // Usar la ruta específica para obtener objetivos por turno y área
        const turnoUrl = `${API_URL}/api/goals/turno/${turnoId}/area/${areaId}`;
        debugData.logs.push(`URL objetivos turno: ${turnoUrl}`);
        
        try {
          const turnoResponse = await fetch(turnoUrl);
          if (turnoResponse.ok) {
            const turnoData = await turnoResponse.json();
            debugData.logs.push(`Objetivos de turno ${turnoActual} cargados: ${turnoData.length}`);
            setObjetivosTurno(turnoData);
            debugData.objetivosTurno = turnoData;
          } else {
            debugData.logs.push(`Error ${turnoResponse.status} al cargar objetivos de turno`);
            setObjetivosTurno([]);
          }
        } catch (err) {
          debugData.logs.push(`Error cargando objetivos de turno ${turnoActual}: ${err.message}`);
          setObjetivosTurno([]);
        }
      }
      
      // 3. Cargar registros para cada objetivo global
      const registrosObj = {};
      for (const objetivo of objetivosData) {
        try {
          debugData.logs.push(`Cargando registros para objetivo ${objetivo.id}...`);
          
          // Ampliar el rango de fechas para capturar registros con offset de zona horaria
          const inicioAmpliado = new Date(inicioStr);
          inicioAmpliado.setDate(inicioAmpliado.getDate() - 1);
          const inicioAmpliadoStr = obtenerFechaISO(inicioAmpliado);
          
          const finAmpliado = new Date(finStr);
          finAmpliado.setDate(finAmpliado.getDate() + 1);
          const finAmpliadoStr = obtenerFechaISO(finAmpliado);
          
          // IMPORTANTE: Asegurarse de que se cargan todos los registros, incluso sin filtro de turno
          // para poder analizarlos correctamente al calcular las métricas
          let registrosUrl = `${API_URL}/api/daily-records/goal/${objetivo.id}?start_date=${inicioAmpliadoStr}&end_date=${finAmpliadoStr}`;
          
          // El filtro de turno lo realizaremos después de obtener los datos
          debugData.logs.push(`URL registros (sin filtro de turno): ${registrosUrl}`);
          
          const registrosRes = await fetch(registrosUrl);
          if (registrosRes.ok) {
            const registrosData = await registrosRes.json();
            
            // Filtrar registros por fecha
            const registrosFiltrados = registrosData.filter(registro => {
              // Extraer solo la parte de la fecha (YYYY-MM-DD) para comparación
              const fechaRegistro = registro.record_date.split('T')[0];
              
              // Determinar si está dentro del rango original
              return fechaRegistro >= inicioStr && fechaRegistro <= finStr;
            });
            
            // Asegurar que todos los valores estén en el formato correcto
            const registrosFormateados = registrosFiltrados.map(registro => {
              // Convertir value_achieved a número si es posible
              if (registro.value_achieved !== null && registro.value_achieved !== undefined) {
                const numValue = parseFloat(registro.value_achieved);
                if (!isNaN(numValue)) {
                  registro.value_achieved = numValue;
                }
              }
              return registro;
            });
            
            registrosObj[objetivo.id] = registrosFormateados;
            debugData.logs.push(`Registros para objetivo ${objetivo.id}: ${registrosFormateados.length}`);
          }
        } catch (error) {
          debugData.logs.push(`Error al cargar registros para objetivo ${objetivo.id}: ${error.message}`);
        }
      }
      
      setRegistros(registrosObj);
      debugData.registros = registrosObj;
      
      // 4. PRIORITARIO: Cargar registros específicamente para objetivos de turno
      if (objetivosTurno && objetivosTurno.length > 0) {
        const registrosTurnoObj = {};
        const turnoId = mapearTurnoId(turnoActual);
        
        debugData.logs.push(`Cargando registros para ${objetivosTurno.length} objetivos de turno...`);
        
        for (const objetivo of objetivosTurno) {
          try {
            // Usar el goal_id para cargar los registros
            const goalId = objetivo.goal_id;
            
            // Amplio rango de fechas para capturar registros con offset
            const inicioAmpliado = new Date(inicioStr);
            inicioAmpliado.setDate(inicioAmpliado.getDate() - 1);
            const inicioAmpliadoStr = obtenerFechaISO(inicioAmpliado);
            
            const finAmpliado = new Date(finStr);
            finAmpliado.setDate(finAmpliado.getDate() + 1);
            const finAmpliadoStr = obtenerFechaISO(finAmpliado);
            
            // CORREGIDO: Cargar primero sin filtro de turno para asegurarnos de tener todos los datos
            const registrosUrl = `${API_URL}/api/daily-records/goal/${goalId}?start_date=${inicioAmpliadoStr}&end_date=${finAmpliadoStr}`;
            debugData.logs.push(`Consultando registros para objetivo ${goalId}: ${registrosUrl}`);
            
            const registrosRes = await fetch(registrosUrl);
            if (registrosRes.ok) {
              const registrosData = await registrosRes.json();
              
              // Filtrar los registros para el rango de fechas correcto
              const registrosFiltrados = registrosData.filter(registro => {
                // Extraer solo la parte de la fecha (YYYY-MM-DD) para comparación
                const fechaRegistro = registro.record_date.split('T')[0];
                
                // Determinar si está dentro del rango original
                const dentroDeRango = fechaRegistro >= inicioStr && fechaRegistro <= finStr;
                
                // IMPORTANTE: Filtrar por turno actual aquí - en la capa de aplicación
                const esTurnoActual = Number(registro.turno_id) === turnoId;
                
                return dentroDeRango && esTurnoActual;
              });
              
              // Asegurar que los valores estén en formato correcto
              const registrosFormateados = registrosFiltrados.map(registro => {
                // Convertir value_achieved a número si es posible
                if (registro.value_achieved !== null && registro.value_achieved !== undefined) {
                  const numValue = parseFloat(registro.value_achieved);
                  if (!isNaN(numValue)) {
                    registro.value_achieved = numValue;
                  }
                }
                return registro;
              });
              
              registrosTurnoObj[goalId] = registrosFormateados;
              debugData.logs.push(`Registros de turno para objetivo ${goalId}: ${registrosFormateados.length}`);
              debugData.logs.push(`Detalles de registros: ${JSON.stringify(registrosFormateados)}`);
            }
          } catch (error) {
            debugData.logs.push(`Error al cargar registros de turno para objetivo ${objetivo.goal_id}: ${error.message}`);
          }
        }
        
        setRegistrosTurno(registrosTurnoObj);
        debugData.registrosTurno = registrosTurnoObj;
      }
    } catch (error) {
      debugData.logs.push(`Error al cargar datos: ${error.message}`);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos. Por favor intente nuevamente.",
        variant: "destructive"
      });
    } finally {
      setCargando(false);
      setDebug(debugData);
    }
  };
  
  // Función corregida que calcula las métricas
  const calcularMetricas = (objetivosList, registrosObj) => {
    if (!objetivosList || objetivosList.length === 0) {
      return {
        total: 0,
        promedioGeneral: 0,
        alcanzados: 0,
        debajo: 0
      };
    }

    console.log(`Calculando métricas para ${objetivosList.length} objetivos con ${Object.keys(registrosObj).length} conjuntos de registros`);

    let sumaPromedios = 0;
    let alcanzados = 0;
    let debajo = 0;
    let objetivosConRegistros = 0;

    // Crear mapa de debug para ver qué está pasando
    const debugInfo = {};

    for (const objetivo of objetivosList) {
      // Identificar correctamente el ID del objetivo
      const objId = objetivo.id || objetivo.goal_id;
      const objRegistros = registrosObj[objId] || [];
      
      // Para debug
      debugInfo[objId] = {
        nombre: objetivo.name,
        tipo: objetivo.measurement_type,
        registros: objRegistros.length,
        valores: objRegistros.map(r => r.value_achieved)
      };
      
      if (objRegistros.length === 0) continue;

      objetivosConRegistros++;

      // CORRECCIÓN IMPORTANTE: Calcular el progreso según el tipo de medición
      if (objetivo.measurement_type === 'percentage') {
        // Usar el promedio de los valores porcentuales
        const valores = objRegistros.map(r => parseFloat(r.value_achieved) || 0);
        const promedio = valores.reduce((sum, val) => sum + val, 0) / valores.length;
        
        // Meta a alcanzar (priorizar meta de turno si existe)
        const metaValor = Number(objetivo.turno_target?.target_percentage) || 
                          Number(objetivo.target_percentage) || 100;
        
        sumaPromedios += promedio;
        debugInfo[objId].promedio = promedio;
        debugInfo[objId].meta = metaValor;
        
        // CORREGIDO: Comparar con tolerancia
        if (promedio >= metaValor || Math.abs(promedio - metaValor) < 0.01) {
          alcanzados++;
          debugInfo[objId].estado = "alcanzado";
        } else {
          debajo++;
          debugInfo[objId].estado = "debajo";
        }
      } 
      else if (objetivo.measurement_type === 'value') {
        // CORREGIDO: Para valor numérico, usar el último valor registrado
        const registrosOrdenados = [...objRegistros].sort((a, b) => 
          new Date(b.record_date) - new Date(a.record_date)
        );
        
        const valorActual = Number(registrosOrdenados[0]?.value_achieved || 0);
        
        // Meta a alcanzar (priorizar meta de turno si existe)
        const metaValor = Number(objetivo.turno_target?.target_value) || 
                          Number(objetivo.target_value) || 0;
        
        sumaPromedios += valorActual;
        debugInfo[objId].valorActual = valorActual;
        debugInfo[objId].meta = metaValor;
        
        // CORREGIDO: Comparar con tolerancia
        if (valorActual >= metaValor || Math.abs(valorActual - metaValor) < 0.01) {
          alcanzados++;
          debugInfo[objId].estado = "alcanzado";
        } else {
          debajo++;
          debugInfo[objId].estado = "debajo";
        }
      } 
      else { // Por defecto, asumir 'resolution'
        // Para resolución: verificar si está completado
        const completado = objRegistros.some(reg => {
          const valor = reg.value_achieved;
          return valor === true || valor === 1 || valor === "true" || 
                 valor === "1" || valor === "yes" || valor === "completado";
        });
        
        debugInfo[objId].completado = completado;
        
        if (completado) {
          alcanzados++;
          sumaPromedios += 100; // Considerarlo como 100% de cumplimiento
          debugInfo[objId].estado = "alcanzado";
        } else {
          debajo++;
          sumaPromedios += 0; // 0% de cumplimiento
          debugInfo[objId].estado = "debajo";
        }
      }
    }

    // Guardar info de debug en la consola
    console.log("Detalles de cálculo de métricas:", debugInfo);

    // Calcular el promedio general
    const promedioGeneral = objetivosConRegistros > 0 
      ? (sumaPromedios / objetivosConRegistros).toFixed(2)
      : 0;

    return {
      total: objetivosList.length,
      promedioGeneral,
      alcanzados,
      debajo,
      debugInfo // Incluir para depuración
    };
  };
  
  const metricasGlobales = calcularMetricas(objetivos, registros);
  const metricasTurno = calcularMetricas(objetivosTurno, registrosTurno);
  
  // Obtener nombre del área según su ID
  const obtenerNombreArea = (id) => {
    if (!id) return '';
    
    switch(parseInt(id)) {
      case 1: return 'Limpieza';
      case 2: return 'Atención al Cliente';
      case 3: return 'Juego';
      case 4: return 'Operaciones';
      default: return `Área ${id}`;
    }
  };
  
  const formatearFecha = (fechaStr) => {
    try {
      // Usar la construcción correcta de Date para evitar problemas de zona horaria
      const [year, month, day] = fechaStr.split('-').map(num => parseInt(num, 10));
      const fecha = new Date(year, month - 1, day); // month es 0-indexado en JavaScript
      
      return fecha.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (error) {
      console.error("Error al formatear fecha:", error);
      return fechaStr; // Devolver la fecha original si hay error
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart2 className="h-6 w-6" />
          Seguimiento de Objetivos
        </h1>
        
        <div className="flex gap-2">
          {(user?.role === 'coordinador_atencion' || 
            user?.role === 'jefe_juego' || 
            user?.role === 'jefe_operaciones' || 
            user?.role === 'jefe_limpieza') && (
            <Button 
              onClick={() => window.location.href = "/objetivos/seguimiento/diario"}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
            >
              <Calendar className="h-4 w-4" />
              Cargar Registro Diario
            </Button>
          )}
          
          {/* Botón para mostrar/ocultar debug */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setMostrarDebug(!mostrarDebug)}
            className="flex items-center gap-1"
          >
            <Bug className="h-4 w-4" />
            {mostrarDebug ? "Ocultar Debug" : "Ver Debug"}
          </Button>
        </div>
      </div>
      
      {/* Panel de Debug */}
      {mostrarDebug && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Panel de Depuración</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-auto max-h-60 bg-white p-2 rounded border">
              <h3 className="font-bold mb-1">Logs:</h3>
              {debug.logs?.map((log, i) => (
                <div key={i} className="text-xs text-gray-700">{log}</div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-bold mb-1">Objetivos Turno ({objetivosTurno.length}):</h3>
                <pre className="overflow-auto max-h-40 bg-white p-2 rounded border text-xs">
                  {JSON.stringify(objetivosTurno, null, 2)}
                </pre>
              </div>
              <div>
                <h3 className="font-bold mb-1">Registros Turno:</h3>
                <pre className="overflow-auto max-h-40 bg-white p-2 rounded border text-xs">
                  {JSON.stringify(registrosTurno, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Tarjeta de información y filtros */}
      <Card className="overflow-hidden shadow-md border-0">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2"></div>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Selector de periodo */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Calendar className="h-4 w-4 text-blue-500" />
                Periodo
              </label>
              <Select
                value={periodoSeleccionado}
                onValueChange={setPeriodoSeleccionado}
              >
                <SelectTrigger className="bg-white border border-gray-200 hover:border-blue-400 transition-colors">
                  <SelectValue placeholder="Seleccionar periodo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="actual">Mes actual</SelectItem>
                  <SelectItem value="anterior">Mes anterior</SelectItem>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                  <SelectItem value="hoy">Solo hoy</SelectItem>
                </SelectContent>
              </Select>
              
              {periodoSeleccionado === 'personalizado' && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Desde</label>
                    <input
                      type="date"
                      value={fechaInicio ? obtenerFechaISO(fechaInicio) : ''}
                      onChange={(e) => setFechaInicio(new Date(e.target.value))}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Hasta</label>
                    <input
                      type="date"
                      value={fechaFin ? obtenerFechaISO(fechaFin) : ''}
                      onChange={(e) => setFechaFin(new Date(e.target.value))}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </div>
              )}
              
              {periodoSeleccionado === 'hoy' && (
                <div className="space-y-1 mt-2">
                  <label className="text-xs text-muted-foreground">Fecha específica</label>
                  <input
                    type="date"
                    value={obtenerFechaISO(fechaSeleccionada)}
                    onChange={(e) => setFechaSeleccionada(new Date(e.target.value))}
                    className="w-full p-2 border rounded"
                  />
                </div>
              )}
            </div>
            
            {/* REEMPLAZADO: Indicador de Turno Actual en lugar de selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Clock className="h-4 w-4 text-blue-500" />
                Turno Actual
              </label>
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-md border border-blue-200 flex items-center gap-2">
                <Badge variant="secondary" className="bg-blue-500 text-white">
                  {turnoActual}
                </Badge>
                <span className="text-sm text-blue-700">
                  Mostrando datos solo para tu turno actual
                </span>
              </div>
            </div>
            
            {/* Área asignada */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Filter className="h-4 w-4 text-blue-500" />
                Área asignada
              </label>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-medium bg-blue-100 text-blue-700 border-blue-200">
                    {obtenerNombreArea(user?.area)}
                  </Badge>
                  <span className="text-blue-700 font-medium">
                    (<Clock className="inline h-3 w-3 mb-0.5" /> {turnoActual})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Pestañas para alternar entre vista global y de turno */}
      <Tabs value={tabValue} onValueChange={setTabValue} className="w-full">
        <TabsList className="w-full md:w-auto justify-start mb-0 p-1 bg-blue-50 rounded-lg">
          <TabsTrigger 
            value="turno" 
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-md"
          >
            <Clock className="h-4 w-4" />
            Objetivos de mi Turno
          </TabsTrigger>
          <TabsTrigger 
            value="global" 
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-md"
          >
            <BarChart2 className="h-4 w-4" />
            Objetivos Globales
          </TabsTrigger>
        </TabsList>
        
        {/* Contenido de Pestaña: Objetivos Globales */}
        <TabsContent value="global" className="mt-6 space-y-6">
          {cargando ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : objetivos.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg shadow-inner">
              <p className="text-muted-foreground">No hay objetivos globales definidos para su área.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Tarjetas de métricas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricaCard 
                  icon={Target} 
                  title="Total Objetivos" 
                  value={metricasGlobales.total} 
                  bgColor="bg-blue-100" 
                  textColor="text-blue-600" 
                />
                
                <MetricaCard 
                  icon={BarChart2} 
                  title="Promedio General" 
                  value={metricasGlobales.promedioGeneral} 
                  bgColor="bg-purple-100" 
                  textColor="text-purple-600" 
                  tendencia={metricasGlobales.tendencia}
                />
                
                <MetricaCard 
                  icon={CheckCircle2} 
                  title="Objetivos Alcanzados" 
                  value={metricasGlobales.alcanzados} 
                  bgColor="bg-green-100" 
                  textColor="text-green-600" 
                />
                
                <MetricaCard 
                  icon={Target} 
                  title="Por Debajo de Meta" 
                  value={metricasGlobales.debajo} 
                  bgColor="bg-red-100" 
                  textColor="text-red-600" 
                />
              </div>
              
              {/* Reportes detallados de cada objetivo global */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Detalle de Objetivos Globales</h2>
                {objetivos.map(objetivo => (
                  <div key={objetivo.id}>
                    <ReporteDetalle
                      objetivo={objetivo}
                      registros={registros[objetivo.id] || []}
                      turnoActual={turnoActual}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
        
        {/* Contenido de Pestaña: Objetivos de Turno - AHORA COMO PRINCIPAL */}
        <TabsContent value="turno" className="mt-6 space-y-6">
          {/* Indicador de Turno - Más prominente */}
          <Card className="overflow-hidden border-0 shadow-md">
            <div className="bg-gradient-to-r from-amber-400 to-amber-500 h-2"></div>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-100 text-amber-700 rounded-full p-3">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-amber-800">
                      Metas de Turno {turnoActual}
                    </h3>
                    <p className="text-sm text-amber-600">
                      Seguimiento en tiempo real de tus objetivos
                    </p>
                  </div>
                </div>
                <div className="grow"></div>
                <Badge className="bg-amber-100 text-amber-800 border-amber-200 px-3 py-1 text-sm">
                  {metricasTurno.alcanzados} de {metricasTurno.total} metas alcanzadas
                </Badge>
              </div>
            </CardContent>
          </Card>
                  
          {cargando ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : objetivosTurno.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg shadow-inner">
              <p className="text-muted-foreground">No hay objetivos específicos definidos para el turno {turnoActual}.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Tarjetas de métricas para turno */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricaCard 
                  icon={Target} 
                  title="Objetivos de Turno" 
                  value={metricasTurno.total} 
                  bgColor="bg-amber-100" 
                  textColor="text-amber-600" 
                />
                
                <MetricaCard 
                  icon={BarChart2} 
                  title="Promedio Turno" 
                  value={metricasTurno.promedioGeneral} 
                  bgColor="bg-blue-100" 
                  textColor="text-blue-600" 
                  tendencia={metricasTurno.tendencia}
                />
                
                <MetricaCard 
                  icon={CheckCircle2} 
                  title="Alcanzados en Turno" 
                  value={metricasTurno.alcanzados} 
                  bgColor="bg-green-100" 
                  textColor="text-green-600" 
                />
                
                <MetricaCard 
                  icon={Target} 
                  title="Por Debajo en Turno" 
                  value={metricasTurno.debajo} 
                  bgColor="bg-red-100" 
                  textColor="text-red-600" 
                />
              </div>
              
              {/* Reportes detallados de cada objetivo de turno */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Detalle de Objetivos de Tu Turno</h2>
                {objetivosTurno.map(objetivo => {
                  // Buscar el objetivo global correspondiente
                  const objetivoGlobal = objetivos.find(og => og.id === objetivo.goal_id) || {};
                  
                  // Combinar datos para mostrar info relevante
                  const objetivoMostrar = {
                    ...objetivoGlobal,
                    id: objetivo.goal_id,
                    name: objetivoGlobal.name || objetivo.name || `Objetivo ${objetivo.goal_id}`,
                    description: objetivoGlobal.description || objetivo.description || '',
                    // Usar las metas de turno como principales
                    target_percentage: objetivo.target_percentage,
                    target_value: objetivo.target_value,
                    target_resolution: objetivo.target_resolution,
                    // Agregar meta global como referencia
                    turno_target: {
                      id: objetivo.id,
                      target_percentage: objetivo.target_percentage,
                      target_value: objetivo.target_value,
                      target_resolution: objetivo.target_resolution
                    },
                    // Agregar el tipo de medición
                    measurement_type: objetivoGlobal.measurement_type || 'value'
                  };
                  
                  return (
                    <div key={`turno-${objetivo.id}`} className="mb-8">
                      <ReporteDetalle
                        key={`turno-${objetivo.id}`}
                        objetivo={objetivoMostrar}
                        registros={registrosTurno[objetivo.goal_id] || []}
                        turnoActual={turnoActual}
                        esTurno={true}
                        metaGlobal={{
                          target_percentage: objetivoGlobal.target_percentage,
                          target_value: objetivoGlobal.target_value,
                          target_resolution: objetivoGlobal.target_resolution
                        }}
                      />
                      
                      {/* Indicador de progreso de turno - MÁS PROMINENTE AQUÍ */}
                      <ProgresoTurnoIndicator 
                        objetivo={objetivoMostrar} 
                        turnoActual={turnoActual}
                        registros={registrosTurno[objetivo.goal_id] || []}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}