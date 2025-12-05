import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = {
  title: "Iniciar Sesión - Sistema Escolar",
  description: "Accede al sistema de gestión y análisis académico",
}

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      {children}
      <Toaster position="top-right" />
      <Analytics />
    </>
  )
}
