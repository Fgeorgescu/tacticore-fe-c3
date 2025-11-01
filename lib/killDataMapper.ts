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
  context: {
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
    attacker_image_x: number
    attacker_image_y: number
    victim_image_x: number
    victim_image_y: number
    debug_attacker: any
    debug_victim: any
  }
  is_good_play: boolean
  confidence: number
  reasoning: string
}

// Función para mapear datos del backend a la estructura del frontend
export function mapBackendKillData(backendData: BackendKillData[]): Kill[] {
  return backendData.map((kill, index) => ({
    id: index + 1,
    killer: kill.attacker,
    victim: kill.victim,
    weapon: kill.weapon,
    isGoodPlay: kill.is_good_play,
    round: kill.round,
    time: formatTimeInRound(kill.time_in_round),
    teamAlive: { ct: 5, t: 5 }, // Esto debería venir del backend
    position: kill.place,
    attackerPosition: {
      x: kill.context.attacker_x,
      y: kill.context.attacker_y,
      z: kill.context.attacker_z
    },
    victimPosition: {
      x: kill.context.victim_x,
      y: kill.context.victim_y,
      z: kill.context.victim_z
    },
    attackerImagePosition: {
      x: kill.context.attacker_image_x,
      y: kill.context.attacker_image_y
    },
    victimImagePosition: {
      x: kill.context.victim_image_x,
      y: kill.context.victim_image_y
    }
  }))
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

  const kills = mapBackendKillData(response.predictions || [])
  
  return {
    kills,
    totalKills: response.total_kills || 0,
    map: response.map || "Unknown",
    tickrate: response.tickrate || 64
  }
}
