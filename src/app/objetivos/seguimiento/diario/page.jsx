"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Calendar, CheckCircle2, AlertCircle, Clock, Filter, User } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

const API_URL = typeof window !== 'undefined' 
  ? (window.ENV?.NEXT_PUBLIC_API_URL || "http://localhost:3001") 
  : "http://localhost:3001"

// Función para mapear turno a su ID
const mapearTurnoId = (turno) => {
  switch(turno) {
    case "Mañana": return 1;
    case "Tarde": return 2;
    case "Noche": return 3;
    default: return 1;
  }
}

export default function CargaDiariaPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [objetivos, setObjetivos] = useState([])
  const [registros, setRegistros] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [turnoActual, setTurnoActual] = useState("")
  const [areaInfo, setAreaInfo] = useState(null)
  
  // Función para obtener nombre de área predefinida
  const obtenerNombreAreaPredefinida = (areaId) => {
    const areasConocidas = {
      1: "Limpieza",
      2: "Atención al Cliente",
      3: "Juego",
      4: "Operaciones"
    };
    return areasConocidas[areaId] || null;
  }
  
  // Fecha actual en formato ISO (YYYY-MM-DD)
  const fechaActual = new Date().toISOString().split('T')[0]
  
  // Cargar información del área
  useEffect(() => {
    const cargarInfoArea = async () => {
      if (!user?.area) return;
      try {
        console.log(`Cargando información del área ${user.area}`);
        const areasConocidas = {
          1: { area_id: 1, name: "Limpieza" },
          2: { area_id: 2, name: "Atención al Cliente" },
          3: { area_id: 3, name: "Juego" },
          4: { area_id: 4, name: "Operaciones" }
        };
        const res = await fetch(`${API_URL}/api/areas/${user.area}`);
        if (!res.ok) {
          console.warn(`Error ${res.status} al cargar información del área ${user.area}`);
          if (areasConocidas[user.area]) {
            console.log(`Usando información predefinida para área ${user.area}`);
            setAreaInfo(areasConocidas[user.area]);
          }
          return;
        }
        try {
          const data = await res.json();
          console.log(`Información de área recibida:`, data);
          const formattedData = {
            id: data.area_id || data.id,
            name: data.name,
            description: data.description
          };
          setAreaInfo(formattedData);
        } catch (jsonError) {
          console.error("Error al parsear JSON de área:", jsonError);
          if (areasConocidas[user.area]) {
            setAreaInfo(areasConocidas[user.area]);
          }
        }
      } catch (err) {
        console.error("Error al cargar información del área:", err);
        const areasConocidas = {
          1: { area_id: 1, name: "Limpieza" },
          2: { area_id: 2, name: "Atención al Cliente" },
          3: { area_id: 3, name: "Juego" },
          4: { area_id: 4, name: "Operaciones" }
        };
        if (areasConocidas[user.area]) {
          setAreaInfo(areasConocidas[user.area]);
        }
      }
    };
    
    if (user) {
      cargarInfoArea();
    }
  }, [user]);

  useEffect(() => {
    console.log("Datos del usuario:", user);
    console.log("Área del usuario:", user?.area);
    console.log("Tipo de dato del área:", typeof user?.area);
  }, [user]);
  
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
  }, [])

  // Cargar objetivos
  useEffect(() => {
    const cargarObjetivos = async () => {
      if (!user) return;
      try {
        setLoading(true)
        setError(null)
        if (!user.area && user.role !== 'jefe_juego') {
          setError("No tienes un área asignada. Contacta al administrador.");
          setLoading(false);
          return;
        }
        let url = `${API_URL}/api/goals`;
        if (user.role !== 'jefe_juego') {
          url += `?area=${user.area}`;
        }
        console.log("URL de petición:", url);
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error("Error al cargar objetivos");
        }
        const data = await res.json();
        console.log("Objetivos cargados:", data.length);
        setObjetivos(data);
        await cargarRegistrosExistentes(data, fechaActual, turnoActual);
      } catch (err) {
        console.error("Error en cargarObjetivos:", err);
        setError(err.message);
        toast({
          title: "Error",
          description: "No se pudieron cargar los objetivos. Por favor intente nuevamente.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    if (user && turnoActual) {
      cargarObjetivos();
    }
  }, [user, turnoActual, toast, fechaActual]);
  
  // Cargar registros existentes
  const cargarRegistrosExistentes = async (objetivosList, fecha, turno) => {
    try {
      const registrosTemp = {};
      for (const objetivo of objetivosList) {
        try {
          const url = `${API_URL}/api/daily-records?goal_id=${objetivo.id}&date=${fecha}&turno=${turno}`;
          console.log("URL para cargar registro:", url);
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) {
              registrosTemp[objetivo.id] = {
                id: data[0].id,
                valorAlcanzado: data[0].value_achieved,
                comentario: data[0].comment || ""
              };
            }
          } else {
            console.warn(`Error ${res.status} al cargar registro para objetivo ${objetivo.id}`);
          }
        } catch (err) {
          console.error(`Error al cargar registro para objetivo ${objetivo.id}:`, err);
        }
      }
      setRegistros(registrosTemp);
    } catch (err) {
      console.error("Error al cargar registros:", err);
    }
  };
  
  const handleValorChange = (objetivoId, valor) => {
    setRegistros({
      ...registros,
      [objetivoId]: {
        ...registros[objetivoId] || {},
        valorAlcanzado: valor
      }
    });
  };
  
  const handleComentarioChange = (objetivoId, comentario) => {
    setRegistros({
      ...registros,
      [objetivoId]: {
        ...registros[objetivoId] || {},
        comentario
      }
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const promesas = objetivos.map(async (objetivo) => {
        const registro = registros[objetivo.id];
        if (!registro?.valorAlcanzado && registro?.valorAlcanzado !== 0) {
          return null;
        }
        
        // Usar mapearTurnoId para enviar turno_id en lugar de turno
        const response = await fetch(`${API_URL}/api/daily-records`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("auth_token") || localStorage.getItem("token")}`
          },
          body: JSON.stringify({
            goal_id: objetivo.id,
            record_date: fechaActual,
            turno_id: mapearTurnoId(turnoActual),
            value_achieved: registro.valorAlcanzado,
            comment: registro.comentario || ""
          })
        });
        
        if (!response.ok) {
          throw new Error(`Error al guardar registro para objetivo ${objetivo.name}`);
        }
        
        return await response.json();
      }).filter(p => p !== null);
      
      await Promise.all(promesas);
      
      toast({
        title: "Éxito",
        description: "Los registros se guardaron correctamente",
        variant: "success"
      });
      
      await cargarRegistrosExistentes(objetivos, fechaActual, turnoActual);
    } catch (err) {
      console.error("Error al guardar registros:", err);
      toast({
        title: "Error",
        description: "No se pudieron guardar los registros. Por favor intente nuevamente.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  const calcularEstadoCumplimiento = (objetivo, valor) => {
    if (!valor && valor !== 0) return 'pendiente';
    let metaValor; 
    if (objetivo.measurement_type === 'percentage') {
      metaValor = objetivo.target_percentage;
    } else if (objetivo.measurement_type === 'value') {
      metaValor = objetivo.target_value;
    } else {
      return valor ? 'cumplido' : 'incumplido';
    }
    if (valor >= metaValor) return 'cumplido';
    if (valor >= metaValor * 0.8) return 'parcial';
    return 'incumplido';
  };
  
  const formatearFecha = (fechaStr) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
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
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-center text-destructive">Error: {error}</p>
        <Card className="max-w-md mx-auto w-full">
          <CardContent className="p-4">
            <h3 className="font-bold mb-2">Datos del usuario:</h3>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </CardContent>
        </Card>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
          {(!user?.area || user.area === "undefined") && user?.role && (
            <Button variant="secondary" onClick={() => {
                let areaId = null;
                if (user.role.includes('limpieza')) areaId = 1;
                else if (user.role.includes('atencion')) areaId = 2;
                else if (user.role.includes('juego')) areaId = 3;
                else if (user.role.includes('operaciones')) areaId = 4;
                if (areaId) {
                  const userStr = localStorage.getItem("auth_user");
                  if (userStr) {
                    const updatedUser = JSON.parse(userStr);
                    updatedUser.area = areaId;
                    localStorage.setItem("auth_user", JSON.stringify(updatedUser));
                    alert(`Área corregida a ${areaId}. Recargando...`);
                    window.location.reload();
                  }
                }
              }}>
              Corregir Área
            </Button>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Calendar className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Carga Diaria de Resultados</h1>
      </div>
      <Card className="bg-gray-50">
        <CardContent className="pt-6 pb-4">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-gray-600" />
            <div>
              <p className="text-sm text-muted-foreground">Usuario actual</p>
              <p className="font-medium">{user?.name || user?.username} ({user?.role})</p>
              <p className="text-sm text-blue-600">
                Área: {areaInfo?.name || obtenerNombreAreaPredefinida(user?.area) || `${user?.area || "No asignada"}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      {user && user.role !== 'jefe_juego' && user.area && (
        <Card className="bg-blue-50">
          <CardContent className="pt-6 pb-4">
            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Filtrando por área</p>
                <p className="font-medium text-blue-700">
                  {areaInfo?.name || obtenerNombreAreaPredefinida(user.area) || `Área ${user.area}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Registro para el turno actual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="bg-muted p-3 rounded-md flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Fecha</p>
                <p className="font-medium">{formatearFecha(fechaActual)}</p>
              </div>
            </div>
            <div className="bg-blue-50 p-3 rounded-md flex items-center gap-3">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Turno</p>
                <p className="font-medium text-blue-700">{turnoActual}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {objetivos.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  No hay objetivos asignados a su área.
                </p>
              </CardContent>
            </Card>
          ) : (
            objetivos.map((objetivo) => {
              const registro = registros[objetivo.id] || {};
              const estadoCumplimiento = calcularEstadoCumplimiento(objetivo, registro.valorAlcanzado);
              let borderClass;
              switch (estadoCumplimiento) {
                case 'cumplido':
                  borderClass = 'border-l-green-500';
                  break;
                case 'parcial':
                  borderClass = 'border-l-yellow-500';
                  break;
                case 'incumplido':
                  borderClass = 'border-l-red-500';
                  break;
                default:
                  borderClass = 'border-l-gray-300';
              }
              return (
                <Card key={objetivo.id} className={`border-l-4 ${borderClass}`}>
                  <CardHeader>
                    <CardTitle className="text-lg">{objetivo.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {objetivo.description}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center">
                      <span className="font-medium mr-2">Meta:</span>
                      {objetivo.measurement_type === 'percentage' ? (
                        <span>{objetivo.target_percentage}%</span>
                      ) : objetivo.measurement_type === 'resolution' ? (
                        <span>Completado</span>
                      ) : (
                        <span>{objetivo.target_value}</span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`valor-${objetivo.id}`}>Valor alcanzado</Label>
                      {objetivo.measurement_type === 'percentage' ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            id={`valor-${objetivo.id}`}
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={registro.valorAlcanzado || ''}
                            onChange={(e) => handleValorChange(objetivo.id, parseFloat(e.target.value))}
                            className="w-24"
                          />
                          <span>%</span>
                        </div>
                      ) : objetivo.measurement_type === 'value' ? (
                        <Input
                          id={`valor-${objetivo.id}`}
                          type="number"
                          step="0.01"
                          value={registro.valorAlcanzado || ''}
                          onChange={(e) => handleValorChange(objetivo.id, parseFloat(e.target.value))}
                        />
                      ) : (
                        <div className="flex gap-4">
                          <div className="flex items-center space-x-2">
                            <input
                              id={`valor-${objetivo.id}-true`}
                              type="radio"
                              name={`valor-${objetivo.id}`}
                              checked={registro.valorAlcanzado === true}
                              onChange={() => handleValorChange(objetivo.id, true)}
                              className="h-4 w-4 text-primary"
                            />
                            <Label htmlFor={`valor-${objetivo.id}-true`}>Completado</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              id={`valor-${objetivo.id}-false`}
                              type="radio"
                              name={`valor-${objetivo.id}`}
                              checked={registro.valorAlcanzado === false}
                              onChange={() => handleValorChange(objetivo.id, false)}
                              className="h-4 w-4 text-primary"
                            />
                            <Label htmlFor={`valor-${objetivo.id}-false`}>No completado</Label>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`comentario-${objetivo.id}`}>Comentario (opcional)</Label>
                      <Textarea
                        id={`comentario-${objetivo.id}`}
                        value={registro.comentario || ''}
                        onChange={(e) => handleComentarioChange(objetivo.id, e.target.value)}
                        placeholder="Añada un comentario o explicación"
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={saving || objetivos.length === 0}
              className="w-full sm:w-auto"
            >
              {saving ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2"></span>
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Guardar Registros
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
