import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ValidationSummary({ totalValidations, completedValidations, averageScore }) {
  const remainingValidations = totalValidations - completedValidations
  const progressPercentage = (completedValidations / totalValidations) * 100

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Resumen de Validaciones</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium">Progreso de Validaciones</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
            </div>
          </div>
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium">Realizadas</p>
              <p className="text-2xl font-bold">{completedValidations}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Restantes</p>
              <p className="text-2xl font-bold">{remainingValidations}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Puntaje Promedio</p>
              <p className="text-2xl font-bold">{averageScore.toFixed(1)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

