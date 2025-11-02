import { type NextRequest, NextResponse } from "next/server"

interface ChatGPTMessage {
  role: "system" | "user" | "assistant"
  content: string
}

interface ChatGPTRequest {
  model: string
  messages: ChatGPTMessage[]
  max_tokens: number
  temperature: number
}

interface ChatGPTResponse {
  choices: {
    message: {
      content: string
    }
  }[]
}

interface MatchContext {
  map: string
  kills: number
  deaths: number
  kdRatio: number
  score: number
  goodPlays: number
  badPlays: number
  duration: string
  gameType: string
  rounds?: Array<{
    roundNumber: number
    totalKills: number
    goodPlays: number
    badPlays: number
  }>
}

function buildSystemPrompt(matchContext: MatchContext): string {
  const totalActions = matchContext.goodPlays + matchContext.badPlays
  const goodPlayPercentage = totalActions > 0 ? ((matchContext.goodPlays / totalActions) * 100).toFixed(1) : "0"
  const badPlayPercentage = totalActions > 0 ? ((matchContext.badPlays / totalActions) * 100).toFixed(1) : "0"
  const killsPerMinute =
    Number.parseFloat(matchContext.duration.split(":")[0]) > 0
      ? (matchContext.kills / Number.parseFloat(matchContext.duration.split(":")[0])).toFixed(2)
      : "0"

  let roundsAnalysis = ""
  if (matchContext.rounds && matchContext.rounds.length > 0) {
    roundsAnalysis = `\n\n🎮 ANÁLISIS POR RONDAS (${matchContext.rounds.length} rondas):
${matchContext.rounds.map((round) => `- Ronda ${round.roundNumber}: ${round.totalKills} kills (${round.goodPlays} buenas, ${round.badPlays} malas)`).join("\n")}

📈 RONDAS DESTACADAS:
${
  matchContext.rounds
    .filter((round) => round.goodPlays > round.badPlays)
    .slice(0, 3)
    .map(
      (round) =>
        `- Ronda ${round.roundNumber}: Excelente rendimiento (${round.goodPlays}/${round.totalKills} buenas jugadas)`,
    )
    .join("\n") || "- No hay rondas con rendimiento destacado"
}

⚠️ RONDAS PROBLEMÁTICAS:
${
  matchContext.rounds
    .filter((round) => round.badPlays > round.goodPlays)
    .slice(0, 3)
    .map(
      (round) => `- Ronda ${round.roundNumber}: Necesita mejora (${round.badPlays}/${round.totalKills} malas jugadas)`,
    )
    .join("\n") || "- No hay rondas problemáticas identificadas"
}`
  }

  return `Eres TACTICORE Bot, un entrenador profesional de Counter-Strike con años de experiencia analizando partidas competitivas. Tu rol es actuar como un coach personal que identifica los puntos más críticos de mejora y proporciona consejos específicos y accionables.

ANÁLISIS DETALLADO DE LA PARTIDA:
📊 ESTADÍSTICAS PRINCIPALES:
- Mapa: ${matchContext.map}
- Kills: ${matchContext.kills} | Deaths: ${matchContext.deaths}
- K/D Ratio: ${matchContext.kdRatio.toFixed(2)}
- Puntuación general: ${matchContext.score.toFixed(1)}/10
- Duración: ${matchContext.duration}
- Tipo de juego: ${matchContext.gameType}

🎯 ANÁLISIS DE RENDIMIENTO:
- Buenas jugadas: ${matchContext.goodPlays} (${goodPlayPercentage}%)
- Malas jugadas: ${matchContext.badPlays} (${badPlayPercentage}%)
- Kills por minuto: ${killsPerMinute}
- Total de acciones analizadas: ${totalActions}${roundsAnalysis}

COMO ENTRENADOR PROFESIONAL:
1. 🎯 ENFÓCATE EN LOS PUNTOS MÁS CRÍTICOS: Identifica las 2-3 áreas más importantes que necesitan mejora inmediata
2. 📈 ANÁLISIS ESPECÍFICO: Usa las estadísticas exactas de esta partida para dar consejos personalizados
3. 🛠️ CONSEJOS ACCIONABLES: Proporciona técnicas específicas y ejercicios prácticos
4. 🗺️ CONTEXTO DEL MAPA: Considera las características específicas de ${matchContext.map} en tus recomendaciones
5. ⚡ PRIORIZACIÓN: Enfócate en los cambios que tendrán mayor impacto en el rendimiento
6. 🎮 ANÁLISIS POR RONDAS: Si hay información de rondas disponible, identifica patrones de rendimiento por ronda

ESTILO DE RESPUESTA:
- Tono profesional pero motivador, como un coach experimentado
- Máximo 250 palabras para mantener el enfoque
- Usa emojis estratégicamente para destacar puntos clave
- Siempre incluye al menos una técnica específica para practicar
- Responde en español
- Si hay datos de rondas, menciona patrones específicos de rendimiento

Tu objetivo es ayudar al jugador a identificar y corregir los errores más impactantes para mejorar significativamente su rendimiento en futuras partidas.`
}

export async function POST(request: NextRequest) {
  try {
    const { message, matchContext } = await request.json()

    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI API key no configurada en el servidor" }, { status: 500 })
    }

    // Verificar si usar respuestas mock
    const useMockResponses = process.env.NEXT_PUBLIC_USE_MOCK_RESPONSES === "true"
    if (useMockResponses) {
      // Generar respuesta mock
      const mockResponses = [
        `Basándome en tu partida en ${matchContext.map} con ${matchContext.kills} kills y ${matchContext.deaths} deaths, te recomiendo mejorar tu posicionamiento y usar más cobertura.`,
        `Tu K/D de ${matchContext.kdRatio.toFixed(2)} indica que necesitas trabajar en tu precisión. Prueba ajustar la sensibilidad del mouse.`,
        `En ${matchContext.map}, es importante controlar los puntos clave del mapa. Tu score de ${matchContext.score.toFixed(1)}/10 sugiere que hay margen de mejora.`,
        `Para mejorar tu rendimiento, enfócate en la comunicación con tu equipo y el timing de tus movimientos.`,
        `Tu partida de ${matchContext.duration} minutos muestra que necesitas ser más agresivo en las rondas económicas.`,
      ]

      // Simular delay
      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

      const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)]
      return NextResponse.json({ response: randomResponse })
    }

    const systemPrompt = buildSystemPrompt(matchContext)

    const chatRequest: ChatGPTRequest = {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: message,
        },
      ],
      max_tokens: 300,
      temperature: 0.7,
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(chatRequest),
    })

    if (response.status === 429) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Por favor, espera un momento y vuelve a intentar." },
        { status: 429 },
      )
    }

    if (response.status === 402) {
      return NextResponse.json({ error: "La cuenta de OpenAI no tiene créditos suficientes." }, { status: 402 })
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error("OpenAI API error:", errorText)
      return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: response.status })
    }

    const data: ChatGPTResponse = await response.json()
    const botResponse = data.choices[0]?.message?.content || "No pude generar una respuesta."

    return NextResponse.json({ response: botResponse })
  } catch (error) {
    console.error("Error in chat API route:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
