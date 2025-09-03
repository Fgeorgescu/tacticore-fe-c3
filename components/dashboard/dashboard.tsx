"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Play, Clock, Target, Skull, TrendingUp, TrendingDown, Users, Trophy, Crosshair, Loader2 } from "lucide-react"
import { useApi } from "@/hooks/useApi"
import { apiService, Match, DashboardStats } from "@/lib/api"

interface DashboardProps {
  onViewDetails: (matchId: string) => void
}

export function Dashboard({ onViewDetails }: DashboardProps) {
  // Fetch matches and dashboard stats
  const { data: matches, loading: matchesLoading, error: matchesError, refetch: refetchMatches } = useApi(
    () => apiService.getMatches(),
    []
  );

  const { data: stats, loading: statsLoading, error: statsError } = useApi(
    () => apiService.getDashboardStats(),
    []
  );

  // Loading state
  if (matchesLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Cargando datos...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (matchesError || statsError) {
    return (
      <div className="space-y-6">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <h3 className="text-destructive font-semibold mb-2">Error al cargar datos</h3>
          <p className="text-sm text-muted-foreground">
            {matchesError || statsError}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => {
              refetchMatches();
            }}
          >
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  // Use real data or fallback to empty arrays/objects
  const matchesData = matches || [];
  const statsData = stats || {
    totalMatches: 0,
    totalKills: 0,
    totalDeaths: 0,
    totalGoodPlays: 0,
    totalBadPlays: 0,
    averageScore: 0,
    kdr: 0,
  };

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-card-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Partidas</p>
                <p className="text-2xl font-bold text-foreground">{statsData.totalMatches}</p>
              </div>
              <Trophy className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-card-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Kills</p>
                <p className="text-2xl font-bold text-foreground">{statsData.totalKills}</p>
              </div>
              <Target className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-card-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">K/D Ratio</p>
                <p className="text-2xl font-bold text-foreground">{statsData.kdr.toFixed(2)}</p>
              </div>
              <Crosshair className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-card-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Promedio Score</p>
                <p className="text-2xl font-bold text-foreground">{statsData.averageScore.toFixed(1)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Matches List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Partidas Recientes</h2>
          <Button variant="outline" size="sm" onClick={refetchMatches}>
            Actualizar
          </Button>
        </div>

        {matchesData.length === 0 ? (
          <Card className="bg-card/50 border-card-border">
            <CardContent className="p-8 text-center">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No hay partidas</h3>
              <p className="text-muted-foreground">Sube tu primera partida para comenzar a analizar tu rendimiento.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {matchesData.map((match) => (
              <Card key={match.id} className="bg-card/50 border-card-border hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground truncate">{match.fileName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={getGameTypeBadge(match.gameType)}>
                          {match.gameType}
                        </Badge>
                        <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                          {match.map}
                        </Badge>
                      </div>
                    </div>
                    {match.hasVideo && (
                      <Play className="h-4 w-4 text-primary" />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-green-400" />
                      <span className="text-sm text-foreground">{match.kills} kills</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Skull className="h-4 w-4 text-red-400" />
                      <span className="text-sm text-foreground">{match.deaths} deaths</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-400" />
                      <span className="text-sm text-foreground">{match.goodPlays} buenas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-400" />
                      <span className="text-sm text-foreground">{match.badPlays} malas</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{match.duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${getScoreColor(match.score)}`}>
                        {match.score.toFixed(1)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(match.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
