"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, Target, Users, TrendingUp, TrendingDown, Send, MessageCircle } from "lucide-react"

// Mock data for match details
const mockMatchData = {
  "1": {
    fileName: "dust2_ranked_2024.dem",
    map: "Dust2",
    gameType: "Ranked",
    duration: "32:45",
    score: 8.5,
    kills: [
      {
        id: 1,
        killer: "Player1",
        victim: "Enemy1",
        weapon: "AK-47",
        isGoodPlay: true,
        round: 3,
        time: "1:45",
        teamAlive: { ct: 4, t: 3 },
        position: "Long A",
      },
      {
        id: 2,
        killer: "Player1",
        victim: "Enemy2",
        weapon: "AK-47",
        isGoodPlay: true,
        round: 3,
        time: "1:42",
        teamAlive: { ct: 4, t: 2 },
        position: "Long A",
      },
      {
        id: 3,
        killer: "Enemy3",
        victim: "Player1",
        weapon: "AWP",
        isGoodPlay: false,
        round: 5,
        time: "0:30",
        teamAlive: { ct: 2, t: 3 },
        position: "Mid",
      },
      {
        id: 4,
        killer: "Player1",
        victim: "Enemy4",
        weapon: "M4A4",
        isGoodPlay: true,
        round: 8,
        time: "1:15",
        teamAlive: { ct: 3, t: 4 },
        position: "Site B",
      },
      {
        id: 5,
        killer: "Player1",
        victim: "Enemy5",
        weapon: "Glock-18",
        isGoodPlay: false,
        round: 12,
        time: "0:45",
        teamAlive: { ct: 1, t: 2 },
        position: "Tunnels",
      },
    ],
  },
}

const mockChatMessages = [
  { id: 1, user: "Analyst", message: "¿Qué opinas de la jugada en el round 3?", timestamp: "14:30" },
  {
    id: 2,
    user: "Player",
    message: "Fue una buena rotación, aproveché que estaban distraídos en B",
    timestamp: "14:32",
  },
  {
    id: 3,
    user: "Coach",
    message: "El timing fue perfecto, pero podrías haber usado mejor cobertura",
    timestamp: "14:35",
  },
]

interface MatchDetailsProps {
  matchId: string | null
  onBack: () => void
}

export function MatchDetails({ matchId, onBack }: MatchDetailsProps) {
  const [chatMessage, setChatMessage] = useState("")
  const [chatMessages, setChatMessages] = useState(mockChatMessages)

  const matchData = matchId ? mockMatchData[matchId as keyof typeof mockMatchData] : null

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
    )
  }

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      const newMessage = {
        id: chatMessages.length + 1,
        user: "You",
        message: chatMessage,
        timestamp: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
      }
      setChatMessages([...chatMessages, newMessage])
      setChatMessage("")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack} className="gap-2 bg-transparent">
          <ArrowLeft className="h-4 w-4" />
          Volver al Dashboard
        </Button>
        <div>
          <h1 className="text-3xl font-bold font-heading text-white">Detalles de Partida</h1>
          <p className="text-white/70">
            {matchData.fileName} - {matchData.map}
          </p>
        </div>
      </div>

      {/* Match Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="py-2 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-white">Mapa</CardTitle>
              <div className="text-lg font-bold text-white">{matchData.map}</div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="py-2 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-white">Tipo</CardTitle>
              <div className="text-lg font-bold text-white">{matchData.gameType}</div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="py-2 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-white">Duración</CardTitle>
              <div className="text-lg font-bold text-white">{matchData.duration}</div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="py-2 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-white">Puntaje</CardTitle>
              <div className="text-lg font-bold text-primary">{matchData.score}/10</div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Side - Match Details and Map */}
        <div className="col-span-2 space-y-6">
          {/* Map Image */}
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-white">Mapa: {matchData.map}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <img
                  src="/cs-map-dust2.png"
                  alt={`Mapa ${matchData.map}`}
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
            </CardContent>
          </Card>

          {/* Kills Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-white">Timeline de Kills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {matchData.kills.map((kill) => (
                  <div key={kill.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Badge variant={kill.isGoodPlay ? "default" : "destructive"} className="gap-1">
                          {kill.isGoodPlay ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {kill.isGoodPlay ? "Buena Jugada" : "Mala Jugada"}
                        </Badge>
                        <span className="text-sm text-white/70">
                          Round {kill.round} - {kill.time}
                        </span>
                      </div>
                      <div className="text-sm text-white/70">{kill.position}</div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-green-400" />
                          <span className="font-medium text-white">{kill.killer}</span>
                          <span className="text-white/70">eliminó a</span>
                          <span className="font-medium text-white">{kill.victim}</span>
                        </div>
                        <Badge variant="outline">{kill.weapon}</Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-blue-400" />
                          <span className="text-blue-400">CT: {kill.teamAlive.ct}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-orange-400" />
                          <span className="text-orange-400">T: {kill.teamAlive.t}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Chat */}
        <div className="space-y-6">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2 text-white">
                <MessageCircle className="h-5 w-5" />
                Chat de Análisis
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground">{msg.user}</span>
                        <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                      </div>
                      <div className="bg-muted rounded-lg p-3 text-sm text-black">{msg.message}</div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex gap-2 mt-4">
                <Input
                  placeholder="Escribe tu pregunta o comentario..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} size="sm" className="gap-2">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
