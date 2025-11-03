import { Kill } from "./api"

// Interfaz para los datos JSON que vienen del backend
interface BackendKillData {
  kill_id: string
  attacker: string
  victim: string
  place: string
  round: number
  weapon: string
  headshot: boolean
  distance: number
  time_in_round: number
  context?: {
    kill_tick: number
    attacker_name: string
    victim_name: string
    side: string
    place: string
    headshot: boolean
    attacker_weapon: string
    victim_weapon: string
    attacker_x: number
    attacker_y: number
    attacker_z: number
    attacker_health: number
    attacker_vel_x: number
    attacker_vel_y: number
    victim_x: number
    victim_y: number
    victim_z: number
    victim_health: number
    time_in_round_s: number
    distance_xy: number
    approach_align_deg: number | null
    flash_near: boolean
    smoke_near: boolean
    molotov_near: boolean
    he_near: boolean
    attacker_image_x?: number | null
    attacker_image_y?: number | null
    victim_image_x?: number | null
    victim_image_y?: number | null
    debug_attacker: any
    debug_victim: any
  }
  is_good_play?: boolean | null // Puede no estar presente
  prediction?: {
    predicted_label?: string
    confidence?: number
  }
  attacker_strengths?: {
    precise?: number
    good_decision?: number
    good_positioning?: number
    [key: string]: number | undefined
  }
  victim_errors?: {
    [key: string]: any
  }
  confidence?: number
  reasoning?: string
}

// Función helper para validar si un valor numérico es válido
function isValidCoordinate(value: number | null | undefined): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value)
}

// Función para mapear datos del backend a la estructura del frontend
export function mapBackendKillData(backendData: BackendKillData[]): Kill[] {
  let killsWithoutCoords = 0
  let killsWithCoords = 0
  
  const mapped = backendData.map((kill, index) => {
    // Preferir datos del contexto cuando estén disponibles
    const killer = kill.context?.attacker_name || kill.attacker
    const victim = kill.context?.victim_name || kill.victim
    const weapon = kill.context?.attacker_weapon || kill.weapon
    const place = kill.context?.place || kill.place
    
    // Usar time_in_round_s del contexto si está disponible, sino time_in_round
    const timeInRound = kill.context?.time_in_round_s ?? kill.time_in_round
    
    // Validar y extraer coordenadas de imagen
    const attackerImageX = kill.context?.attacker_image_x
    const attackerImageY = kill.context?.attacker_image_y
    const victimImageX = kill.context?.victim_image_x
    const victimImageY = kill.context?.victim_image_y
    
    const hasAttackerImageCoords = isValidCoordinate(attackerImageX) && isValidCoordinate(attackerImageY)
    const hasVictimImageCoords = isValidCoordinate(victimImageX) && isValidCoordinate(victimImageY)
    
    if (hasAttackerImageCoords || hasVictimImageCoords) {
      killsWithCoords++
    } else {
      killsWithoutCoords++
      if (killsWithoutCoords <= 3) {
        console.log(`[killDataMapper] Kill ${index + 1} missing image coords:`, {
          killer,
          victim,
          weapon,
          hasContext: !!kill.context,
          attackerImageX,
          attackerImageY,
          victimImageX,
          victimImageY,
          contextKeys: kill.context ? Object.keys(kill.context) : []
        })
      }
    }
    
    // Obtener el lado del atacante
    const attackerSide = kill.context?.side
    const validSide: "ct" | "t" | undefined = (attackerSide === "ct" || attackerSide === "t") ? attackerSide : undefined
    
    // Determinar isGoodPlay: verificar múltiples fuentes en orden de prioridad
    let isGoodPlay = false
    if (kill.is_good_play !== undefined && kill.is_good_play !== null) {
      // 1. Prioridad: campo is_good_play directo
      isGoodPlay = Boolean(kill.is_good_play)
    } else if (kill.attacker_strengths) {
      // 2. Nuevo formato: attacker_strengths (ej: { precise: 0.97 })
      // Si hay algún strength con valor > 0.5, considerarlo buena jugada
      const strengths = Object.values(kill.attacker_strengths).filter(v => typeof v === 'number') as number[]
      isGoodPlay = strengths.some(strength => strength > 0.5)
    } else if (kill.prediction?.predicted_label) {
      // 3. Formato antiguo: predicted_label de prediction
      const label = kill.prediction.predicted_label.toLowerCase()
      isGoodPlay = label === "good_decision" || label === "good_positioning" || label === "precise"
    }
    
    // Log para debug de is_good_play en los primeros kills
    if (index < 5) {
      console.log(`[killDataMapper] Kill ${index + 1}:`, {
        is_good_play: kill.is_good_play,
        predicted_label: kill.prediction?.predicted_label,
        attacker_strengths: kill.attacker_strengths,
        final_isGoodPlay: isGoodPlay
      })
    }
    
    return {
      id: index + 1,
      killer,
      victim,
      weapon,
      isGoodPlay: isGoodPlay, // Usar el valor calculado
      round: kill.round,
      time: formatTimeInRound(timeInRound),
      teamAlive: { ct: 5, t: 5 }, // Esto debería venir del backend
      position: place,
      attackerSide: validSide,
      attackerPosition: kill.context ? {
        x: kill.context.attacker_x,
        y: kill.context.attacker_y,
        z: kill.context.attacker_z
      } : undefined,
      victimPosition: kill.context ? {
        x: kill.context.victim_x,
        y: kill.context.victim_y,
        z: kill.context.victim_z
      } : undefined,
      attackerImagePosition: hasAttackerImageCoords ? {
        x: attackerImageX!,
        y: attackerImageY!
      } : undefined,
      victimImagePosition: hasVictimImageCoords ? {
        x: victimImageX!,
        y: victimImageY!
      } : undefined
    }
  })
  
  console.log(`[killDataMapper] Image coordinate stats: ${killsWithCoords} with coords, ${killsWithoutCoords} without`)
  
  return mapped
}

// Función para formatear el tiempo en la ronda
function formatTimeInRound(timeInSeconds: number): string {
  const minutes = Math.floor(timeInSeconds / 60)
  const seconds = Math.floor(timeInSeconds % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

// Función para procesar la respuesta completa del backend
export function processBackendResponse(response: any): {
  kills: Kill[]
  totalKills: number
  map: string
  tickrate: number
} {
  if (!response || response.status !== "success") {
    throw new Error("Invalid response format")
  }

  const predictions = response.predictions || []
  console.log(`[killDataMapper] Processing ${predictions.length} predictions from backend`)
  
  const kills = mapBackendKillData(predictions)
  
  // Log de kills con coordenadas
  const killsWithImageCoords = kills.filter(k => k.attackerImagePosition || k.victimImagePosition)
  console.log(`[killDataMapper] Mapped ${kills.length} kills, ${killsWithImageCoords.length} with image coordinates`)
  
  return {
    kills,
    totalKills: response.total_kills || 0,
    map: response.map || "Unknown",
    tickrate: response.tickrate || 64
  }
}
