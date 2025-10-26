"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import Image from "next/image"

interface SteamAuthProps {
  onSuccess?: () => void
  onError?: (message: string) => void
}

export function SteamAuth({ onSuccess, onError }: SteamAuthProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSteamLogin = async () => {
    setError("")
    setIsLoading(true)

    try {
      // Obtener URL de Steam OpenID del backend
      const response = await fetch('/api/auth/steam/login')
      const data = await response.json()

      if (data.success) {
        // Redirigir a Steam para autenticación
        window.location.href = data.steamLoginUrl
      } else {
        const errorMessage = data.message || "Error obteniendo URL de Steam"
        setError(errorMessage)
        onError?.(errorMessage)
      }
    } catch (err) {
      const errorMessage = "Error de conexión. Inténtalo de nuevo."
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-2">
          <Image 
            src="/steam-logo.svg" 
            alt="Steam" 
            width={32} 
            height={32} 
            className="mr-2"
          />
          <CardTitle className="text-xl">Autenticación Steam</CardTitle>
        </div>
        <CardDescription>
          Conecta tu cuenta de Steam para acceder a TACTICORE
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Serás redirigido a Steam para autenticarte de forma segura
            </p>
          </div>

          <Button 
            onClick={handleSteamLogin}
            className="w-full" 
            disabled={isLoading}
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Conectando con Steam...
              </>
            ) : (
              <>
                <Image 
                  src="/steam-logo.svg" 
                  alt="Steam" 
                  width={20} 
                  height={20} 
                  className="mr-2"
                />
                Iniciar Sesión con Steam
              </>
            )}
          </Button>

          <div className="text-xs text-muted-foreground text-center">
            <p>
              Al hacer clic, serás redirigido a Steam para autenticarte de forma segura.
              TACTICORE no tiene acceso a tu contraseña de Steam.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
