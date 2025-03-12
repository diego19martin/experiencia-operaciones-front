"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Calendar, CheckCircle2, AlertCircle, Clock, Filter, User, Target, BarChart2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

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

// CORREGIDO: Función para obtener la fecha actual con zona horaria de Buenos Aires
function obtenerFechaActualBuenosAires() {
  // Creamos una fecha con la hora actual
  const ahora = new Date();
  
  // Obtenemos la fecha en zona horaria local, ajustando para Buenos Aires (GMT-3)
  // Opción 1: Usar la API Intl si está disponible
  if (typeof Intl !== 'undefined') {
    try {
      const options = { 
        timeZone: 'America/Argentina/Buenos_Aires',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      };
      
      // Formatear fecha en zona horaria de Buenos Aires
      const formatter = new Intl.DateTimeFormat('fr-CA', options); // fr-CA usa formato YYYY-MM-DD
      return formatter.format(ahora).replace(/\//g, '-');
    } catch (error) {
      console.error("Error al usar Intl para formatear fecha:", error);
      // Continuar con método alternativo
    }
  }
  
  // Opción 2: Ajuste manual para GMT-3 (Buenos Aires)
  // Creamos una nueva fecha con el offset correcto
  const buenosAiresDate = new Date(ahora.getTime() - (3 * 60 * 60 * 1000));
  const año = buenosAiresDate.getUTCFullYear();
  const mes = String(buenosAiresDate.getUTCMonth() + 1).padStart(2, '0');
  const dia = String(buenosAiresDate.getUTCDate()).padStart(2, '0');
  
  return `${año}-${mes}-${dia}`;
}

export default function CargaDiariaPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [objetivos, setObjetivos] = useState([])
  const [objetivosTurno, setObjetivosTurno] = useState([])
  const [objetivosConMetas, setObjetivosConMetas] = useState([])
  const [registros, setRegistros] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [turnoActual, setTurnoActual] = useState("")
  const [areaInfo, setAreaInfo] = useState(null)
  const [debugInfo, setDebugInfo] = useState(null)
  const [fechaActual, setFechaActual] = useState("")
  
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
  
  // CORREGIDO: Inicializar la fecha actual correctamente al cargar el componente
  useEffect(() => {
    // Obtener fecha actual en Buenos Aires
    const fechaFormateada = obtenerFechaActualBuenosAires();
    
    console.log("Fecha formateada para hoy (Buenos Aires):", fechaFormateada);
    console.log("Fecha/hora completa (local):", new Date().toString());
    console.log("Offset de zona horaria local:", new Date().getTimezoneOffset());
    
    setFechaActual(fechaFormateada);
  }, []);
  
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
  
  // CORREGIDO: Determinar el turno actual usando zona horaria de Buenos Aires
  useEffect(() => {
    const calcularTurno = () => {
      // Obtener la hora actual en Buenos Aires
      let currentHour;
      
      try {
        // Intentar obtener la hora usando la API Intl
        const options = { timeZone: 'America/Argentina/Buenos_Aires', hour: 'numeric', hour12: false };
        const formatter = new Intl.DateTimeFormat('es-AR', options);
        currentHour = parseInt(formatter.format(new Date()), 10);
      } catch (error) {
        // Fallback: calcular manualmente con offset para GMT-3
        const now = new Date();
        const buenosAiresTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
        currentHour = buenosAiresTime.getUTCHours();
      }
      
      console.log("Hora actual en Buenos Aires:", currentHour);
      
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

  // Cargar objetivos y metas cuando se tenga la fecha y el turno
  useEffect(() => {
    if (fechaActual && user && turnoActual) {
      cargarObjetivos();
    }
  }, [fechaActual, user, turnoActual]);

  // Cargar objetivos y sus metas específicas de turno
  const cargarObjetivos = async () => {
    if (!user || !turnoActual || !fechaActual) return;
  
    try {
      setLoading(true);
      setError(null);
      
      // Verificar que el usuario tenga un área asignada
      if (!user.area) {
        setError("No tienes un área asignada. Contacta al administrador.");
        setLoading(false);
        return;
      }
      
      console.log(`Cargando objetivos para área ${user.area} (tipo: ${typeof user.area}) en fecha ${fechaActual}`);
      
      // Asegurar que el área es un número
      const areaId = typeof user.area === 'string' ? parseInt(user.area, 10) : user.area;
      const turnoId = mapearTurnoId(turnoActual);
      
      // 1. Cargar objetivos globales
      const urlGlobal = `${API_URL}/api/goals/area/${areaId}`;
      console.log("URL objetivos globales:", urlGlobal);
      
      const resGlobal = await fetch(urlGlobal);
  
      if (!resGlobal.ok) {
        const errorData = await resGlobal.json();
        throw new Error(errorData.error || "Error al cargar objetivos globales");
      }
  
      const dataGlobal = await resGlobal.json();
      console.log(`Objetivos globales cargados: ${dataGlobal.length}`);
      setObjetivos(dataGlobal);
      
      // 2. Cargar objetivos específicos de turno usando la ruta directa
      const urlTurno = `${API_URL}/api/goals/turno/${turnoId}/area/${areaId}`;
      console.log("URL objetivos turno:", urlTurno);
      
      try {
        const resTurno = await fetch(urlTurno);
        
        if (resTurno.ok) {
          const dataTurno = await resTurno.json();
          console.log(`Objetivos de turno cargados:`, dataTurno);
          setObjetivosTurno(dataTurno);
          
          // Guardar información para depuración
          setDebugInfo({
            fechaActual,
            turnoId,
            dataTurno,
            timezone: {
              local: Intl.DateTimeFormat().resolvedOptions().timeZone,
              offset: new Date().getTimezoneOffset()
            }
          });
          
          // Combinar objetivos globales con los específicos de turno
          const objetivosCombinados = dataGlobal.map(objGlobal => {
            // Buscar si hay una meta específica de turno para este objetivo
            const metaTurno = dataTurno.find(objTurno => objTurno.goal_id === objGlobal.id);
            
            if (metaTurno) {
              console.log(`Meta de turno encontrada para objetivo ${objGlobal.id}:`, metaTurno);
              
              // Usar valores explícitos de las metas de turno
              return {
                ...objGlobal,
                turno_target: {
                  id: metaTurno.id,
                  turno_id: metaTurno.turno_id,
                  target_percentage: metaTurno.target_percentage,
                  target_value: metaTurno.target_value,
                  target_resolution: metaTurno.target_resolution
                }
              };
            }
            
            return objGlobal;
          });
          
          setObjetivosConMetas(objetivosCombinados);
        } else {
          console.warn("No se pudieron cargar objetivos de turno");
          setObjetivosConMetas(dataGlobal);
        }
      } catch (err) {
        console.error("Error al cargar objetivos de turno:", err);
        setObjetivosConMetas(dataGlobal);
      }
  
      await cargarRegistrosExistentes(dataGlobal);
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
  };
  
  // CORREGIDO: Función mejorada para cargar registros existentes
  const cargarRegistrosExistentes = async (objetivosList) => {
    try {
      const registrosTemp = {};
      const turnoId = mapearTurnoId(turnoActual);
      
      // IMPORTANTE: Simplificar la lógica para usar el parámetro 'date' que el backend espera
      console.log(`Cargando registros para fecha ${fechaActual} y turno ${turnoId}`);
      
      for (const objetivo of objetivosList) {
        try {
          // CORREGIDO: Asegurarnos de enviar la fecha en formato ISO para consistencia
          const formattedDate = fechaActual; // Ya está en formato YYYY-MM-DD
          const url = `${API_URL}/api/daily-records?goal_id=${objetivo.id}&date=${formattedDate}&turno=${turnoId}`;
          console.log("URL para cargar registro:", url);
          
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            
            console.log(`Registros recibidos para objetivo ${objetivo.id}:`, data.length);
            
            if (data && data.length > 0) {
              registrosTemp[objetivo.id] = {
                id: data[0].id,
                valorAlcanzado: data[0].value_achieved,
                comentario: data[0].comment || ""
              };
              
              console.log(`Registro encontrado para objetivo ${objetivo.id}:`, {
                id: data[0].id,
                valorAlcanzado: data[0].value_achieved
              });
            }
          } else {
            console.warn(`Error ${res.status} al cargar registro para objetivo ${objetivo.id}`);
          }
        } catch (err) {
          console.error(`Error al cargar registro para objetivo ${objetivo.id}:`, err);
        }
      }
      
      console.log("Registros cargados para todos los objetivos:", Object.keys(registrosTemp).length);
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
  
  // CORREGIDO: Función para enviar registros con manejo adecuado de zona horaria
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const turnoId = mapearTurnoId(turnoActual);
      console.log(`Enviando registros para turno ${turnoActual} (${turnoId}) en fecha ${fechaActual}`);
      
      const promesas = objetivosConMetas.map(async (objetivo) => {
        const registro = registros[objetivo.id];
        if (!registro?.valorAlcanzado && registro?.valorAlcanzado !== 0) {
          return null;
        }
        
        // Convertir explícitamente valores para evitar problemas de tipo
        let valorNormalizado = registro.valorAlcanzado;
        
        // Si es porcentaje o valor numérico, asegurar que sea número
        if (objetivo.measurement_type === 'percentage' || objetivo.measurement_type === 'value') {
          valorNormalizado = parseFloat(valorNormalizado);
          // Si no es un número válido, usar 0
          if (isNaN(valorNormalizado)) valorNormalizado = 0;
        }
        
        // CORREGIDO: Asegurarnos de enviar la fecha en formato ISO para que sea procesada correctamente
        // Usamos la fecha ya normalizada al formato YYYY-MM-DD
        const formattedDate = fechaActual;
        
        // Datos a enviar
        const objetivoData = {
          goal_id: objetivo.id,
          record_date: formattedDate,
          turno_id: turnoId,
          value_achieved: valorNormalizado,
          comment: registro.comentario || ""
        };
        
        console.log(`Guardando registro para objetivo ${objetivo.id}:`, objetivoData);
        
        // Si ya existe un registro, actualizarlo
        if (registro.id) {
          console.log(`Actualizando registro existente (ID: ${registro.id})`);
          const response = await fetch(`${API_URL}/api/daily-records/${registro.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${localStorage.getItem("auth_token") || localStorage.getItem("token")}`
            },
            body: JSON.stringify(objetivoData)
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error al actualizar registro para objetivo ${objetivo.name}`);
          }
          
          return await response.json();
        } else {
          // Si no existe, crear uno nuevo
          console.log("Creando nuevo registro");
          const response = await fetch(`${API_URL}/api/daily-records`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${localStorage.getItem("auth_token") || localStorage.getItem("token")}`
            },
            body: JSON.stringify(objetivoData)
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error al guardar registro para objetivo ${objetivo.name}`);
          }
          
          return await response.json();
        }
      }).filter(p => p !== null);
      
      const resultados = await Promise.all(promesas);
      console.log("Registros guardados:", resultados);
      
      toast({
        title: "Éxito",
        description: "Los registros se guardaron correctamente",
        variant: "success"
      });
      
      // Recargar registros para mostrar los datos actualizados
      await cargarRegistrosExistentes(objetivosConMetas);
      
    } catch (err) {
      console.error("Error al guardar registros:", err);
      toast({
        title: "Error",
        description: err.message || "No se pudieron guardar los registros. Por favor intente nuevamente.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Función para calcular la contribución al objetivo global
  const calcularContribucion = (objetivo, valor) => {
    if (!objetivo.turno_target || !valor && valor !== 0) return null;
    
    let valorTurno, metaTurno, metaGlobal;
    
    if (objetivo.measurement_type === 'percentage') {
      valorTurno = parseFloat(valor);
      metaTurno = parseFloat(objetivo.turno_target.target_percentage || objetivo.target_percentage);
      metaGlobal = parseFloat(objetivo.target_percentage);
    } else if (objetivo.measurement_type === 'value') {
      valorTurno = parseFloat(valor);
      metaTurno = parseFloat(objetivo.turno_target.target_value || objetivo.target_value);
      metaGlobal = parseFloat(objetivo.target_value);
    } else {
      // Para tipo resolución, es 100% o 0%
      return valor ? 100 : 0;
    }
    
    if (isNaN(valorTurno) || isNaN(metaTurno) || metaTurno === 0 || isNaN(metaGlobal) || metaGlobal === 0) {
      return 0;
    }
    
    // Porcentaje de cumplimiento de la meta de turno
    const cumplimientoTurno = (valorTurno / metaTurno) * 100;
    
    // Porcentaje de contribución de la meta de turno a la meta global
    const contribucionMeta = (metaTurno / metaGlobal) * 100;
    
    // Contribución real (ponderada) al objetivo global
    const contribucionReal = (cumplimientoTurno * contribucionMeta) / 100;
    
    return Math.min(100, Math.round(contribucionReal));
  };
  
  const calcularEstadoCumplimiento = (objetivo, valor) => {
    if (valor === null || valor === undefined) return 'pendiente';
    
    let metaValor;
    
    // Priorizar meta de turno si existe
    if (objetivo.turno_target) {
      if (objetivo.measurement_type === 'percentage') {
        metaValor = objetivo.turno_target.target_percentage || objetivo.target_percentage;
      } else if (objetivo.measurement_type === 'value') {
        metaValor = objetivo.turno_target.target_value || objetivo.target_value;
      } else {
        return valor ? 'cumplido' : 'incumplido';
      }
    } else {
      if (objetivo.measurement_type === 'percentage') {
        metaValor = objetivo.target_percentage;
      } else if (objetivo.measurement_type === 'value') {
        metaValor = objetivo.target_value;
      } else {
        return valor ? 'cumplido' : 'incumplido';
      }
    }
    
    if (valor >= metaValor) return 'cumplido';
    if (valor >= metaValor * 0.8) return 'parcial';
    return 'incumplido';
  };
  
  // CORREGIDO: Mejorar el formateo de fecha para usar la zona horaria correcta
  const formatearFecha = (fechaStr) => {
    try {
      // Usar la API Intl para formatear la fecha con la zona horaria correcta
      if (typeof Intl !== 'undefined') {
        const [year, month, day] = fechaStr.split('-').map(num => parseInt(num, 10));
        const date = new Date(year, month - 1, day);
        
        return new Intl.DateTimeFormat('es-ES', { 
          timeZone: 'America/Argentina/Buenos_Aires',
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }).format(date);
      }
      
      // Fallback al método anterior
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
  
  // Agregamos un contador de objetivos para facilitar la identificación de problemas
  const objetivosConTurno = objetivosConMetas.filter(obj => obj.turno_target).length;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Calendar className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Carga Diaria de Resultados</h1>
        
        {/* Mostrar botón de debug solo en desarrollo */}
        {process.env.NODE_ENV === 'development' && (
          <Button variant="outline" size="sm" onClick={() => console.log(debugInfo)}>Debug</Button>
        )}
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
          
          {/* Agregar contador de objetivos con metas específicas */}
          <div className="mt-4 flex flex-col sm:flex-row justify-between">
            <p className="text-sm text-muted-foreground">
              Total objetivos: <span className="font-medium">{objetivosConMetas.length}</span>
            </p>
            <p className="text-sm text-blue-600">
              Con metas específicas de turno: <span className="font-medium">{objetivosConTurno}</span>
            </p>
          </div>
        </CardContent>
      </Card>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {objetivosConMetas.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  No hay objetivos asignados a su área.
                </p>
              </CardContent>
            </Card>
          ) : (
            objetivosConMetas.map((objetivo) => {
              const registro = registros[objetivo.id] || {};
              const estadoCumplimiento = calcularEstadoCumplimiento(objetivo, registro.valorAlcanzado);
              const contribucion = calcularContribucion(objetivo, registro.valorAlcanzado);
              
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
              
              // Usar explícitamente la meta de turno si existe
              let metaValue;
              if (objetivo.turno_target) {
                if (objetivo.measurement_type === 'percentage') {
                  metaValue = objetivo.turno_target.target_percentage;
                } else if (objetivo.measurement_type === 'value') {
                  metaValue = objetivo.turno_target.target_value;
                } else {
                  metaValue = "Completado";
                }
              } else {
                if (objetivo.measurement_type === 'percentage') {
                  metaValue = objetivo.target_percentage;
                } else if (objetivo.measurement_type === 'value') {
                  metaValue = objetivo.target_value;
                } else {
                  metaValue = "Completado";
                }
              }
              
              return (
                <Card key={objetivo.id} className={`border-l-4 ${borderClass}`}>
                  <CardHeader>
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
                      {objetivo.turno_target && (
                        <Badge className="bg-amber-100 text-amber-800">Meta de Turno</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{objetivo.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">Meta del Turno:</div>
                          <div className="text-blue-700">
                            {objetivo.measurement_type === 'percentage' ? (
                              <span>{metaValue}%</span>
                            ) : objetivo.measurement_type === 'resolution' ? (
                              <span>Completado</span>
                            ) : (
                              <span>{metaValue}</span>
                            )}
                          </div>
                        </div>
                        
                        {/* Mostrar meta global si hay una meta específica de turno */}
                        {objetivo.turno_target && (
                          <div className="flex items-center justify-between text-sm">
                            <div className="text-muted-foreground">Meta Global:</div>
                            <div>
                              {objetivo.measurement_type === 'percentage' ? (
                                <span>{objetivo.target_percentage}%</span>
                              ) : objetivo.measurement_type === 'resolution' ? (
                                <span>Completado</span>
                              ) : (
                                <span>{objetivo.target_value}</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Contribución al objetivo global */}
                      {objetivo.turno_target && contribucion !== null && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-muted-foreground">
                              Contribución al objetivo global:
                            </div>
                            <div className={contribucion >= 80 ? "text-green-600 font-medium" : 
                                    contribucion >= 50 ? "text-blue-600 font-medium" : 
                                    contribucion > 0 ? "text-amber-600 font-medium" : 
                                    "text-gray-400 font-medium"}>
                              {contribucion}%
                            </div>
                          </div>
                          <Progress 
                            value={contribucion} 
                            className="h-2" 
                          />
                        </div>
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
              disabled={saving || objetivosConMetas.length === 0}
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