export interface RoundData {
  roundNumber: number
  totalKills: number
  goodPlays: number
  badPlays: number
  kills: Array<{
    killer: string
    victim: string
    weapon: string
    isGoodPlay: boolean
    time: string
    position: string
  }>
}

export interface MatchContext {
  map: string
  kills: number
  deaths: number
  kdRatio: number
  score: number
  goodPlays: number
  badPlays: number
  duration: string
  gameType: string
  rounds?: RoundData[]
  weaponStats?: {
    mostUsedWeapon: string
    weaponDistribution: Record<string, number>
    totalUniqueWeapons: number
    weaponEffectiveness: Record<string, number>
    weaponHeadshotRate: Record<string, number>
    totalHeadshots: number
    headshotPercentage: number
    weaponGoodPlays: Record<string, number>
    weaponBadPlays: Record<string, number>
  }
}

type QueryType = "round-specific" | "weapons" | "positioning" | "economy" | "timing" | "general"

export class ChatGPTService {
  async sendMessage(
    userMessage: string,
    matchContext: MatchContext,
    queryType?: QueryType,
    selectedUser?: string | null,
  ): Promise<string> {
    console.log("ChatGPT sendMessage called with:", { userMessage, matchContext, queryType, selectedUser })

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          matchContext,
          queryType: queryType || "general",
          selectedUser, // Pass selectedUser to API route
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Chat API error:", errorData)
        return errorData.error || "Lo siento, hubo un error al procesar tu consulta."
      }

      const data = await response.json()
      return data.response
    } catch (error) {
      console.error("Error calling chat API:", error)
      return "Lo siento, hubo un error al procesar tu consulta. Inténtalo de nuevo."
    }
  }
}

// Instancia singleton
export const chatGPTService = new ChatGPTService()
