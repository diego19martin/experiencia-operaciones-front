import { Inter } from "next/font/google"
import "./globals.css"
import Navbar from "../components/Navbar"
import { AuthProvider } from "@/contexts/AuthContext"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Sistema de Supervisión Operativa - Casino",
  description: "Gestión de validaciones y supervisión para operaciones de casino",
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          <Navbar />
          <main className="container mx-auto px-4 py-8">{children}</main>
        </AuthProvider>
      </body>
    </html>
  )
}

