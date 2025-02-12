"use client"

import { IncidentForm } from "@/components/IncidentForm"
import { IncidentsList } from "@/components/IncidentsList"

export default function NovedadesPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Gestión de Novedades</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <IncidentForm />
        </div>
        <div>
          <IncidentsList />
        </div>
      </div>
    </div>
  )
}

