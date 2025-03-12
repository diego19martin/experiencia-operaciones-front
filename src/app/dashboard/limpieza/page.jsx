"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { 
  Card, 
  CardHeader, 
  CardContent, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Clock, 
  CheckSquare, 
  AlertTriangle, 
  Calendar, 
  BarChart3,
  Bell
} from "lucide-react"

// Componente para mostrar un estado de carga
const LoadingState = () => (
  <div className="flex flex-col items-center justify-center min-h-screen p-4">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
    <p className="text-lg font-medium text-gray-700">Cargando información del dashboard...</p>
  </div>
);

// Componente para mostrar un mensaje de error con retry
const ErrorMessage = ({ message, onRetry }) => (
  <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-2">
    <div className="flex">
      <div className="flex-shrink-0">
        <AlertTriangle className="h-5 w-5 text-red-400" />
      </div>
      <div className="ml-3">
        <p className="text-sm text-red-700">{message}</p>
      </div>
    </div>
    {onRetry && (
      <div className="mt-3">
        <Button 
          variant="outline" 
          size="sm" 
          className="text-red-800 hover:bg-red-100"
          onClick={onRetry}
        >
          Reintentar
        </Button>
      </div>
    )}
  </div>
);

// URL base para todas las llamadas a la API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Utilidad para manejar errores y hacer fetch
const fetchWithErrorHandling = async (url, options = {}) => {
  try {
    console.log(`Haciendo petición a: ${url}`);
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Error en petición a ${url}:`, response.status, errorData);
      throw new Error(`Error ${response.status}: ${errorData.message || response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error en fetchWithErrorHandling para ${url}:`, error);
    // Rethrow para que el llamador pueda manejar el error
    throw error;
  }
};

// Servicios para llamadas a la API
const ApiService = {
  // Servicio para validaciones
  validations: {
    getAll: async (filters = {}) => {
      try {
        const queryParams = new URLSearchParams(filters).toString();
        return await fetchWithErrorHandling(`${API_BASE_URL}/api/validations?${queryParams}`);
      } catch (error) {
        console.error('Error al obtener validaciones:', error);
        // Devolver un array vacío en caso de error para evitar errores en cascada
        return [];
      }
    },
    getLastValidation: async () => {
      try {
        return await fetchWithErrorHandling(`${API_BASE_URL}/api/validations/last`);
      } catch (error) {
        console.error('Error al obtener última validación:', error);
        return null;
      }
    }
  },
  
  // Servicio para objetivos
  goals: {
    getAll: async () => {
      try {
        return await fetchWithErrorHandling(`${API_BASE_URL}/api/goals`);
      } catch (error) {
        console.error('Error al obtener objetivos:', error);
        return [];
      }
    },
    getByArea: async (areaId) => {
      try {
        return await fetchWithErrorHandling(`${API_BASE_URL}/api/goals/area/${areaId}`);
      } catch (error) {
        console.error(`Error al obtener objetivos para el área ${areaId}:`, error);
        return [];
      }
    },
    getByTurnoAndArea: async (turnoId, areaId) => {
      try {
        return await fetchWithErrorHandling(`${API_BASE_URL}/api/goals/turno/${turnoId}/area/${areaId}`);
      } catch (error) {
        console.error(`Error al obtener objetivos para turno ${turnoId} y área ${areaId}:`, error);
        return [];
      }
    }
  },
  
  // Servicio para novedades
  news: {
    getAll: async () => {
      try {
        return await fetchWithErrorHandling(`${API_BASE_URL}/api/news`);
      } catch (error) {
        console.error('Error al obtener novedades:', error);
        return [];
      }
    },
    getScheduled: async () => {
      try {
        return await fetchWithErrorHandling(`${API_BASE_URL}/api/news/scheduled`);
      } catch (error) {
        console.error('Error al obtener tareas programadas:', error);
        return [];
      }
    }
  },
  
  // Servicio para incidentes
  incidents: {
    getByTurno: async (turno) => {
      try {
        return await fetchWithErrorHandling(`${API_BASE_URL}/api/incidents/turno/${turno}`);
      } catch (error) {
        console.error(`Error al obtener incidentes para el turno ${turno}:`, error);
        return [];
      }
    }
  },
  
  // Servicio para áreas
  areas: {
    getAll: async () => {
      try {
        return await fetchWithErrorHandling(`${API_BASE_URL}/api/areas`);
      } catch (error) {
        console.error('Error al obtener áreas:', error);
        return [];
      }
    }
  }
}


// Componente para objetivos del turno
const TurnoGoalCard = ({ goal, areaName }) => {
  const progress = goal.current > 0 && goal.target > 0 
    ? Math.round((goal.current / goal.target) * 100) 
    : goal.progress || 0;
  
  const isCompleted = progress >= 100;
  
  return (
    <div className={`p-4 rounded-lg border ${isCompleted ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
      <div className="flex items-start mb-2">
        <div className={`w-5 h-5 rounded-full mr-3 flex-shrink-0 flex items-center justify-center mt-1 ${isCompleted ? 'bg-green-500' : 'bg-amber-500'}`}>
          {isCompleted ? (
            <CheckSquare className="h-3 w-3 text-white" />
          ) : (
            <span className="text-white text-xs font-bold">!</span>
          )}
        </div>
        <div>
          <h4 className="font-medium">{goal.title}</h4>
          <p className="text-xs text-gray-500">Área: {areaName}</p>
        </div>
      </div>
      
      <div className="mt-2">
        <div className="flex justify-between text-sm mb-1">
          <span>Meta del turno: {goal.target}</span>
          <span>Actual: {goal.current || 0}</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-xs mt-1">
          <span>Progreso: {progress}%</span>
          {goal.percentage > 0 && (
            <span>Aporte al objetivo global: {goal.percentage}%</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default function DashboardPrincipal() {
  const { user } = useAuth()
  const router = useRouter()
  const [currentTime, setCurrentTime] = useState("")
  const [loading, setLoading] = useState(true)
  
  // Estados para datos de la API
  const [validations, setValidations] = useState({ completed: 0, total: 0, areas: [] })
  const [objectives, setObjectives] = useState([])
  const [news, setNews] = useState([])
  const [incidents, setIncidents] = useState([])
  const [areas, setAreas] = useState([])
  const [currentShift, setCurrentShift] = useState({ name: "", hours: "", supervisor: "" })
  const [staffOnDuty, setStaffOnDuty] = useState([])
  const [kpis, setKpis] = useState([])
  
  // Función para determinar el turno actual basado en la hora
  const getCurrentShift = () => {
    const now = new Date();
    const hour = now.getHours();
    
    if (hour >= 6 && hour < 14) {
      return { id: 1, name: "Mañana", hours: "06:00 - 14:00" };
    } else if (hour >= 14 && hour < 22) {
      return { id: 2, name: "Tarde", hours: "14:00 - 22:00" };
    } else {
      return { id: 3, name: "Noche", hours: "22:00 - 06:00" };
    }
  };
  
  // Estado para errores
  const [errors, setErrors] = useState({
    validations: false,
    objectives: false,
    news: false,
    incidents: false,
    areas: false
  });

  // Cargar datos al iniciar
  useEffect(() => {
    if (!user) {
      router.replace("/login")
      return
    }
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Obtener el turno actual
        const turnoActual = getCurrentShift();
        setCurrentShift({
          ...turnoActual,
          supervisor: user.name // Como ejemplo, pero podría venir del backend
        });
        
        // Cargar validaciones
        try {
          const validationsData = await ApiService.validations.getAll();
          
          // Valores por defecto en caso de que validationsData sea undefined o null
          if (validationsData && validationsData.length > 0) {
            const completedValidations = validationsData.filter(v => v.status === 'approved').length;
            const pendingValidations = validationsData.filter(v => v.status === 'pending').length;
            const inProgressValidations = validationsData.filter(v => v.status === 'in_progress').length;
            const rejectedValidations = validationsData.filter(v => v.status === 'rejected').length;
            
            // Filtrar validaciones completadas hoy
            const today = new Date().toISOString().split('T')[0];
            const completedToday = validationsData.filter(v => 
              v.status === 'approved' && 
              v.updated_at && 
              v.updated_at.startsWith(today)
            ).length;
            
            setValidations({
              completed: completedValidations,
              total: validationsData.length,
              pending: pendingValidations,
              inProgress: inProgressValidations,
              rejected: rejectedValidations,
              completedToday,
              areas: validationsData
                .filter(v => v.status !== 'approved')
                .map(v => v.area?.name || 'Área sin asignar')
                .filter((value, index, self) => self.indexOf(value) === index) // Eliminar duplicados
            });
          }
        } catch (error) {
          console.error("Error al cargar validaciones:", error);
          setErrors(prev => ({ ...prev, validations: true }));
          // Usar datos de respaldo
          setValidations({
            completed: 0,
            total: 0,
            pending: 0,
            inProgress: 0,
            rejected: 0,
            completedToday: 0,
            areas: []
          });
        }
        
        // Cargar áreas
        try {
          const areasData = await ApiService.areas.getAll();
          setAreas(areasData || []);
          
          // Cargar objetivos solo si tenemos áreas
          if (areasData && areasData.length > 0) {
            // Cargar objetivos por turno y filtrar por área según el rol del usuario
            let areasToFilter = [];
            if (user.role === 'jefe_limpieza') {
              // Filtrar solo áreas de limpieza
              areasToFilter = areasData.filter(area => area.type === 'limpieza').map(area => area.id);
            }
            
            // Si hay áreas para filtrar, cargar objetivos para cada área
            let allObjectives = [];
            if (areasToFilter.length > 0) {
              for (const areaId of areasToFilter) {
                try {
                  const areaObjectives = await ApiService.goals.getByTurnoAndArea(turnoActual.id, areaId);
                  if (areaObjectives && areaObjectives.length) {
                    allObjectives = [...allObjectives, ...areaObjectives];
                  }
                } catch (error) {
                  console.error(`Error al cargar objetivos para área ${areaId}:`, error);
                }
              }
            } else {
              // Si no hay áreas específicas, cargar todos los objetivos
              try {
                const generalObjectives = await ApiService.goals.getAll();
                if (generalObjectives && generalObjectives.length) {
                  allObjectives = generalObjectives;
                }
              } catch (error) {
                console.error("Error al cargar todos los objetivos:", error);
                setErrors(prev => ({ ...prev, objectives: true }));
              }
            }
            
            // Formatear los objetivos para el dashboard
            const formattedObjectives = allObjectives.map(obj => ({
              id: obj.id,
              title: obj.description || obj.name || `Objetivo ${obj.id}`,
              completed: obj.progress >= 100,
              progress: obj.progress || 0
            }));
            
            setObjectives(formattedObjectives);
          } else {
            setObjectives([]);
          }
        } catch (error) {
          console.error("Error al cargar áreas:", error);
          setErrors(prev => ({ ...prev, areas: true }));
          setAreas([]);
          setObjectives([]);
        }
        
        // Cargar novedades
        try {
          const newsData = await ApiService.news.getAll();
          // Obtener las 5 novedades más recientes
          if (newsData && newsData.length > 0) {
            const recentNews = newsData
              .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
              .slice(0, 5)
              .map(item => ({
                id: item.id,
                title: item.title || "Sin título",
                priority: item.priority || 'media',
                date: item.created_at ? new Date(item.created_at).toLocaleDateString() : "Fecha desconocida"
              }));
            
            setNews(recentNews);
          } else {
            setNews([]);
          }
        } catch (error) {
          console.error("Error al cargar novedades:", error);
          setErrors(prev => ({ ...prev, news: true }));
          setNews([]);
        }
        
        // Cargar incidentes del turno actual
        try {
          const incidentsData = await ApiService.incidents.getByTurno(turnoActual.id);
          setIncidents(incidentsData || []);
        } catch (error) {
          console.error(`Error al cargar incidentes para turno ${turnoActual.id}:`, error);
          setErrors(prev => ({ ...prev, incidents: true }));
          setIncidents([]);
        }
        
        // Ejemplo de KPIs - En una implementación real, estos datos vendrían del backend
        setKpis([
          { name: "Satisfacción del cliente", value: 92, target: 90 },
          { name: "Tiempo promedio de limpieza", value: 24, target: 30 }
        ]);
        
      } catch (error) {
        console.error("Error general al cargar datos:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Actualizar hora actual cada minuto
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString())
    }
    
    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [user, router])

  if (!user) return null;
  if (loading) return <LoadingState />;
  
  // Verificar si hay errores globales
  const hasGlobalErrors = Object.values(errors).some(value => value === true);
  
  // Estado de datos vacíos
  const hasEmptyData = validations.total === 0 && objectives.length === 0 && news.length === 0;

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "alta": return "text-red-500"
      case "media": return "text-amber-500"
      case "baja": return "text-green-500"
      default: return "text-gray-500"
    }
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Principal</h1>
          <p className="text-gray-500">Bienvenido al turno {currentShift.name}, {user.name} ({user.role})</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="font-medium">{currentTime}</p>
            <p className="text-sm text-gray-500">{new Date().toLocaleDateString()}</p>
          </div>
          <div className="p-2 bg-blue-50 rounded-full">
            <Clock className="h-6 w-6 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Resumen del turno actual */}
      <Card className="mb-6 border-blue-200 shadow-sm">
        <CardHeader className="bg-blue-50">
          <div className="flex justify-between items-center">
            <CardTitle>
              <div className="flex items-center">
                <Calendar className="mr-2 h-5 w-5 text-blue-600" />
                Información del Turno
              </div>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Turno:</p>
              <p className="font-medium text-lg">{currentShift.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Horario:</p>
              <p className="font-medium text-lg">{currentShift.hours}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Supervisor:</p>
              <p className="font-medium text-lg">{currentShift.supervisor}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Objetivos del turno */}
        <Card className="border-green-200 shadow-sm">
          <CardHeader className="bg-green-50">
            <div className="flex justify-between items-center">
              <CardTitle>
                <div className="flex items-center">
                  <CheckSquare className="mr-2 h-5 w-5 text-green-600" />
                  Tus Objetivos del Turno {currentShift.name}
                </div>
              </CardTitle>
              <span className="text-sm bg-green-100 text-green-800 py-1 px-2 rounded-full">
                {objectives.filter(obj => obj.completed).length}/{objectives.length} Completados
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {errors.objectives ? (
              <ErrorMessage 
                message="Error al cargar los objetivos. Por favor, intenta de nuevo más tarde." 
                onRetry={() => window.location.reload()}
              />
            ) : objectives.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500 mb-2">No hay objetivos asignados para este turno en tu área</p>
                <Button variant="outline" size="sm" onClick={() => router.push("/objectives")}>
                  Ver todos los objetivos
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {objectives.map((objective) => (
                  <TurnoGoalCard 
                    key={objective.id} 
                    goal={objective} 
                    areaName={areas.find(a => a.id === user.area_id)?.name || "Tu área"}
                  />
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-gray-50 flex justify-between">
            <Button variant="outline" size="sm" onClick={() => router.push("/objectives")}>
              Ver todos los objetivos
            </Button>
            <Button variant="default" size="sm" onClick={() => router.push("/daily-records")}>
              Cargar datos
            </Button>
          </CardFooter>
        </Card>

        {/* Validaciones */}
        <Card className="border-purple-200 shadow-sm">
          <CardHeader className="bg-purple-50">
            <div className="flex justify-between items-center">
              <CardTitle>
                <div className="flex items-center">
                  <CheckSquare className="mr-2 h-5 w-5 text-purple-600" />
                  Validaciones Pendientes
                </div>
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => router.push("/areas/limpieza")}>
                Ir a validaciones
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {errors.validations ? (
              <ErrorMessage 
                message="Error al cargar las validaciones. Por favor, intenta de nuevo más tarde." 
                onRetry={() => window.location.reload()}
              />
            ) : (
              <>
                <div className="mb-4">
                  <div className="flex justify-between mb-1">
                    <span>Progreso: {validations.completed} de {validations.total}</span>
                    <span className="font-medium">{validations.total > 0 ? Math.round((validations.completed / validations.total) * 100) : 0}%</span>
                  </div>
                  <Progress value={validations.total > 0 ? (validations.completed / validations.total) * 100 : 0} className="h-2" />
                </div>
                
                <div className="mb-4 grid grid-cols-2 gap-3">
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600">En instancia de ingreso</p>
                    <p className="text-xl font-bold">{validations.inProgress || 0}</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600">Pendientes de revisión</p>
                    <p className="text-xl font-bold">{validations.pending || 0}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600">Completadas hoy</p>
                    <p className="text-xl font-bold">{validations.completedToday || 0}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600">Rechazadas</p>
                    <p className="text-xl font-bold">{validations.rejected || 0}</p>
                  </div>
                </div>
                
                {validations.areas && validations.areas.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Áreas pendientes de validación:</p>
                    <div className="flex flex-wrap gap-2">
                      {validations.areas.map((area, index) => (
                        <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-700 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Recuerda que las validaciones se pueden realizar cada dos horas.
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {hasGlobalErrors && (
        <Card className="border-red-300 shadow-sm mb-6">
          <CardHeader className="bg-red-50">
            <CardTitle className="text-red-700">Error de conexión</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              Estamos experimentando problemas para conectar con el servidor. Algunas funciones pueden no estar disponibles.
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Reintentar
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* KPIs */}
        <Card className="border-indigo-200 shadow-sm">
          <CardHeader className="bg-indigo-50">
            <CardTitle>
              <div className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5 text-indigo-600" />
                KPIs del Turno
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ul className="space-y-4">
              {kpis.map((kpi, index) => (
                <li key={index}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">{kpi.name}</span>
                    <span className={`text-sm font-medium ${kpi.value >= kpi.target ? 'text-green-600' : 'text-red-600'}`}>
                      {kpi.value}%
                    </span>
                  </div>
                  <Progress value={(kpi.value / kpi.target) * 100} className="h-1.5" 
                    indicatorClassName={kpi.value >= kpi.target ? 'bg-green-500' : 'bg-red-500'} />
                  <div className="text-right text-xs text-gray-500 mt-1">
                    Meta: {kpi.target}%
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Novedades */}
        <Card className="border-amber-200 shadow-sm">
          <CardHeader className="bg-amber-50">
            <CardTitle>
              <div className="flex items-center">
                <Bell className="mr-2 h-5 w-5 text-amber-600" />
                Novedades
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {errors.news ? (
              <ErrorMessage 
                message="Error al cargar las novedades. Por favor, intenta de nuevo más tarde." 
                onRetry={() => window.location.reload()}
              />
            ) : news.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay novedades para mostrar</p>
            ) : (
              <ul className="divide-y">
                {news.map((item) => (
                  <li key={item.id} className="py-3">
                    <div className="flex items-start">
                      <span className={`inline-block w-2 h-2 rounded-full mt-1.5 mr-2 ${getPriorityColor(item.priority)}`}></span>
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <div className="flex text-xs mt-1">
                          <span className={`mr-2 ${getPriorityColor(item.priority)}`}>
                            Prioridad {item.priority}
                          </span>
                          <span className="text-gray-500">{item.date}</span>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
          <CardFooter className="bg-gray-50">
            <Button variant="outline" size="sm" className="w-full" onClick={() => router.push("/news")}>
              Ver todas las novedades
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}