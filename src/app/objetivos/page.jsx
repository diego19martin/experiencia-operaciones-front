"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/components/ui/use-toast"
import { 
  Target, 
  BarChart2, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  Clock,
  Filter
} from "lucide-react"
import ObjetivoActions from "@/components/ObjetivoActions"

const API_URL = typeof window !== 'undefined' 
  ? (window.ENV?.NEXT_PUBLIC_API_URL || "http://localhost:3001")
  : "http://localhost:3001"

const getStatusDetails = (progress) => {
  if (progress === null || progress === undefined) {
    return { 
      label: "Pendiente", 
      variant: "secondary", 
      Icon: Clock,
      color: "text-gray-500"
    }
  }
  
  if (progress < 25) {
    return { 
      label: "Inicial", 
      variant: "destructive", 
      Icon: TrendingDown,
      color: "text-red-500"
    }
  }
  
  if (progress >= 25 && progress < 50) {
    return { 
      label: "En Progreso", 
      variant: "warning", 
      Icon: Target,
      color: "text-yellow-500"
    }
  }
  
  if (progress >= 50 && progress < 75) {
    return { 
      label: "Avanzado", 
      variant: "default", 
      Icon: TrendingUp,
      color: "text-blue-500"
    }
  }
  
  if (progress >= 75 && progress < 100) {
    return { 
      label: "Casi Completado", 
      variant: "outline", 
      Icon: CheckCircle2,
      color: "text-green-500"
    }
  }
  
  return { 
    label: "Completado", 
    variant: "success", 
    Icon: CheckCircle2,
    color: "text-green-700"
  }
}

export default function ObjetivosPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [goals, setGoals] = useState([])
  const [areas, setAreas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [areaInfo, setAreaInfo] = useState(null)

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

  // Cargar objetivos
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
        
        console.log("URL de petición:", url);
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Error al cargar los objetivos");
        }
        
        const data = await response.json();
        console.log("Objetivos cargados:", data.length);
        setGoals(data);
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

  const calculateGoalValue = (goal) => {
    switch (goal.measurement_type) {
      case "percentage":
        return `${goal.target_percentage || 0}%`
      case "value":
        return goal.target_value || "N/A"
      case "resolution":
        return goal.target_resolution || "Pendiente"
      default:
        return "N/A"
    }
  }

  const calculateSummary = () => {
    if (goals.length === 0) return {
      totalGoals: 0,
      completedGoals: 0,
      averageProgress: 0
    }

    const totalGoals = goals.length
    const completedGoals = goals.filter(goal => 
      goal.progress_percentage && goal.progress_percentage >= 100
    ).length
    const averageProgress = goals.reduce((sum, goal) => 
      sum + (goal.progress_percentage || 0), 0) / totalGoals

    return {
      totalGoals,
      completedGoals,
      averageProgress: Math.round(averageProgress)
    }
  }

  // Obtener el nombre del área
  const obtenerNombreArea = (id) => {
    if (!id) return '';
    const area = areas.find(a => a.id.toString() === id.toString());
    return area ? area.name : `Área ${id}`;
  };

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
        <div className="text-center text-red-500 p-4">
          Error: {error}
        </div>
      </div>
    )
  }

  const summary = calculateSummary()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart2 className="w-8 h-8" />
          Tablero de Objetivos
        </h1>
      </div>

      {/* Indicador de área filtrada para no-jefes */}
      {user && user.role !== 'jefe_juego' && (
        <Card className="bg-blue-50">
          <CardContent className="pt-6 pb-4">
            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Filtrando por área</p>
                <p className="font-medium text-blue-700">
                  {areaInfo ? areaInfo.name : obtenerNombreArea(user.area)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Acciones Rápidas */}
      <ObjetivoActions />

      {/* Summary Section */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="bg-green-100 rounded-full p-3">
              <Target className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Objetivos</p>
              <p className="text-2xl font-bold">{summary.totalGoals}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="bg-blue-100 rounded-full p-3">
              <CheckCircle2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Objetivos Completados</p>
              <p className="text-2xl font-bold">{summary.completedGoals}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="bg-yellow-100 rounded-full p-3">
              <BarChart2 className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Progreso Promedio</p>
              <p className="text-2xl font-bold">{summary.averageProgress}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map((goal) => {
          const progress = goal.progress_percentage ?? 0
          const statusDetails = getStatusDetails(progress)
          
          return (
            <Card key={goal.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {goal.measurement_type === "percentage" && <BarChart2 className="w-5 h-5" />}
                    {goal.measurement_type === "value" && <Target className="w-5 h-5" />}
                    {goal.measurement_type === "resolution" && <CheckCircle2 className="w-5 h-5" />}
                    {goal.name}
                  </CardTitle>
                  <Badge 
                    variant={statusDetails.variant} 
                    className={`flex items-center gap-1 ${statusDetails.color}`}
                  >
                    <statusDetails.Icon className="w-3 h-3" />
                    {statusDetails.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Objetivo:</span>
                    <span className="font-medium">{calculateGoalValue(goal)}</span>
                  </div>
                  <Progress 
                    value={progress} 
                    className="h-2" 
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progreso</span>
                    <span>{progress}%</span>
                  </div>
                  {goal.description && (
                    <p className="text-xs italic text-muted-foreground">
                      {goal.description}
                    </p>
                  )}
                  {/* Mostrar área o áreas asociadas */}
                  {goal.areas && goal.areas.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-100 text-xs">
                      <span className="text-muted-foreground">Áreas: </span>
                      <span className="font-medium">
                        {goal.areas.map(areaId => obtenerNombreArea(areaId)).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {goals.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          No hay objetivos disponibles para tu área
        </div>
      )}
    </div>
  )
}