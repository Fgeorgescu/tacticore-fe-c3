"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface KillMapProps {
  matchId: string
  totalKills?: number
  goodPlays?: number
  badPlays?: number
  mapImageUrl?: string
}

export function KillMap({
  matchId,
  totalKills = 0,
  goodPlays = 0,
  badPlays = 0,
  mapImageUrl = "/cs2-map-overview.jpg",
}: KillMapProps) {
  const [viewMode, setViewMode] = useState<"attacker" | "victim">("attacker")

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mapa de Kills</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          {/* Estadísticas a la izquierda */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{totalKills}</div>
              <div className="text-sm text-muted-foreground">Total Kills</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">{goodPlays}</div>
              <div className="text-sm text-muted-foreground">Buenas Jugadas</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-400">{badPlays}</div>
              <div className="text-sm text-muted-foreground">Malas Jugadas</div>
            </div>
          </div>

          {/* Controles y leyenda a la derecha */}
          <div className="flex flex-col gap-3">
            {/* Botones de vista */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === "attacker" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("attacker")}
              >
                Atacante
              </Button>
              <Button
                variant={viewMode === "victim" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("victim")}
              >
                Víctima
              </Button>
            </div>

            {/* Leyenda */}
            <div className="flex flex-col gap-1 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span>CT</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-orange-500" />
                <span>T</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-red-500">✕</div>
                <span>Víctima</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mapa */}
        <div className="relative mt-6 w-full overflow-hidden rounded-lg border">
          <Image
            src={mapImageUrl || "/placeholder.svg"}
            alt="Mapa de kills"
            width={600}
            height={400}
            className="h-auto w-full object-contain"
          />
        </div>
      </CardContent>
    </Card>
  )
}
