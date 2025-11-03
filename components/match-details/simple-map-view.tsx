"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import type { Kill } from "@/lib/api"

interface SimpleMapViewProps {
  mapName: string
  kills: Kill[]
  selectedUser?: string
  showAttackerPositions?: boolean
  showVictimPositions?: boolean
  className?: string
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
  const imagePath = `/maps/${normalizedName}.png`
  const mapData = mapDataJson?.[normalizedName]

  return {
    name: normalizedName,
    displayName,
    imagePath,
    mapData,
    imageDimensions: {
      width: 1024,
      height: 1024,
    },
  }
}

// Función para obtener el color del punto basado en el lado (CT o T)
function getKillColor(kill: Kill, isVictim = false): string {
  if (isVictim) {
    if (kill.attackerSide === "ct") {
      return "#ff8c42"
    } else if (kill.attackerSide === "t") {
      return "#4fc3f7"
    }
    return "#9e9e9e"
  }

  if (kill.attackerSide === "ct") {
    return "#64b5f6"
  } else if (kill.attackerSide === "t") {
    return "#ff9800"
  }

  return kill.isGoodPlay ? "#10b981" : "#ef4444"
}

// Función para obtener el tamaño del punto
function getKillSize(kill: Kill, selectedUser?: string): number {
  if (!selectedUser) return 6

  if (kill.killer === selectedUser || kill.victim === selectedUser) {
    return 8
  }

  return 4
}

// Función para ajustar coordenadas específicas del mapa
function adjustCoordinatesForMap(
  mapName: string,
  x: number,
  y: number,
  imageWidth: number,
  imageHeight: number,
  kill?: Kill,
  isVictim = false,
  mapData?: MapData,
): { x: number; y: number } {
  const normalizedName = mapName.toLowerCase()
  const needsRecalculation = normalizedName === "de_inferno" || normalizedName === "de_nuke"

  if (needsRecalculation) {
    const gamePos = isVictim ? kill?.victimPosition : kill?.attackerPosition
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
        minX = 46
        maxX = 2598
        minY = -349
        maxY = 3485
        margin = 0.75
      } else if (normalizedName === "de_nuke") {
        minX = -719
        maxX = 1579
        minY = -2432
        maxY = 346
        margin = 0.55
      } else {
        return { x, y }
      }

      const centerGameX = (minX + maxX) / 2
      const centerGameY = (minY + maxY) / 2
      const rangeX = maxX - minX
      const rangeY = maxY - minY
      const maxRange = Math.max(rangeX, rangeY)
      const scale = maxRange / (Math.min(imageWidth, imageHeight) * margin)

      const centeredX = gamePos.x - centerGameX
      const centeredY = gamePos.y - centerGameY
      const scaledX = centeredX / scale
      let scaledY = centeredY / scale

      if (normalizedName === "de_nuke") {
        scaledY = -scaledY
      }

      let centerX = imageWidth / 2
      let centerY = imageHeight / 2

      if (normalizedName === "de_nuke") {
        centerX = centerX + imageWidth * 0.03
        centerY = centerY + imageHeight * 0.05
      }

      const adjustedX = centerX + scaledX
      const adjustedY = centerY + scaledY

      return { x: adjustedX, y: adjustedY }
    }

    const isProblematicCoords = normalizedName === "de_nuke" && ((x > 900 && x < 1000) || (y > 900 && y < 1000))

    if (!isProblematicCoords && x > 0 && x < imageWidth && y > 0 && y < imageHeight) {
      return { x, y }
    }

    const adjustedX = x * 0.35 + imageWidth * 0.3
    const adjustedY = y * 0.5 + imageHeight * 0.25

    return { x: adjustedX, y: adjustedY }
  }

  return { x, y }
}

export function SimpleMapView({
  mapName,
  kills,
  selectedUser,
  showAttackerPositions = true,
  showVictimPositions = true,
  className = "",
}: SimpleMapViewProps) {
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
      .catch(() => {
        setMapDataJson(null)
      })
  }, [])

  const mapConfig = getMapConfig(mapName, mapDataJson)

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget
    setImageDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight,
    })
  }

  const killsWithCoordinates = kills.filter((kill) => kill.attackerImagePosition || kill.victimImagePosition)

  // Dibujar el mapa y los puntos
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || killsWithCoordinates.length === 0 || imageDimensions.width === 0) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const container = containerRef.current
    if (container) {
      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight
      canvas.width = containerWidth
      canvas.height = containerHeight
    }

    const scaleX = canvas.width / imageDimensions.width
    const scaleY = canvas.height / imageDimensions.height

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Dibujar cada kill
    killsWithCoordinates.forEach((kill) => {
      // Dibujar posición del atacante
      if (showAttackerPositions && kill.attackerImagePosition) {
        let { x, y } = kill.attackerImagePosition
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
        const scaledX = x * scaleX
        const scaledY = y * scaleY
        const color = getKillColor(kill, false)
        const size = getKillSize(kill, selectedUser) * Math.min(scaleX, scaleY)

        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(scaledX, scaledY, size, 0, 2 * Math.PI)
        ctx.fill()

        ctx.strokeStyle = "white"
        ctx.lineWidth = 2
        ctx.stroke()
      }

      // Dibujar posición de la víctima (con X)
      if (showVictimPositions && kill.victimImagePosition) {
        let { x, y } = kill.victimImagePosition
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
        const scaledX = x * scaleX
        const scaledY = y * scaleY
        const color = getKillColor(kill, true)
        const size = getKillSize(kill, selectedUser) * Math.min(scaleX, scaleY)

        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(scaledX, scaledY, size, 0, 2 * Math.PI)
        ctx.fill()

        ctx.strokeStyle = "white"
        ctx.lineWidth = 2
        ctx.stroke()

        // Dibujar X sobre la víctima
        ctx.strokeStyle = "white"
        ctx.lineWidth = 2
        const xSize = size * 0.6
        ctx.beginPath()
        ctx.moveTo(scaledX - xSize, scaledY - xSize)
        ctx.lineTo(scaledX + xSize, scaledY + xSize)
        ctx.moveTo(scaledX + xSize, scaledY - xSize)
        ctx.lineTo(scaledX - xSize, scaledY + xSize)
        ctx.stroke()
      }
    })
  }, [
    killsWithCoordinates,
    showAttackerPositions,
    showVictimPositions,
    selectedUser,
    imageDimensions,
    mapName,
    mapConfig.mapData,
  ])

  if (killsWithCoordinates.length === 0) {
    return (
      <div className={`text-center py-8 text-white ${className}`}>
        <p className="text-sm">No hay datos de coordenadas disponibles para este mapa.</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`relative border border-border rounded-lg overflow-hidden bg-gray-900 ${className}`}
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
          e.currentTarget.style.display = "none"
        }}
      />

      {/* Canvas para los puntos */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  )
}
