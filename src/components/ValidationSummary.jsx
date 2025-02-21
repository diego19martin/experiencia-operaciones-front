"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Star } from "lucide-react"
import { motion } from "framer-motion"

export function ValidationSummary({ totalValidations, completedValidations, averageScore }) {
  const remainingValidations = totalValidations - completedValidations
  const progressPercentage = (completedValidations / totalValidations) * 100

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle>Resumen de Validaciones</CardTitle>
            <span className="text-sm text-muted-foreground">{Math.round(progressPercentage)}%</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Progreso de Validaciones</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <p className="text-sm text-muted-foreground">Realizadas</p>
              <p className="text-4xl font-normal">{completedValidations}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <p className="text-sm text-muted-foreground">Restantes</p>
              <p className="text-4xl font-normal">{remainingValidations}</p>
            </motion.div>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full bg-gradient-to-br from-gray-900 to-gray-800">
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-4">
            <p className="text-white text-lg font-medium">Puntaje Promedio</p>
            <div className="flex items-center space-x-2">
              <span className="text-6xl font-bold text-white">{averageScore.toFixed(1)}</span>
              <span className="text-2xl text-gray-400">/5</span>
            </div>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-6 h-6 ${
                    star <= Math.round(averageScore) ? "text-yellow-400 fill-yellow-400" : "text-gray-600"
                  }`}
                />
              ))}
            </div>
            <p className="text-gray-400 text-sm">Basado en {completedValidations} validaciones</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

