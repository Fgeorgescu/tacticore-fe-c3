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
    kills: Array<{
      killer: string
      victim: string
      weapon: string
      isGoodPlay: boolean
      time: string
      position: string
    }>
  }>
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

function buildSystemPrompt(
  matchContext: MatchContext,
  queryType: QueryType = "general",
  selectedUser?: string | null,
): string {
  const totalActions = matchContext.goodPlays + matchContext.badPlays
  const goodPlayPercentage = totalActions > 0 ? ((matchContext.goodPlays / totalActions) * 100).toFixed(1) : "0"
  const badPlayPercentage = totalActions > 0 ? ((matchContext.badPlays / totalActions) * 100).toFixed(1) : "0"
  const killsPerMinute =
    Number.parseFloat(matchContext.duration.split(":")[0]) > 0
      ? (matchContext.kills / Number.parseFloat(matchContext.duration.split(":")[0])).toFixed(2)
      : "0"

  const userContext = selectedUser
    ? `\n\n👤 CONTEXTO DE USUARIO:
- Estás analizando a: ${selectedUser}
- Todos los consejos deben estar personalizados para este jugador específico
- Cuando menciones estadísticas o jugadas, refiérete directamente al jugador ("tu", "tus kills", "tu posicionamiento")`
    : `\n\n👥 CONTEXTO DE EQUIPO:
- Esta es una vista general del equipo completo
- Los datos muestran el rendimiento colectivo de todas las partidas
- Enfoca el análisis desde una perspectiva de equipo ("el equipo", "las estadísticas del equipo")
- Proporciona consejos aplicables a nivel de equipo y estrategia general`

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
}

🔫 DETALLES DE KILLS POR RONDA:
${matchContext.rounds
  .slice(0, 5)
  .map(
    (round) =>
      `Ronda ${round.roundNumber}:
${round.kills.map((kill) => `  • ${kill.killer} → ${kill.victim} [${kill.weapon}] (${kill.isGoodPlay ? "✓ Buena" : "✗ Mala"}) @ ${kill.time} en ${kill.position}`).join("\n")}`,
  )
  .join("\n\n")}`
  }

  let weaponAnalysis = ""
  if (matchContext.weaponStats) {
    const topWeapons = Object.entries(matchContext.weaponStats.weaponDistribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([weapon, count]) => {
        const effectiveness = matchContext.weaponStats!.weaponEffectiveness[weapon]?.toFixed(1) || "0"
        const headshotRate = matchContext.weaponStats!.weaponHeadshotRate[weapon]?.toFixed(1) || "0"
        const goodPlays = matchContext.weaponStats!.weaponGoodPlays[weapon] || 0
        const badPlays = matchContext.weaponStats!.weaponBadPlays[weapon] || 0

        return `- ${weapon}: ${count} kills | ${effectiveness}% efectividad | ${headshotRate}% headshots | ${goodPlays} buenas / ${badPlays} malas`
      })
      .join("\n")

    weaponAnalysis = `\n\n🔫 ANÁLISIS DETALLADO DE ARMAS:
- Arma más usada: ${matchContext.weaponStats.mostUsedWeapon}
- Total de armas diferentes: ${matchContext.weaponStats.totalUniqueWeapons}
- Headshots totales: ${matchContext.weaponStats.totalHeadshots} (${matchContext.weaponStats.headshotPercentage.toFixed(1)}% del total)

📊 TOP 5 ARMAS (con efectividad y precisión):
${topWeapons}

💡 NOTAS SOBRE ARMAS:
- La efectividad muestra el % de buenas jugadas con cada arma
- El % de headshots indica precisión y control del arma
- Considera mejorar el uso de armas con baja efectividad o cambiarlas por alternativas`
  }

  const basePrompt = `Eres TACTICORE Bot, un entrenador profesional de Counter-Strike con años de experiencia analizando partidas competitivas. Tu rol es actuar como un coach personal que identifica los puntos más críticos de mejora y proporciona consejos específicos y accionables.${userContext}

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
- Total de acciones analizadas: ${totalActions}${roundsAnalysis}${weaponAnalysis}`

  let specializedInstructions = ""

  switch (queryType) {
    case "round-specific":
      specializedInstructions = `

🎯 ENFOQUE ESPECIALIZADO: ANÁLISIS DE RONDA ESPECÍFICA
El usuario preguntó sobre una ronda en particular. Proporciona:
- Análisis detallado de cada kill en esa ronda
- Decisiones tácticas tomadas (buenas y malas)
- Qué cambiar específicamente en situaciones similares
- Timing y posicionamiento en esa ronda
- Impacto de cada acción en el resultado de la ronda`
      break

    case "weapons":
      specializedInstructions = `

🔫 ENFOQUE ESPECIALIZADO: ANÁLISIS DE ARMAS
El usuario preguntó sobre armas. Enfócate en:
- Efectividad de cada arma usada
- Recomendaciones de armas alternativas
- Ejercicios específicos para mejorar con armas problemáticas
- Situaciones en las que usar cada arma
- Análisis de headshot rate y cómo mejorar precisión`
      break

    case "positioning":
      specializedInstructions = `

🗺️ ENFOQUE ESPECIALIZADO: POSICIONAMIENTO Y MAPA
El usuario preguntó sobre posicionamiento. Proporciona:
- Análisis de posiciones tomadas durante la partida
- Zonas del mapa donde mejorar
- Rotaciones y timing de movimientos
- Cobertura y ángulos utilizados
- Posiciones recomendadas para ${matchContext.map}`
      break

    case "economy":
      specializedInstructions = `

💰 ENFOQUE ESPECIALIZADO: ECONOMÍA Y COMPRAS
El usuario preguntó sobre economía. Analiza:
- Decisiones de compra basadas en armas usadas
- Cuándo hacer eco vs full buy
- Patrones de armas caras vs baratas
- Optimización del gasto en rondas específicas
- Estrategias económicas para mejorar`
      break

    case "timing":
      specializedInstructions = `

⏱️ ENFOQUE ESPECIALIZADO: TIMING Y TEMPO
El usuario preguntó sobre timing. Enfócate en:
- Análisis de cuándo ocurrieron los kills
- Early/mid/late round patterns
- Timing de entradas y pushes
- Cuándo ser agresivo vs pasivo
- Sincronización con el equipo`
      break

    case "general":
    default:
      specializedInstructions = `

COMO ENTRENADOR PROFESIONAL:
1. 🎯 ENFÓCATE EN LOS PUNTOS MÁS CRÍTICOS: Identifica las 2-3 áreas más importantes que necesitan mejora inmediata
2. 📈 ANÁLISIS ESPECÍFICO: Usa las estadísticas exactas de esta partida para dar consejos personalizados
3. 🛠️ CONSEJOS ACCIONABLES: Proporciona técnicas específicas y ejercicios prácticos
4. 🗺️ CONTEXTO DEL MAPA: Considera las características específicas de ${matchContext.map} en tus recomendaciones
5. ⚡ PRIORIZACIÓN: Enfócate en los cambios que tendrán mayor impacto en el rendimiento
6. 🎮 ANÁLISIS POR RONDAS: Identifica patrones de rendimiento por ronda y timing de kills
7. 🔫 ANÁLISIS DE ARMAS: Evalúa la elección de armas y recomienda optimizaciones en el loadout`
      break
  }

  const criticalClarification = `
⚠️ IMPORTANTE - INTERPRETACIÓN DE JUGADAS:
- Una MALA JUGADA NO significa automáticamente que ${selectedUser || "el jugador"} murió
- En cada kill, verifica QUIÉN es el killer y QUIÉN es el victim:
  ${selectedUser ? `• Si ${selectedUser} es el KILLER → ${selectedUser} SOBREVIVIÓ ese enfrentamiento` : "• Si el jugador es el KILLER → El jugador SOBREVIVIÓ"}
  ${selectedUser ? `• Si ${selectedUser} es el VICTIM → ${selectedUser} murió en ese enfrentamiento` : "• Si el jugador es el VICTIM → El jugador murió"}
  
🔍 CUANDO EL USUARIO ES LA VÍCTIMA (VICTIM):
${selectedUser ? `- Si ${selectedUser} aparece como VICTIM en un kill, significa que ${selectedUser} PERDIÓ ese enfrentamiento` : "- Si el jugador aparece como VICTIM, perdió ese enfrentamiento"}
- Si es una BUENA JUGADA donde el usuario es victim:
  • Explica que el atacante tenía mejor posicionamiento o ventaja táctica
  • Reconoce que el usuario pudo haber hecho las cosas correctamente, pero el oponente ejecutó mejor
  • Enfatiza que en CS a veces el oponente simplemente tiene la ventaja posicional/numérica
  • Da consejos sobre cómo evitar esas situaciones desventajosas en el futuro
- Si es una MALA JUGADA donde el usuario es victim:
  • Indica claramente que el usuario perdió el enfrentamiento
  • Explica qué error cometió el usuario que resultó en su muerte
  • Proporciona estrategias para evitar ese error en situaciones similares

🎯 CUANDO EL USUARIO ES EL ATACANTE (KILLER):
${selectedUser ? `- Si ${selectedUser} aparece como KILLER, significa que ${selectedUser} GANÓ ese enfrentamiento y sobrevivió` : "- Si el jugador aparece como KILLER, ganó y sobrevivió"}
- Si es una MALA JUGADA donde el usuario es killer:
  • El usuario SOBREVIVIÓ pero la jugada fue subóptima (mal posicionamiento, timing incorrecto, no esperar refuerzos, exposición innecesaria)
  • NUNCA digas "esto resultó en tu muerte" o "perdiste la vida" cuando el usuario es el killer
  • Enfócate en POR QUÉ fue mala jugada a pesar de conseguir el kill

- Una mala jugada puede ser por:
  • Mal posicionamiento (aunque no murió)
  • Decisión táctica pobre (timing incorrecto, no esperar refuerzos)
  • Exposición innecesaria al riesgo
  • Kill poco estratégico (aunque exitoso)
  • Uso ineficiente de recursos
- NUNCA asumas que una mala jugada resultó en muerte a menos que veas explícitamente al jugador como VICTIM
- NUNCA te contradigas diciendo "esto resultó en tu eliminación" si el jugador es el killer en ese kill
`

  return (
    basePrompt +
    specializedInstructions +
    criticalClarification +
    `

ESTILO DE RESPUESTA:
- Tono profesional pero motivador, como un coach experimentado
- Máximo 300-400 palabras para mantener el enfoque
- Usa emojis estratégicamente para destacar puntos clave
- Siempre incluye al menos una técnica específica para practicar
- Responde en español
- Si hay datos detallados de kills, menciona patrones específicos
- Identifica kills críticos que cambiaron el rumbo de rondas
${selectedUser ? `- Dirígete al jugador directamente usando "tu" y "tus" (análisis personalizado para ${selectedUser})` : "- Usa lenguaje de equipo: 'el equipo', 'las estadísticas colectivas' (análisis general del equipo)"}

Tu objetivo es ayudar ${selectedUser ? "al jugador" : "al equipo"} a identificar y corregir los errores más impactantes para mejorar significativamente ${selectedUser ? "su" : "el"} rendimiento en futuras partidas.`
  )
}

export async function POST(request: NextRequest) {
  try {
    const { message, matchContext, queryType, selectedUser } = await request.json()

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

    const systemPrompt = buildSystemPrompt(matchContext, queryType || "general", selectedUser)

    const chatRequest: ChatGPTRequest = {
      model: "gpt-4o-mini",
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
      max_tokens: 1000,
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
