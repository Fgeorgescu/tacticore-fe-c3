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

  const goToPreviousRound = () => {
    setCurrentRoundIndex(Math.max(0, currentRoundIndex - 1))
  }

  const goToNextRound = () => {
    setCurrentRoundIndex(Math.min(killsByRound.length - 1, currentRoundIndex + 1))
  }

  const goToRound = (roundIndex: number) => {
    setCurrentRoundIndex(roundIndex)
  }

  // Filtrar kills que tienen coordenadas de imagen
  const killsWithCoordinates = currentRoundKills.filter(kill => 
    kill.attackerImagePosition || kill.victimImagePosition
  )

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

          {/* Estadísticas de la ronda actual */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xl font-bold text-white">{currentRoundKills.length}</p>
              <p className="text-sm text-gray-300">Total Kills</p>
            </div>
            <div>
              <p className="text-xl font-bold text-green-400">
                {currentRoundKills.filter(k => k.isGoodPlay).length}
              </p>
              <p className="text-sm text-gray-300">Buenas Jugadas</p>
            </div>
            <div>
              <p className="text-xl font-bold text-red-400">
                {currentRoundKills.filter(k => !k.isGoodPlay).length}
              </p>
              <p className="text-sm text-gray-300">Malas Jugadas</p>
            </div>
            <div>
              <p className="text-xl font-bold text-blue-400">
                {killsWithCoordinates.length}
              </p>
              <p className="text-sm text-gray-300">Con Coordenadas</p>
            </div>
          </div>

          {/* Mapa de la ronda actual */}
          {killsWithCoordinates.length > 0 ? (
            <KillMap
              mapName={mapName}
              kills={currentRoundKills}
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
