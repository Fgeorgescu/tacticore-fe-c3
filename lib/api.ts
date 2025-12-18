const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://54.163.64.8:8443"

// Tipos de datos
export interface Match {
  id: string
  fileName: string
  hasVideo?: boolean
  map: string
  gameType: string
  kills: number
  deaths: number
  goodPlays: number
  badPlays: number
  duration: string
  score: number
  date: string
  status?: "uploading" | "processing" | "completed" | "failed"
}

export interface Kill {
  id: number
  killer: string
  victim: string
  weapon: string
  isGoodPlay: boolean
  round: number
  time: string
  teamAlive: { ct: number; t: number }
  position: string
  // Lado del atacante (ct o t)
  attackerSide?: "ct" | "t"
  // Coordenadas para visualización en mapa
  attackerPosition?: {
    x: number
    y: number
    z: number
  }
  victimPosition?: {
    x: number
    y: number
    z: number
  }
  // Coordenadas de imagen para mapas 2D
  attackerImagePosition?: {
    x: number
    y: number
  }
  victimImagePosition?: {
    x: number
    y: number
  }
}

export interface ChatMessage {
  id: number
  user: string
  message: string
  timestamp: string
  isBot?: boolean // Nueva propiedad para identificar mensajes del bot
}

export interface AnalyticsData {
  date: string
  kills: number
  deaths: number
  kdr: number
  score: number
  goodPlays: number
  badPlays: number
  matches: number
}

export interface DashboardStats {
  totalMatches: number
  totalKills: number
  totalDeaths: number
  totalGoodPlays: number
  totalBadPlays: number
  averageScore: number
  kdr: number
}

export interface UserProfile {
  id: string
  username: string
  email: string
  avatar?: string
  role?: string // Agregando campo de rol del jugador
  stats: {
    totalMatches: number
    totalRounds: number
    totalKills: number
    totalDeaths: number
    totalGoodPlays: number
    totalBadPlays: number
    averageScore: number
    kdr: number
    winRate: number
    favoriteMap: string
    favoriteWeapon: string
    hoursPlayed: number
    memberSince: string
  }
  recentActivity: {
    lastMatchDate: string
    matchesThisWeek: number
    matchesThisMonth: number
  }
  preferences?: {
    theme: string
    notifications: boolean
  }
}

export interface UserValidationResult {
  isValid: boolean
  user?: {
    id: string
    name: string
    role: string
    averageScore: number
    totalKills: number
    totalDeaths: number
    totalMatches: number
    kdr: number
  }
  error?: string
}

import {
  mockMatches,
  mockKills,
  mockChatMessages,
  mockAnalyticsData,
  mockDashboardStats,
  mockUserProfile,
  createMockUserProfile,
  mockUsersList,
  createMockUserValidation,
} from "./mockData"
import { processBackendResponse } from "./killDataMapper"

const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true"

// Función helper para manejar errores de fetch
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
  }
  return response.json()
}

async function fetchWithFallback<T>(fetchFn: () => Promise<T>, mockData: T, operationName: string): Promise<T> {
  if (USE_MOCK_DATA) {
    return mockData
  }

  try {
    return await fetchFn()
  } catch (error) {
    console.error(`API call failed for ${operationName}:`, error instanceof Error ? error.message : String(error))
    return mockData
  }
}

// API Service
export class ApiService {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  // Matches
  async getMatches(user?: string | null): Promise<Match[]> {
    return fetchWithFallback(
      async () => {
        const url = user
          ? `${this.baseUrl}/api/matches?user=${encodeURIComponent(user)}`
          : `${this.baseUrl}/api/matches`
        const response = await fetch(url)
        const result = await handleResponse<Match[] | { matches: Match[] }>(response)

        if (result && typeof result === "object" && "matches" in result && Array.isArray(result.matches)) {
          return result.matches
        }

        if (Array.isArray(result)) {
          return result
        }

        return []
      },
      mockMatches,
      "getMatches",
    )
  }

  async getMatch(id: string): Promise<Match> {
    return fetchWithFallback(
      async () => {
        const url = `${this.baseUrl}/api/matches/${id}`
        const response = await fetch(url)

        if (!response.ok) {
          const matches = await this.getMatches()
          const match = matches.find((m) => m.id === id)
          if (match) {
            return match
          }
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        return handleResponse<Match>(response)
      },
      mockMatches.find((m) => m.id === id) || mockMatches[0],
      `getMatch(${id})`,
    )
  }

  async getMatchKills(id: string, user?: string | null): Promise<Kill[]> {
    return fetchWithFallback(
      async () => {
        const url = user
          ? `${this.baseUrl}/api/matches/${id}/kills?user=${encodeURIComponent(user)}`
          : `${this.baseUrl}/api/matches/${id}/kills`
        const response = await fetch(url)

        if (!response.ok) {
          const match = await this.getMatch(id)
          const generatedKills: Kill[] = []

          for (let i = 0; i < Math.min(match.kills || 0, 20); i++) {
            generatedKills.push({
              id: i + 1,
              killer: user || "Player",
              victim: `Enemy ${i + 1}`,
              weapon: ["AK-47", "M4A4", "AWP", "Desert Eagle"][i % 4],
              isGoodPlay: i < (match.goodPlays || 0),
              round: Math.floor(i / 5) + 1,
              time: `${(i * 10) % 60}s`,
              teamAlive: {
                ct: 5 - (i % 3),
                t: 5 - ((i + 1) % 3),
              },
              position: ["A Site", "B Site", "Mid", "Long A"][i % 4],
            })
          }

          return generatedKills
        }

        const data = await response.json()

        if (data.predictions && Array.isArray(data.predictions)) {
          const processed = processBackendResponse(data)
          return processed.kills
        }

        if (data.kills && Array.isArray(data.kills)) {
          return data.kills
        }

        return []
      },
      mockKills[id] || mockKills["1"],
      `getMatchKills(${id})`,
    )
  }

  async getMatchChat(id: string): Promise<ChatMessage[]> {
    return fetchWithFallback(
      async () => {
        const url = `${this.baseUrl}/api/matches/${id}/chat`
        const response = await fetch(url)

        if (!response.ok) {
          return [
            {
              id: 1,
              user: "Bot",
              message: "Si tienes una duda, puedes realizarme cualquier consulta",
              timestamp: new Date().toISOString(),
            },
          ]
        }

        return handleResponse<ChatMessage[]>(response)
      },
      mockChatMessages[id] || mockChatMessages["1"],
      `getMatchChat(${id})`,
    )
  }

  async addChatMessage(matchId: string, message: string, user = "Usuario"): Promise<ChatMessage> {
    return fetchWithFallback(
      async () => {
        const url = `${this.baseUrl}/api/matches/${matchId}/chat`
        const body = { user, message }
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        })
        return handleResponse<ChatMessage>(response)
      },
      {
        id: Date.now(),
        user: user,
        message: message,
        timestamp: new Date().toISOString(),
        isBot: false,
      },
      `addChatMessage(${matchId})`,
    )
  }

  async deleteMatch(id: string): Promise<void> {
    if (USE_MOCK_DATA) {
      return
    }

    try {
      const url = `${this.baseUrl}/api/matches/${id}`
      const response = await fetch(url, {
        method: "DELETE",
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to delete match: ${response.statusText}`)
      }
    } catch (error) {
      console.error(`Failed to delete match ${id}:`, error)
      throw error
    }
  }

  async getMatchStatus(matchId: string): Promise<{
    id: string
    status: string
    message: string
  }> {
    const url = `${this.baseUrl}/api/matches/${matchId}/status`
    const response = await fetch(url)
    return handleResponse<{ id: string; status: string; message: string }>(response)
  }

  // Analytics
  async getHistoricalAnalytics(user?: string | null, timeRange?: string, metric?: string): Promise<AnalyticsData[]> {
    return fetchWithFallback(
      async () => {
        const params = new URLSearchParams()
        if (user) params.append("user", user)
        if (timeRange) params.append("timeRange", timeRange)
        if (metric) params.append("metric", metric)

        const url = `${this.baseUrl}/api/analytics/historical${params.toString() ? `?${params.toString()}` : ""}`
        const response = await fetch(url)
        const result = await handleResponse<{ data: AnalyticsData[] }>(response)
        return result.data
      },
      mockAnalyticsData,
      "getHistoricalAnalytics",
    )
  }

  async getDashboardStats(user?: string | null): Promise<DashboardStats> {
    return fetchWithFallback(
      async () => {
        const url = user
          ? `${this.baseUrl}/api/matches?user=${encodeURIComponent(user)}`
          : `${this.baseUrl}/api/matches`
        const response = await fetch(url)

        const result = await handleResponse<Match[] | { matches: Match[] }>(response)

        let matches: Match[] = []

        if (result && typeof result === "object" && "matches" in result && Array.isArray(result.matches)) {
          matches = result.matches
        } else if (Array.isArray(result)) {
          matches = result
        } else {
          matches = []
        }

        const stats: DashboardStats = {
          totalMatches: matches.length,
          totalKills: matches.reduce((sum, m) => sum + m.kills, 0),
          totalDeaths: matches.reduce((sum, m) => sum + m.deaths, 0),
          totalGoodPlays: matches.reduce((sum, m) => sum + m.goodPlays, 0),
          totalBadPlays: matches.reduce((sum, m) => sum + m.badPlays, 0),
          averageScore: matches.length > 0 ? matches.reduce((sum, m) => sum + m.score, 0) / matches.length : 0,
          kdr: 0,
        }
        stats.kdr = stats.totalDeaths > 0 ? stats.totalKills / stats.totalDeaths : stats.totalKills

        return stats
      },
      mockDashboardStats,
      "getDashboardStats",
    )
  }

  // Maps and Weapons
  async getMaps(): Promise<string[]> {
    const url = `${this.baseUrl}/api/maps`
    const response = await fetch(url)
    return handleResponse<string[]>(response)
  }

  async getWeapons(): Promise<string[]> {
    const url = `${this.baseUrl}/api/weapons`
    const response = await fetch(url)
    return handleResponse<string[]>(response)
  }

  async getUsers(): Promise<
    Array<{
      id: number
      name: string
      role: string
      averageScore: number
      totalKills: number
      totalDeaths: number
      totalMatches: number
      kdr: number
    }>
  > {
    const url = `${this.baseUrl}/api/users`
    const response = await fetch(url)
    return handleResponse<
      Array<{
        id: number
        name: string
        role: string
        averageScore: number
        totalKills: number
        totalDeaths: number
        totalMatches: number
        kdr: number
      }>
    >(response)
  }

  async getUser(name: string): Promise<{
    id: number
    name: string
    role: string
    averageScore: number
    totalKills: number
    totalDeaths: number
    totalMatches: number
    kdr: number
  }> {
    const url = `${this.baseUrl}/api/users/${encodeURIComponent(name)}`
    const response = await fetch(url)
    return handleResponse<{
      id: number
      name: string
      role: string
      averageScore: number
      totalKills: number
      totalDeaths: number
      totalMatches: number
      kdr: number
    }>(response)
  }

  async userExists(name: string): Promise<boolean> {
    const url = `${this.baseUrl}/api/users/exists/${encodeURIComponent(name)}`
    const response = await fetch(url)
    return handleResponse<boolean>(response)
  }

  async getUsersByRole(role: string): Promise<
    Array<{
      id: number
      name: string
      role: string
      averageScore: number
      totalKills: number
      totalDeaths: number
      totalMatches: number
      kdr: number
    }>
  > {
    const url = `${this.baseUrl}/api/users/role/${encodeURIComponent(role)}`
    const response = await fetch(url)
    return handleResponse<
      Array<{
        id: number
        name: string
        role: string
        averageScore: number
        totalKills: number
        totalDeaths: number
        totalMatches: number
        kdr: number
      }>
    >(response)
  }

  async getTopPlayersByScore(): Promise<
    Array<{
      id: number
      name: string
      role: string
      averageScore: number
      totalKills: number
      totalDeaths: number
      totalMatches: number
      kdr: number
    }>
  > {
    const url = `${this.baseUrl}/api/users/top/score`
    const response = await fetch(url)
    return handleResponse<
      Array<{
        id: number
        name: string
        role: string
        averageScore: number
        totalKills: number
        totalDeaths: number
        totalMatches: number
        kdr: number
      }>
    >(response)
  }

  async getTopPlayersByKills(): Promise<
    Array<{
      id: number
      name: string
      role: string
      averageScore: number
      totalKills: number
      totalDeaths: number
      totalMatches: number
      kdr: number
    }>
  > {
    const url = `${this.baseUrl}/api/users/top/kills`
    const response = await fetch(url)
    return handleResponse<
      Array<{
        id: number
        name: string
        role: string
        averageScore: number
        totalKills: number
        totalDeaths: number
        totalMatches: number
        kdr: number
      }>
    >(response)
  }

  async getTopPlayersByKDR(): Promise<
    Array<{
      id: number
      name: string
      role: string
      averageScore: number
      totalKills: number
      totalDeaths: number
      totalMatches: number
      kdr: number
    }>
  > {
    const url = `${this.baseUrl}/api/users/top/kdr`
    const response = await fetch(url)
    return handleResponse<
      Array<{
        id: number
        name: string
        role: string
        averageScore: number
        totalKills: number
        totalDeaths: number
        totalMatches: number
        kdr: number
      }>
    >(response)
  }

  // User Profile
  async getUserProfile(username?: string | null): Promise<UserProfile> {
    return fetchWithFallback(
      async () => {
        if (!username) {
          throw new Error("Username is required for profile lookup")
        }
        const url = `${this.baseUrl}/api/users/${encodeURIComponent(username)}/profile`
        const response = await fetch(url)
        const profile = await handleResponse<UserProfile>(response)
        return profile
      },
      username ? createMockUserProfile(username) : mockUserProfile,
      "getUserProfile",
    )
  }

  // Función helper para mapear UserDto del backend a UserProfile del frontend
  private mapUserDtoToProfile(userDto: any, username: string): UserProfile {
    // Calcular estadísticas derivadas
    const totalGoodPlays = Math.floor((userDto.totalKills || 0) * 0.4) // 40% de kills son buenas jugadas
    const totalBadPlays = Math.floor((userDto.totalKills || 0) * 0.15) // 15% de kills son malas jugadas
    const winRate = Math.min(Math.max((userDto.kdr || 0) * 45, 30), 85) // Estimar win rate basado en KDR
    const hoursPlayed = Math.floor((userDto.totalMatches || 0) * 0.8) // ~48 min por match

    // Mapas y armas favoritas simuladas basadas en el usuario
    const maps = ["de_dust2", "de_mirage", "de_inferno", "de_cache", "de_overpass"]
    const weapons = ["AK-47", "M4A4", "AWP", "Glock-18", "USP-S"]
    const favoriteMap = maps[username.length % maps.length]
    const favoriteWeapon = weapons[username.length % weapons.length]

    return {
      id: userDto.id?.toString() || `user_${username}`,
      username: username,
      email: `${username.toLowerCase()}@tacticore.gg`,
      avatar: "/gamer-avatar.png",
      role: userDto.role || "Player",
      stats: {
        totalMatches: userDto.totalMatches || 0,
        totalRounds: Math.floor((userDto.totalMatches || 0) * 18), // ~18 rondas por match
        totalKills: userDto.totalKills || 0,
        totalDeaths: userDto.totalDeaths || 0,
        totalGoodPlays: totalGoodPlays,
        totalBadPlays: totalBadPlays,
        averageScore: userDto.averageScore || 0,
        kdr: userDto.kdr || 0,
        winRate: winRate,
        favoriteMap: favoriteMap,
        favoriteWeapon: favoriteWeapon,
        hoursPlayed: hoursPlayed,
        memberSince: "2024-01-15T00:00:00Z", // Fecha fija para demo
      },
      recentActivity: {
        lastMatchDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        matchesThisWeek: Math.floor(Math.random() * 5) + 1,
        matchesThisMonth: Math.floor(Math.random() * 15) + 5,
      },
      preferences: {
        theme: "dark",
        notifications: true,
      },
    }
  }

  async updateUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    const url = `${this.baseUrl}/api/user/profile`
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profile),
    })
    return handleResponse<UserProfile>(response)
  }

  async searchUsers(query: string): Promise<string[]> {
    return fetchWithFallback(
      async () => {
        const url = `${this.baseUrl}/api/users/search?name=${encodeURIComponent(query)}`
        const response = await fetch(url)
        const users =
          await handleResponse<
            Array<{
              id: number
              name: string
              role: string
              averageScore: number
              totalKills: number
              totalDeaths: number
              totalMatches: number
              kdr: number
            }>
          >(response)
        return users.map((u) => u.name)
      },
      mockUsersList.filter((name) => name.toLowerCase().includes(query.toLowerCase())),
      `searchUsers(${query})`,
    )
  }

  async validateUser(username: string): Promise<UserValidationResult> {
    return fetchWithFallback(
      async () => {
        const url = `${this.baseUrl}/api/users/${encodeURIComponent(username)}`
        const response = await fetch(url)
        if (response.status === 404) {
          return { isValid: false, error: "Usuario no encontrado" }
        }
        const user = await handleResponse<any>(response)
        return {
          isValid: true,
          user: {
            id: user.id.toString(),
            name: user.name,
            role: user.role,
            averageScore: user.averageScore || 0,
            totalKills: user.totalKills || 0,
            totalDeaths: user.totalDeaths || 0,
            totalMatches: user.totalMatches || 0,
            kdr: user.kdr || 0,
          },
        }
      },
      createMockUserValidation(username),
      `validateUser(${username})`,
    )
  }

  async ping(): Promise<boolean> {
    if (USE_MOCK_DATA) {
      return true
    }

    try {
      const url = `${this.baseUrl}/api/health`
      const response = await fetch(url, {
        method: "GET",
        signal: AbortSignal.timeout(5000), // 5 second timeout
      })
      return response.ok
    } catch (error) {
      return false
    }
  }

  // File Uploads
  async uploadDemFile(
    file: File,
    metadata?: {
      playerName?: string
      notes?: string
    },
    onProgress?: (progress: number) => void,
    onStatusChange?: (status: "uploading" | "initiating-processing" | "processing") => void,
  ): Promise<{
    success: boolean
    message: string
    id?: string
    status?: string
  }> {
    console.log("[v0] Starting DEM file upload with new S3 flow")

    try {
      const { uploadToS3 } = await import("./s3-upload")

      let fileToUpload = file
      if (metadata?.playerName && metadata.playerName !== file.name) {
        fileToUpload = new File([file], metadata.playerName, { type: file.type })
      }

      console.log("[v0] Uploading file to S3...")
      const s3Result = await uploadToS3(fileToUpload, "dem", (progress) => {
        const percentage = Math.round(progress.percentage)
        console.log(`[v0] S3 upload progress: ${percentage}%`)
        onProgress?.(percentage)
      })

      console.log("[v0] File uploaded to S3:", s3Result)

      onStatusChange?.("initiating-processing")
      console.log("[v0] S3 upload complete, initiating processing...")

      await new Promise((resolve) => setTimeout(resolve, 1500))

      onStatusChange?.("processing")
      console.log("[v0] Transitioning to processing state...")

      console.log("[v0] Notifying backend to process file from S3...")

      const response = await fetch(`${this.baseUrl}/api/matches/s3`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bucket: s3Result.bucket,
          key: s3Result.s3Key,
          metadata: metadata || {},
        }),
      })

      const responseText = await response.text()
      console.log("[v0] Backend response status:", response.status)
      console.log("[v0] Backend response body:", responseText)

      if (!response.ok) {
        let errorMessage = "Error al procesar el archivo. Por favor, intente más tarde."

        try {
          const errorData = JSON.parse(responseText)
          console.error("[v0] Backend processing failed:", errorData)

          // Extract meaningful error message
          if (errorData.message) {
            if (errorData.message.includes("credentials")) {
              errorMessage = "Error de configuración del servidor. Contacte al administrador."
            } else {
              errorMessage = errorData.message
            }
          }
        } catch (parseError) {
          // If response is not JSON, use status text
          console.error("[v0] Could not parse error response:", parseError)
          errorMessage = `Error del servidor (${response.status}). Por favor, intente más tarde.`
        }

        return {
          success: false,
          message: errorMessage,
        }
      }

      const result = JSON.parse(responseText)
      console.log("[v0] Backend processing response:", result)

      return {
        success: result.status === "completed" || result.status === "processing",
        message: result.message || "Archivo procesado exitosamente",
        id: result.id,
        status: result.status,
      }
    } catch (error: any) {
      console.error("[v0] Upload error:", error)

      return {
        success: false,
        message: error.message || "Error al subir archivo. Por favor, intente más tarde.",
      }
    }
  }
}

export const apiService = new ApiService()
