const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://65ov51asvd.execute-api.us-east-1.amazonaws.com/prod"

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
  status?: "processing" | "completed" | "failed"
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
  // Si está configurado para usar mock data, retornar directamente
  if (USE_MOCK_DATA) {
    console.log(`[v0] Using mock data for ${operationName}`)
    return mockData
  }

  try {
    console.log(`[v0] Attempting real API call for ${operationName}`)
    return await fetchFn()
  } catch (error) {
    console.warn(`[v0] API call failed for ${operationName}, falling back to mock data:`, error)
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
        console.log("API: getMatches called with user:", user, "URL:", url)
        const response = await fetch(url)
        const result = await handleResponse<{ matches: Match[] }>(response)
        return result.matches
      },
      mockMatches,
      "getMatches",
    )
  }

  async getMatch(id: string): Promise<Match> {
    return fetchWithFallback(
      async () => {
        const response = await fetch(`${this.baseUrl}/api/matches/${id}`)
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
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        // Leer la respuesta una sola vez
        const data = await response.json()

        console.log(`[api] getMatchKills response for match ${id}:`, {
          hasPredictions: !!data.predictions,
          predictionsCount: data.predictions?.length || 0,
          hasKills: !!data.kills,
          killsCount: data.kills?.length || 0,
          totalKills: data.total_kills,
          map: data.map,
        })

        // Verificar si tiene el formato nuevo con predictions
        if (data.predictions && Array.isArray(data.predictions)) {
          const processed = processBackendResponse(data)
          console.log(`[api] Processed ${processed.kills.length} kills from predictions`)
          return processed.kills
        }

        // Formato del backend: { kills: [...], matchId: "...", filteredBy: "..." }
        if (data.kills && Array.isArray(data.kills)) {
          console.log(`[api] Returning ${data.kills.length} kills from backend format`)
          return data.kills
        }

        // Si no tiene ninguno de los formatos esperados, retornar array vacío
        console.warn("[api] Unknown response format for kills:", data)
        return []
      },
      mockKills[id] || mockKills["1"],
      `getMatchKills(${id})`,
    )
  }

  async getMatchChat(id: string): Promise<ChatMessage[]> {
    return fetchWithFallback(
      async () => {
        const response = await fetch(`${this.baseUrl}/api/matches/${id}/chat`)
        return handleResponse<ChatMessage[]>(response)
      },
      mockChatMessages[id] || mockChatMessages["1"],
      `getMatchChat(${id})`,
    )
  }

  async addChatMessage(matchId: string, message: string, user = "Usuario"): Promise<ChatMessage> {
    return fetchWithFallback(
      async () => {
        const response = await fetch(`${this.baseUrl}/api/matches/${matchId}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user, message }),
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
      console.log(`[v0] Mock: Deleting match ${id}`)
      return
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/matches/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        throw new Error(`Failed to delete match: ${response.statusText}`)
      }
    } catch (error) {
      console.warn(`[v0] Failed to delete match ${id}:`, error)
      throw error
    }
  }

  async getMatchStatus(matchId: string): Promise<{
    id: string
    status: string
    message: string
  }> {
    const response = await fetch(`${this.baseUrl}/api/matches/${matchId}/status`)
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
        console.log("API: getHistoricalAnalytics called with params:", { user, timeRange, metric })
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
          ? `${this.baseUrl}/api/analytics/dashboard?user=${encodeURIComponent(user)}`
          : `${this.baseUrl}/api/analytics/dashboard`
        console.log("API: getDashboardStats called with user:", user, "URL:", url)
        const response = await fetch(url)
        return handleResponse<DashboardStats>(response)
      },
      mockDashboardStats,
      "getDashboardStats",
    )
  }

  // Maps and Weapons
  async getMaps(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/api/maps`)
    return handleResponse<string[]>(response)
  }

  async getWeapons(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/api/weapons`)
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
    const response = await fetch(`${this.baseUrl}/api/users`)
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
    const response = await fetch(`${this.baseUrl}/api/users/${encodeURIComponent(name)}`)
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
    const response = await fetch(`${this.baseUrl}/api/users/exists/${encodeURIComponent(name)}`)
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
    const response = await fetch(`${this.baseUrl}/api/users/role/${encodeURIComponent(role)}`)
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
    const response = await fetch(`${this.baseUrl}/api/users/top/score`)
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
    const response = await fetch(`${this.baseUrl}/api/users/top/kills`)
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
    const response = await fetch(`${this.baseUrl}/api/users/top/kdr`)
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

  async getTopPlayersByMatches(minMatches = 5): Promise<
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
    const response = await fetch(`${this.baseUrl}/api/users/top/matches?minMatches=${minMatches}`)
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

  async createUser(
    name: string,
    role: string,
  ): Promise<{
    id: number
    name: string
    role: string
    averageScore: number
    totalKills: number
    totalDeaths: number
    totalMatches: number
    kdr: number
  }> {
    const response = await fetch(`${this.baseUrl}/api/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, role }),
    })
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

  async getRoles(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/api/users/roles`)
    return handleResponse<string[]>(response)
  }

  async getUserStats(): Promise<{
    totalUsers: number
    averageScore: number
    totalKills: number
    totalDeaths: number
    totalMatches: number
    roleStats: Array<[string, number, number, number]>
  }> {
    const response = await fetch(`${this.baseUrl}/api/users/stats`)
    return handleResponse<{
      totalUsers: number
      averageScore: number
      totalKills: number
      totalDeaths: number
      totalMatches: number
      roleStats: Array<[string, number, number, number]>
    }>(response)
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
    const response = await fetch(`${this.baseUrl}/api/user/profile`, {
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
        const response = await fetch(`${this.baseUrl}/api/users/search?name=${encodeURIComponent(query)}`)
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
        const response = await fetch(`${this.baseUrl}/api/users/${encodeURIComponent(username)}`)
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

  // File Uploads
  async uploadDemFile(file: File): Promise<{
    success: boolean
    message: string
    id?: string
    fileName?: string
    status?: string
    aiResponse?: any
    totalKills?: number
    map?: string
    tickrate?: number
  }> {
    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch(`${this.baseUrl}/api/upload/dem`, {
      method: "POST",
      body: formData,
    })
    return handleResponse<{
      success: boolean
      message: string
      id?: string
      fileName?: string
      status?: string
      aiResponse?: any
      totalKills?: number
      map?: string
      tickrate?: number
    }>(response)
  }

  async uploadVideoFile(file: File, matchId?: string): Promise<{ id: string; matchId: string; status: string }> {
    const formData = new FormData()
    formData.append("file", file)
    if (matchId) {
      formData.append("matchId", matchId)
    }

    const response = await fetch(`${this.baseUrl}/api/upload/video`, {
      method: "POST",
      body: formData,
    })
    return handleResponse<{ id: string; matchId: string; status: string }>(response)
  }

  async processUpload(matchId: string): Promise<{ matchId: string; status: string; estimatedTime: number }> {
    const response = await fetch(`${this.baseUrl}/api/upload/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ matchId }),
    })
    return handleResponse<{ matchId: string; status: string; estimatedTime: number }>(response)
  }

  // New method for uploading matches with processing status
  async uploadMatch(
    demFile: File,
    videoFile?: File,
    metadata?: any,
  ): Promise<{
    id: string
    status: string
    message: string
  }> {
    const formData = new FormData()
    formData.append("demFile", demFile)

    if (videoFile) {
      formData.append("videoFile", videoFile)
    }

    if (metadata) {
      formData.append("metadata", JSON.stringify(metadata))
    }

    const response = await fetch(`${this.baseUrl}/api/matches`, {
      method: "POST",
      body: formData,
    })
    return handleResponse<{ id: string; status: string; message: string }>(response)
  }

  // Health check
  async ping(): Promise<{ status: string; timestamp: string; service: string }> {
    const response = await fetch(`${this.baseUrl}/api/health`)
    const healthText = await response.text()
    return {
      status: response.ok ? "ok" : "error",
      timestamp: new Date().toISOString(),
      service: healthText,
    }
  }
}

// Instancia global del servicio
export const apiService = new ApiService()
