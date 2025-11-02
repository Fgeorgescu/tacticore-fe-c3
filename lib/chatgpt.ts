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
}

export class ChatGPTService {
  async sendMessage(userMessage: string, matchContext: MatchContext): Promise<string> {
    console.log("ChatGPT sendMessage called with:", { userMessage, matchContext })

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          matchContext,
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
