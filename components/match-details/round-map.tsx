"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Target, Eye, EyeOff, ChevronLeft, ChevronRight } from "lucide-react"
import { KillMap } from "./kill-map"
import { Kill } from "@/lib/api"

interface RoundMapProps {
  mapName: string
  killsByRound: Array<[number, Kill[]]>
  selectedUser?: string
  className?: string
}

export function RoundMap({ mapName, killsByRound, selectedUser, className = "" }: RoundMapProps) {
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0)
  const [currentKillIndex, setCurrentKillIndex] = useState<number | null>(null) // null = mostrar todas, número = mostrar solo esa kill
  const [showAttackerPositions, setShowAttackerPositions] = useState(true)
  const [showVictimPositions, setShowVictimPositions] = useState(true)

  if (killsByRound.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Mapa por Rondas - {mapName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-white">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay datos de rondas disponibles.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentRound = killsByRound[currentRoundIndex]
  const currentRoundNumber = currentRound[0]
  const currentRoundKills = currentRound[1]

  // Reset kill index cuando cambia la ronda
  React.useEffect(() => {
    setCurrentKillIndex(null)
  }, [currentRoundIndex])

  const goToPreviousRound = () => {
    setCurrentRoundIndex(Math.max(0, currentRoundIndex - 1))
  }

  const goToNextRound = () => {
    setCurrentRoundIndex(Math.min(killsByRound.length - 1, currentRoundIndex + 1))
  }

  const goToRound = (roundIndex: number) => {
    setCurrentRoundIndex(roundIndex)
  }

  // Navegación de kills individuales dentro de la ronda
  const goToPreviousKill = () => {
    if (currentKillIndex === null) {
      setCurrentKillIndex(currentRoundKillsWithCoords.length - 1)
    } else {
      setCurrentKillIndex(Math.max(0, currentKillIndex - 1))
    }
  }

  const goToNextKill = () => {
    if (currentKillIndex === null) {
      setCurrentKillIndex(0)
    } else {
      setCurrentKillIndex(Math.min(currentRoundKillsWithCoords.length - 1, currentKillIndex + 1))
    }
  }

  const goToKill = (killIndex: number | null) => {
    setCurrentKillIndex(killIndex)
  }

  const showAllKills = () => {
    setCurrentKillIndex(null)
  }

  // Filtrar kills que tienen coordenadas de imagen
  const killsWithCoordinates = currentRoundKills.filter(kill => 
    kill.attackerImagePosition || kill.victimImagePosition
  )

  // Kills ordenadas por tiempo (ya vienen ordenadas, pero por si acaso)
  const sortedRoundKills = [...currentRoundKills].sort((a, b) => a.time.localeCompare(b.time))
  const currentRoundKillsWithCoords = sortedRoundKills.filter(kill => 
    kill.attackerImagePosition || kill.victimImagePosition
  )

  // Determinar qué kills mostrar en el mapa
  const killsToDisplay = currentKillIndex === null 
    ? currentRoundKills  // Mostrar todas
    : currentRoundKillsWithCoords[currentKillIndex] 
      ? [currentRoundKillsWithCoords[currentKillIndex]]  // Mostrar solo la kill seleccionada
      : currentRoundKills  // Fallback: mostrar todas si el índice es inválido

  const currentKill = currentKillIndex !== null && currentRoundKillsWithCoords[currentKillIndex] 
    ? currentRoundKillsWithCoords[currentKillIndex] 
    : null

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Mapa por Rondas - {mapName}
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
          {/* Navegación de rondas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousRound}
                  disabled={currentRoundIndex === 0}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <span className="text-white font-medium">
                  Ronda {currentRoundNumber} ({currentRoundIndex + 1} de {killsByRound.length})
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextRound}
                  disabled={currentRoundIndex === killsByRound.length - 1}
                  className="gap-1"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Selector de ronda */}
              <div className="flex gap-1">
                {killsByRound.map(([roundNumber, roundKills], index) => (
                  <Button
                    key={roundNumber}
                    variant={index === currentRoundIndex ? "default" : "outline"}
                    size="sm"
                    onClick={() => goToRound(index)}
                    className="w-8 h-8 p-0"
                  >
                    {roundNumber}
                  </Button>
                ))}
              </div>
            </div>

            {/* Navegación de kills individuales dentro de la ronda */}
            {currentRoundKillsWithCoords.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-border">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousKill}
                    disabled={currentKillIndex !== null && currentKillIndex === 0}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Kill Anterior
                  </Button>
                  <span className="text-white font-medium">
                    {currentKillIndex === null 
                      ? `Todas las kills (${currentRoundKillsWithCoords.length} total)`
                      : `Kill ${currentKillIndex + 1} de ${currentRoundKillsWithCoords.length}`
                    }
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextKill}
                    disabled={currentKillIndex !== null && currentKillIndex === currentRoundKillsWithCoords.length - 1}
                    className="gap-1"
                  >
                    Kill Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant={currentKillIndex === null ? "default" : "outline"}
                    size="sm"
                    onClick={showAllKills}
                    className="text-xs"
                  >
                    Ver Todas
                  </Button>
                  
                  {/* Selector de kill individual */}
                  <div className="flex gap-1 max-w-xs overflow-x-auto">
                    {currentRoundKillsWithCoords.map((kill, index) => (
                      <Button
                        key={kill.id}
                        variant={currentKillIndex === index ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToKill(index)}
                        className="w-8 h-8 p-0 text-xs"
                        title={`${kill.killer} → ${kill.victim} (${kill.time})`}
                      >
                        {index + 1}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Información de la kill actual si está seleccionada */}
            {currentKill && (
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-foreground">{currentKill.killer}</span>
                    <span className="text-white">→</span>
                    <span className="text-foreground">{currentKill.victim}</span>
                    <Badge variant="outline" className="text-xs">
                      {currentKill.weapon}
                    </Badge>
                    <Badge 
                      variant={currentKill.isGoodPlay ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {currentKill.isGoodPlay ? "Buena" : "Mala"}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-300">
                    Ronda {currentKill.round} • {currentKill.time} • {currentKill.position}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Estadísticas de la ronda actual */}
          

          {/* Mapa de la ronda actual */}
          {killsWithCoordinates.length > 0 ? (
            <KillMap
              mapName={mapName}
              kills={killsToDisplay}
              selectedUser={selectedUser}
              className="w-full"
            />
          ) : (
            <div className="text-center py-8 text-white border border-border rounded-lg">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay datos de coordenadas para esta ronda.</p>
            </div>
          )}

          {/* Lista de kills de la ronda */}
          {currentRoundKills.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-lg font-semibold text-white">Kills de la Ronda {currentRoundNumber}</h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {currentRoundKills.map((kill) => (
                  <div
                    key={kill.id}
                    className={`flex items-center justify-between p-2 rounded border ${
                      kill.isGoodPlay
                        ? "bg-green-500/10 border-green-500/20"
                        : "bg-red-500/10 border-red-500/20"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{kill.killer}</span>
                      <span className="text-white">→</span>
                      <span className="text-foreground">{kill.victim}</span>
                      <Badge variant="outline" className="text-xs">
                        {kill.weapon}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white">{kill.time}</span>
                      <Badge 
                        variant={kill.isGoodPlay ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {kill.isGoodPlay ? "Buena" : "Mala"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
