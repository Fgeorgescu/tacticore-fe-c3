"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Play, Clock, Target, Skull, TrendingUp, TrendingDown, Users, Trophy, Crosshair } from "lucide-react"

// Mock data for matches
const mockMatches = [
  {
    id: "1",
    fileName: "dust2_ranked_2024.dem",
    hasVideo: true,
    map: "Dust2",
    gameType: "Ranked",
    kills: 24,
    deaths: 18,
    goodPlays: 8,
    badPlays: 3,
    duration: "32:45",
    score: 8.5,
    date: "2024-01-15",
  },
  {
    id: "2",
    fileName: "mirage_casual_2024.dem",
    hasVideo: false,
    map: "Mirage",
    gameType: "Casual",
    kills: 16,
    deaths: 22,
    goodPlays: 4,
    badPlays: 7,
    duration: "28:12",
    score: 6.2,
    date: "2024-01-14",
  },
  {
    id: "3",
    fileName: "inferno_training_2024.dem",
    hasVideo: true,
    map: "Inferno",
    gameType: "Entrenamiento",
    kills: 31,
    deaths: 12,
    goodPlays: 12,
    badPlays: 2,
    duration: "25:30",
    score: 9.1,
    date: "2024-01-13",
  },
]

interface DashboardProps {
  onViewDetails: (matchId: string) => void
}

export function Dashboard({ onViewDetails }: DashboardProps) {
  // Calculate aggregate statistics
  const totalMatches = mockMatches.length
  const totalKills = mockMatches.reduce((sum, match) => sum + match.kills, 0)
  const totalDeaths = mockMatches.reduce((sum, match) => sum + match.deaths, 0)
  const totalGoodPlays = mockMatches.reduce((sum, match) => sum + match.goodPlays, 0)
  const totalBadPlays = mockMatches.reduce((sum, match) => sum + match.badPlays, 0)
  const averageScore = mockMatches.reduce((sum, match) => sum + match.score, 0) / totalMatches
  const kdr = totalKills / totalDeaths

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-400"
    if (score >= 6) return "text-yellow-400"
    return "text-red-400"
  }

  const getGameTypeBadge = (type: string) => {
    const variants = {
      Ranked: "bg-red-500/20 text-red-400 border-red-500/30",
      Casual: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      Entrenamiento: "bg-green-500/20 text-green-400 border-green-500/30",
      Otros: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    }
    return variants[type as keyof typeof variants] || variants["Otros"]
  }

  return (
    <div className="space-y-6">
      {/* Header Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs font-medium text-white">Total Partidas</p>
              <p className="text-lg font-bold">{totalMatches}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Trophy className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs font-medium text-white">K/D Ratio</p>
              <p className="text-lg font-bold text-primary">{kdr.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Target className="h-5 w-5 text-green-400" />
            <div>
              <p className="text-xs font-medium text-white">Total Kills</p>
              <p className="text-lg font-bold text-green-400">{totalKills}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Skull className="h-5 w-5 text-red-400" />
            <div>
              <p className="text-xs font-medium text-white">Total Muertes</p>
              <p className="text-lg font-bold text-red-400">{totalDeaths}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-green-400" />
            <div>
              <p className="text-xs font-medium text-white">Buenas Jugadas</p>
              <p className="text-lg font-bold text-green-400">{totalGoodPlays}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Crosshair className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs font-medium text-white">Puntaje Promedio</p>
              <p className={`text-lg font-bold ${getScoreColor(averageScore)}`}>{averageScore.toFixed(1)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Matches List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold font-heading">Partidas Recientes</h2>

        <div className="grid gap-4">
          {mockMatches.map((match) => (
            <Card key={match.id} className="hover:bg-card/80 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <span className="font-medium">{match.fileName}</span>
                      {match.hasVideo && (
                        <Badge variant="secondary" className="gap-1">
                          <Play className="h-3 w-3" />
                          Video
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <span className="text-white">Mapa:</span>
                        <span className="font-medium">{match.map}</span>
                      </div>

                      <Badge className={getGameTypeBadge(match.gameType)}>{match.gameType}</Badge>

                      <div className="flex items-center gap-1">
                        <Target className="h-4 w-4 text-green-400" />
                        <span className="text-green-400">{match.kills}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Skull className="h-4 w-4 text-red-400" />
                        <span className="text-red-400">{match.deaths}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-green-400" />
                        <span className="text-green-400">{match.goodPlays}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <TrendingDown className="h-4 w-4 text-red-400" />
                        <span className="text-red-400">{match.badPlays}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{match.duration}</span>
                      </div>

                      <div className={`font-bold ${getScoreColor(match.score)}`}>{match.score}/10</div>
                    </div>

                    <Button variant="outline" size="sm" onClick={() => onViewDetails(match.id)} className="gap-2">
                      <Eye className="h-4 w-4" />
                      Detalles
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
