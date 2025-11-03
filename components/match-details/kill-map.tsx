"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Eye, EyeOff } from "lucide-react"
import type { Kill } from "@/lib/api"

interface KillMapProps {
  mapName: string
  kills: Kill[]
  selectedUser?: string
  className?: string
  showHeader?: boolean
  showAttackerPositions?: boolean
  showVictimPositions?: boolean
  onToggleAttackerPositions?: () => void
  onToggleVictimPositions?: () => void
}

interface MapData {
  pos_x: number
  pos_y: number
  scale: number
}

interface MapConfig {
  name: string
  displayName: string
  imagePath: string
  mapData?: MapData
  imageDimensions: {
    width: number
    height: number
  }
}

// Nombres de mapas para mostrar
const MAP_DISPLAY_NAMES: Record<string, string> = {
  de_mirage: "Mirage",
  de_dust2: "Dust2",
  de_inferno: "Inferno",
  de_cache: "Cache",
  de_overpass: "Overpass",
  de_nuke: "Nuke",
  de_train: "Train",
  de_vertigo: "Vertigo",
  de_ancient: "Ancient",
  de_anubis: "Anubis",
  de_cobblestone: "Cobblestone",
  cs_office: "Office",
  cs_italy: "Italy",
  ar_shoots: "Shoots",
  ar_baggage: "Baggage",
}

// Función para obtener la configuración del mapa
function getMapConfig(mapName: string, mapDataJson: Record<string, MapData> | null): MapConfig {
  const normalizedName = mapName.toLowerCase()
  const displayName = MAP_DISPLAY_NAMES[normalizedName] || normalizedName

  // Construir la ruta de la imagen PNG
  const imagePath = `/maps/${normalizedName}.png`

  // Obtener datos del mapa si están disponibles
  const mapData = mapDataJson?.[normalizedName]

  // Intentar obtener dimensiones de la imagen cuando se cargue
  // Por ahora usamos dimensiones estándar que se ajustarán cuando la imagen cargue
  return {
    name: normalizedName,
    displayName,
    imagePath,
    mapData,
    imageDimensions: {
      width: 1024, // Se ajustará cuando la imagen cargue
      height: 1024,
    },
  }
}

// Función para obtener el color del punto basado en el lado (CT o T)
function getKillColor(kill: Kill, isVictim = false): string {
  // Si es víctima, usar un color más oscuro o con X
  // Para atacantes: usar color según el lado
  if (isVictim) {
    // Víctimas: usar el color opuesto o un color distintivo
    if (kill.attackerSide === "ct") {
      // Si el atacante es CT, la víctima probablemente es T
      return "#ff8c42" // Naranja más oscuro para víctima T
    } else if (kill.attackerSide === "t") {
      // Si el atacante es T, la víctima probablemente es CT
      return "#4fc3f7" // Celeste más oscuro para víctima CT
    }
    return "#9e9e9e" // Gris para víctimas sin lado definido
  }
  // Para atacantes: usar color según el lado
  if (kill.attackerSide === "ct") {
    return "#64b5f6" // Celeste para CT
  } else if (kill.attackerSide === "t") {
    return "#ff9800" // Naranja para T
  }
  // Fallback: usar color basado en buena/mala jugada si no hay lado
  return kill.isGoodPlay ? "#10b981" : "#ef4444"
}

// Función para obtener el tamaño del punto
function getKillSize(kill: Kill, selectedUser?: string): number {
  if (!selectedUser) return 6

  if (kill.killer === selectedUser || kill.victim === selectedUser) {
    return 8 // Más grande si involucra al usuario seleccionado
  }

  return 4 // Más pequeño para otros
}

// Función para corregir coordenadas específicas del mapa Inferno
// PROBLEMA: Todas las coordenadas X de Inferno son 989 (mismo valor), causando que se vean todas acumuladas a la derecha
// SOLUCIÓN: Recalcular las coordenadas desde las coordenadas originales del juego si están disponibles
function adjustCoordinatesForMap(
  mapName: string,
  x: number,
  y: number,
  imageWidth: number,
  imageHeight: number,
  kill?: Kill,
  isVictim = false, // Indica si estamos ajustando posición de víctima o atacante
  mapData?: MapData, // Datos del mapa desde map-data.json
): { x: number; y: number } {
  const normalizedName = mapName.toLowerCase()

  // Mapa con coordenadas incorrectas que necesitan recalcularse
  const needsRecalculation = normalizedName === "de_inferno" || normalizedName === "de_nuke"

  if (needsRecalculation) {
    // Todas las coordenadas de imagen están en 989, 928, necesitamos recalcular desde las coordenadas originales
    // Usar las coordenadas correctas según si es atacante o víctima
    const gamePos = isVictim ? kill?.victimPosition : kill?.attackerPosition

    // Verificar si tenemos coordenadas válidas del juego
    const hasValidGamePos =
      gamePos &&
      typeof gamePos.x === "number" &&
      !isNaN(gamePos.x) &&
      isFinite(gamePos.x) &&
      typeof gamePos.y === "number" &&
      !isNaN(gamePos.y) &&
      isFinite(gamePos.y)

    if (hasValidGamePos && gamePos) {
      let minX: number, maxX: number, minY: number, maxY: number, margin: number

      if (normalizedName === "de_inferno") {
        // Parámetros específicos para Inferno
        minX = 46
        maxX = 2598
        minY = -349
        maxY = 3485
        margin = 0.75
      } else if (normalizedName === "de_nuke") {
        // Parámetros específicos para Nuke
        // Límites ampliados para cubrir todo el mapa (incluyendo áreas más al sur)
        minX = -719
        maxX = 1579
        minY = -2432
        maxY = 346
        // Nota: La tercera kill tiene Y=-1651, que está dentro del rango, así que el problema
        // puede ser otro. Mantener límites fijos para consistencia.
        margin = 0.55 // Zoom hacia adentro para que los puntos se vean más cerca entre sí
      } else {
        // Fallback (no debería llegar aquí)
        return { x, y }
      }

      // Calcular el centro del rango
      const centerGameX = (minX + maxX) / 2
      const centerGameY = (minY + maxY) / 2

      // Calcular el rango para determinar el scale
      const rangeX = maxX - minX
      const rangeY = maxY - minY
      const maxRange = Math.max(rangeX, rangeY) // Usar el mayor

      // Escalar para que quepa bien en la imagen
      const scale = maxRange / (Math.min(imageWidth, imageHeight) * margin)

      // Transformación:
      // 1. Centrar las coordenadas del juego
      const centeredX = gamePos.x - centerGameX
      const centeredY = gamePos.y - centerGameY

      // 2. Escalar
      const scaledX = centeredX / scale
      let scaledY = centeredY / scale

      // 3. Aplicar espejado para Nuke (necesita flip vertical)
      // En la imagen la víctima está arriba del atacante, pero debería estar abajo
      if (normalizedName === "de_nuke") {
        scaledY = -scaledY // Espejado vertical
      }

      // 4. Centrar en la imagen
      let centerX = imageWidth / 2
      let centerY = imageHeight / 2

      // 5. Aplicar offset específico para Nuke (mover hacia abajo y un poco a la derecha)
      if (normalizedName === "de_nuke") {
        centerX = centerX + imageWidth * 0.03 // Mover 3% hacia la derecha
        centerY = centerY + imageHeight * 0.05 // Mover 5% hacia abajo
      }

      const adjustedX = centerX + scaledX
      const adjustedY = centerY + scaledY

      // Log para debug (solo los primeros 3 kills)
      if (kill && kill.id <= 3) {
        const beforeFlip = { x: centeredX / scale, y: centeredY / scale }
        console.log(
          `[${normalizedName} Transform] Kill ${kill.id} ${isVictim ? "(victim)" : "(attacker)"} (${kill.position}):`,
          {
            gamePos: { x: gamePos.x, y: gamePos.y },
            centered: { x: centeredX, y: centeredY },
            scaledBeforeFlip: beforeFlip,
            scaledAfterFlip: { x: scaledX, y: scaledY },
            centerImage: { x: centerX, y: centerY },
            final: { x: adjustedX, y: adjustedY },
            scale,
            centerGame: { x: centerGameX, y: centerGameY },
            imageDimensions: { width: imageWidth, height: imageHeight },
          },
        )
      }

      return { x: adjustedX, y: adjustedY }
    }

    // Si no tenemos coordenadas originales del juego válidas, verificar si las coordenadas de imagen son razonables
    // Las coordenadas problemáticas suelen ser todas iguales (ej: 989, 928)
    // Si son diferentes y están dentro de un rango razonable, usarlas directamente
    const isProblematicCoords = normalizedName === "de_nuke" && ((x > 900 && x < 1000) || (y > 900 && y < 1000))

    if (!isProblematicCoords && x > 0 && x < imageWidth && y > 0 && y < imageHeight) {
      // Las coordenadas de imagen parecen válidas, usarlas directamente
      console.warn(
        `[${normalizedName} Transform] Kill ${kill?.id || "unknown"} ${isVictim ? "(victim)" : "(attacker)"}: Usando coordenadas de imagen directamente (no hay coordenadas del juego)`,
        { x, y },
      )
      return { x, y }
    }

    // Si las coordenadas son problemáticas y no tenemos coordenadas del juego, loggear y usar fallback
    console.warn(
      `[${normalizedName} Transform] Kill ${kill?.id || "unknown"} ${isVictim ? "(victim)" : "(attacker)"}: Sin coordenadas del juego válidas, usando fallback`,
      {
        imageCoords: { x, y },
        gamePos: gamePos ? { x: gamePos.x, y: gamePos.y } : null,
        killId: kill?.id,
      },
    )

    // Fallback: intentar una transformación simple pero mejor posicionada
    const adjustedX = x * 0.35 + imageWidth * 0.3
    const adjustedY = y * 0.5 + imageHeight * 0.25

    return { x: adjustedX, y: adjustedY }
  }

  // Para otros mapas (como de_mirage), las coordenadas de imagen ya vienen correctas del backend
  // No necesitamos aplicar transformación compleja, solo devolver las coordenadas originales
  // El map-data.json se mantiene para referencia futura pero no se usa en esta transformación
  return { x, y }
}

export function KillMap({
  mapName,
  kills,
  selectedUser,
  className = "",
  showHeader = true,
  showAttackerPositions: externalShowAttackerPositions,
  showVictimPositions: externalShowVictimPositions,
  onToggleAttackerPositions,
  onToggleVictimPositions,
}: KillMapProps) {
  const [internalShowAttackerPositions, setInternalShowAttackerPositions] = useState(true)
  const [internalShowVictimPositions, setInternalShowVictimPositions] = useState(true)

  const showAttackerPositions = externalShowAttackerPositions ?? internalShowAttackerPositions
  const showVictimPositions = externalShowVictimPositions ?? internalShowVictimPositions

  const toggleAttackerPositions = () => {
    if (onToggleAttackerPositions) {
      onToggleAttackerPositions()
    } else {
      setInternalShowAttackerPositions(!internalShowAttackerPositions)
    }
  }

  const toggleVictimPositions = () => {
    if (onToggleVictimPositions) {
      onToggleVictimPositions()
    } else {
      setInternalShowVictimPositions(!internalShowVictimPositions)
    }
  }

  const [mapDataJson, setMapDataJson] = useState<Record<string, MapData> | null>(null)
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number }>({
    width: 1024,
    height: 1024,
  })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // Cargar map-data.json al montar el componente
  useEffect(() => {
    fetch("/maps/map-data.json")
      .then((response) => response.json())
      .then((data) => setMapDataJson(data))
      .catch((error) => {
        console.warn("No se pudo cargar map-data.json:", error)
        setMapDataJson(null)
      })
  }, [])

  // Obtener configuración del mapa
  const mapConfig = getMapConfig(mapName, mapDataJson)

  // Manejar carga de imagen para obtener dimensiones reales
  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget
    setImageDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight,
    })
    imageRef.current = img
  }

  // Filtrar kills que tienen coordenadas de imagen
  const killsWithCoordinates = kills.filter((kill) => kill.attackerImagePosition || kill.victimImagePosition)

  // Log para debug
  useEffect(() => {
    const withCoords = kills.filter((kill) => kill.attackerImagePosition || kill.victimImagePosition)
    console.log(`[KillMap] Total kills: ${kills.length}, Kills with coordinates: ${withCoords.length}`)
    if (kills.length > 0 && withCoords.length === 0) {
      console.warn(`[KillMap] No kills have image coordinates! Sample kill:`, kills[0])
    }
  }, [kills])

  // Dibujar el mapa y los puntos
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || killsWithCoordinates.length === 0 || imageDimensions.width === 0) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Asegurar que el canvas tenga las dimensiones correctas
    const container = containerRef.current
    if (container) {
      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight
      canvas.width = containerWidth
      canvas.height = containerHeight
    }

    // Calcular la escala para ajustar las coordenadas de imagen al tamaño del canvas
    const scaleX = canvas.width / imageDimensions.width
    const scaleY = canvas.height / imageDimensions.height

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Dibujar cada kill
    killsWithCoordinates.forEach((kill) => {
      // Dibujar posición del atacante
      if (showAttackerPositions && kill.attackerImagePosition) {
        let { x, y } = kill.attackerImagePosition
        // Aplicar corrección específica del mapa (ej: Inferno)
        const adjusted = adjustCoordinatesForMap(
          mapName,
          x,
          y,
          imageDimensions.width,
          imageDimensions.height,
          kill,
          false,
          mapConfig.mapData,
        )
        x = adjusted.x
        y = adjusted.y
        // Escalar coordenadas al tamaño del canvas
        const scaledX = x * scaleX
        const scaledY = y * scaleY
        const color = getKillColor(kill, false) // false = atacante
        const size = getKillSize(kill, selectedUser) * Math.min(scaleX, scaleY)
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(scaledX, scaledY, size, 0, 2 * Math.PI)
        ctx.fill()
        // Borde blanco para mejor visibilidad
        ctx.strokeStyle = "white"
        ctx.lineWidth = 2
        ctx.stroke()
      }

      // Dibujar posición de la víctima (con X)
      if (showVictimPositions && kill.victimImagePosition) {
        let { x, y } = kill.victimImagePosition
        // Aplicar corrección específica del mapa (ej: Inferno)
        const adjusted = adjustCoordinatesForMap(
          mapName,
          x,
          y,
          imageDimensions.width,
          imageDimensions.height,
          kill,
          true,
          mapConfig.mapData,
        )
        x = adjusted.x
        y = adjusted.y
        // Escalar coordenadas al tamaño del canvas
        const scaledX = x * scaleX
        const scaledY = y * scaleY
        const color = getKillColor(kill, true) // true = víctima
        const size = getKillSize(kill, selectedUser) * Math.min(scaleX, scaleY)
        // Dibujar círculo de la víctima
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(scaledX, scaledY, size, 0, 2 * Math.PI)
        ctx.fill()
        // Borde blanco para mejor visibilidad
        ctx.strokeStyle = "white"
        ctx.lineWidth = 2
        ctx.stroke()
        // Dibujar X sobre la víctima
        ctx.strokeStyle = "white"
        ctx.lineWidth = 2
        const xSize = size * 0.6 // Tamaño de la X (60% del radio del círculo)
        ctx.beginPath()
        // Línea diagonal 1: \
        ctx.moveTo(scaledX - xSize, scaledY - xSize)
        ctx.lineTo(scaledX + xSize, scaledY + xSize)
        // Línea diagonal 2: /
        ctx.moveTo(scaledX + xSize, scaledY - xSize)
        ctx.lineTo(scaledX - xSize, scaledY + xSize)
        ctx.stroke()
      }
    })
  }, [killsWithCoordinates, showAttackerPositions, showVictimPositions, selectedUser, imageDimensions])

  // Manejar hover para mostrar información del kill
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || imageDimensions.width === 0) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // Convertir coordenadas del canvas a coordenadas de imagen originales
    const scaleX = imageDimensions.width / canvas.width
    const scaleY = imageDimensions.height / canvas.height
    const imageX = x * scaleX
    const imageY = y * scaleY

    // Buscar el kill más cercano al cursor
    let closestKill: Kill | null = null
    let minDistance = Number.POSITIVE_INFINITY
    const hoverRadius = 20 * Math.min(scaleX, scaleY) // Ajustar radio según escala

    killsWithCoordinates.forEach((kill) => {
      if (showAttackerPositions && kill.attackerImagePosition) {
        const adjusted = adjustCoordinatesForMap(
          mapName,
          kill.attackerImagePosition.x,
          kill.attackerImagePosition.y,
          imageDimensions.width,
          imageDimensions.height,
          kill,
          false, // false = atacante
          mapConfig.mapData,
        )
        const distance = Math.sqrt(Math.pow(imageX - adjusted.x, 2) + Math.pow(imageY - adjusted.y, 2))
        if (distance < hoverRadius && distance < minDistance) {
          minDistance = distance
          closestKill = kill
        }
      }

      if (showVictimPositions && kill.victimImagePosition) {
        const adjusted = adjustCoordinatesForMap(
          mapName,
          kill.victimImagePosition.x,
          kill.victimImagePosition.y,
          imageDimensions.width,
          imageDimensions.height,
          kill,
          true, // true = víctima
          mapConfig.mapData,
        )
        const distance = Math.sqrt(Math.pow(imageX - adjusted.x, 2) + Math.pow(imageY - adjusted.y, 2))
        if (distance < hoverRadius && distance < minDistance) {
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

  const [hoveredKill, setHoveredKill] = useState<Kill | null>(null)

  if (killsWithCoordinates.length === 0) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Mapa de Kills - {mapConfig.displayName}
            </CardTitle>
          </CardHeader>
        )}
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
      {showHeader && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Mapa de Kills - {mapConfig.displayName}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        {showHeader && (
          <div className="flex justify-between gap-6 mb-4 items-center">
            {/* Left side: Statistics */}
            <div className="grid grid-cols-3 gap-4 text-center flex-1">
              <div>
                <p className="text-2xl font-bold text-white">{killsWithCoordinates.length}</p>
                <p className="text-sm text-gray-300">Total Kills</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-400">
                  {killsWithCoordinates.filter((k) => k.isGoodPlay).length}
                </p>
                <p className="text-sm text-gray-300">Buenas Jugadas</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-400">
                  {killsWithCoordinates.filter((k) => !k.isGoodPlay).length}
                </p>
                <p className="text-sm text-gray-300">Malas Jugadas</p>
              </div>
            </div>

            {/* Right side: Buttons and legend */}
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  variant={showAttackerPositions ? "default" : "outline"}
                  size="sm"
                  onClick={toggleAttackerPositions}
                  className="gap-1"
                >
                  {showAttackerPositions ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  Atacantes
                </Button>
                <Button
                  variant={showVictimPositions ? "default" : "outline"}
                  size="sm"
                  onClick={toggleVictimPositions}
                  className="gap-1"
                >
                  {showVictimPositions ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  Víctimas
                </Button>
              </div>

              {/* Leyenda de colores */}
              <div className="flex gap-3 items-center text-xs bg-black/40 px-2 py-1 rounded">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#64b5f6" }}></div>
                  <span className="text-gray-300">CT</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ff9800" }}></div>
                  <span className="text-gray-300">T</span>
                </div>
                <div className="flex items-center gap-1">
                  <div
                    className="w-3 h-3 rounded-full border border-white"
                    style={{ backgroundColor: "#4fc3f7" }}
                  ></div>
                  <span className="text-white text-[10px]">X</span>
                  <span className="text-gray-300">Víctima</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mapa */}
        <div
          ref={containerRef}
          className="relative border border-border rounded-lg overflow-hidden bg-gray-900"
          style={{ aspectRatio: "1/1" }}
        >
          {/* Imagen de fondo del mapa */}
          <img
            ref={imageRef}
            src={mapConfig.imagePath || "/placeholder.svg"}
            alt={`Mapa ${mapConfig.displayName}`}
            className="absolute inset-0 w-full h-full object-cover opacity-30"
            onLoad={handleImageLoad}
            onError={(e) => {
              // Si la imagen no existe, mostrar un placeholder
              console.warn(`No se pudo cargar la imagen del mapa: ${mapConfig.imagePath}`)
              e.currentTarget.style.display = "none"
            }}
          />

          {/* Canvas para los puntos */}
          <canvas
            ref={canvasRef}
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
                  <Badge variant={hoveredKill.isGoodPlay ? "default" : "destructive"} className="text-xs">
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
      </CardContent>
    </Card>
  )
}
