import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Star, StarHalf, AlertCircle, Info, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

// Iconos para cada etapa del journey
const stageIcons = {
  ingreso: "🚪",
  experiencia_en_maquina: "🎰",
  pausa: "🚽",
  salida: "🚶"
};

// Función para determinar el emoji de emoción basado en puntaje
const getEmotionEmoji = (score) => {
  if (score >= 4.5) return "😍";
  if (score >= 3.5) return "😊";
  if (score >= 2.5) return "😐";
  if (score >= 1.5) return "😕";
  return "😢";
};

// Función para determinar color basado en puntaje
const getScoreColor = (score) => {
  if (score >= 4.5) return "text-green-600";
  if (score >= 3.5) return "text-green-500";
  if (score >= 2.5) return "text-yellow-500";
  if (score >= 1.5) return "text-orange-500";
  return "text-red-500";
};

// Función para determinar fondo basado en puntaje
const getScoreBackground = (score) => {
  if (score >= 4.5) return "bg-green-50 border-green-200";
  if (score >= 3.5) return "bg-green-50 border-green-200";
  if (score >= 2.5) return "bg-yellow-50 border-yellow-200";
  if (score >= 1.5) return "bg-orange-50 border-orange-200";
  return "bg-red-50 border-red-200";
};

// Tooltip personalizado para los gráficos
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const score = payload[0].value;
    return (
      <Card className={`p-0 shadow-lg border ${getScoreBackground(score)}`}>
        <CardContent className="p-3">
          <h4 className="font-semibold mb-1">{label}</h4>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold ${getScoreColor(score)}`}>
              {score.toFixed(2)}
            </span>
            <span className="text-2xl">{getEmotionEmoji(score)}</span>
          </div>
          <div className="flex mt-2">
            {renderStars(score)}
          </div>
          <p className="text-sm mt-2 text-gray-600">
            {getScoreDescription(score)}
          </p>
        </CardContent>
      </Card>
    );
  }
  return null;
};

// Función para generar texto descriptivo basado en puntaje
const getScoreDescription = (score) => {
  if (score >= 4.5) return "Experiencia excepcional";
  if (score >= 3.5) return "Buena experiencia";
  if (score >= 2.5) return "Experiencia aceptable";
  if (score >= 1.5) return "Necesita mejorar";
  return "Experiencia crítica";
};

// Función para renderizar estrellas
const renderStars = (score) => {
  const fullStars = Math.floor(score);
  const hasHalfStar = score % 1 >= 0.5;
  const stars = [];

  for (let i = 0; i < fullStars; i++) {
    stars.push(<Star key={`full-${i}`} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
  }

  if (hasHalfStar) {
    stars.push(<StarHalf key="half" className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
  }

  const emptyStars = 5 - stars.length;
  for (let i = 0; i < emptyStars; i++) {
    stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
  }

  return <div className="flex">{stars}</div>;
};

// Componente principal de Journey Road
const JourneyRoad = ({ stages, averageScores, onClick }) => {
  return (
    <div className="relative my-8">
      {/* Camino de fondo */}
      <div className="absolute w-full h-3 bg-gray-200 top-1/2 transform -translate-y-1/2 rounded-full"></div>
      
      {/* Nodos de las etapas */}
      <div className="flex justify-between items-center relative z-10">
        {stages.map((stage, index) => {
          const score = averageScores[index];
          const normalizedStage = stage.replace(" ", "_");
          
          return (
            <motion.div 
              key={stage} 
              className="flex flex-col items-center cursor-pointer"
              whileHover={{ scale: 1.05 }}
              onClick={() => onClick && onClick(stage, score)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Nodo principal con icono */}
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getScoreBackground(score)} border-2 shadow-md`}>
                <span className="text-3xl" role="img" aria-label={stage}>
                  {stageIcons[normalizedStage] || "❓"}
                </span>
              </div>
              
              {/* Emoji de emoción */}
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white border-2 border-gray-200 -mt-3 shadow-sm">
                <span className="text-xl">{getEmotionEmoji(score)}</span>
              </div>
              
              {/* Nombre de la etapa */}
              <p className="mt-2 text-sm font-medium text-center capitalize">
                {stage.replace("_", " ")}
              </p>
              
              {/* Puntuación */}
              <p className={`text-lg font-bold ${getScoreColor(score)}`}>
                {score.toFixed(1)}
              </p>
            </motion.div>
          );
        })}
      </div>
      
      {/* Flechas entre nodos */}
      <div className="absolute top-1/2 transform -translate-y-1/2 w-full flex justify-between px-10 z-0">
        {stages.slice(0, -1).map((_, index) => (
          <div key={`arrow-${index}`} className="flex-1 flex justify-center">
            <ArrowRight className="text-gray-400 opacity-70" />
          </div>
        ))}
      </div>
    </div>
  );
};

// Tarjeta para cada etapa
const StageCard = ({ stage, score, icon }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className={`h-full transition-all hover:shadow-lg ${getScoreBackground(score)}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="capitalize">{stage.replace("_", " ")}</span>
            <Badge 
              variant={score >= 3.5 ? "success" : score >= 2.5 ? "warning" : "destructive"}
              className="ml-2"
            >
              {score.toFixed(1)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-5xl text-center my-4">
              {icon}
            </div>
            
            <div className="flex justify-center">
              {renderStars(score)}
            </div>
            
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-2xl">{getEmotionEmoji(score)}</span>
              <p className="text-sm font-medium">{getScoreDescription(score)}</p>
            </div>

            <Progress value={score * 20} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Componente principal del Customer Journey Map mejorado
const EnhancedJourneyMap = ({ validaciones, loading, error, pendientes }) => {
  const [selectedArea, setSelectedArea] = useState("general");
  const [chartData, setChartData] = useState([]);
  const [selectedStage, setSelectedStage] = useState(null);
  
  useEffect(() => {
    if (selectedArea === "general") {
      setChartData(calcularPromediosGenerales());
    } else {
      setChartData(calcularPromediosPorArea(selectedArea));
    }
  }, [selectedArea, validaciones]);

  // Calcular promedios por área
  const calcularPromediosPorArea = (area) => {
    if (!Array.isArray(validaciones) || validaciones.length === 0) return [];

    const validacionesArea = validaciones.filter((v) => v.area === area);
    const instancias = ["ingreso", "experiencia_en_maquina", "pausa", "salida"];

    return instancias.map((instancia) => {
      const valInstancia = validacionesArea.filter((v) => v.instancia === instancia);
      const promedio = valInstancia.length > 0 
        ? valInstancia.reduce((acc, v) => acc + v.rating, 0) / valInstancia.length 
        : 0;

      return {
        name: instancia,
        displayName: instancia.replace("_", " "),
        value: Number(promedio.toFixed(2)),
      };
    });
  };

  // Calcular promedios generales
  const calcularPromediosGenerales = () => {
    if (!Array.isArray(validaciones) || validaciones.length === 0) return [];

    const areas = ["Limpieza", "Atención al Cliente", "Juego"];
    const instancias = ["ingreso", "experiencia_en_maquina", "pausa", "salida"];

    return instancias.map((instancia) => {
      const promediosPorArea = areas.map((area) => {
        const val = validaciones.filter((v) => v.area === area && v.instancia === instancia);
        return val.length > 0 ? val.reduce((sum, v) => sum + v.rating, 0) / val.length : 0;
      });

      const promedioGeneral = promediosPorArea.reduce((a, b) => a + b, 0) / areas.length;

      return {
        name: instancia,
        displayName: instancia.replace("_", " "),
        value: Number(promedioGeneral.toFixed(2)),
      };
    });
  };

  // Calcular promedio general
  const calcularPromedio = (data) => {
    if (!data || data.length === 0) return 0;
    return data.reduce((acc, item) => acc + item.value, 0) / data.length;
  };

  // Manejar clic en etapa del journey
  const handleStageClick = (stage, score) => {
    setSelectedStage({ stage, score });
  };

  // Cerrar panel de detalles
  const closeDetails = () => setSelectedStage(null);

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Error al cargar los datos: {error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {pendientes > 0 && (
        <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>
            Existen <strong>{pendientes}</strong> validaciones pendientes de aprobación. 
            El mapa muestra únicamente las validaciones aprobadas.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Journey Customer Map</h1>
        <div className="text-sm text-gray-500 flex items-center gap-1">
          <Info className="h-4 w-4" />
          Última actualización: {new Date().toLocaleDateString()}
        </div>
      </div>

      <Tabs 
        value={selectedArea} 
        onValueChange={setSelectedArea} 
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="Limpieza">Limpieza</TabsTrigger>
          <TabsTrigger value="Atención al Cliente">Atención</TabsTrigger>
          <TabsTrigger value="Juego">Juego</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedArea}>
          <Card className={`border ${getScoreBackground(calcularPromedio(chartData))}`}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle>
                  {selectedArea === "general" ? "Promedio General" : selectedArea}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    Promedio: {calcularPromedio(chartData).toFixed(2)}
                  </span>
                  <span className="text-2xl">{getEmotionEmoji(calcularPromedio(chartData))}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse flex space-x-4">
                  <div className="flex-1 space-y-6 py-1">
                    <div className="h-60 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ) : (
                <>
                  <JourneyRoad 
                    stages={chartData.map(d => d.displayName)} 
                    averageScores={chartData.map(d => d.value)}
                    onClick={handleStageClick}
                  />
                  
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.6} />
                      <XAxis 
                        dataKey="displayName" 
                        tick={{ fill: "#666" }}
                      />
                      <YAxis 
                        domain={[0, 5]} 
                        tick={{ fill: "#666" }}
                        ticks={[0, 1, 2, 3, 4, 5]}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="value"
                        name="Puntuación"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={(props) => {
                          if (!props.payload) return null;
                          const score = props.payload.value;
                          return (
                            <g transform={`translate(${props.cx},${props.cy})`}>
                              <circle r={5} fill="#3b82f6" stroke="#fff" strokeWidth={1} />
                            </g>
                          );
                        }}
                        activeDot={(props) => {
                          if (!props.payload) return null;
                          const score = props.payload.value;
                          return (
                            <g transform={`translate(${props.cx},${props.cy})`}>
                              <circle r={8} fill="#3b82f6" fillOpacity={0.8} />
                              <text 
                                x={0} 
                                y={-15} 
                                textAnchor="middle" 
                                fill="#333"
                                style={{fontSize: '12px', fontWeight: 'bold'}}
                              >
                                {score.toFixed(1)}
                              </text>
                            </g>
                          );
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <h2 className="text-xl font-semibold mt-8">Desglose por Etapas</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {chartData.map((stage) => (
          <StageCard
            key={stage.name}
            stage={stage.name}
            score={stage.value}
            icon={stageIcons[stage.name]}
          />
        ))}
      </div>

      {selectedStage && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closeDetails}
        >
          <Card 
            className="w-full max-w-lg" 
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className={getScoreBackground(selectedStage.score)}>
              <CardTitle className="flex items-center justify-between">
                <span className="capitalize">{selectedStage.stage.replace("_", " ")}</span>
                <span className="text-2xl">{getEmotionEmoji(selectedStage.score)}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="text-6xl">
                    {stageIcons[selectedStage.stage.replace(" ", "_")] || "❓"}
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-4xl font-bold">{selectedStage.score.toFixed(1)}</p>
                  <div className="flex justify-center mt-2">
                    {renderStars(selectedStage.score)}
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Descripción</h4>
                  <p>{getScoreDescription(selectedStage.score)}</p>
                </div>
                
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    {selectedStage.score < 3 ? (
                      <span className="flex items-center text-red-500">
                        <TrendingDown className="mr-1 h-4 w-4" />
                        Necesita atención urgente
                      </span>
                    ) : selectedStage.score >= 4 ? (
                      <span className="flex items-center text-green-500">
                        <TrendingUp className="mr-1 h-4 w-4" />
                        Experiencia destacada
                      </span>
                    ) : (
                      <span>Experiencia promedio</span>
                    )}
                  </p>
                  <Button onClick={closeDetails}>Cerrar</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default EnhancedJourneyMap;