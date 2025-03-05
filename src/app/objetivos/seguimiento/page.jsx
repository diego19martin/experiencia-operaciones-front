"use client"

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Filter, BarChart2 } from 'lucide-react';
import ReporteDetalle from '@/components/ReporteDetalle';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

const API_URL = typeof window !== 'undefined' 
  ? (window.ENV?.NEXT_PUBLIC_API_URL || "http://localhost:3001")
  : "http://localhost:3001"

export default function SeguimientoPage() {
  const [objetivos, setObjetivos] = useState([]);
  const [registros, setRegistros] = useState({});
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('actual');
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [cargando, setCargando] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Cargar objetivos y registros según filtros
  useEffect(() => {
    const cargarDatos = async () => {
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
      try {
        let inicio, fin;
        const hoy = new Date();
        
        if (periodoSeleccionado === 'actual') {
          inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
          fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        } else if (periodoSeleccionado === 'anterior') {
          inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
          fin = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
        } else {
          inicio = fechaInicio || new Date(hoy.getFullYear(), hoy.getMonth(), 1);
          fin = fechaFin || new Date();
        }
        
        const inicioStr = inicio.toISOString().split('T')[0];
        const finStr = fin.toISOString().split('T')[0];
        
        // Cargar objetivos según el área del usuario
        const url = `${API_URL}/api/goals?area=${user.area}`;
        const objetivosRes = await fetch(url);
        if (!objetivosRes.ok) {
          throw new Error("Error al cargar objetivos");
        }
        const objetivosData = await objetivosRes.json();
        console.debug("Objetivos cargados:", objetivosData);
        setObjetivos(objetivosData);
        
        // Cargar registros para cada objetivo
        const registrosObj = {};
        for (const objetivo of objetivosData) {
          try {
            console.log(`Cargando registros para objetivo ${objetivo.id}...`);
            
            const registrosRes = await fetch(
              `${API_URL}/api/daily-records/goal/${objetivo.id}?start_date=${inicioStr}&end_date=${finStr}`
            );
            if (registrosRes.ok) {
              const registrosData = await registrosRes.json();
              registrosObj[objetivo.id] = registrosData;
              console.debug(`Registros para objetivo ${objetivo.id}:`, registrosData);
            }
          } catch (error) {
            console.error(`Error al cargar registros para objetivo ${objetivo.id}:`, error);
          }
        }

        console.log("Registros cargados:", registrosObj);
        
        
        setRegistros(registrosObj);
      } catch (error) {
        console.error("Error al cargar datos:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos. Por favor intente nuevamente.",
          variant: "destructive"
        });
      } finally {
        setCargando(false);
      }
    };
    
    if (user) {
      cargarDatos();
    }
  }, [periodoSeleccionado, fechaInicio, fechaFin, user, toast]);
  
  // Calcular métricas generales para los objetivos
const calcularMetricas = () => {
  if (objetivos.length === 0) {
    return {
      total: 0,
      promedioGeneral: 0,
      alcanzados: 0,
      debajo: 0
    };
  }

  let sumaPromedios = 0;
  let alcanzados = 0;
  let debajo = 0;
  let objetivosConRegistros = 0;

  for (const objetivo of objetivos) {
    const objRegistros = registros[objetivo.id] || [];
    if (objRegistros.length === 0) continue;

    // 1) Filtrar únicamente los registros con value_achieved numérico
    const registrosValidos = objRegistros.filter(reg => {
      const val = parseFloat(reg.value_achieved);
      return !isNaN(val); // solo conservamos los que NO sean NaN
    });

    // Si tras filtrar no hay registros válidos, no calculamos nada
    if (registrosValidos.length === 0) continue;

    objetivosConRegistros++;

    // 2) Sumar los value_achieved numéricos
    const suma = registrosValidos.reduce((sum, reg) => {
      return sum + parseFloat(reg.value_achieved);
    }, 0);

    // 3) Calcular el promedio con la cantidad de registros válidos
    const promedio = suma / registrosValidos.length;
    sumaPromedios += promedio;

    // 4) Calcular metaValor según measurement_type
    let metaValor;
    if (objetivo.measurement_type === 'percentage') {
      metaValor = parseFloat(objetivo.target_percentage) || 0;
    } else if (objetivo.measurement_type === 'value') {
      metaValor = parseFloat(objetivo.target_value) || 0;
    } else {
      // Tipo "resolution"
      const diasCompletados = registrosValidos.filter(r => parseFloat(r.value_achieved)).length;
      const porcentajeCompletado = (diasCompletados / registrosValidos.length) * 100;

      if (porcentajeCompletado >= 80) {
        alcanzados++;
      } else {
        debajo++;
      }
      continue; // pasamos al siguiente objetivo
    }

    // 5) Determinar si se alcanzó la meta
    if (promedio >= metaValor) {
      alcanzados++;
    } else {
      debajo++;
    }
  }

  console.log("Alcanzados:", alcanzados);
  console.log("Debajo:", debajo);
  console.log("Objetivos con registros:", objetivosConRegistros);
  console.log("Suma de promedios:", sumaPromedios);

  return {
    total: objetivos.length,
    promedioGeneral: objetivosConRegistros > 0 
      ? (sumaPromedios / objetivosConRegistros).toFixed(2)
      : 0,
    alcanzados,
    debajo
  };
};

  
  const metricas = calcularMetricas();
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart2 className="h-6 w-6" />
          Seguimiento de Objetivos
        </h1>
        
        {(user?.role === 'coordinador_atencion' || 
          user?.role === 'jefe_juego' || 
          user?.role === 'jefe_operaciones' || 
          user?.role === 'jefe_limpieza') && (
          <Button 
            onClick={() => window.location.href = "/objetivos/seguimiento/diario"}
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            Cargar Registro Diario
          </Button>
        )}
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Periodo</label>
              <Select
                value={periodoSeleccionado}
                onValueChange={setPeriodoSeleccionado}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar periodo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="actual">Mes actual</SelectItem>
                  <SelectItem value="anterior">Mes anterior</SelectItem>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>
              
              {periodoSeleccionado === 'personalizado' && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Desde</label>
                    <input
                      type="date"
                      value={fechaInicio ? fechaInicio.toISOString().split('T')[0] : ''}
                      onChange={(e) => setFechaInicio(new Date(e.target.value))}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Hasta</label>
                    <input
                      type="date"
                      value={fechaFin ? fechaFin.toISOString().split('T')[0] : ''}
                      onChange={(e) => setFechaFin(new Date(e.target.value))}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Área asignada</label>
              <div className="p-2 bg-blue-50 rounded-md">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-blue-500" />
                  <span className="text-blue-700 font-medium">
                    {user?.area === 1 ? 'Limpieza' : 
                     user?.area === 2 ? 'Atención al Cliente' : 
                     user?.area === 3 ? 'Juego' : 
                     user?.area === 4 ? 'Operaciones' : 
                     `Área ${user?.area}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {cargando ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : objetivos.length === 0 ? (
        <div className="text-center py-12 bg-muted rounded-lg">
          <p className="text-muted-foreground">No hay objetivos definidos para su área.</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="bg-gray-100 rounded-full p-3">
                  <BarChart2 className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Objetivos</p>
                  <p className="text-2xl font-bold">{metricas.total}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="bg-blue-100 rounded-full p-3">
                  <BarChart2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Promedio General</p>
                  <p className="text-2xl font-bold">
                    {metricas.promedioGeneral}%
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="bg-green-100 rounded-full p-3">
                  <BarChart2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Objetivos Alcanzados</p>
                  <p className="text-2xl font-bold text-green-600">
                    {metricas.alcanzados}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="bg-red-100 rounded-full p-3">
                  <BarChart2 className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Por Debajo de Meta</p>
                  <p className="text-2xl font-bold text-red-600">
                    {metricas.debajo}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            {objetivos.map(objetivo => (
              <ReporteDetalle
                key={objetivo.id}
                objetivo={objetivo}
                registros={registros[objetivo.id] || []}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
