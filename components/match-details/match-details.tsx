"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { KillMap } from "./kill-map"

interface MatchDetailsProps {
  matchId: string
  finalScore?: {
    team1: number
    team2: number
  }
  totalKills?: number
  goodPlays?: number
  badPlays?: number
}

export function MatchDetails({
  matchId,
  finalScore = { team1: 13, team2: 10 },
  totalKills = 45,
  goodPlays = 12,
  badPlays = 3,
}: MatchDetailsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Estadísticas de la Partida</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Puntaje Final */}
          <div className="mb-6 text-center">
            <div className="text-sm text-muted-foreground mb-2">Puntaje Final</div>
            <div className="text-4xl font-bold">
              {finalScore.team1} - {finalScore.team2}
            </div>
          </div>

          <div className="mx-auto max-w-2xl">
            <KillMap matchId={matchId} totalKills={totalKills} goodPlays={goodPlays} badPlays={badPlays} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
