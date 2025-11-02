"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Wifi, WifiOff, RefreshCw } from "lucide-react"
import { apiService } from "@/lib/api"

export function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(true)
  const [isChecking, setIsChecking] = useState(false)

  const checkConnection = async () => {
    setIsChecking(true)
    try {
      await apiService.ping()
      setIsConnected(true)
    } catch (error) {
      setIsConnected(false)
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    checkConnection()
    
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000)
    
    return () => clearInterval(interval)
  }, [])

  if (isConnected) {
    return null
  }

  return (
    <Alert className="border-red-500/20 bg-red-500/5">
      <WifiOff className="h-4 w-4 text-red-500" />
      <AlertDescription className="flex items-center justify-between">
        <span>No se puede conectar con el servidor backend</span>
        <Button
          variant="outline"
          size="sm"
          onClick={checkConnection}
          disabled={isChecking}
          className="gap-2"
        >
          {isChecking ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          Reintentar
        </Button>
      </AlertDescription>
    </Alert>
  )
}
