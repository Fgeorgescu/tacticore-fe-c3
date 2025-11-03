import { Kill } from "./api"

// Interfaz para los datos de map-data.json
interface MapDataConfig {
  pos_x: number
  pos_y: number
  scale: number
}

// Cache para map-data.json
let mapDataCache: Record<string, MapDataConfig> | null = null

// Cargar map-data.json
async function loadMapData(): Promise<Record<string, MapDataConfig> | null> {
  if (mapDataCache) {
    return mapDataCache
  }
  
  try {
    const response = await fetch("/maps/map-data.json")
    if (!response.ok) {
      console.warn("[killDataMapper] No se pudo cargar map-data.json")
      return null
    }
    mapDataCache = await response.json()
    return mapDataCache
  } catch (error) {
    console.warn("[killDataMapper] Error cargando map-data.json:", error)
    return null
  }
}

// Calcular coordenadas de imagen desde coordenadas del juego usando map-data.json
function calculateImageCoordinates(
  gameX: number,
  gameY: number,
  mapName: string,
  mapData: Record<string, MapDataConfig> | null,
  imageWidth: number = 1024,
  imageHeight: number = 1024
): { x: number; y: number } | null {
  if (!mapData) {
    console.warn(`[killDataMapper] No hay mapData disponible para calcular coordenadas`)
    return null
  }
  
  // Normalizar el nombre del mapa
  let normalizedMapName = mapName.toLowerCase()
  
  // Si no tiene prefijo "de_", intentar agregarlo
  if (!normalizedMapName.startsWith("de_") && !normalizedMapName.startsWith("cs_") && !normalizedMapName.startsWith("ar_")) {
    normalizedMapName = `de_${normalizedMapName}`
  }
  
  const mapConfig = mapData[normalizedMapName]
  
  if (!mapConfig) {
    // Intentar sin prefijo también
    const nameWithoutPrefix = normalizedMapName.replace(/^(de_|cs_|ar_)/, "")
    const altConfig = mapData[nameWithoutPrefix] || mapData[mapName.toLowerCase()]
    
    if (!altConfig) {
      console.warn(`[killDataMapper] No hay configuración para mapa: ${mapName} (intentó: ${normalizedMapName}, ${nameWithoutPrefix})`, {
        availableMaps: Object.keys(mapData)
      })
      return null
    }
    
    // Usar la configuración alternativa encontrada
    const centeredX = gameX - altConfig.pos_x
    const centeredY = gameY - altConfig.pos_y
    const scaledX = centeredX / altConfig.scale
    const scaledY = centeredY / altConfig.scale
    const imageX = (imageWidth / 2) + scaledX
    const imageY = (imageHeight / 2) + scaledY
    
    console.log(`[killDataMapper] Calculated coords for ${mapName} using alt config:`, { gameX, gameY, imageX, imageY })
    return { x: imageX, y: imageY }
  }
  
  // Calcular coordenadas de imagen usando la fórmula del backend
  // Basado en: pos_x, pos_y (centro del mapa en coordenadas del juego) y scale
  const centeredX = gameX - mapConfig.pos_x
  const centeredY = gameY - mapConfig.pos_y
  
  // Escalar
  const scaledX = centeredX / mapConfig.scale
  const scaledY = centeredY / mapConfig.scale
  
  // Centrar en la imagen
  const imageX = (imageWidth / 2) + scaledX
  const imageY = (imageHeight / 2) + scaledY
  
  return { x: imageX, y: imageY }
}

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
export async function mapBackendKillData(
  backendData: BackendKillData[], 
  mapName: string = "Unknown"
): Promise<Kill[]> {
  // Cargar map-data.json una sola vez
  const mapData = await loadMapData()
  
  console.log(`[killDataMapper] Processing ${backendData.length} kills for map: ${mapName}`)
  console.log(`[killDataMapper] Map data loaded:`, mapData ? `Yes (${Object.keys(mapData).length} maps)` : "No")
  
  let killsWithoutCoords = 0
  let killsWithCoords = 0
  let killsWithCalculatedCoords = 0
  
  const mapped = await Promise.all(
    backendData.map(async (kill, index) => {
    // Preferir datos del contexto cuando estén disponibles
    const killer = kill.context?.attacker_name || kill.attacker
    const victim = kill.context?.victim_name || kill.victim
    const weapon = kill.context?.attacker_weapon || kill.weapon
    const place = kill.context?.place || kill.place
    
    // Usar time_in_round_s del contexto si está disponible, sino time_in_round
    const timeInRound = kill.context?.time_in_round_s ?? kill.time_in_round
    
    // Validar y extraer coordenadas de imagen
    let attackerImageX = kill.context?.attacker_image_x
    let attackerImageY = kill.context?.attacker_image_y
    let victimImageX = kill.context?.victim_image_x
    let victimImageY = kill.context?.victim_image_y
    
    let hasAttackerImageCoords = isValidCoordinate(attackerImageX) && isValidCoordinate(attackerImageY)
    let hasVictimImageCoords = isValidCoordinate(victimImageX) && isValidCoordinate(victimImageY)
    
    // Si no hay coordenadas de imagen pero hay coordenadas del juego, calcularlas usando map-data.json
    if (!hasAttackerImageCoords && kill.context && 
        isValidCoordinate(kill.context.attacker_x) && isValidCoordinate(kill.context.attacker_y)) {
      const calculated = calculateImageCoordinates(
        kill.context.attacker_x,
        kill.context.attacker_y,
        mapName,
        mapData
      )
      if (calculated) {
        attackerImageX = calculated.x
        attackerImageY = calculated.y
        hasAttackerImageCoords = true
        killsWithCalculatedCoords++
        console.log(`[killDataMapper] ✅ Calculated attacker image coords for kill ${index + 1} (${killer} -> ${victim}):`, {
          gameCoords: { x: kill.context.attacker_x, y: kill.context.attacker_y },
          imageCoords: calculated,
          mapName
        })
      } else {
        if (index < 3) {
          console.warn(`[killDataMapper] ❌ Failed to calculate attacker coords for kill ${index + 1}:`, {
            gameCoords: { x: kill.context.attacker_x, y: kill.context.attacker_y },
            mapName,
            hasMapData: !!mapData
          })
        }
      }
    }
    
    if (!hasVictimImageCoords && kill.context && 
        isValidCoordinate(kill.context.victim_x) && isValidCoordinate(kill.context.victim_y)) {
      const calculated = calculateImageCoordinates(
        kill.context.victim_x,
        kill.context.victim_y,
        mapName,
        mapData
      )
      if (calculated) {
        victimImageX = calculated.x
        victimImageY = calculated.y
        hasVictimImageCoords = true
        killsWithCalculatedCoords++
        console.log(`[killDataMapper] ✅ Calculated victim image coords for kill ${index + 1} (${killer} -> ${victim}):`, {
          gameCoords: { x: kill.context.victim_x, y: kill.context.victim_y },
          imageCoords: calculated,
          mapName
        })
      } else {
        if (index < 3) {
          console.warn(`[killDataMapper] ❌ Failed to calculate victim coords for kill ${index + 1}:`, {
            gameCoords: { x: kill.context.victim_x, y: kill.context.victim_y },
            mapName,
            hasMapData: !!mapData
          })
        }
      }
    }
    
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
          hasGameCoords: kill.context ? 
            (isValidCoordinate(kill.context.attacker_x) && isValidCoordinate(kill.context.attacker_y)) : false,
          contextKeys: kill.context ? Object.keys(kill.context) : []
        })
      }
    }
    
    // Obtener el lado del atacante
    const attackerSide = kill.context?.side
    const validSide = attackerSide === "ct" || attackerSide === "t" ? attackerSide : undefined
    
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
  )

  console.log(`[killDataMapper] Image coordinate stats: ${killsWithCoords} with coords (${killsWithCalculatedCoords} calculated), ${killsWithoutCoords} without`)

  return mapped
}

// Función para formatear el tiempo en la ronda
function formatTimeInRound(timeInSeconds: number): string {
  const minutes = Math.floor(timeInSeconds / 60)
  const seconds = Math.floor(timeInSeconds % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

// Función para procesar la respuesta completa del backend
export async function processBackendResponse(response: any): Promise<{
  kills: Kill[]
  totalKills: number
  map: string
  tickrate: number
}> {
  if (!response || response.status !== "success") {
    throw new Error("Invalid response format")
  }

  const predictions = response.predictions || []
  const mapName = response.map || "Unknown"
  console.log(`[killDataMapper] Processing ${predictions.length} predictions from backend for map: ${mapName}`)
  
  const kills = await mapBackendKillData(predictions, mapName)
  
  // Log de kills con coordenadas
  const killsWithImageCoords = kills.filter(k => k.attackerImagePosition || k.victimImagePosition)
  console.log(`[killDataMapper] Mapped ${kills.length} kills, ${killsWithImageCoords.length} with image coordinates`)
  
  return {
    kills,
    totalKills: response.total_kills || 0,
    map: mapName,
    tickrate: response.tickrate || 64
  }
}
