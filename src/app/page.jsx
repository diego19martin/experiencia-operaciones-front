import { redirect } from "next/navigation"

export default function Home() {
  // Cuando alguien va a "/", lo redirigimos a "/login"
  redirect("/login")
}