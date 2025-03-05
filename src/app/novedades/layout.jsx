import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

export default function NovedadesLayout({ children }) {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Novedades</h1>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <Link href="/novedades">
            <TabsTrigger value="list">Novedades</TabsTrigger>
          </Link>
          <Link href="/novedades/objetivos">
            <TabsTrigger value="goals">Objetivos</TabsTrigger>
          </Link>
        </TabsList>
      </Tabs>

      {children}
    </div>
  )
}

