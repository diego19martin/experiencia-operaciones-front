"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/components/ui/use-toast"
import { 
  Target, 
  BarChart2, 
  CheckCircle2, 
  Calendar, 
  FileDown, 
  Filter,
  AlertCircle,
  Download
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const API_URL = typeof window !== 'undefined' 
  ? (window.ENV?.NEXT_PUBLIC_API_URL || "http://localhost:3001") 
  : "http://localhost:3001"

// Componente para las tarjetas de acciones rápidas
const ActionCard = ({ icon: Icon, title, subtitle, color, href, onClick }) => {
  if (href) {
    return (
      <Link 
        href={href}
        className={`bg-gradient-to-br from-${color}-50 to-white border-l-4 border-l-${color}-500 rounded-lg shadow hover:shadow-md transition-shadow block`}
      >
        <div className="p-6 flex items-center gap-4">
          <div className={`bg-${color}-100 rounded-full p-3`}>
            <Icon className={`h-5 w-5 text-${color}-600`} />
          </div>
          <div>
            <p className="font-medium">{title}</p>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </Link>
    );
  }
  
  return (
    <div 
      className={`bg-gradient-to-br from-${color}-50 to-white border-l-4 border-l-${color}-500 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer`}
      onClick={onClick}
    >
      <div className="p-6 flex items-center gap-4">
        <div className={`bg-${color}-100 rounded-full p-3`}>
          <Icon className={`h-5 w-5 text-${color}-600`} />
        </div>
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </div>
  );
};

// Componente para las tarjetas de estadísticas
const StatsCard = ({ icon: Icon, title, value, bgColor, textColor }) => {
  return (
    <Card>
      <CardContent className="pt-6 flex items-center gap-4">
        <div className={`${bgColor} rounded-full p-3`}>
          <Icon className={`h-6 w-6 ${textColor}`} />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
};

// Componente para las tarjetas de objetivos con comparación entre meses
const ObjetivoCard = ({ objetivo }) => {
  // Obtener el nombre del mes actual y anterior
  const getCurrentAndPreviousMonthNames = () => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1; // Si es enero (0), el mes anterior es diciembre (11)
    
    return {
      current: months[currentMonth],
      previous: months[previousMonth]
    };
  };
  
  const { current: currentMonthName, previous: previousMonthName } = getCurrentAndPreviousMonthNames();
  
  const getStatusDetails = (progress) => {
    if (progress >= 100) return { label: "Completado", variant: "success", color: "text-green-700", bgColor: "#10b981" };
    if (progress >= 75) return { label: "Avanzado", variant: "default", color: "text-blue-700", bgColor: "#3b82f6" };
    if (progress >= 50) return { label: "En progreso", variant: "secondary", color: "text-yellow-600", bgColor: "#f59e0b" };
    if (progress >= 25) return { label: "Inicial", variant: "outline", color: "text-gray-600", bgColor: "#9ca3af" };
    return { label: "Pendiente", variant: "outline", color: "text-gray-500", bgColor: "#d1d5db" };
  };
  
  const calculateGoalValue = () => {
    switch (objetivo.measurement_type) {
      case "percentage":
        return objetivo.target_percentage || 0;
      case "value":
        return objetivo.target_value || 0;
      case "resolution":
        return 100; // Para tipo resolución, la meta siempre es completar al 100%
      default:
        return 0;
    }
  };
  
  const formatGoalValue = () => {
    switch (objetivo.measurement_type) {
      case "percentage":
        return `${objetivo.target_percentage || 0}%`;
      case "value":
        return objetivo.target_value || "N/A";
      case "resolution":
        return objetivo.target_resolution || "Completado";
      default:
        return "N/A";
    }
  };
  
  const targetValue = calculateGoalValue();
  
  // Progreso real: qué porcentaje de la meta se ha cumplido
  const currentProgress = objetivo.progress_percentage ?? 0;
  const previousProgress = objetivo.previous_progress_percentage ?? 0;
  
  // Valores actuales reales (no porcentaje de progreso)
  const getCurrentActualValue = () => {
    if (objetivo.measurement_type === "percentage") {
      const currentRecords = objetivo.current_records || [];
      if (currentRecords.length === 0) return 0;
      
      // Calculamos el promedio del valor alcanzado en los registros
      const sum = currentRecords.reduce((acc, record) => 
        acc + parseFloat(record.value_achieved || 0), 0);
      return (sum / currentRecords.length).toFixed(1);
    } else if (objetivo.measurement_type === "value") {
      const currentRecords = objetivo.current_records || [];
      if (currentRecords.length === 0) return 0;
      
      // Obtenemos el último valor registrado
      const latestRecord = currentRecords.sort((a, b) => 
        new Date(b.record_date) - new Date(a.record_date))[0];
      return parseFloat(latestRecord.value_achieved || 0).toFixed(1);
    } else {
      // Para tipo resolución, indicamos si está completado o no
      return currentProgress >= 100 ? "Completado" : "Pendiente";
    }
  };
  
  const getPreviousActualValue = () => {
    if (objetivo.measurement_type === "percentage") {
      const previousRecords = objetivo.previous_records || [];
      if (previousRecords.length === 0) return 0;
      
      const sum = previousRecords.reduce((acc, record) => 
        acc + parseFloat(record.value_achieved || 0), 0);
      return (sum / previousRecords.length).toFixed(1);
    } else if (objetivo.measurement_type === "value") {
      const previousRecords = objetivo.previous_records || [];
      if (previousRecords.length === 0) return 0;
      
      const latestRecord = previousRecords.sort((a, b) => 
        new Date(b.record_date) - new Date(a.record_date))[0];
      return parseFloat(latestRecord.value_achieved || 0).toFixed(1);
    } else {
      return previousProgress >= 100 ? "Completado" : "Pendiente";
    }
  };
  
  const currentActualValue = getCurrentActualValue();
  const previousActualValue = getPreviousActualValue();
  const currentStatus = getStatusDetails(currentProgress);
  const previousStatus = getStatusDetails(previousProgress);
  
  // Determinar icono basado en tipo de objetivo
  const getIcon = () => {
    switch (objetivo.measurement_type) {
      case "percentage":
        return <BarChart2 className="w-5 h-5" />;
      case "value":
        return <Target className="w-5 h-5" />;
      case "resolution":
        return <CheckCircle2 className="w-5 h-5" />;
      default:
        return <Target className="w-5 h-5" />;
    }
  };
  
  // Formatear los valores para mostrar
  const formatValue = (value) => {
    if (objetivo.measurement_type === "percentage") {
      return `${value}%`;
    } else if (objetivo.measurement_type === "value") {
      return value;
    } else {
      return value; // Ya está formateado como "Completado" o "Pendiente"
    }
  };
  
  // Determinar si hay mejora respecto al mes anterior
  let hasImproved = false;
  let improvementPercentage = "0";
  
  if (objetivo.measurement_type === "percentage" || objetivo.measurement_type === "value") {
    // Comparar los valores numéricos
    const current = parseFloat(currentActualValue);
    const previous = parseFloat(previousActualValue);
    hasImproved = current > previous;
    
    if (previous > 0) {
      improvementPercentage = ((current - previous) / previous * 100).toFixed(1);
    } else if (current > 0) {
      improvementPercentage = "∞"; // Si el mes anterior era 0, cualquier mejora es infinita
    }
  } else {
    // Para resolución, comparamos si estaba completado o no
    hasImproved = currentActualValue === "Completado" && previousActualValue === "Pendiente";
    improvementPercentage = hasImproved ? "100" : "0";
  }
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="p-5 border-b">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            {getIcon()}
            <h3 className="text-lg font-medium">{objetivo.name}</h3>
          </div>
          <Badge variant={currentStatus.variant} className="flex items-center gap-1">
            {currentStatus.label}
          </Badge>
        </div>
        
        <p className="text-sm text-muted-foreground mb-3">{objetivo.description}</p>
        
        {/* Meta del objetivo */}
        <div className="text-sm mb-4">
          <span className="font-medium">Meta: </span>
          <span>{formatGoalValue()}</span>
        </div>
        
        {/* Gráfico comparativo de meses */}
        <div className="space-y-4">
          {/* Mes actual */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium">{currentMonthName}</span>
              <span>{formatValue(currentActualValue)}</span>
            </div>
            <div className="relative h-5">
              <div className="absolute inset-0 bg-gray-200 rounded-full"></div>
              <div 
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min(currentProgress, 100)}%`,
                  backgroundColor: currentStatus.bgColor
                }}
              >
                {currentProgress > 30 && (
                  <span className="absolute inset-0 flex items-center justify-start pl-2 text-white text-xs font-medium">
                    {formatValue(currentActualValue)}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Mes anterior */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium">{previousMonthName}</span>
              <span>{formatValue(previousActualValue)}</span>
            </div>
            <div className="relative h-5">
              <div className="absolute inset-0 bg-gray-200 rounded-full"></div>
              <div 
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min(previousProgress, 100)}%`,
                  backgroundColor: previousStatus.bgColor
                }}
              >
                {previousProgress > 30 && (
                  <span className="absolute inset-0 flex items-center justify-start pl-2 text-white text-xs font-medium">
                    {formatValue(previousActualValue)}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Comparativa mensual */}
          <div className="flex justify-between items-center mt-2 text-xs">
            <span>Variación mensual:</span>
            <span 
              className={`font-medium ${hasImproved ? 'text-green-600' : 
                (objetivo.measurement_type !== "resolution" && parseFloat(currentActualValue) === parseFloat(previousActualValue)) || 
                (objetivo.measurement_type === "resolution" && currentActualValue === previousActualValue) 
                ? 'text-gray-600' : 'text-red-600'}`}
            >
              {hasImproved ? '+' : 
                (objetivo.measurement_type !== "resolution" && parseFloat(currentActualValue) === parseFloat(previousActualValue)) || 
                (objetivo.measurement_type === "resolution" && currentActualValue === previousActualValue) 
                ? '' : '-'}
              {improvementPercentage !== "∞" ? `${Math.abs(parseFloat(improvementPercentage))}%` : "N/A"}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default function ObjetivosPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [goals, setGoals] = useState([])
  const [areas, setAreas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [areaInfo, setAreaInfo] = useState(null)

  // Función para generar y descargar el reporte
  const exportarReporte = () => {
    // Verificar que hay datos para exportar
    if (goals.length === 0) {
      toast({
        title: "Error",
        description: "No hay datos para exportar",
        variant: "destructive"
      });
      return;
    }

    try {
      // Para Excel, es mejor usar punto y coma como separador en países donde la coma es separador decimal
      const separator = ";";
      
      // Iniciar el contenido con BOM (Byte Order Mark) para que Excel reconozca UTF-8
      let csvContent = "\uFEFF";
      
      // Encabezados
      csvContent += ["Nombre", "Descripción", "Tipo", "Meta", "Progreso", "Estado"].join(separator) + "\r\n";
      
      // Función para escapar células de Excel
      const escapeCsv = (text) => {
        if (text === null || text === undefined) return '';
        text = String(text);
        // Si contiene separadores, comillas o saltos de línea, envuelve en comillas
        if (text.includes(separator) || text.includes('"') || text.includes('\n')) {
          // Duplicar comillas para escaparlas
          return '"' + text.replace(/"/g, '""') + '"';
        }
        return text;
      };
      
      // Agregar filas de datos
      goals.forEach(goal => {
        const progress = goal.progress_percentage || 0;
        let estado = "Pendiente";
        if (progress >= 100) estado = "Completado";
        else if (progress >= 75) estado = "Avanzado";
        else if (progress >= 50) estado = "En progreso";
        else if (progress >= 25) estado = "Inicial";
        
        // Meta según tipo
        let meta = '';
        if (goal.measurement_type === 'percentage') meta = `${goal.target_percentage}%`;
        else if (goal.measurement_type === 'value') meta = goal.target_value;
        else meta = goal.target_resolution || 'Completado';
        
        // Formatear tipo de medición para mostrar
        let tipoMedicion = goal.measurement_type;
        if (tipoMedicion === 'percentage') tipoMedicion = 'porcentaje';
        else if (tipoMedicion === 'value') tipoMedicion = 'valor';
        else tipoMedicion = 'resolución';
        
        // Agregar fila al CSV
        csvContent += [
          escapeCsv(goal.name),
          escapeCsv(goal.description),
          escapeCsv(tipoMedicion),
          escapeCsv(meta),
          escapeCsv(`${progress}%`),
          escapeCsv(estado)
        ].join(separator) + "\r\n";
      });
      
      // Crear un Blob con el contenido CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Crear URL para el blob
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `objetivos_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      
      // Descargar el archivo
      link.click();
      
      // Limpiar
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Éxito",
        description: "Reporte exportado correctamente. Abra el archivo con Excel.",
      });
    } catch (err) {
      console.error("Error al exportar:", err);
      toast({
        title: "Error",
        description: "No se pudo exportar el reporte",
        variant: "destructive"
      });
    }
  };

  // Cargar áreas
  useEffect(() => {
    const cargarAreas = async () => {
      try {
        const res = await fetch(`${API_URL}/api/areas`);
        if (res.ok) {
          const data = await res.json();
          setAreas(data);
        }
      } catch (err) {
        console.error("Error al cargar áreas:", err);
      }
    };
    
    cargarAreas();
  }, []);

  // Cargar información del área del usuario
  useEffect(() => {
    const cargarInfoArea = async () => {
      if (!user?.area) return;
      
      try {
        const res = await fetch(`${API_URL}/api/areas/${user.area}`);
        if (res.ok) {
          const data = await res.json();
          setAreaInfo(data);
        }
      } catch (err) {
        console.error("Error al cargar información del área:", err);
      }
    };
    
    if (user) {
      cargarInfoArea();
    }
  }, [user]);

  // Cargar objetivos con cálculo real de progreso actual y del mes anterior
  useEffect(() => {
    const fetchGoals = async () => {
      try {
        setLoading(true);
        setError(null);

        // Verificar si el usuario tiene un área asignada
        if (!user?.area && user?.role !== 'jefe_juego') {
          setError("No tienes un área asignada. Contacta al administrador.");
          setLoading(false);
          return;
        }
        
        // Construir URL para obtener objetivos
        let url = `${API_URL}/api/goals`;
        
        // Si no es jefe de juego, filtrar por área
        if (user?.role !== "jefe_juego") {
          url += `?area=${user.area}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Error al cargar los objetivos");
        }
        
        const data = await response.json();
        console.log("Objetivos cargados:", data.length);
        
        // Fechas para el mes actual
        const today = new Date();
        const firstDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        // Fechas para el mes anterior
        const firstDayOfPreviousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDayOfPreviousMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        
        // Formatear fechas para la API
        const currentStartDate = firstDayOfCurrentMonth.toISOString().split('T')[0];
        const currentEndDate = today.toISOString().split('T')[0]; // Hasta hoy
        const previousStartDate = firstDayOfPreviousMonth.toISOString().split('T')[0];
        const previousEndDate = lastDayOfPreviousMonth.toISOString().split('T')[0];
        
        // Cargar registros diarios para cada objetivo y calcular progreso real de ambos meses
        const goalsWithProgress = await Promise.all(data.map(async (goal) => {
          try {
            // 1. Obtener registros del mes actual
            const currentRecordsUrl = `${API_URL}/api/daily-records/goal/${goal.id}?start_date=${currentStartDate}&end_date=${currentEndDate}`;
            const currentRecordsResponse = await fetch(currentRecordsUrl);
            
            // 2. Obtener registros del mes anterior
            const previousRecordsUrl = `${API_URL}/api/daily-records/goal/${goal.id}?start_date=${previousStartDate}&end_date=${previousEndDate}`;
            const previousRecordsResponse = await fetch(previousRecordsUrl);
            
            let currentRecords = [];
            let previousRecords = [];
            
            if (currentRecordsResponse.ok) {
              currentRecords = await currentRecordsResponse.json();
            } else {
              console.warn(`No se pudieron cargar registros actuales para el objetivo ${goal.id}`);
            }
            
            if (previousRecordsResponse.ok) {
              previousRecords = await previousRecordsResponse.json();
            } else {
              console.warn(`No se pudieron cargar registros del mes anterior para el objetivo ${goal.id}`);
            }
            
            // Calcular progreso del mes actual según el tipo de medición
            let currentProgress = 0;
            if (currentRecords && currentRecords.length > 0) {
              if (goal.measurement_type === 'percentage') {
                // Para porcentaje: Promedio de valores alcanzados / valor objetivo * 100
                const sum = currentRecords.reduce((acc, record) => acc + parseFloat(record.value_achieved || 0), 0);
                const average = sum / currentRecords.length;
                currentProgress = (average / parseFloat(goal.target_percentage)) * 100;
              } 
              else if (goal.measurement_type === 'value') {
                // Para valor: Último valor registrado / valor objetivo * 100
                const latestRecord = currentRecords.sort((a, b) => 
                  new Date(b.record_date) - new Date(a.record_date)
                )[0];
                currentProgress = (parseFloat(latestRecord.value_achieved || 0) / parseFloat(goal.target_value)) * 100;
              } 
              else if (goal.measurement_type === 'resolution') {
                // Para resolución: Si el último registro es true, 100%; si no, 0%
                const latestRecord = currentRecords.sort((a, b) => 
                  new Date(b.record_date) - new Date(a.record_date)
                )[0];
                currentProgress = latestRecord.value_achieved ? 100 : 0;
              }
            }
            
            // Calcular progreso del mes anterior con la misma lógica
            let previousProgress = 0;
            if (previousRecords && previousRecords.length > 0) {
              if (goal.measurement_type === 'percentage') {
                const sum = previousRecords.reduce((acc, record) => acc + parseFloat(record.value_achieved || 0), 0);
                const average = sum / previousRecords.length;
                previousProgress = (average / parseFloat(goal.target_percentage)) * 100;
              } 
              else if (goal.measurement_type === 'value') {
                // Tomamos el último registro del mes anterior
                const latestRecord = previousRecords.sort((a, b) => 
                  new Date(b.record_date) - new Date(a.record_date)
                )[0];
                previousProgress = (parseFloat(latestRecord.value_achieved || 0) / parseFloat(goal.target_value)) * 100;
              } 
              else if (goal.measurement_type === 'resolution') {
                const latestRecord = previousRecords.sort((a, b) => 
                  new Date(b.record_date) - new Date(a.record_date)
                )[0];
                previousProgress = latestRecord.value_achieved ? 100 : 0;
              }
            }
            
            // Limitar el progreso entre 0 y 100
            currentProgress = Math.max(0, Math.min(100, currentProgress));
            previousProgress = Math.max(0, Math.min(100, previousProgress));
            
            // Además de los datos de progreso, agregar los registros reales también para referencia
            return {
              ...goal,
              progress_percentage: Math.round(currentProgress),
              previous_progress_percentage: Math.round(previousProgress),
              current_records: currentRecords,
              previous_records: previousRecords
            };
          } catch (error) {
            console.error(`Error calculando progreso para objetivo ${goal.id}:`, error);
            return {
              ...goal,
              progress_percentage: 0,
              previous_progress_percentage: 0
            };
          }
        }));
        
        setGoals(goalsWithProgress);
      } catch (err) {
        console.error("Error al cargar objetivos:", err);
        setError(err.message);
        toast({
          title: "Error",
          description: "No se pudieron cargar los objetivos. Por favor intente nuevamente.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchGoals();
    }
  }, [user, toast]);

  // Obtener nombre del área - Mantener la función original
  const obtenerNombreArea = (id) => {
    if (!id) return '';
    const area = areas.find(a => a.id === id || a.area_id === id);
    return area ? area.name : (areaInfo?.name || `Área ${id}`);
  };

  // Calcular resumen
  const calculateSummary = () => {
    if (goals.length === 0) return {
      totalGoals: 0,
      completedGoals: 0,
      averageProgress: 0
    }

    const totalGoals = goals.length;
    const completedGoals = goals.filter(goal => 
      goal.progress_percentage >= 100
    ).length;
    const averageProgress = goals.reduce((sum, goal) => 
      sum + (goal.progress_percentage || 0), 0) / totalGoals;

    return {
      totalGoals,
      completedGoals,
      averageProgress: Math.round(averageProgress)
    }
  };

  const summary = calculateSummary();

  // Verificar si el usuario puede cargar resultados
  const puedeCargarResultados = user?.role === "coordinador_atencion" || 
                              user?.role === "jefe_juego" || 
                              user?.role === "jefe_operaciones" || 
                              user?.role === "jefe_limpieza";

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-center text-destructive p-4">
          Error: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart2 className="w-8 h-8" />
          Tablero de Objetivos
        </h1>
      </div>

      {/* Indicador de área filtrada para usuarios específicos */}
      {user && user.role !== 'jefe_juego' && (
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="pt-6 pb-4">
            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Filtrando por área</p>
                <p className="font-medium text-blue-700">
                  {obtenerNombreArea(user.area)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Acciones Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {puedeCargarResultados && (
          <ActionCard 
            icon={Calendar} 
            title="Carga Diaria" 
            subtitle="Registrar resultados" 
            color="blue" 
            href="/objetivos/seguimiento/diario" 
          />
        )}
        <ActionCard 
          icon={BarChart2} 
          title="Seguimiento" 
          subtitle="Ver tendencias" 
          color="green" 
          href="/objetivos/seguimiento" 
        />
        <ActionCard 
          icon={FileDown} 
          title="Exportar" 
          subtitle="Descargar reporte" 
          color="amber" 
          onClick={exportarReporte} 
        />
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className="grid md:grid-cols-2 gap-4">
        <StatsCard 
          icon={Target} 
          title="Total de Objetivos" 
          value={summary.totalGoals} 
          bgColor="bg-green-100" 
          textColor="text-green-600" 
        />
        <StatsCard 
          icon={CheckCircle2} 
          title="Objetivos Completados" 
          value={summary.completedGoals} 
          bgColor="bg-blue-100" 
          textColor="text-blue-600" 
        />
      </div>

      {/* Lista de Objetivos */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map((goal) => (
          <ObjetivoCard key={goal.id} objetivo={goal} />
        ))}
      </div>

      {goals.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
          <p>No hay objetivos disponibles para tu área</p>
        </div>
      )}
    </div>
  );
}