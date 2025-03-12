"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Target,
  BarChart2,
  CheckCircle2,
  Calendar,
  FileDown,
  Filter,
  AlertCircle,
  Download,
  Clock,
  Trophy,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const API_URL =
  typeof window !== "undefined"
    ? window.ENV?.NEXT_PUBLIC_API_URL || "http://localhost:3001"
    : "http://localhost:3001";

// Componente para las tarjetas de acciones rápidas con diseño mejorado
const ActionCard = ({ icon: Icon, title, subtitle, color, href, onClick }) => {
  const gradientBg = `bg-gradient-to-br from-${color}-50 to-white`;
  const borderColor = `border-l-${color}-500`;
  const bgIconColor = `bg-${color}-100`;
  const textIconColor = `text-${color}-600`;

  if (href) {
    return (
      <Link
        href={href}
        className={`rounded-lg shadow-md hover:shadow-lg transition-shadow block border-l-4 ${borderColor} overflow-hidden`}
      >
        <div className={`${gradientBg} p-6 flex items-center gap-4`}>
          <div className={`${bgIconColor} rounded-full p-3`}>
            <Icon className={`h-5 w-5 ${textIconColor}`} />
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
      className={`rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-l-4 ${borderColor} overflow-hidden`}
      onClick={onClick}
    >
      <div className={`${gradientBg} p-6 flex items-center gap-4`}>
        <div className={`${bgIconColor} rounded-full p-3`}>
          <Icon className={`h-5 w-5 ${textIconColor}`} />
        </div>
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </div>
  );
};

// Componente para las tarjetas de estadísticas con diseño mejorado
const StatsCard = ({ icon: Icon, title, value, color, description = null }) => {
  return (
    <Card className="border-0 shadow-md overflow-hidden">
      <div
        className={`bg-gradient-to-r from-${color}-500 to-${color}-600 h-1`}
      ></div>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
          <div className={`bg-${color}-100 rounded-full p-3`}>
            <Icon className={`h-6 w-6 text-${color}-600`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Componente para las tarjetas de objetivos con diseño mejorado
const ObjetivoCard = ({
  objetivo,
  showGlobalTarget = false,
  turnoTarget = null,
}) => {
  // Obtener el nombre del mes actual y anterior
  const getCurrentAndPreviousMonthNames = () => {
    const months = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];

    const now = new Date();
    const currentMonth = now.getMonth();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1; // Si es enero (0), el mes anterior es diciembre (11)

    return {
      current: months[currentMonth],
      previous: months[previousMonth],
    };
  };

  const { current: currentMonthName, previous: previousMonthName } =
    getCurrentAndPreviousMonthNames();

  const getStatusDetails = (progress) => {
    if (progress >= 100)
      return {
        label: "Completado",
        variant: "success",
        color: "text-green-700",
        bgColor: "#10b981",
      };
    if (progress >= 75)
      return {
        label: "Avanzado",
        variant: "default",
        color: "text-blue-700",
        bgColor: "#3b82f6",
      };
    if (progress >= 50)
      return {
        label: "En progreso",
        variant: "secondary",
        color: "text-yellow-600",
        bgColor: "#f59e0b",
      };
    if (progress >= 25)
      return {
        label: "Inicial",
        variant: "outline",
        color: "text-gray-600",
        bgColor: "#9ca3af",
      };
    return {
      label: "Pendiente",
      variant: "outline",
      color: "text-gray-500",
      bgColor: "#d1d5db",
    };
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

  // Formatea el valor de la meta específica por turno
  const formatTurnoGoalValue = () => {
    if (!turnoTarget) return "No establecida";

    switch (objetivo.measurement_type) {
      case "percentage":
        return `${turnoTarget.target_percentage || 0}%`;
      case "value":
        return turnoTarget.target_value || "N/A";
      case "resolution":
        return turnoTarget.target_resolution || "Completado";
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
      const sum = currentRecords.reduce(
        (acc, record) => acc + parseFloat(record.value_achieved || 0),
        0
      );
      return (sum / currentRecords.length).toFixed(1);
    } else if (objetivo.measurement_type === "value") {
      const currentRecords = objetivo.current_records || [];
      if (currentRecords.length === 0) return 0;

      // Obtenemos el último valor registrado
      const latestRecord = currentRecords.sort(
        (a, b) => new Date(b.record_date) - new Date(a.record_date)
      )[0];
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

      const sum = previousRecords.reduce(
        (acc, record) => acc + parseFloat(record.value_achieved || 0),
        0
      );
      return (sum / previousRecords.length).toFixed(1);
    } else if (objetivo.measurement_type === "value") {
      const previousRecords = objetivo.previous_records || [];
      if (previousRecords.length === 0) return 0;

      const latestRecord = previousRecords.sort(
        (a, b) => new Date(b.record_date) - new Date(a.record_date)
      )[0];
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

  if (
    objetivo.measurement_type === "percentage" ||
    objetivo.measurement_type === "value"
  ) {
    // Comparar los valores numéricos
    const current = parseFloat(currentActualValue);
    const previous = parseFloat(previousActualValue);
    hasImproved = current > previous;

    if (previous > 0) {
      improvementPercentage = (((current - previous) / previous) * 100).toFixed(
        1
      );
    } else if (current > 0) {
      improvementPercentage = "∞"; // Si el mes anterior era 0, cualquier mejora es infinita
    }
  } else {
    // Para resolución, comparamos si estaba completado o no
    hasImproved =
      currentActualValue === "Completado" &&
      previousActualValue === "Pendiente";
    improvementPercentage = hasImproved ? "100" : "0";
  }

  // Calcular contribución al objetivo global (solo para vistas de turno)
  const calculateContribution = () => {
    if (!turnoTarget || !showGlobalTarget) return null;

    // Calcula la contribución basada en el progreso del turno vs. el progreso global
    const turnoProgress = turnoTarget.progress_percentage || 0;
    const globalProgress = objetivo.progress_percentage || 0;

    if (globalProgress <= 0) return 0;

    return Math.min(100, Math.round((turnoProgress / globalProgress) * 100));
  };

  const contribution = calculateContribution();

  return (
    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow overflow-hidden">
      <div className={`bg-gradient-to-r from-blue-500 to-blue-600 h-1`}></div>
      <div className="p-5">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            {getIcon()}
            <h3 className="text-lg font-semibold">{objetivo.name}</h3>
          </div>
          <Badge
            className={`
              ${
                currentProgress >= 100
                  ? "bg-green-100 text-green-800 border-green-200"
                  : currentProgress >= 75
                  ? "bg-blue-100 text-blue-800 border-blue-200"
                  : currentProgress >= 50
                  ? "bg-amber-100 text-amber-800 border-amber-200"
                  : "bg-gray-100 text-gray-800 border-gray-200"
              }
            `}
          >
            {currentStatus.label}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground mb-3">
          {objetivo.description}
        </p>

        {/* Meta del objetivo */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          {showGlobalTarget && turnoTarget && (
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 gap-2">
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-gray-700">
                  Meta Global:
                </span>
                <span className="text-sm">{formatGoalValue()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                  Meta Turno
                </Badge>
                <span className="text-sm font-medium">
                  {formatTurnoGoalValue()}
                </span>
              </div>
            </div>
          )}

          {!showGlobalTarget && (
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium text-gray-700">Meta:</span>
              <span className="text-sm">{formatGoalValue()}</span>
            </div>
          )}

          {showGlobalTarget && turnoTarget && contribution !== null && (
            <div className="mt-2">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-gray-600">
                  Contribución al objetivo global:
                </span>
                <span
                  className={
                    contribution >= 90
                      ? "text-green-600 font-medium"
                      : contribution >= 50
                      ? "text-blue-600 font-medium"
                      : "text-amber-600 font-medium"
                  }
                >
                  {contribution}%
                </span>
              </div>
              <Progress
                value={contribution}
                className="h-1.5"
                color={
                  contribution >= 90
                    ? "bg-green-500"
                    : contribution >= 50
                    ? "bg-blue-500"
                    : "bg-amber-500"
                }
              />
            </div>
          )}
        </div>

        {/* Gráfico comparativo de meses */}
        <div className="space-y-4">
          {/* Mes actual */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium">{currentMonthName}</span>
              <span>{formatValue(currentActualValue)}</span>
            </div>
            <div className="relative h-5 rounded-full overflow-hidden bg-gray-200">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(currentProgress, 100)}%`,
                  backgroundColor: currentStatus.bgColor,
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
            <div className="relative h-5 rounded-full overflow-hidden bg-gray-200">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(previousProgress, 100)}%`,
                  backgroundColor: previousStatus.bgColor,
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
          <div className="flex justify-between items-center mt-2 bg-gray-50 p-2 rounded-lg text-xs">
            <span>Variación mensual:</span>
            <div className="flex items-center">
              {hasImproved ? (
                <span className="inline-flex items-center text-green-600 font-medium">
                  <TrendingUp className="h-3 w-3 mr-1" />+
                  {improvementPercentage !== "∞"
                    ? `${Math.abs(parseFloat(improvementPercentage))}%`
                    : "N/A"}
                </span>
              ) : parseFloat(improvementPercentage) === 0 ? (
                <span className="text-gray-600 font-medium">Sin cambios</span>
              ) : (
                <span className="text-red-600 font-medium">
                  -
                  {improvementPercentage !== "∞"
                    ? `${Math.abs(parseFloat(improvementPercentage))}%`
                    : "N/A"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default function ObjetivosPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState([]);
  const [turnoGoals, setTurnoGoals] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [areaInfo, setAreaInfo] = useState(null);
  const [tabValue, setTabValue] = useState("turno"); // Por defecto, mostrar pestaña de turno
  const [turnoActual, setTurnoActual] = useState("");

  // Determinar el turno actual
  useEffect(() => {
    const calcularTurno = () => {
      const now = new Date();
      const currentHour = now.getHours();
      if (currentHour >= 6 && currentHour < 14) {
        setTurnoActual("Mañana");
      } else if (currentHour >= 14 && currentHour < 22) {
        setTurnoActual("Tarde");
      } else {
        setTurnoActual("Noche");
      }
    };
    calcularTurno();
  }, []);

  // Función para mapear nombre de turno a ID
  const mapearTurnoId = (turno) => {
    switch (turno) {
      case "Mañana":
        return 1;
      case "Tarde":
        return 2;
      case "Noche":
        return 3;
      default:
        return 1;
    }
  };

  // Función para generar y descargar el reporte
  const exportarReporte = () => {
    // Verificar que hay datos para exportar
    if (goals.length === 0) {
      toast({
        title: "Error",
        description: "No hay datos para exportar",
        variant: "destructive",
      });
      return;
    }

    try {
      // Para Excel, es mejor usar punto y coma como separador en países donde la coma es separador decimal
      const separator = ";";

      // Iniciar el contenido con BOM (Byte Order Mark) para que Excel reconozca UTF-8
      let csvContent = "\uFEFF";

      // Encabezados
      csvContent +=
        ["Nombre", "Descripción", "Tipo", "Meta", "Progreso", "Estado"].join(
          separator
        ) + "\r\n";

      // Función para escapar células de Excel
      const escapeCsv = (text) => {
        if (text === null || text === undefined) return "";
        text = String(text);
        // Si contiene separadores, comillas o saltos de línea, envuelve en comillas
        if (
          text.includes(separator) ||
          text.includes('"') ||
          text.includes("\n")
        ) {
          // Duplicar comillas para escaparlas
          return '"' + text.replace(/"/g, '""') + '"';
        }
        return text;
      };

      // Agregar filas de datos
      goals.forEach((goal) => {
        const progress = goal.progress_percentage || 0;
        let estado = "Pendiente";
        if (progress >= 100) estado = "Completado";
        else if (progress >= 75) estado = "Avanzado";
        else if (progress >= 50) estado = "En progreso";
        else if (progress >= 25) estado = "Inicial";

        // Meta según tipo
        let meta = "";
        if (goal.measurement_type === "percentage")
          meta = `${goal.target_percentage}%`;
        else if (goal.measurement_type === "value") meta = goal.target_value;
        else meta = goal.target_resolution || "Completado";

        // Formatear tipo de medición para mostrar
        let tipoMedicion = goal.measurement_type;
        if (tipoMedicion === "percentage") tipoMedicion = "porcentaje";
        else if (tipoMedicion === "value") tipoMedicion = "valor";
        else tipoMedicion = "resolución";

        // Agregar fila al CSV
        csvContent +=
          [
            escapeCsv(goal.name),
            escapeCsv(goal.description),
            escapeCsv(tipoMedicion),
            escapeCsv(meta),
            escapeCsv(`${progress}%`),
            escapeCsv(estado),
          ].join(separator) + "\r\n";
      });

      // Crear un Blob con el contenido CSV
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

      // Crear URL para el blob
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `objetivos_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);

      // Descargar el archivo
      link.click();

      // Limpiar
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Éxito",
        description:
          "Reporte exportado correctamente. Abra el archivo con Excel.",
      });
    } catch (err) {
      console.error("Error al exportar:", err);
      toast({
        title: "Error",
        description: "No se pudo exportar el reporte",
        variant: "destructive",
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
        if (!user?.area && user?.role !== "jefe_juego") {
          setError("No tienes un área asignada. Contacta al administrador.");
          setLoading(false);
          return;
        }

        // Asegurar que el área es un número
        const areaId =
          typeof user.area === "string" ? parseInt(user.area, 10) : user.area;

        // Construir URL para obtener objetivos
        let url = `${API_URL}/api/goals/area/${areaId}`;

        // Si es jefe de juego, no filtrar por área
        if (user?.role === "jefe_juego") {
          url = `${API_URL}/api/goals`;
        }

        console.log("URL objetivos globales:", url);

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Error al cargar los objetivos");
        }

        const data = await response.json();
        console.log("Objetivos globales cargados:", data.length);

        // Cargar objetivos específicos de turno si procede
        let turnoData = [];
        if (turnoActual && user?.area) {
          const turnoId = mapearTurnoId(turnoActual);
          const turnoUrl = `${API_URL}/api/goals/turno/${turnoId}/area/${areaId}`;
          console.log("URL objetivos turno:", turnoUrl);

          try {
            const turnoResponse = await fetch(turnoUrl);
            if (turnoResponse.ok) {
              turnoData = await turnoResponse.json();
              console.log(
                `Objetivos de turno ${turnoActual} cargados:`,
                turnoData.length
              );
            } else {
              console.warn(
                `Error ${turnoResponse.status} al cargar objetivos de turno`
              );
            }
          } catch (err) {
            console.error(
              `Error cargando objetivos de turno ${turnoActual}:`,
              err
            );
          }
        }

        // Fechas para el mes actual
        const today = new Date();
        const firstDayOfCurrentMonth = new Date(
          today.getFullYear(),
          today.getMonth(),
          1
        );
        const lastDayOfCurrentMonth = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          0
        );

        // Fechas para el mes anterior
        const firstDayOfPreviousMonth = new Date(
          today.getFullYear(),
          today.getMonth() - 1,
          1
        );
        const lastDayOfPreviousMonth = new Date(
          today.getFullYear(),
          today.getMonth(),
          0
        );

        // Formatear fechas para la API
        const currentStartDate = firstDayOfCurrentMonth
          .toISOString()
          .split("T")[0];
        const currentEndDate = today.toISOString().split("T")[0]; // Hasta hoy
        const previousStartDate = firstDayOfPreviousMonth
          .toISOString()
          .split("T")[0];
        const previousEndDate = lastDayOfPreviousMonth
          .toISOString()
          .split("T")[0];

        // Cargar registros diarios para cada objetivo y calcular progreso real de ambos meses
        const goalsWithProgress = await Promise.all(
          data.map(async (goal) => {
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
                console.warn(
                  `No se pudieron cargar registros actuales para el objetivo ${goal.id}`
                );
              }

              if (previousRecordsResponse.ok) {
                previousRecords = await previousRecordsResponse.json();
              } else {
                console.warn(
                  `No se pudieron cargar registros del mes anterior para el objetivo ${goal.id}`
                );
              }

              // Calcular progreso del mes actual según el tipo de medición
              let currentProgress = 0;
              if (currentRecords && currentRecords.length > 0) {
                if (goal.measurement_type === "percentage") {
                  // Para porcentaje: Promedio de valores alcanzados / valor objetivo * 100
                  const sum = currentRecords.reduce(
                    (acc, record) =>
                      acc + parseFloat(record.value_achieved || 0),
                    0
                  );
                  const average = sum / currentRecords.length;
                  currentProgress =
                    (average / parseFloat(goal.target_percentage)) * 100;
                } else if (goal.measurement_type === "value") {
                  // Para valor: Último valor registrado / valor objetivo * 100
                  const latestRecord = currentRecords.sort(
                    (a, b) => new Date(b.record_date) - new Date(a.record_date)
                  )[0];
                  currentProgress =
                    (parseFloat(latestRecord.value_achieved || 0) /
                      parseFloat(goal.target_value)) *
                    100;
                } else if (goal.measurement_type === "resolution") {
                  // Para resolución: Si el último registro es true, 100%; si no, 0%
                  const latestRecord = currentRecords.sort(
                    (a, b) => new Date(b.record_date) - new Date(a.record_date)
                  )[0];
                  currentProgress = latestRecord.value_achieved ? 100 : 0;
                }
              }

              // Calcular progreso del mes anterior con la misma lógica
              let previousProgress = 0;
              if (previousRecords && previousRecords.length > 0) {
                if (goal.measurement_type === "percentage") {
                  const sum = previousRecords.reduce(
                    (acc, record) =>
                      acc + parseFloat(record.value_achieved || 0),
                    0
                  );
                  const average = sum / previousRecords.length;
                  previousProgress =
                    (average / parseFloat(goal.target_percentage)) * 100;
                } else if (goal.measurement_type === "value") {
                  // Tomamos el último registro del mes anterior
                  const latestRecord = previousRecords.sort(
                    (a, b) => new Date(b.record_date) - new Date(a.record_date)
                  )[0];
                  previousProgress =
                    (parseFloat(latestRecord.value_achieved || 0) /
                      parseFloat(goal.target_value)) *
                    100;
                } else if (goal.measurement_type === "resolution") {
                  const latestRecord = previousRecords.sort(
                    (a, b) => new Date(b.record_date) - new Date(a.record_date)
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
                previous_records: previousRecords,
              };
            } catch (error) {
              console.error(
                `Error calculando progreso para objetivo ${goal.id}:`,
                error
              );
              return {
                ...goal,
                progress_percentage: 0,
                previous_progress_percentage: 0,
              };
            }
          })
        );

        // Procesar objetivos de turno
        const turnoGoalsWithProgress = await Promise.all(
          turnoData.map(async (turnoGoal) => {
            try {
              // Buscar el objetivo global asociado
              const globalGoal = goalsWithProgress.find(
                (g) => g.id === turnoGoal.goal_id
              );

              // Obtener registros del mes actual para este turno
              const turnoId = mapearTurnoId(turnoActual);
              const turnoRecordsUrl = `${API_URL}/api/daily-records/goal/${turnoGoal.goal_id}?start_date=${currentStartDate}&end_date=${currentEndDate}&turno=${turnoId}`;
              console.log(
                `Cargando registros de turno para objetivo ${turnoGoal.goal_id}:`,
                turnoRecordsUrl
              );

              const turnoRecordsResponse = await fetch(turnoRecordsUrl);

              let turnoRecords = [];
              if (turnoRecordsResponse.ok) {
                turnoRecords = await turnoRecordsResponse.json();
                console.log(
                  `Registros de turno para objetivo ${turnoGoal.goal_id}:`,
                  turnoRecords.length
                );
              }

              // Calcular progreso del turno
              let turnoProgress = 0;
              if (turnoRecords && turnoRecords.length > 0) {
                if (turnoGoal.measurement_type === "percentage") {
                  const sum = turnoRecords.reduce(
                    (acc, record) =>
                      acc + parseFloat(record.value_achieved || 0),
                    0
                  );
                  const average = sum / turnoRecords.length;
                  turnoProgress =
                    (average /
                      parseFloat(
                        turnoGoal.target_percentage ||
                          globalGoal?.target_percentage
                      )) *
                    100;
                } else if (turnoGoal.measurement_type === "value") {
                  const latestRecord = turnoRecords.sort(
                    (a, b) => new Date(b.record_date) - new Date(a.record_date)
                  )[0];
                  turnoProgress =
                    (parseFloat(latestRecord.value_achieved || 0) /
                      parseFloat(
                        turnoGoal.target_value || globalGoal?.target_value
                      )) *
                    100;
                } else if (turnoGoal.measurement_type === "resolution") {
                  const latestRecord = turnoRecords.sort(
                    (a, b) => new Date(b.record_date) - new Date(a.record_date)
                  )[0];
                  turnoProgress = latestRecord.value_achieved ? 100 : 0;
                }
              }

              // Limitar progreso
              turnoProgress = Math.max(0, Math.min(100, turnoProgress));

              return {
                ...turnoGoal,
                progress_percentage: Math.round(turnoProgress),
                turno_records: turnoRecords,
                global_goal: globalGoal,
              };
            } catch (error) {
              console.error(
                `Error calculando progreso para objetivo de turno ${turnoGoal.id}:`,
                error
              );
              return {
                ...turnoGoal,
                progress_percentage: 0,
              };
            }
          })
        );

        setGoals(goalsWithProgress);
        setTurnoGoals(turnoGoalsWithProgress);
      } catch (err) {
        console.error("Error al cargar objetivos:", err);
        setError(err.message);
        toast({
          title: "Error",
          description:
            "No se pudieron cargar los objetivos. Por favor intente nuevamente.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchGoals();
    }
  }, [user, toast, turnoActual]);

  // Obtener nombre del área - Mantener la función original
  const obtenerNombreArea = (id) => {
    if (!id) return "";
    const area = areas.find((a) => a.id === id || a.area_id === id);
    return area ? area.name : areaInfo?.name || `Área ${id}`;
  };

  // Calcular resumen para objetivos globales
  const calculateGlobalSummary = () => {
    if (goals.length === 0)
      return {
        totalGoals: 0,
        completedGoals: 0,
        averageProgress: 0,
      };

    const totalGoals = goals.length;
    const completedGoals = goals.filter(
      (goal) => goal.progress_percentage >= 100
    ).length;
    const averageProgress =
      goals.reduce((sum, goal) => sum + (goal.progress_percentage || 0), 0) /
      totalGoals;

    return {
      totalGoals,
      completedGoals,
      averageProgress: Math.round(averageProgress),
    };
  };

  // Calcular resumen para objetivos de turno
  const calculateTurnoSummary = () => {
    if (turnoGoals.length === 0)
      return {
        totalGoals: 0,
        completedGoals: 0,
        averageProgress: 0,
      };

    const totalGoals = turnoGoals.length;
    const completedGoals = turnoGoals.filter(
      (goal) => goal.progress_percentage >= 100
    ).length;

    // AQUÍ ESTÁ EL ERROR - Calcula el promedio incorrecto
    const averageProgress =
      turnoGoals.reduce(
        (sum, goal) => sum + (goal.progress_percentage || 0),
        0
      ) / totalGoals;

    return {
      totalGoals,
      completedGoals,
      averageProgress: Math.round(averageProgress),
    };
  };

  const globalSummary = calculateGlobalSummary();
  const turnoSummary = calculateTurnoSummary();

  // Verificar si el usuario puede cargar resultados
  const puedeCargarResultados =
    user?.role === "coordinador_atencion" ||
    user?.role === "jefe_juego" ||
    user?.role === "jefe_operaciones" ||
    user?.role === "jefe_limpieza";

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-center text-destructive p-4 bg-red-50 rounded-lg">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
          <p className="font-medium">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2 text-gray-800">
          <BarChart2 className="w-8 h-8 text-blue-600" />
          Tablero de Objetivos
        </h1>
      </div>

      {/* Indicador de área filtrada para usuarios específicos */}
      {user && user.role !== "jefe_juego" && (
        <Card className="overflow-hidden border-0 shadow-md">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-1"></div>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 text-blue-700 rounded-full p-2.5">
                <Filter className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Filtrando por área</p>
                <p className="font-medium text-blue-700 mt-0.5">
                  {obtenerNombreArea(user.area)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

        <TabsContent value="global" className="mt-6 space-y-6">
          {/* Acciones Rápidas para vista global */}
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

          {/* Tarjetas de Estadísticas para vista global */}
          <div className="grid md:grid-cols-3 gap-4">
            <StatsCard
              icon={Target}
              title="Total de Objetivos"
              value={globalSummary.totalGoals}
              color="green"
              description="Objetivos asignados al área"
            />
            <StatsCard
              icon={CheckCircle2}
              title="Objetivos Completados"
              value={globalSummary.completedGoals}
              color="blue"
              description={`${
                globalSummary.completedGoals > 0
                  ? (
                      (globalSummary.completedGoals /
                        globalSummary.totalGoals) *
                      100
                    ).toFixed(0)
                  : 0
              }% de cumplimiento`}
            />
            <StatsCard
              icon={Trophy}
              title="Progreso Promedio"
              value={`${globalSummary.averageProgress}%`}
              color="purple"
              description="Promedio de todos los objetivos"
            />
          </div>

          {/* Lista de Objetivos Globales con título */}
          <div className="space-y-4 mt-6">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
              Objetivos Globales del Área
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {goals.map((goal) => (
                <ObjetivoCard key={goal.id} objetivo={goal} />
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="turno" className="mt-6 space-y-6">
          {/* Indicador de Turno */}
          <Card className="overflow-hidden border-0 shadow-md">
            <div className="bg-gradient-to-r from-amber-400 to-amber-500 h-1"></div>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-100 text-amber-700 rounded-full p-2.5">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Turno actual</p>
                    <p className="font-medium text-amber-700 text-lg">
                      {turnoActual}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500">
                    Mostrando metas específicas para este turno
                  </p>
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                    {turnoGoals.length} objetivos
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Acciones Rápidas para vista de turno */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              title="Seguimiento de Turno"
              subtitle="Ver tendencias específicas"
              color="green"
              href={`/objetivos/seguimiento?turno=${mapearTurnoId(
                turnoActual
              )}`}
            />
          </div>

          {/* Tarjetas de Estadísticas para vista de turno */}
          <div className="grid md:grid-cols-3 gap-4">
            <StatsCard
              icon={Target}
              title="Objetivos de Turno"
              value={turnoSummary.totalGoals}
              color="amber"
              description="Metas específicas para este turno"
            />
            <StatsCard
              icon={CheckCircle2}
              title="Completados en Turno"
              value={turnoSummary.completedGoals}
              color="green"
              description={`${
                turnoSummary.completedGoals > 0
                  ? (
                      (turnoSummary.completedGoals / turnoSummary.totalGoals) *
                      100
                    ).toFixed(0)
                  : 0
              }% de cumplimiento`}
            />
            <StatsCard
              icon={Trophy}
              title="Progreso en Turno"
              value={`${turnoSummary.averageProgress}%`}
              color="blue"
              description="Avance hacia las metas de turno"
            />
          </div>

          {/* Lista de Objetivos de Turno con título */}
          <div className="space-y-4 mt-6">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
              Objetivos Específicos del Turno {turnoActual}
            </h2>
            {turnoGoals.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {turnoGoals.map((turnoGoal) => (
                  <ObjetivoCard
                    key={`turno-${turnoGoal.id}`}
                    objetivo={turnoGoal.global_goal || turnoGoal}
                    showGlobalTarget={true}
                    turnoTarget={turnoGoal}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8 bg-gray-50 rounded-lg shadow-inner">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
                <p>
                  No hay objetivos específicos para el turno {turnoActual} en tu
                  área
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
