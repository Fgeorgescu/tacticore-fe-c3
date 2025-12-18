"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Target,
  TrendingUp,
  TrendingDown,
  Loader2,
  Trash2,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  ChevronLeft,
} from "lucide-react"
import { BotChat } from "@/components/chat/bot-chat"
import { RoundMap } from "@/components/match-details/round-map"
import { useApi } from "@/hooks/useApi"
import { useUser } from "@/contexts/UserContext"
import { apiService, type Kill, type ChatMessage } from "@/lib/api"
import { SimpleMapView } from "@/components/match-details/simple-map-view"
import { formatScore } from "@/lib/utils"

interface MatchDetailsProps {
  matchId: string | null
  onBack: () => void
}

export function MatchDetails({ matchId, onBack }: MatchDetailsProps) {
  const { selectedUser } = useUser()
  const [chatMessagesData, setChatMessagesData] = useState<ChatMessage[]>([])
  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set())
  const [showAttackerPositions, setShowAttackerPositions] = useState(true)
  const [showVictimPositions, setShowVictimPositions] = useState(true)
  const [roundsPage, setRoundsPage] = useState(1)
  const ROUNDS_PER_PAGE = 5

  const {
    data: matchData,
    loading: matchLoading,
    error: matchError,
  } = useApi(
    () => (matchId ? apiService.getMatch(matchId) : Promise.reject(new Error("No match ID provided"))),
    [matchId],
  )

  const {
    data: kills,
    loading: killsLoading,
    error: killsError,
  } = useApi(
    () =>
      matchId
        ? apiService.getMatchKills(matchId, selectedUser.value)
        : Promise.reject(new Error("No match ID provided")),
    [matchId, selectedUser.value],
  )

  const {
    data: chatMessages,
    loading: chatLoading,
    error: chatError,
    refetch: refetchChat,
  } = useApi(
    () => (matchId ? apiService.getMatchChat(matchId) : Promise.reject(new Error("No match ID provided"))),
    [matchId],
  )

  React.useEffect(() => {
    if (chatMessages) {
      setChatMessagesData(chatMessages)
    }
  }, [chatMessages])

  if (matchLoading || killsLoading || chatLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-white">Cargando detalles de la partida...</span>
        </div>
      </div>
    )
  }

  if (matchError || killsError || chatError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} size="icon" className="shrink-0 bg-transparent">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold font-heading text-white">Error al cargar la partida</h1>
        </div>
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-sm text-white">{matchError || killsError || chatError}</p>
        </div>
      </div>
    )
  }

  if (!matchData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} size="icon" className="shrink-0 bg-transparent">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold font-heading text-white">Partida no encontrada</h1>
        </div>
      </div>
    )
  }

  const killsData = kills || []

  const handleDeleteMatch = async () => {
    if (!matchId) return

    if (confirm("¿Estás seguro de que quieres eliminar esta partida?")) {
      try {
        await apiService.deleteMatch(matchId)
        onBack() // Go back to dashboard
      } catch (error) {
        console.error("Error deleting match:", error)
        alert("Error al eliminar la partida")
      }
    }
  }

  const groupKillsByRounds = (kills: Kill[]) => {
    const roundsMap = new Map<number, Kill[]>()

    kills.forEach((kill) => {
      const round = kill.round
      if (!roundsMap.has(round)) {
        roundsMap.set(round, [])
      }
      roundsMap.get(round)!.push(kill)
    })

    const sortedRounds = Array.from(roundsMap.entries()).sort(([a], [b]) => a - b)
    sortedRounds.forEach(([, kills]) => {
      kills.sort((a, b) => a.time.localeCompare(b.time))
    })

    return sortedRounds
  }

  const toggleRound = (roundNumber: number) => {
    const newExpanded = new Set(expandedRounds)
    if (newExpanded.has(roundNumber)) {
      newExpanded.delete(roundNumber)
    } else {
      newExpanded.add(roundNumber)
    }
    setExpandedRounds(newExpanded)
  }

  const getRoundStats = (kills: Kill[]) => {
    const goodPlays = kills.filter((kill) => kill.isGoodPlay).length
    const badPlays = kills.filter((kill) => !kill.isGoodPlay).length
    return { goodPlays, badPlays, totalKills: kills.length }
  }

  const allRounds = groupKillsByRounds(killsData)
  const totalRoundsPages = Math.ceil(allRounds.length / ROUNDS_PER_PAGE)
  const paginatedRounds = allRounds.slice((roundsPage - 1) * ROUNDS_PER_PAGE, roundsPage * ROUNDS_PER_PAGE)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} size="icon" className="shrink-0 bg-transparent">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold font-heading text-white truncate max-w-2xl">{matchData.fileName}</h1>
        </div>
        <Button variant="destructive" onClick={handleDeleteMatch} className="gap-2 shrink-0">
          <Trash2 className="h-4 w-4" />
          Eliminar Partida
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Estadísticas de la Partida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{matchData.kills}</p>
                <p className="text-sm text-white">Kills</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-400">{matchData.deaths}</p>
                <p className="text-sm text-white">Deaths</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{matchData.goodPlays}</p>
                <p className="text-sm text-white">Buenas Jugadas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-400">{matchData.badPlays}</p>
                <p className="text-sm text-white">Malas Jugadas</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-lg font-semibold text-foreground">{matchData.map}</p>
                <p className="text-sm text-white">Mapa</p>
              </div>
              <div className="text-center">
                <Badge variant="outline">{matchData.gameType}</Badge>
                <p className="text-sm text-white mt-1">Tipo de Juego</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-foreground">{matchData.duration}</p>
                <p className="text-sm text-white">Duración</p>
              </div>
            </div>

            <div className="mt-6 flex justify-center items-center gap-8">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{formatScore(matchData.score)}/10</p>
                <p className="text-sm text-white">Puntaje Final</p>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button
                    variant={showAttackerPositions ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowAttackerPositions(!showAttackerPositions)}
                    className={`gap-1 ${showAttackerPositions ? "bg-orange-500 hover:bg-orange-600" : "bg-blue-600 hover:bg-blue-700"}`}
                  >
                    {showAttackerPositions ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    Atacantes
                  </Button>
                  <Button
                    variant={showVictimPositions ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowVictimPositions(!showVictimPositions)}
                    className={`gap-1 ${showVictimPositions ? "bg-orange-500 hover:bg-orange-600" : "bg-blue-600 hover:bg-blue-700"}`}
                  >
                    {showVictimPositions ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    Víctimas
                  </Button>
                </div>

                <div className="flex gap-3 items-center text-xs bg-black/40 px-2 py-1 rounded">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#64b5f6" }}></div>
                    <span className="text-gray-300">CT</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ff9800" }}></div>
                    <span className="text-gray-300">T</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div
                      className="w-3 h-3 rounded-full border border-white"
                      style={{ backgroundColor: "#4fc3f7" }}
                    ></div>
                    <span className="text-white text-[10px]">X</span>
                    <span className="text-gray-300">Víctima</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="relative w-full max-w-md mx-auto">
                <SimpleMapView
                  mapName={matchData.map}
                  kills={killsData}
                  selectedUser={selectedUser.value}
                  showAttackerPositions={showAttackerPositions}
                  showVictimPositions={showVictimPositions}
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1 flex flex-col max-h-[600px]">
          <CardContent className="p-4 flex-1 flex flex-col min-h-0">
            <BotChat
              matchData={matchData}
              killsData={killsData}
              initialMessages={chatMessagesData}
              onNewMessage={(message) => {
                setChatMessagesData((prev) => [...prev, message])
              }}
            />
          </CardContent>
        </Card>
      </div>

      <RoundMap
        mapName={matchData.map}
        killsByRound={groupKillsByRounds(killsData)}
        selectedUser={selectedUser.value}
        className="w-full"
      />

      <Card>
        <CardHeader>
          <CardTitle>Timeline de Kills por Rondas</CardTitle>
        </CardHeader>
        <CardContent>
          {killsData.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-white mx-auto mb-4" />
              <p className="text-white">No hay kills registradas para esta partida.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedRounds.map(([roundNumber, roundKills]) => {
                const stats = getRoundStats(roundKills)
                const isExpanded = expandedRounds.has(roundNumber)

                return (
                  <div key={roundNumber} className="border border-border rounded-lg">
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => toggleRound(roundNumber)}
                    >
                      <div className="flex items-center gap-4">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-white" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-white" />
                        )}
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-white">Ronda {roundNumber}</h3>
                          <Badge variant="outline" className="text-xs">
                            {stats.totalKills} kills
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-400" />
                          <span className="text-sm text-green-400">{stats.goodPlays}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-red-400" />
                          <span className="text-sm text-red-400">{stats.badPlays}</span>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-border p-4">
                        <div className="space-y-2">
                          {roundKills.map((kill) => (
                            <div
                              key={kill.id}
                              className={`flex items-center justify-between p-3 rounded-lg border ${
                                kill.isGoodPlay
                                  ? "bg-green-500/10 border-green-500/20"
                                  : "bg-red-500/10 border-red-500/20"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-foreground">{kill.killer}</span>
                                  <span className="text-white">→</span>
                                  <span className="text-foreground">{kill.victim}</span>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {kill.weapon}
                                </Badge>
                                <span className="text-sm text-white">{kill.position}</span>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="text-center">
                                  <p className="text-sm font-medium">{kill.time}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs text-white">CT: {kill.teamAlive.ct}</p>
                                  <p className="text-xs text-white">T: {kill.teamAlive.t}</p>
                                </div>
                                {kill.isGoodPlay ? (
                                  <TrendingUp className="h-4 w-4 text-green-400" />
                                ) : (
                                  <TrendingDown className="h-4 w-4 text-red-400" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {totalRoundsPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRoundsPage((p) => Math.max(1, p - 1))}
                    disabled={roundsPage === 1}
                    className="w-8 h-8 p-0"
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-white">
                    Página {roundsPage} de {totalRoundsPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRoundsPage((p) => Math.min(totalRoundsPages, p + 1))}
                    disabled={roundsPage === totalRoundsPages}
                    className="w-8 h-8 p-0"
                    aria-label="Página siguiente"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
