"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, Target, Users, TrendingUp, TrendingDown, Send, MessageCircle, Loader2, Trash2 } from "lucide-react"
import { useApi } from "@/hooks/useApi"
import { apiService, Match, Kill, ChatMessage } from "@/lib/api"

interface MatchDetailsProps {
  matchId: string | null
  onBack: () => void
}

export function MatchDetails({ matchId, onBack }: MatchDetailsProps) {
  const [chatMessage, setChatMessage] = useState("")
  const [isSendingMessage, setIsSendingMessage] = useState(false)

  // Fetch match data
  const { data: matchData, loading: matchLoading, error: matchError } = useApi(
    () => matchId ? apiService.getMatch(matchId) : Promise.reject(new Error("No match ID provided")),
    [matchId]
  );

  // Fetch kills data
  const { data: kills, loading: killsLoading, error: killsError } = useApi(
    () => matchId ? apiService.getMatchKills(matchId) : Promise.reject(new Error("No match ID provided")),
    [matchId]
  );

  // Fetch chat messages
  const { data: chatMessages, loading: chatLoading, error: chatError, refetch: refetchChat } = useApi(
    () => matchId ? apiService.getMatchChat(matchId) : Promise.reject(new Error("No match ID provided")),
    [matchId]
  );

  // Loading state
  if (matchLoading || killsLoading || chatLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Cargando detalles de la partida...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (matchError || killsError || chatError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} className="gap-2 bg-transparent">
            <ArrowLeft className="h-4 w-4" />
            Volver al Dashboard
          </Button>
          <h1 className="text-3xl font-bold font-heading text-white">Error al cargar la partida</h1>
        </div>
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            {matchError || killsError || chatError}
          </p>
        </div>
      </div>
    );
  }

  // No match data
  if (!matchData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} className="gap-2 bg-transparent">
            <ArrowLeft className="h-4 w-4" />
            Volver al Dashboard
          </Button>
          <h1 className="text-3xl font-bold font-heading text-white">Partida no encontrada</h1>
        </div>
      </div>
    );
  }

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !matchId || isSendingMessage) return;

    setIsSendingMessage(true);
    try {
      await apiService.addChatMessage(matchId, chatMessage);
      setChatMessage("");
      refetchChat(); // Refresh chat messages
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleDeleteMatch = async () => {
    if (!matchId) return;
    
    if (confirm("¿Estás seguro de que quieres eliminar esta partida?")) {
      try {
        await apiService.deleteMatch(matchId);
        onBack(); // Go back to dashboard
      } catch (error) {
        console.error("Error deleting match:", error);
        alert("Error al eliminar la partida");
      }
    }
  };

  const killsData = kills || [];
  const chatMessagesData = chatMessages || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} className="gap-2 bg-transparent">
            <ArrowLeft className="h-4 w-4" />
            Volver al Dashboard
          </Button>
          <h1 className="text-3xl font-bold font-heading text-white">{matchData.fileName}</h1>
        </div>
        <Button variant="destructive" onClick={handleDeleteMatch} className="gap-2">
          <Trash2 className="h-4 w-4" />
          Eliminar Partida
        </Button>
      </div>

      {/* Match Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Match Statistics */}
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
                <p className="text-sm text-muted-foreground">Kills</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-400">{matchData.deaths}</p>
                <p className="text-sm text-muted-foreground">Deaths</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{matchData.goodPlays}</p>
                <p className="text-sm text-muted-foreground">Buenas Jugadas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-400">{matchData.badPlays}</p>
                <p className="text-sm text-muted-foreground">Malas Jugadas</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-lg font-semibold text-foreground">{matchData.map}</p>
                <p className="text-sm text-muted-foreground">Mapa</p>
              </div>
              <div className="text-center">
                <Badge variant="outline">{matchData.gameType}</Badge>
                <p className="text-sm text-muted-foreground mt-1">Tipo de Juego</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-foreground">{matchData.duration}</p>
                <p className="text-sm text-muted-foreground">Duración</p>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-3xl font-bold text-primary">{matchData.score.toFixed(1)}/10</p>
              <p className="text-sm text-muted-foreground">Puntaje Final</p>
            </div>
          </CardContent>
        </Card>

        {/* Chat */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Chat de Análisis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64 mb-4">
              <div className="space-y-3">
                {chatMessagesData.map((message) => (
                  <div key={message.id} className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-primary">{message.user}</span>
                      <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                    </div>
                    <p className="text-sm text-foreground">{message.message}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-2">
              <Input
                placeholder="Escribe un mensaje..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                disabled={isSendingMessage}
              />
              <Button 
                size="sm" 
                onClick={handleSendMessage}
                disabled={!chatMessage.trim() || isSendingMessage}
              >
                {isSendingMessage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kills Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline de Kills</CardTitle>
        </CardHeader>
        <CardContent>
          {killsData.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay kills registradas para esta partida.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {killsData.map((kill) => (
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
                      <span className="text-muted-foreground">→</span>
                      <span className="text-foreground">{kill.victim}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {kill.weapon}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{kill.position}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Round {kill.round}</p>
                      <p className="text-sm font-medium">{kill.time}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">CT: {kill.teamAlive.ct}</p>
                      <p className="text-xs text-muted-foreground">T: {kill.teamAlive.t}</p>
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
