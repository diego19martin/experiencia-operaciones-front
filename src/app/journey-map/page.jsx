"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, Download, RefreshCw, FileText, Map, BarChart2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { calcularTurno } from "@/lib/utils"
import EnhancedJourneyMap from "@/components/EnhancedJourneyMap"
import JourneyInsights from "@/components/JourneyInsights"
import { motion } from "framer-motion"

export default function JourneyMapPage() {
  const [validaciones, setValidaciones] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pendientes, setPendientes] = useState(0)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("map")

  const fetchData = async () => {
    try {
      setRefreshing(true)
      const turnoActual = calcularTurno()
      const today = new Date().toISOString().split("T")[0]

      const [approvedRes, pendingRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/validations?status=approved&date=${today}&turno=${turnoActual}`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/validations?status=pending&date=${today}&turno=${turnoActual}`),
      ])

      if (!approvedRes.ok || !pendingRes.ok) {
        throw new Error("Error al obtener las validaciones")
      }

      const [approvedData, pendingData] = await Promise.all([approvedRes.json(), pendingRes.json()])

      setValidaciones(Array.isArray(approvedData) ? approvedData : [])
      setPendientes(Array.isArray(pendingData) ? pendingData.length : 0)
      setLastUpdate(new Date())
    } catch (err) {
      console.error("Error:", err)
      setError(err.message)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
    
    // Opcionalmente, configurar un temporizador para refrescar datos
    const intervalId = setInterval(() => {
      fetchData()
    }, 5 * 60 * 1000) // Refrescar cada 5 minutos
    
    return () => clearInterval(intervalId)
  }, [])
  
  // Función para exportar los datos
  const handleExport = () => {
    if (!validaciones.length) return;
    
    // Convertir validaciones a formato CSV
    const headers = "Área,Instancia,Puntuación,Fecha\n";
    const csvContent = validaciones.reduce((acc, val) => {
      return acc + `${val.area},${val.instancia.replace("_", " ")},${val.rating},${new Date(val.created_at).toLocaleDateString()}\n`;
    }, headers);
    
    // Crear y descargar el archivo
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    link.setAttribute("href", url);
    link.setAttribute("download", `journey_map_data_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Error al cargar los datos: {error}</AlertDescription>
        <Button variant="outline" className="ml-4" onClick={fetchData}>
          Reintentar
        </Button>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <h1 className="text-3xl font-bold">Journey Customer Map</h1>
        <div className="space-y-4">
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-[200px] w-full rounded-xl" />
            <Skeleton className="h-[200px] w-full rounded-xl" />
            <Skeleton className="h-[200px] w-full rounded-xl" />
            <Skeleton className="h-[200px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Journey Customer Map</h1>
          {lastUpdate && (
            <p className="text-sm text-gray-500">
              Última actualización: {lastUpdate.toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Actualizando..." : "Actualizar datos"}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExport}
            disabled={validaciones.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar datos
          </Button>
        </div>
      </div>
      
      {pendientes > 0 && (
        <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Existen <strong>{pendientes}</strong> validaciones pendientes de aprobación. 
            El mapa muestra únicamente las validaciones aprobadas.
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="map" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            Mapa de Viaje
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            Insights y Análisis
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="map">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <EnhancedJourneyMap 
              validaciones={validaciones}
              loading={isLoading}
              error={error}
              pendientes={pendientes}
            />
          </motion.div>
        </TabsContent>
        
        <TabsContent value="insights">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Análisis Detallado del Journey Map
                </CardTitle>
              </CardHeader>
              <CardContent>
                <JourneyInsights validaciones={validaciones} />
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}