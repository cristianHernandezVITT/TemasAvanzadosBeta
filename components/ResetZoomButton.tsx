"use client"

import { useAccessibility } from "@/hooks/useAccessibility"
import { Button } from "@/components/ui/button"
import { ZoomOut } from "lucide-react"

export function ResetZoomButton() {
  const { preferences, updatePreference } = useAccessibility()

  // Solo mostrar el botón cuando el zoom esté en 200%
  if (preferences.lupaZoom !== 200) {
    return null
  }

  const handleResetZoom = () => {
    updatePreference("lupaZoom", 100)
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={handleResetZoom}
        className="shadow-lg hover:shadow-xl transition-shadow"
        size="lg"
        aria-label="Restablecer zoom a 100%"
      >
        <ZoomOut className="h-4 w-4 mr-2" />
        Restablecer zoom
      </Button>
    </div>
  )
}

