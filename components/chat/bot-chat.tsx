"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Bot, User, Loader2, MessageCircle } from "lucide-react"
import { ChatMessage, Match } from "@/lib/api"
import { chatGPTService, MatchContext } from "@/lib/chatgpt"

interface BotChatProps {
  matchData: Match
  initialMessages: ChatMessage[]
  onNewMessage: (message: ChatMessage) => void
}

export function BotChat({ matchData, initialMessages, onNewMessage }: BotChatProps) {
  const [message, setMessage] = useState("")
  const [isBotTyping, setIsBotTyping] = useState(false)

  const handleSendMessage = async () => {
    if (!message.trim() || isBotTyping) return

    const userMessage = message.trim()
    setMessage("")
    setIsBotTyping(true)

    try {
      // Crear mensaje del usuario
      const userChatMessage: ChatMessage = {
        id: Date.now(),
        user: "Usuario",
        message: userMessage,
        timestamp: new Date().toLocaleTimeString(),
        isBot: false
      }
      onNewMessage(userChatMessage)

      // Crear contexto de la partida
      const matchContext: MatchContext = {
        map: matchData.map,
        kills: matchData.kills,
        deaths: matchData.deaths,
        kdRatio: matchData.deaths > 0 ? matchData.kills / matchData.deaths : matchData.kills,
        score: matchData.score,
        goodPlays: matchData.goodPlays,
        badPlays: matchData.badPlays,
        duration: matchData.duration,
        gameType: matchData.gameType
      }

      // Enviar al bot y obtener respuesta
      const botResponse = await chatGPTService.sendMessage(userMessage, matchContext)
      
      // Crear mensaje del bot
      const botChatMessage: ChatMessage = {
        id: Date.now() + 1,
        user: "TACTICORE Bot",
        message: botResponse,
        timestamp: new Date().toLocaleTimeString(),
        isBot: true
      }
      
      onNewMessage(botChatMessage)

    } catch (error) {
      console.error("Error sending message to bot:", error)
      
      // Mensaje de error del bot
      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        user: "TACTICORE Bot",
        message: "Lo siento, no pude procesar tu solicitud en este momento. Esto puede deberse a límites de uso de la API. Inténtalo de nuevo en unos minutos.",
        timestamp: new Date().toLocaleTimeString(),
        isBot: true
      }
      
      onNewMessage(errorMessage)
    } finally {
      setIsBotTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="space-y-4">
      {/* Header del chat */}
      <div className="flex items-center gap-2 pb-2 border-b border-border">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-white">Chat de Análisis</h3>
        <div className="flex items-center gap-1 ml-auto">
          <Bot className="h-4 w-4 text-primary" />
          <span className="text-xs text-white">Bot disponible</span>
        </div>
      </div>

      {/* Área de mensajes */}
      <ScrollArea className="h-64 mb-4">
        <div className="space-y-3 pr-4">
          {initialMessages.map((msg) => (
            <div key={msg.id} className="flex flex-col">
              <div className="flex items-center gap-2">
                {msg.isBot ? (
                  <Bot className="h-4 w-4 text-primary" />
                ) : (
                  <User className="h-4 w-4 text-secondary" />
                )}
                <span className="text-sm font-semibold text-primary">{msg.user}</span>
                <span className="text-xs text-white">{msg.timestamp}</span>
              </div>
              <div className={`ml-6 p-2 rounded-lg ${
                msg.isBot 
                  ? "bg-primary/10 border border-primary/20" 
                  : "bg-secondary/10 border border-secondary/20"
              }`}>
                <p className="text-sm text-white whitespace-pre-wrap">{msg.message}</p>
              </div>
            </div>
          ))}
          
          {isBotTyping && (
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">TACTICORE Bot</span>
              <div className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                <span className="text-xs text-white">Escribiendo...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input de mensaje */}
      <div className="flex gap-2">
        <Input
          placeholder="Pregunta al bot sobre esta partida..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isBotTyping}
          className="flex-1"
        />
        <Button 
          size="sm" 
          onClick={handleSendMessage}
          disabled={!message.trim() || isBotTyping}
          className="gap-2"
        >
          {isBotTyping ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
