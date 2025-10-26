"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

export default function SteamCallbackPage() {
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { steamAuth } = useAuth()

  useEffect(() => {
    const handleSteamCallback = async () => {
      try {
        // Obtener la URL completa de Steam
        const openIdResponse = window.location.href
        
        if (!openIdResponse) {
          setError("No se recibió respuesta de Steam")
          setIsLoading(false)
          return
        }

        // Extraer Steam ID de la respuesta
        const steamId = extractSteamIdFromUrl(openIdResponse)
        
        if (!steamId) {
          setError("No se pudo extraer Steam ID de la respuesta")
          setIsLoading(false)
          return
        }

        console.log("Enviando datos al backend:", { openIdResponse, steamId })

        // Obtener información del usuario de Steam
        const response = await fetch('/api/auth/steam/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            openIdResponse: openIdResponse,
            steamId: steamId 
          }),
        })

        console.log("Respuesta del backend:", response.status)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        console.log("Datos del backend:", data)

        if (data.success) {
          // Guardar información de Steam en sessionStorage para el registro
          sessionStorage.setItem('steam_auth_data', JSON.stringify({
            steamId: data.steamId,
            steamUsername: data.steamUsername,
            timestamp: Date.now()
          }))
          
          // Redirigir al registro con parámetro de Steam
          setTimeout(() => {
            router.push('/register?steam=success')
          }, 2000)
        } else {
          setError(data.message || "Error en la autenticación con Steam")
        }
      } catch (err) {
        console.error("Error en Steam callback:", err)
        setError("Error de conexión. Inténtalo de nuevo.")
      } finally {
        setIsLoading(false)
      }
    }

    handleSteamCallback()
  }, [searchParams, router, steamAuth])

  const extractSteamIdFromUrl = (url: string): string | null => {
    try {
      console.log("Extrayendo Steam ID de URL:", url)
      
      // Crear objeto URL para parsear parámetros
      const urlObj = new URL(url)
      
      // Buscar en openid.claimed_id primero
      const claimedId = urlObj.searchParams.get('openid.claimed_id')
      if (claimedId && claimedId.includes('/openid/id/')) {
        const steamId = claimedId.substring(claimedId.lastIndexOf('/') + 1)
        console.log("Steam ID extraído de claimed_id:", steamId)
        return steamId
      }
      
      // Buscar en openid.identity como fallback
      const identity = urlObj.searchParams.get('openid.identity')
      if (identity && identity.includes('/openid/id/')) {
        const steamId = identity.substring(identity.lastIndexOf('/') + 1)
        console.log("Steam ID extraído de identity:", steamId)
        return steamId
      }
      
      console.log("No se pudo extraer Steam ID de la URL")
      return null
    } catch (error) {
      console.error("Error extrayendo Steam ID:", error)
      return null
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Procesando Steam...</CardTitle>
            <CardDescription>
              Estamos verificando tu cuenta de Steam
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              Por favor espera mientras procesamos tu autenticación
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {error ? "Error de Autenticación" : "Autenticación Exitosa"}
          </CardTitle>
          <CardDescription>
            {error ? "Hubo un problema con Steam" : "Te has autenticado correctamente"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="text-center">
            <button
              onClick={() => router.push('/')}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
            >
              Ir al Inicio
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
