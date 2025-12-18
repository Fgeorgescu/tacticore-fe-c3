"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Bot, User, Loader2, MessageCircle } from "lucide-react"
import type { ChatMessage, Match, Kill } from "@/lib/api"
import { chatGPTService, type MatchContext, type RoundData } from "@/lib/chatgpt"
import { MarkdownMessage } from "@/components/chat/markdown-message"

interface BotChatProps {
  matchData: Match
  killsData?: Kill[]
  initialMessages: ChatMessage[]
  onNewMessage: (message: ChatMessage) => void
}

type QueryType = "round-specific" | "weapons" | "positioning" | "economy" | "timing" | "general"

interface DetectionResult {
  type: QueryType
  roundNumber?: number
}

export function BotChat({ matchData, killsData, initialMessages, onNewMessage }: BotChatProps) {
  const [message, setMessage] = useState("")
  const [isBotTyping, setIsBotTyping] = useState(false)

  const calculateWeaponStats = (kills: Kill[]) => {
    const weaponDistribution: Record<string, number> = {}
    const weaponHeadshots: Record<string, number> = {}
    const weaponGoodPlays: Record<string, number> = {}
    const weaponBadPlays: Record<string, number> = {}

    let totalHeadshots = 0

    kills.forEach((kill) => {
      const weapon = kill.weapon || "Unknown"
      weaponDistribution[weapon] = (weaponDistribution[weapon] || 0) + 1

      // Track headshots per weapon
      if (kill.headshot) {
        weaponHeadshots[weapon] = (weaponHeadshots[weapon] || 0) + 1
        totalHeadshots++
      }

      // Track good/bad plays per weapon
      if (kill.isGoodPlay) {
        weaponGoodPlays[weapon] = (weaponGoodPlays[weapon] || 0) + 1
      } else {
        weaponBadPlays[weapon] = (weaponBadPlays[weapon] || 0) + 1
      }
    })

    const sortedWeapons = Object.entries(weaponDistribution).sort(([, a], [, b]) => b - a)
    const mostUsedWeapon = sortedWeapons[0]?.[0] || "N/A"

    // Calculate effectiveness per weapon (good plays / total kills with that weapon)
    const weaponEffectiveness: Record<string, number> = {}
    Object.keys(weaponDistribution).forEach((weapon) => {
      const total = weaponDistribution[weapon]
      const good = weaponGoodPlays[weapon] || 0
      weaponEffectiveness[weapon] = total > 0 ? (good / total) * 100 : 0
    })

    // Calculate headshot percentage per weapon
    const weaponHeadshotRate: Record<string, number> = {}
    Object.keys(weaponDistribution).forEach((weapon) => {
      const total = weaponDistribution[weapon]
      const headshots = weaponHeadshots[weapon] || 0
      weaponHeadshotRate[weapon] = total > 0 ? (headshots / total) * 100 : 0
    })

    const totalKills = kills.length
    const headshotPercentage = totalKills > 0 ? (totalHeadshots / totalKills) * 100 : 0

    return {
      mostUsedWeapon,
      weaponDistribution,
      totalUniqueWeapons: Object.keys(weaponDistribution).length,
      weaponEffectiveness,
      weaponHeadshotRate,
      totalHeadshots,
      headshotPercentage,
      weaponGoodPlays,
      weaponBadPlays,
    }
  }

  // Función para procesar kills y crear datos de rondas
  const processRoundsData = (kills: Kill[]): RoundData[] => {
    const roundsMap = new Map<number, Kill[]>()

    kills.forEach((kill) => {
      const round = kill.round
      if (!roundsMap.has(round)) {
        roundsMap.set(round, [])
      }
      roundsMap.get(round)!.push(kill)
    })

    return Array.from(roundsMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([roundNumber, roundKills]) => ({
        roundNumber,
        totalKills: roundKills.length,
        goodPlays: roundKills.filter((kill) => kill.isGoodPlay).length,
        badPlays: roundKills.filter((kill) => !kill.isGoodPlay).length,
        kills: roundKills.map((kill) => ({
          killer: kill.killer,
          victim: kill.victim,
          weapon: kill.weapon,
          isGoodPlay: kill.isGoodPlay,
          time: kill.time,
          position: kill.position,
        })),
      }))
  }

  const detectQueryType = (message: string): DetectionResult => {
    const lowerMessage = message.toLowerCase()

    // Round-specific detection
    const roundMatch =
      lowerMessage.match(/ronda\s+(\d+)/i) ||
      lowerMessage.match(/round\s+(\d+)/i) ||
      lowerMessage.match(/r(\d+)/i) ||
      lowerMessage.match(/en\s+la\s+(\d+)/i)

    if (roundMatch) {
      const roundNumber = Number.parseInt(roundMatch[1], 10)
      if (roundNumber >= 1 && roundNumber <= 30) {
        return { type: "round-specific", roundNumber }
      }
    }

    // Weapons detection
    if (
      lowerMessage.match(/\b(arma|armas|weapon|weapons|rifle|pistol|awp|ak|m4|loadout|equipamiento)\b/i) ||
      lowerMessage.match(/\b(ak47|ak-47|m4a4|m4a1|awp|desert eagle|deagle|usp|glock)\b/i)
    ) {
      return { type: "weapons" }
    }

    // Positioning detection
    if (
      lowerMessage.match(/\b(mapa|map|posición|position|positioning|site|mid|rotate|rotación|zona)\b/i) ||
      lowerMessage.match(/\b(site a|site b|bombsite|spawn|long|short|catwalk)\b/i)
    ) {
      return { type: "positioning" }
    }

    // Economy detection
    if (
      lowerMessage.match(/\b(economía|economy|dinero|money|compra|buy|eco|force buy|full buy)\b/i) ||
      lowerMessage.match(/\b(económica|save round|guardar)\b/i)
    ) {
      return { type: "economy" }
    }

    // Timing detection
    if (
      lowerMessage.match(/\b(timing|tiempo|cuándo|when|early|late|inicio|final|temprano|tarde)\b/i) ||
      lowerMessage.match(/\b(push|entrada|entry)\b/i)
    ) {
      return { type: "timing" }
    }

    // Default to general
    return { type: "general" }
  }

  const buildOptimizedContext = (
    queryType: QueryType,
    roundNumber: number | undefined,
    matchData: Match,
    killsData: Kill[] | undefined,
  ): MatchContext => {
    const baseContext = {
      map: matchData.map,
      kills: matchData.kills,
      deaths: matchData.deaths,
      kdRatio: matchData.deaths > 0 ? matchData.kills / matchData.deaths : matchData.kills,
      score: matchData.score,
      goodPlays: matchData.goodPlays,
      badPlays: matchData.badPlays,
      duration: matchData.duration,
      gameType: matchData.gameType,
    }

    if (!killsData || killsData.length === 0) {
      return baseContext
    }

    const allRounds = processRoundsData(killsData)

    switch (queryType) {
      case "round-specific":
        // Only send data for specific round
        if (roundNumber) {
          const targetRound = allRounds.find((r) => r.roundNumber === roundNumber)
          if (targetRound) {
            return {
              ...baseContext,
              rounds: [targetRound],
              weaponStats: calculateWeaponStats(
                targetRound.kills.map((k) => killsData.find((kill) => kill.weapon === k.weapon)!).filter(Boolean),
              ),
            }
          }
        }
        return baseContext

      case "weapons":
        // Full weapon stats, reduced kill details (first 3 rounds)
        return {
          ...baseContext,
          rounds: allRounds.slice(0, 3),
          weaponStats: calculateWeaponStats(killsData),
        }

      case "positioning":
        // Emphasis on positions (first 5 rounds with full position data)
        return {
          ...baseContext,
          rounds: allRounds.slice(0, 5),
          weaponStats: calculateWeaponStats(killsData),
        }

      case "economy":
        // Weapon distribution indicates buy decisions
        return {
          ...baseContext,
          rounds: allRounds.slice(0, 5),
          weaponStats: calculateWeaponStats(killsData),
        }

      case "timing":
        // Focus on time field (first 5 rounds with timing emphasis)
        return {
          ...baseContext,
          rounds: allRounds.slice(0, 5),
          weaponStats: calculateWeaponStats(killsData),
        }

      case "general":
      default:
        // Full context (current behavior)
        return {
          ...baseContext,
          rounds: allRounds,
          weaponStats: calculateWeaponStats(killsData),
        }
    }
  }

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
        isBot: false,
      }
      onNewMessage(userChatMessage)

      const detection = detectQueryType(userMessage)
      const matchContext = buildOptimizedContext(detection.type, detection.roundNumber, matchData, killsData)

      console.log(
        `[v0] Query type detected: ${detection.type}`,
        detection.roundNumber ? `(Round ${detection.roundNumber})` : "",
      )

      const botResponse = await chatGPTService.sendMessage(userMessage, matchContext, detection.type)

      // Crear mensaje del bot
      const botChatMessage: ChatMessage = {
        id: Date.now() + 1,
        user: "TACTICORE Bot",
        message: botResponse,
        timestamp: new Date().toLocaleTimeString(),
        isBot: true,
      }

      onNewMessage(botChatMessage)
    } catch (error) {
      console.error("Error sending message to bot:", error)

      // Mensaje de error del bot
      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        user: "TACTICORE Bot",
        message:
          "Lo siento, no pude procesar tu solicitud en este momento. Esto puede deberse a límites de uso de la API. Inténtalo de nuevo en unos minutos.",
        timestamp: new Date().toLocaleTimeString(),
        isBot: true,
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
    <div className="flex flex-col h-full gap-4">
      {/* Header del chat */}
      <div className="flex items-center gap-2 pb-2 border-b border-border flex-shrink-0">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-white">Chat de Análisis</h3>
        <div className="flex items-center gap-1 ml-auto">
          <Bot className="h-4 w-4 text-primary" />
          <span className="text-xs text-white">Bot disponible</span>
        </div>
      </div>

      {/* Área de mensajes */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="space-y-3 pr-4">
          {initialMessages.map((msg) => (
            <div key={msg.id} className="flex flex-col">
              <div className="flex items-center gap-2">
                {msg.isBot ? <Bot className="h-4 w-4 text-primary" /> : <User className="h-4 w-4 text-secondary" />}
                <span className="text-sm font-semibold text-primary">{msg.user}</span>
                <span className="text-xs text-white">{msg.timestamp}</span>
              </div>
              <div
                className={`ml-6 p-2 rounded-lg ${
                  msg.isBot ? "bg-primary/10 border border-primary/20" : "bg-secondary/10 border border-secondary/20"
                }`}
              >
                {msg.isBot ? (
                  <MarkdownMessage content={msg.message} />
                ) : (
                  <p className="text-sm text-white whitespace-pre-wrap">{msg.message}</p>
                )}
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
      <div className="flex gap-2 flex-shrink-0">
        <Input
          placeholder="Pregunta al bot sobre esta partida..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isBotTyping}
          className="flex-1"
        />
        <Button size="sm" onClick={handleSendMessage} disabled={!message.trim() || isBotTyping} className="gap-2">
          {isBotTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}
