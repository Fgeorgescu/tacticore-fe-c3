"use client"

import React, { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Target, Users, Eye, EyeOff } from "lucide-react"
import { Kill } from "@/lib/api"

interface KillMapProps {
  mapName: string
  kills: Kill[]
  selectedUser?: string
  className?: string
}

interface MapConfig {
  name: string
  imagePath: string
  bounds: {
    minX: number
    maxX: number
    minY: number
    maxY: number
  }
  // Dimensiones de la imagen del mapa (en píxeles)
  imageDimensions: {
    width: number
    height: number
  }
}

// Configuración de mapas conocidos
const MAP_CONFIGS: Record<string, MapConfig> = {
  "de_mirage": {
    name: "Mirage",
    imagePath: "/maps/de_mirage.svg",
    bounds: {
      minX: -3000,
      maxX: 3000,
      minY: -3000,
      maxY: 3000
    },
    imageDimensions: {
      width: 1024,
      height: 1024
    }
  },
  "de_dust2": {
    name: "Dust2",
    imagePath: "/maps/de_dust2.svg",
    bounds: {
      minX: -3000,
      maxX: 3000,
      minY: -3000,
      maxY: 3000
    },
    imageDimensions: {
      width: 1024,
      height: 1024
    }
  },
  "de_inferno": {
    name: "Inferno",
    imagePath: "/maps/de_inferno.svg",
    bounds: {
      minX: -3000,
      maxX: 3000,
      minY: -3000,
      maxY: 3000
    },
    imageDimensions: {
      width: 1024,
      height: 1024
    }
  },
  "de_cache": {
    name: "Cache",
    imagePath: "/maps/de_cache.svg",
    bounds: {
      minX: -3000,
      maxX: 3000,
      minY: -3000,
      maxY: 3000
    },
    imageDimensions: {
      width: 1024,
      height: 1024
    }
  },
  "de_overpass": {
    name: "Overpass",
    imagePath: "/maps/de_overpass.svg",
    bounds: {
      minX: -3000,
      maxX: 3000,
      minY: -3000,
      maxY: 3000
    },
    imageDimensions: {
      width: 1024,
      height: 1024
    }
  }
}

// Función para convertir coordenadas del juego a coordenadas de imagen
function gameToImageCoordinates(
  gameX: number,
  gameY: number,
  mapConfig: MapConfig
): { x: number; y: number } {
  const { bounds, imageDimensions } = mapConfig
  
  // Normalizar coordenadas del juego a 0-1
  const normalizedX = (gameX - bounds.minX) / (bounds.maxX - bounds.minX)
  const normalizedY = (gameY - bounds.minY) / (bounds.maxY - bounds.minY)
  
  // Convertir a coordenadas de imagen
  const imageX = normalizedX * imageDimensions.width
  const imageY = (1 - normalizedY) * imageDimensions.height // Invertir Y para que el origen esté abajo
  
  return { x: imageX, y: imageY }
}

// Función para obtener el color del punto basado en el tipo de kill
function getKillColor(kill: Kill, selectedUser?: string): string {
  if (!selectedUser) {
    return kill.isGoodPlay ? "#10b981" : "#ef4444" // Verde para buena jugada, rojo para mala
  }
  
  if (kill.killer === selectedUser) {
    return kill.isGoodPlay ? "#10b981" : "#ef4444" // Verde/rojo si es el atacante
  } else if (kill.victim === selectedUser) {
    return kill.isGoodPlay ? "#f59e0b" : "#dc2626" // Amarillo/naranja si es la víctima
  }
  
  return "#6b7280" // Gris para otros jugadores
}

// Función para obtener el tamaño del punto
function getKillSize(kill: Kill, selectedUser?: string): number {
  if (!selectedUser) return 6
  
  if (kill.killer === selectedUser || kill.victim === selectedUser) {
    return 8 // Más grande si involucra al usuario seleccionado
  }
  
  return 4 // Más pequeño para otros
}

export function KillMap({ mapName, kills, selectedUser, className = "" }: KillMapProps) {
  const [showAttackerPositions, setShowAttackerPositions] = useState(true)
  const [showVictimPositions, setShowVictimPositions] = useState(true)
  const [hoveredKill, setHoveredKill] = useState<Kill | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const mapConfig = MAP_CONFIGS[mapName.toLowerCase()] || MAP_CONFIGS["de_mirage"]

  // Filtrar kills que tienen coordenadas de imagen
  const killsWithCoordinates = kills.filter(kill => 
    kill.attackerImagePosition || kill.victimImagePosition
  )

  // Dibujar el mapa y los puntos
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || killsWithCoordinates.length === 0) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Dibujar cada kill
    killsWithCoordinates.forEach((kill) => {
      // Dibujar posición del atacante
      if (showAttackerPositions && kill.attackerImagePosition) {
        const { x, y } = kill.attackerImagePosition
        const color = getKillColor(kill, selectedUser)
        const size = getKillSize(kill, selectedUser)
        
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(x, y, size, 0, 2 * Math.PI)
        ctx.fill()
        
        // Borde blanco para mejor visibilidad
        ctx.strokeStyle = "white"
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // Dibujar posición de la víctima
      if (showVictimPositions && kill.victimImagePosition) {
        const { x, y } = kill.victimImagePosition
        const color = getKillColor(kill, selectedUser)
        const size = getKillSize(kill, selectedUser)
        
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(x, y, size, 0, 2 * Math.PI)
        ctx.fill()
        
        // Borde blanco para mejor visibilidad
        ctx.strokeStyle = "white"
        ctx.lineWidth = 1
        ctx.stroke()
      }
    })
  }, [killsWithCoordinates, showAttackerPositions, showVictimPositions, selectedUser])

  // Manejar hover para mostrar información del kill
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // Buscar el kill más cercano al cursor
    let closestKill: Kill | null = null
    let minDistance = Infinity

    killsWithCoordinates.forEach((kill) => {
      if (showAttackerPositions && kill.attackerImagePosition) {
        const distance = Math.sqrt(
          Math.pow(x - kill.attackerImagePosition.x, 2) + 
          Math.pow(y - kill.attackerImagePosition.y, 2)
        )
        if (distance < 20 && distance < minDistance) {
          minDistance = distance
          closestKill = kill
        }
      }

      if (showVictimPositions && kill.victimImagePosition) {
        const distance = Math.sqrt(
          Math.pow(x - kill.victimImagePosition.x, 2) + 
          Math.pow(y - kill.victimImagePosition.y, 2)
        )
        if (distance < 20 && distance < minDistance) {
          minDistance = distance
          closestKill = kill
        }
      }
    })

    setHoveredKill(closestKill)
  }

  const handleMouseLeave = () => {
    setHoveredKill(null)
  }

  if (killsWithCoordinates.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Mapa de Kills - {mapConfig.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-white">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay datos de coordenadas disponibles para este mapa.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Mapa de Kills - {mapConfig.name}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={showAttackerPositions ? "default" : "outline"}
              size="sm"
              onClick={() => setShowAttackerPositions(!showAttackerPositions)}
              className="gap-1"
            >
              {showAttackerPositions ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              Atacantes
            </Button>
            <Button
              variant={showVictimPositions ? "default" : "outline"}
              size="sm"
              onClick={() => setShowVictimPositions(!showVictimPositions)}
              className="gap-1"
            >
              {showVictimPositions ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              Víctimas
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Leyenda */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-white">Buena jugada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-white">Mala jugada</span>
            </div>
            {selectedUser && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-white">Víctima</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                  <span className="text-white">Otros jugadores</span>
                </div>
              </>
            )}
          </div>

          {/* Mapa */}
          <div 
            ref={containerRef}
            className="relative border border-border rounded-lg overflow-hidden bg-gray-900"
            style={{ aspectRatio: "1/1" }}
          >
            {/* Imagen de fondo del mapa */}
            <img
              src={mapConfig.imagePath}
              alt={`Mapa ${mapConfig.name}`}
              className="absolute inset-0 w-full h-full object-cover opacity-30"
              onError={(e) => {
                // Si la imagen no existe, mostrar un placeholder
                e.currentTarget.style.display = 'none'
              }}
            />
            
            {/* Canvas para los puntos */}
            <canvas
              ref={canvasRef}
              width={mapConfig.imageDimensions.width}
              height={mapConfig.imageDimensions.height}
              className="absolute inset-0 w-full h-full cursor-pointer"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
            
            {/* Tooltip para información del kill */}
            {hoveredKill && (
              <div className="absolute top-4 left-4 bg-black/80 text-white p-3 rounded-lg border border-border max-w-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{hoveredKill.killer}</span>
                    <span className="text-gray-300">→</span>
                    <span className="font-semibold">{hoveredKill.victim}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {hoveredKill.weapon}
                    </Badge>
                    <Badge 
                      variant={hoveredKill.isGoodPlay ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {hoveredKill.isGoodPlay ? "Buena" : "Mala"}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-300">
                    Ronda {hoveredKill.round} • {hoveredKill.time}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-white">{killsWithCoordinates.length}</p>
              <p className="text-sm text-gray-300">Total Kills</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">
                {killsWithCoordinates.filter(k => k.isGoodPlay).length}
              </p>
              <p className="text-sm text-gray-300">Buenas Jugadas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400">
                {killsWithCoordinates.filter(k => !k.isGoodPlay).length}
              </p>
              <p className="text-sm text-gray-300">Malas Jugadas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-400">
                {new Set(killsWithCoordinates.map(k => k.round)).size}
              </p>
              <p className="text-sm text-gray-300">Rondas</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
