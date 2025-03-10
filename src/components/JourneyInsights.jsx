import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Star, HelpCircle } from "lucide-react";

// Colores para los gráficos
const COLORS = ['#4CAF50', '#FFC107', '#F44336', '#2196F3', '#9C27B0'];

const JourneyInsights = ({ validaciones }) => {
  const [selectedTab, setSelectedTab] = useState('summary');
  const [insightData, setInsightData] = useState(null);
  
  useEffect(() => {
    if (validaciones && validaciones.length > 0) {
      calculateInsights();
    }
  }, [validaciones]);
  
  const calculateInsights = () => {
    // Calcular datos de insights
    const data = {
      summary: calculateSummaryMetrics(),
      areas: calculateAreaPerformance(),
      stages: calculateStagePerformance(),
      trends: calculateTrends()
    };
    
    setInsightData(data);
  };
  
  // Calcular métricas de resumen
  const calculateSummaryMetrics = () => {
    if (!validaciones.length) return null;
    
    // Puntuación promedio general
    const averageScore = validaciones.reduce((sum, v) => sum + v.rating, 0) / validaciones.length;
    
    // Distribución de puntuaciones (1-5)
    const scoreDistribution = [0, 0, 0, 0, 0]; // Para puntuaciones 1-5
    validaciones.forEach(v => {
      const scoreIndex = Math.min(Math.floor(v.rating), 5) - 1;
      if (scoreIndex >= 0) scoreDistribution[scoreIndex]++;
    });
    
    // Convertir a porcentajes
    const scoreDistributionPercent = scoreDistribution.map(count => 
      Math.round((count / validaciones.length) * 100)
    );
    
    // Etapa con mejor y peor puntuación
    const stageScores = {};
    validaciones.forEach(v => {
      if (!stageScores[v.instancia]) stageScores[v.instancia] = [];
      stageScores[v.instancia].push(v.rating);
    });
    
    const stageAvgScores = Object.entries(stageScores).map(([stage, scores]) => ({
      stage,
      score: scores.reduce((sum, s) => sum + s, 0) / scores.length
    }));
    
    // Ordenar por puntuación
    stageAvgScores.sort((a, b) => b.score - a.score);
    
    return {
      totalValidaciones: validaciones.length,
      averageScore,
      scoreDistribution: scoreDistribution.map((count, i) => ({
        name: `${i+1} stars`,
        value: count,
        percentage: scoreDistributionPercent[i]
      })),
      bestStage: stageAvgScores[0],
      worstStage: stageAvgScores[stageAvgScores.length - 1]
    };
  };
  
  // Calcular rendimiento por área
  const calculateAreaPerformance = () => {
    if (!validaciones.length) return [];
    
    // Agrupar validaciones por área
    const areaData = {};
    validaciones.forEach(v => {
      if (!areaData[v.area]) {
        areaData[v.area] = {
          name: v.area,
          ratings: [],
          stages: {}
        };
      }
      
      areaData[v.area].ratings.push(v.rating);
      
      // Agrupar también por etapa dentro del área
      if (!areaData[v.area].stages[v.instancia]) {
        areaData[v.area].stages[v.instancia] = [];
      }
      areaData[v.area].stages[v.instancia].push(v.rating);
    });
    
    // Calcular promedios
    return Object.values(areaData).map(area => {
      const avgScore = area.ratings.reduce((sum, r) => sum + r, 0) / area.ratings.length;
      
      // Calcular promedios por etapa
      const stageScores = Object.entries(area.stages).map(([stage, ratings]) => ({
        stage: stage.replace("_", " "),
        score: ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      }));
      
      return {
        name: area.name,
        averageScore: avgScore,
        count: area.ratings.length,
        stageScores
      };
    }).sort((a, b) => b.averageScore - a.averageScore);
  };
  
  // Calcular rendimiento por etapa
  const calculateStagePerformance = () => {
    if (!validaciones.length) return [];
    
    // Agrupar validaciones por etapa
    const stageData = {};
    validaciones.forEach(v => {
      if (!stageData[v.instancia]) {
        stageData[v.instancia] = {
          name: v.instancia.replace("_", " "),
          ratings: [],
          areas: {}
        };
      }
      
      stageData[v.instancia].ratings.push(v.rating);
      
      // Agrupar también por área dentro de la etapa
      if (!stageData[v.instancia].areas[v.area]) {
        stageData[v.instancia].areas[v.area] = [];
      }
      stageData[v.instancia].areas[v.area].push(v.rating);
    });
    
    // Calcular promedios
    return Object.values(stageData).map(stage => {
      const avgScore = stage.ratings.reduce((sum, r) => sum + r, 0) / stage.ratings.length;
      
      // Calcular promedios por área
      const areaScores = Object.entries(stage.areas).map(([area, ratings]) => ({
        area,
        score: ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      }));
      
      return {
        name: stage.name,
        averageScore: avgScore,
        count: stage.ratings.length,
        areaScores
      };
    }).sort((a, b) => a.name.localeCompare(b.name)); // Ordenar por nombre de etapa
  };
  
  // Calcular tendencias (simuladas ya que no tenemos datos históricos)
  const calculateTrends = () => {
    // En una implementación real, aquí compararíamos con datos históricos
    return {
      overallTrend: 'up', // o 'down', 'stable'
      changePercentage: 8, // simulado
      improvements: [
        { stage: 'ingreso', change: 12 },
        { stage: 'experiencia_en_maquina', change: 5 }
      ],
      declines: [
        { stage: 'pausa', change: -3 }
      ]
    };
  };
  
  // Formatear número como porcentaje
  const formatPercent = (value) => {
    return `${Math.abs(Math.round(value))}%`;
  };
  
  // Renderizar icono de tendencia
  const renderTrendIcon = (trend, size = 16) => {
    if (trend > 0) {
      return <TrendingUp className="text-green-500" size={size} />;
    } else if (trend < 0) {
      return <TrendingDown className="text-red-500" size={size} />;
    }
    return null;
  };
  
  // Criterios para la calificación de desempeño
  const getPerformanceBadge = (score) => {
    if (score >= 4.5) return <Badge className="bg-green-100 text-green-800">Excelente</Badge>;
    if (score >= 3.5) return <Badge className="bg-blue-100 text-blue-800">Bueno</Badge>;
    if (score >= 2.5) return <Badge className="bg-yellow-100 text-yellow-800">Regular</Badge>;
    return <Badge className="bg-red-100 text-red-800">Crítico</Badge>;
  };
  
  // Renderer para la pestaña de Resumen
  const renderSummaryTab = () => {
    if (!insightData || !insightData.summary) return <div>No hay datos disponibles</div>;
    
    const { totalValidaciones, averageScore, scoreDistribution, bestStage, worstStage } = insightData.summary;
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-500">Validaciones Totales</p>
                <p className="text-4xl font-bold">{totalValidaciones}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-500">Promedio General</p>
                <p className="text-4xl font-bold">{averageScore.toFixed(2)}</p>
                <div className="flex justify-center mt-1">
                  {renderStars(averageScore)}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-500">Mejor Etapa</p>
                <p className="text-lg font-bold capitalize">{bestStage.stage.replace("_", " ")}</p>
                <div className="flex justify-center mt-1">
                  {renderStars(bestStage.score)}
                </div>
                <p className="text-xl font-bold mt-1">{bestStage.score.toFixed(1)}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-500">Etapa a Mejorar</p>
                <p className="text-lg font-bold capitalize">{worstStage.stage.replace("_", " ")}</p>
                <div className="flex justify-center mt-1">
                  {renderStars(worstStage.score)}
                </div>
                <p className="text-xl font-bold mt-1">{worstStage.score.toFixed(1)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Calificaciones</CardTitle>
            <CardDescription>Análisis de la distribución de puntuaciones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={scoreDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                    >
                      {scoreDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Cantidad']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={scoreDistribution}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" name="Cantidad">
                      {scoreDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-gray-500">
              La distribución muestra cómo se reparten las puntuaciones entre 1 y 5 estrellas.
            </p>
          </CardFooter>
        </Card>
        
        {insightData.trends && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Tendencia General
                {insightData.trends.overallTrend === 'up' ? (
                  <TrendingUp className="text-green-500" />
                ) : insightData.trends.overallTrend === 'down' ? (
                  <TrendingDown className="text-red-500" />
                ) : null}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-gray-50">
                  <p className="text-sm text-gray-500">Cambio</p>
                  <div className="flex items-center justify-center gap-2">
                    {renderTrendIcon(insightData.trends.changePercentage, 24)}
                    <p className="text-2xl font-bold">
                      {formatPercent(insightData.trends.changePercentage)}
                    </p>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-green-50">
                  <p className="text-sm text-gray-500">Mejoras</p>
                  <ul className="space-y-2 mt-2">
                    {insightData.trends.improvements.map((item, idx) => (
                      <li key={idx} className="flex items-center justify-between">
                        <span className="capitalize">{item.stage.replace("_", " ")}</span>
                        <span className="flex items-center text-green-600">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          {formatPercent(item.change)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="p-4 rounded-lg bg-red-50">
                  <p className="text-sm text-gray-500">Retrocesos</p>
                  <ul className="space-y-2 mt-2">
                    {insightData.trends.declines.map((item, idx) => (
                      <li key={idx} className="flex items-center justify-between">
                        <span className="capitalize">{item.stage.replace("_", " ")}</span>
                        <span className="flex items-center text-red-600">
                          <TrendingDown className="h-4 w-4 mr-1" />
                          {formatPercent(item.change)}
                        </span>
                      </li>
                    ))}
                    {insightData.trends.declines.length === 0 && (
                      <li className="text-center py-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                        <span className="text-sm text-green-600 mt-1">Sin retrocesos</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };
  
  // Renderer para la pestaña de Áreas
  const renderAreasTab = () => {
    if (!insightData || !insightData.areas || !insightData.areas.length) {
      return <div>No hay datos disponibles</div>;
    }
    
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Desempeño por Área</CardTitle>
            <CardDescription>Comparación del rendimiento entre áreas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={insightData.areas}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Bar dataKey="averageScore" name="Puntuación Promedio" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insightData.areas.map((area, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{area.name}</span>
                  {getPerformanceBadge(area.averageScore)}
                </CardTitle>
                <CardDescription>
                  {area.count} validaciones registradas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <p className="text-3xl font-bold">{area.averageScore.toFixed(1)}</p>
                  <div className="flex justify-center mt-2">
                    {renderStars(area.averageScore)}
                  </div>
                </div>
                
                <h4 className="text-sm font-medium mb-2">Desglose por etapa:</h4>
                <ul className="space-y-2">
                  {area.stageScores.map((stage, idx) => (
                    <li key={idx} className="flex items-center justify-between">
                      <span className="capitalize">{stage.stage}</span>
                      <div className="flex items-center">
                        <span className="mr-2">{stage.score.toFixed(1)}</span>
                        <div className="flex">
                          {renderMiniStars(stage.score)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };
  
  // Renderer para la pestaña de Etapas
  const renderStagesTab = () => {
    if (!insightData || !insightData.stages || !insightData.stages.length) {
      return <div>No hay datos disponibles</div>;
    }
    
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Puntuación por Etapa</CardTitle>
            <CardDescription>Análisis del journey a través de las diferentes etapas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={insightData.stages}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Bar dataKey="averageScore" name="Puntuación Promedio" fill="#4CAF50" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insightData.stages.map((stage, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="capitalize">{stage.name}</span>
                  {getPerformanceBadge(stage.averageScore)}
                </CardTitle>
                <CardDescription>
                  {stage.count} validaciones registradas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <p className="text-3xl font-bold">{stage.averageScore.toFixed(1)}</p>
                  <div className="flex justify-center mt-2">
                    {renderStars(stage.averageScore)}
                  </div>
                </div>
                
                <h4 className="text-sm font-medium mb-2">Desglose por área:</h4>
                <ul className="space-y-2">
                  {stage.areaScores.map((area, idx) => (
                    <li key={idx} className="flex items-center justify-between">
                      <span>{area.area}</span>
                      <div className="flex items-center">
                        <span className="mr-2">{area.score.toFixed(1)}</span>
                        <div className="flex">
                          {renderMiniStars(area.score)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };
  
  // Renderer para la pestaña de Recomendaciones
  const renderRecommendationsTab = () => {
    if (!insightData || !insightData.stages || !insightData.areas) {
      return <div>No hay datos disponibles para generar recomendaciones</div>;
    }
    
    // Identificar la etapa con peor puntuación
    const worstStage = [...insightData.stages].sort((a, b) => a.averageScore - b.averageScore)[0];
    
    // Para cada área, identificar la etapa con peor puntuación
    const areaRecommendations = insightData.areas.map(area => {
      const lowestScoreStage = area.stageScores.reduce(
        (lowest, current) => current.score < lowest.score ? current : lowest,
        { score: 5, stage: '' } // Valor inicial
      );
      
      return {
        area: area.name,
        focusStage: lowestScoreStage.stage,
        score: lowestScoreStage.score
      };
    });
    
    // Filtrar solo áreas con puntuaciones por debajo de 3.5
    const criticalAreas = areaRecommendations.filter(rec => rec.score < 3.5);
    
    return (
      <div className="space-y-6">
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="text-blue-500" />
              Síntesis y Recomendaciones
            </CardTitle>
            <CardDescription>
              Basado en el análisis de los datos de validación
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-blue-100">
              <h3 className="font-medium mb-2 text-blue-800">Visión general</h3>
              <p>
                La experiencia del cliente en su recorrido muestra un promedio de <strong>{insightData.summary.averageScore.toFixed(1)}</strong> sobre 5,
                lo que indica {
                  insightData.summary.averageScore >= 4 ? 'una experiencia muy positiva.' : 
                  insightData.summary.averageScore >= 3 ? 'una experiencia generalmente satisfactoria.' :
                  'una experiencia que necesita mejoras significativas.'
                }
              </p>
            </div>
            
            {worstStage && (
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <h3 className="font-medium mb-2 text-blue-800">Punto crítico del journey</h3>
                <div className="flex items-start gap-4">
                  <AlertTriangle className="text-yellow-500 mt-1" />
                  <div>
                    <p>
                      La etapa <strong className="capitalize">{worstStage.name}</strong> muestra la puntuación más 
                      baja con <strong>{worstStage.averageScore.toFixed(1)}</strong> sobre 5. 
                      Se recomienda priorizar mejoras en esta etapa para optimizar la experiencia general.
                    </p>
                    {worstStage.averageScore < 3 && (
                      <Badge variant="destructive" className="mt-2">Necesita atención urgente</Badge>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {criticalAreas.length > 0 && (
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <h3 className="font-medium mb-2 text-blue-800">Áreas que requieren atención</h3>
                <ul className="space-y-2">
                  {criticalAreas.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <AlertTriangle className="text-yellow-500 shrink-0 mt-1" size={16} />
                      <span>
                        <strong>{item.area}</strong>: Enfocarse en mejorar la etapa <strong className="capitalize">{item.focusStage}</strong> 
                        (puntuación actual: {item.score.toFixed(1)})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="bg-white p-4 rounded-lg border border-blue-100">
              <h3 className="font-medium mb-2 text-blue-800">Recomendaciones de mejora</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="text-green-500 shrink-0 mt-1" size={16} />
                  <span>
                    Implementar evaluaciones regulares en {worstStage ? `la etapa ${worstStage.name}` : 'todas las etapas'} con 
                    puntuaciones bajas para identificar causas específicas.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="text-green-500 shrink-0 mt-1" size={16} />
                  <span>
                    Desarrollar un plan de acción específico para cada área con etapas de puntuación baja.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="text-green-500 shrink-0 mt-1" size={16} />
                  <span>
                    Realizar capacitaciones específicas para el personal en las áreas identificadas como críticas.
                  </span>
                </li>
              </ul>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              Generar informe completo
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  };
  
  // Mini estrellas para usar en listas
  const renderMiniStars = (score) => {
    const fullStars = Math.floor(score);
    const stars = [];
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`mini-${i}`} className="w-3 h-3 fill-yellow-400 text-yellow-400" />);
    }
    
    const remainingStars = 5 - stars.length;
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`mini-empty-${i}`} className="w-3 h-3 text-gray-300" />);
    }
    
    return stars;
  };
  
  // Estrellas normales
  const renderStars = (score) => {
    const fullStars = Math.floor(score);
    const hasHalfStar = score % 1 >= 0.5;
    const stars = [];
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} className="w-5 h-5 fill-yellow-400 text-yellow-400" />);
    }
    
    if (hasHalfStar) {
      stars.push(<Star key="half" className="w-5 h-5 fill-yellow-400 text-yellow-400" />);
    }
    
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-5 h-5 text-gray-300" />);
    }
    
    return stars;
  };
  
  if (!insightData) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-500">Analizando datos...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="summary">Resumen</TabsTrigger>
          <TabsTrigger value="areas">Por Área</TabsTrigger>
          <TabsTrigger value="stages">Por Etapa</TabsTrigger>
          <TabsTrigger value="recommendations">Recomendaciones</TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary">
          {renderSummaryTab()}
        </TabsContent>
        
        <TabsContent value="areas">
          {renderAreasTab()}
        </TabsContent>
        
        <TabsContent value="stages">
          {renderStagesTab()}
        </TabsContent>
        
        <TabsContent value="recommendations">
          {renderRecommendationsTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default JourneyInsights;