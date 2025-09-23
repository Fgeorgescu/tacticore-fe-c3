"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Play, Clock, Target, Skull, TrendingUp, TrendingDown, Users, Trophy, Crosshair, Loader2, Calendar } from "lucide-react"
import { useApi } from "@/hooks/useApi"
import { useUser } from "@/contexts/UserContext"
import { apiService, Match, DashboardStats } from "@/lib/api"
import { UserSelector } from "@/components/ui/user-selector"

interface DashboardProps {
  onViewDetails: (matchId: string) => void
}

export function Dashboard({ onViewDetails }: DashboardProps) {
  const { selectedUser } = useUser();
  
  // Fetch matches and dashboard stats - se actualizan automáticamente cuando cambia selectedUser
  const { data: matches, loading: matchesLoading, error: matchesError, refetch: refetchMatches } = useApi(
    () => apiService.getMatches(selectedUser.value),
    [selectedUser.value]
  );

  const { data: stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useApi(
    () => apiService.getDashboardStats(selectedUser.value),
    [selectedUser.value]
  );

  // Función para actualizar ambos datos
  const handleRefresh = () => {
    refetchMatches()
    refetchStats()
  }

  // Loading state
  if (matchesLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-white">Cargando datos...</span>
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
          <p className="text-sm text-white">
            {matchesError || statsError}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={handleRefresh}
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

  // Función para formatear fecha relativa
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

    if (diffInDays > 0) {
      return `hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
    } else if (diffInHours > 0) {
      return `hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    } else if (diffInMinutes > 0) {
      return `hace ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
    } else {
      return 'hace unos momentos';
    }
  }

  // Ordenar partidas por fecha (más recientes primero)
  const sortedMatches = [...matchesData].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="space-y-6">
      {/* User Selector */}
      <div className="flex justify-end">
        <UserSelector />
      </div>
      
      {/* Header Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-card-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Total Partidas</p>
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
                <p className="text-sm font-medium text-white">Total Kills</p>
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
                <p className="text-sm font-medium text-white">K/D Ratio</p>
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
                <p className="text-sm font-medium text-white">Promedio Score</p>
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
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Actualizar
          </Button>
        </div>

        {matchesData.length === 0 ? (
          <Card className="bg-card/50 border-card-border">
            <CardContent className="p-8 text-center">
              <Trophy className="h-12 w-12 text-white mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No hay partidas</h3>
              <p className="text-white">Sube tu primera partida para comenzar a analizar tu rendimiento.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sortedMatches.map((match) => (
              <Card key={match.id} className="bg-card/50 border-card-border hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    {/* Información principal */}
                    <div className="flex items-center gap-4 flex-1">
                      {/* Indicador de tiempo */}
                      <div className="flex flex-col items-center min-w-[80px]">
                        <Calendar className="h-4 w-4 text-white mb-1" />
                        <span className="text-xs text-white text-center">{getRelativeTime(match.date)}</span>
                      </div>

                      {/* Información de la partida */}
                      <div className="flex-1">
                        <div className="flex items-center gap-8">
                          {/* Nombre y badges */}
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-foreground">{match.fileName}</h3>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={getGameTypeBadge(match.gameType)}>
                                {match.gameType}
                              </Badge>
                              <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                {match.map}
                              </Badge>
                              {match.hasVideo && (
                                <Play className="h-4 w-4 text-primary" />
                              )}
                            </div>
                          </div>

                          {/* Estadísticas en línea */}
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Target className="h-4 w-4 text-green-400" />
                              <span className="text-foreground">{match.kills}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Skull className="h-4 w-4 text-red-400" />
                              <span className="text-foreground">{match.deaths}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-4 w-4 text-green-400" />
                              <span className="text-foreground">{match.goodPlays}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingDown className="h-4 w-4 text-red-400" />
                              <span className="text-foreground">{match.badPlays}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-white" />
                              <span className="text-white">{match.duration}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Score y botón de acción */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className={`text-lg font-bold ${getScoreColor(match.score)}`}>
                          {match.score.toFixed(1)}
                        </div>
                        <div className="text-xs text-white">Score</div>
                      </div>
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
