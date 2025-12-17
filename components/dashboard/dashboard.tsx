"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Eye,
  Play,
  Clock,
  Target,
  Skull,
  TrendingUp,
  TrendingDown,
  Trophy,
  Crosshair,
  Loader2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react"
import { useApi } from "@/hooks/useApi"
import { useUser } from "@/contexts/UserContext"
import { useUpload } from "@/contexts/UploadContext"
import { apiService } from "@/lib/api"
import { getRelativeTimeFromBackend } from "@/lib/dateUtils"
import { useState } from "react"

interface DashboardProps {
  onViewDetails: (matchId: string) => void
}

export function Dashboard({ onViewDetails }: DashboardProps) {
  const { selectedUser } = useUser()
  const { uploadingMatches } = useUpload()
  const [matchesPage, setMatchesPage] = useState(1)
  const MATCHES_PER_PAGE = 10

  // Fetch matches and dashboard stats - se actualizan automáticamente cuando cambia selectedUser
  const {
    data: matches,
    loading: matchesLoading,
    error: matchesError,
    refetch: refetchMatches,
  } = useApi(() => apiService.getMatches(selectedUser.value), [selectedUser.value])

  const {
    data: stats,
    loading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useApi(() => apiService.getDashboardStats(selectedUser.value), [selectedUser.value])

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
    )
  }

  // Error state
  if (matchesError || statsError) {
    return (
      <div className="space-y-6">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <h3 className="text-destructive font-semibold mb-2">Error al cargar datos</h3>
          <p className="text-sm text-white">{matchesError || statsError}</p>
          <Button variant="outline" size="sm" className="mt-2 bg-transparent" onClick={handleRefresh}>
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  // Use real data or fallback to empty arrays/objects
  const matchesData = matches || []
  const statsData =
    stats && typeof stats === "object" && "totalMatches" in stats
      ? stats
      : {
          totalMatches: 0,
          totalKills: 0,
          totalDeaths: 0,
          totalGoodPlays: 0,
          totalBadPlays: 0,
          averageScore: 0,
          kdr: 0,
        }

  const uploadingMatchesFromContext = uploadingMatches.filter((m) => m.status === "uploading")
  const processingMatchesFromContext = uploadingMatches.filter((m) => m.status === "processing")

  const uploadingMatchesFromBackend = matchesData.filter((m) => m.status === "uploading")
  const processingMatchesFromBackend = matchesData.filter((m) => m.status === "processing")

  const allUploadingMatches = [...uploadingMatchesFromContext, ...uploadingMatchesFromBackend]
  const allProcessingMatches = [...processingMatchesFromContext, ...processingMatchesFromBackend]

  const completedMatches = matchesData.filter((m) => m.status !== "processing" && m.status !== "uploading")

  console.log("[v0] Dashboard - Uploading matches from context:", uploadingMatchesFromContext.length)
  console.log("[v0] Dashboard - Processing matches from context:", processingMatchesFromContext.length)
  console.log("[v0] Dashboard - Total uploading matches:", allUploadingMatches.length)
  console.log("[v0] Dashboard - Total processing matches:", allProcessingMatches.length)

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

  // Función para formatear fecha relativa (maneja zonas horarias correctamente)
  const getRelativeTime = (dateString: string) => {
    return getRelativeTimeFromBackend(dateString)
  }

  // Ordenar partidas por fecha (más recientes primero)
  const sortedMatches = [...completedMatches].sort((a, b) => {
    const dateA = new Date(a.date + "Z") // Agregar 'Z' para UTC
    const dateB = new Date(b.date + "Z") // Agregar 'Z' para UTC
    return dateB.getTime() - dateA.getTime()
  })

  const totalMatchesPages = Math.ceil(sortedMatches.length / MATCHES_PER_PAGE)
  const paginatedMatches = sortedMatches.slice((matchesPage - 1) * MATCHES_PER_PAGE, matchesPage * MATCHES_PER_PAGE)

  return (
    <div className="space-y-6">
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

        {allUploadingMatches.length > 0 && (
          <Card className="bg-amber-500/10 border-amber-500/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="h-4 w-4 text-amber-400" />
                    <h3 className="font-semibold text-amber-400">
                      {allUploadingMatches.length === 1
                        ? "Subiendo archivo"
                        : `Subiendo ${allUploadingMatches.length} archivos`}
                    </h3>
                  </div>
                  <p className="text-sm text-amber-300 mb-3">
                    {allUploadingMatches.length === 1
                      ? "Tu archivo se está subiendo a S3"
                      : "Tus archivos se están subiendo a S3"}
                    . Este proceso puede tomar algunos minutos.
                  </p>
                  <div className="space-y-2">
                    {allUploadingMatches.map((match) => (
                      <div
                        key={match.id}
                        className="flex items-center justify-between bg-amber-500/5 rounded-lg p-3 border border-amber-500/20"
                      >
                        <div className="flex items-center gap-3">
                          <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                          <div>
                            <p className="text-sm font-medium text-amber-200">{match.fileName}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {match.map !== "Unknown" && (
                                <Badge
                                  variant="outline"
                                  className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs"
                                >
                                  {match.map}
                                </Badge>
                              )}
                              <span className="text-xs text-amber-300">{getRelativeTime(match.date)}</span>
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                          Subiendo...
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {allProcessingMatches.length > 0 && (
          <Card className="bg-blue-500/10 border-blue-500/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="h-4 w-4 text-blue-400" />
                    <h3 className="font-semibold text-blue-400">
                      {allProcessingMatches.length === 1
                        ? "Tienes una partida en proceso"
                        : `Tienes ${allProcessingMatches.length} partidas en proceso`}
                    </h3>
                  </div>
                  <p className="text-sm text-blue-300 mb-3">
                    Estamos analizando {allProcessingMatches.length === 1 ? "tu archivo" : "tus archivos"} DEM y
                    generando estadísticas. Esto puede tomar algunos minutos.
                  </p>
                  <div className="space-y-2">
                    {allProcessingMatches.map((match) => (
                      <div
                        key={match.id}
                        className="flex items-center justify-between bg-blue-500/5 rounded-lg p-3 border border-blue-500/20"
                      >
                        <div className="flex items-center gap-3">
                          <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                          <div>
                            <p className="text-sm font-medium text-blue-200">{match.fileName}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {match.map !== "Unknown" && (
                                <Badge
                                  variant="outline"
                                  className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs"
                                >
                                  {match.map}
                                </Badge>
                              )}
                              <span className="text-xs text-blue-300">{getRelativeTime(match.date)}</span>
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                          Procesando...
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {matchesData.length === 0 ? (
          <Card className="bg-card/50 border-card-border">
            <CardContent className="p-8 text-center">
              <Trophy className="h-12 w-12 text-white mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No hay partidas</h3>
              <p className="text-white">Sube tu primera partida para comenzar a analizar tu rendimiento.</p>
            </CardContent>
          </Card>
        ) : sortedMatches.length === 0 ? (
          <Card className="bg-card/50 border-card-border">
            <CardContent className="p-8 text-center">
              <Loader2 className="h-12 w-12 text-blue-400 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-semibold text-white mb-2">Todas las partidas están en proceso</h3>
              <p className="text-white">Espera a que termine el procesamiento para ver tus estadísticas.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {paginatedMatches.map((match) => (
                <Card
                  key={match.id}
                  className="bg-card/50 border-card-border hover:border-primary/30 transition-colors"
                >
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
                                {match.hasVideo && <Play className="h-4 w-4 text-primary" />}
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

            {totalMatchesPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMatchesPage((p) => Math.max(1, p - 1))}
                  disabled={matchesPage === 1}
                  className="w-8 h-8 p-0"
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-white">
                  Página {matchesPage} de {totalMatchesPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMatchesPage((p) => Math.min(totalMatchesPages, p + 1))}
                  disabled={matchesPage === totalMatchesPages}
                  className="w-8 h-8 p-0"
                  aria-label="Página siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
