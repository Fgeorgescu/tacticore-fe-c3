"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { Kill } from "@/lib/api"

interface GlobalKillMapProps {
  mapName: string
  kills: Kill[]
  selectedUser: string
  className?: string
}

export function GlobalKillMap({ mapName, kills, selectedUser, className = "" }: GlobalKillMapProps) {
  const [showAttacker, setShowAttacker] = useState(true)
  const [showVictim, setShowVictim] = useState(true)

  // Filtrar kills según el usuario seleccionado
  const filteredKills = kills.filter((kill) => {
    if (selectedUser === "all") return true
    return kill.killer === selectedUser || kill.victim === selectedUser
  })

  // Filtrar kills con coordenadas válidas
  const killsWithCoordinates = filteredKills.filter(
    (kill) =>
      kill.killerPosition &&
      kill.victimPosition &&
      kill.killerPosition.x !== undefined &&
      kill.killerPosition.y !== undefined &&
      kill.victimPosition.x !== undefined &&
      kill.victimPosition.y !== undefined,
  )

  // Normalizar el nombre del mapa
  const normalizedMapName = mapName.toLowerCase().replace(/^de_/, "")

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-white">Mapa de Kills</h3>

          {/* Controls: Atacante/Víctima buttons and legend */}
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <Button
                variant={showAttacker ? "default" : "outline"}
                size="sm"
                onClick={() => setShowAttacker(!showAttacker)}
              >
                Atacante
              </Button>
              <Button variant={showVictim ? "default" : "outline"} size="sm" onClick={() => setShowVictim(!showVictim)}>
                Víctima
              </Button>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-blue-400" />
                <span className="text-white">CT</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <span className="text-white">T</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500" />
                <span className="text-white">Víctima</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Map container */}
        <div className="relative w-full aspect-square bg-gray-900 rounded-lg overflow-hidden">
          <img
            src={`/maps/${normalizedMapName}.png`}
            alt={`Mapa ${mapName}`}
            className="w-full h-full object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = "/cs2-map-overview.jpg"
            }}
          />

          {/* Render kills on map */}
          {killsWithCoordinates.map((kill) => {
            const isUserKiller = kill.killer === selectedUser
            const isUserVictim = kill.victim === selectedUser

            return (
              <React.Fragment key={kill.id}>
                {/* Atacante (Killer) */}
                {showAttacker && kill.killerPosition && (
                  <div
                    className="absolute w-3 h-3 rounded-full transform -translate-x-1/2 -translate-y-1/2 border-2 border-white shadow-lg"
                    style={{
                      left: `${kill.killerPosition.x}%`,
                      top: `${kill.killerPosition.y}%`,
                      backgroundColor: kill.killerTeam === "CT" ? "#60a5fa" : "#facc15",
                      opacity: isUserKiller ? 1 : 0.6,
                      zIndex: isUserKiller ? 20 : 10,
                    }}
                    title={`${kill.killer} (${kill.killerTeam})`}
                  />
                )}

                {/* Víctima (Victim) */}
                {showVictim && kill.victimPosition && (
                  <div
                    className="absolute w-3 h-3 transform -translate-x-1/2 -translate-y-1/2 border-2 border-white shadow-lg"
                    style={{
                      left: `${kill.victimPosition.x}%`,
                      top: `${kill.victimPosition.y}%`,
                      backgroundColor: "#ef4444",
                      opacity: isUserVictim ? 1 : 0.6,
                      zIndex: isUserVictim ? 20 : 10,
                    }}
                    title={`${kill.victim} (${kill.victimTeam})`}
                  />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
