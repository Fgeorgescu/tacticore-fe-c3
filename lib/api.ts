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
    console.log(`[v0] API Error Response - Status: ${response.status}, Body:`, errorText)
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
  }
  const data = await response.json()
  console.log(`[v0] API Success Response - Status: ${response.status}, Data:`, data)
  return data
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
        console.log("[v0] API Request: getMatches -", { user, url })
        const response = await fetch(url)

        const result = await handleResponse<Match[] | { matches: Match[] }>(response)
        console.log("[v0] getMatches result:", result)

        // If backend returns { matches: [...] }, extract the array
        if (result && typeof result === "object" && "matches" in result && Array.isArray(result.matches)) {
          return result.matches
        }

        // If backend returns [...] directly
        if (Array.isArray(result)) {
          return result
        }

        // Fallback to empty array
        console.warn("[v0] getMatches: Unexpected response format, returning empty array")
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
        console.log("[v0] API Request: getMatch -", { id, url })
        const response = await fetch(url)

        if (!response.ok) {
          console.log(`[v0] getMatch endpoint failed, trying to derive from getMatches`)
          // Intentar obtener el match desde el listado de matches
          const matches = await this.getMatches()
          const match = matches.find((m) => m.id === id)
          if (match) {
            console.log(`[v0] Found match in getMatches list:`, match)
            return match
          }
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await handleResponse<Match>(response)
        console.log("[v0] getMatch result:", result)
        return result
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
        console.log("[v0] API Request: getMatchKills -", { id, user, url })
        const response = await fetch(url)

        if (!response.ok) {
          console.log(`[v0] getMatchKills endpoint failed (${response.status}), generating from match data`)
          // Generar kills básicas desde la información de la partida
          const match = await this.getMatch(id)
          const generatedKills: Kill[] = []

          // Generar kills de ejemplo basadas en los datos de la partida
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

          console.log(`[v0] Generated ${generatedKills.length} kills from match data`)
          return generatedKills
        }

        const data = await response.json()
        console.log("[v0] getMatchKills raw response:", data)

        // Verificar si tiene el formato nuevo con predictions
        if (data.predictions && Array.isArray(data.predictions)) {
          const processed = processBackendResponse(data)
          console.log(`[v0] Processed ${processed.kills.length} kills from predictions`)
          return processed.kills
        }

        // Formato del backend: { kills: [...], matchId: "...", filteredBy: "..." }
        if (data.kills && Array.isArray(data.kills)) {
          console.log(`[v0] Returning ${data.kills.length} kills from backend format`)
          return data.kills
        }

        // Si no tiene ninguno de los formatos esperados, retornar array vacío
        console.warn("[v0] Unknown response format for kills:", data)
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
        console.log("[v0] API Request: getMatchChat -", { id, url })
        const response = await fetch(url)

        if (!response.ok) {
          console.log(`[v0] getMatchChat endpoint failed (${response.status}), returning initial bot message`)
          // Retornar mensaje inicial del bot cuando el endpoint no existe
          return [
            {
              id: 1,
              user: "Bot",
              message: "Si tienes una duda, puedes realizarme cualquier consulta",
              timestamp: new Date().toISOString(),
            },
          ]
        }

        const result = await handleResponse<ChatMessage[]>(response)
        console.log("[v0] getMatchChat result:", result)
        return result
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
        console.log("[v0] API Request: addChatMessage -", { matchId, url, body })
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        })
        const result = await handleResponse<ChatMessage>(response)
        console.log("[v0] addChatMessage result:", result)
        return result
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
      const url = `${this.baseUrl}/api/matches/${id}`
      console.log("[v0] API Request: deleteMatch -", { id, url })
      const response = await fetch(url, {
        method: "DELETE",
      })
      if (!response.ok) {
        const errorText = await response.text()
        console.log("[v0] deleteMatch error response:", errorText)
        throw new Error(`Failed to delete match: ${response.statusText}`)
      }
      console.log("[v0] deleteMatch success")
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
    const url = `${this.baseUrl}/api/matches/${matchId}/status`
    console.log("[v0] API Request: getMatchStatus -", { matchId, url })
    const response = await fetch(url)
    const result = await handleResponse<{ id: string; status: string; message: string }>(response)
    console.log("[v0] getMatchStatus result:", result)
    return result
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
        console.log("[v0] API Request: getHistoricalAnalytics -", { user, timeRange, metric, url })
        const response = await fetch(url)
        const result = await handleResponse<{ data: AnalyticsData[] }>(response)
        console.log("[v0] getHistoricalAnalytics result:", result)
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
        console.log("[v0] API Request: getDashboardStats (using matches endpoint) -", { user, url })
        const response = await fetch(url)

        const result = await handleResponse<Match[] | { matches: Match[] }>(response)

        let matches: Match[] = []

        // Extract matches array from response
        if (result && typeof result === "object" && "matches" in result && Array.isArray(result.matches)) {
          matches = result.matches
        } else if (Array.isArray(result)) {
          matches = result
        } else {
          console.warn("[v0] getDashboardStats: Unexpected response format")
          matches = []
        }

        console.log("[v0] getDashboardStats: Computing stats from matches:", matches)

        // Calculate stats from matches array
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

        console.log("[v0] getDashboardStats: Computed stats:", stats)
        return stats
      },
      mockDashboardStats,
      "getDashboardStats",
    )
  }

  // Maps and Weapons
  async getMaps(): Promise<string[]> {
    const url = `${this.baseUrl}/api/maps`
    console.log("[v0] API Request: getMaps -", { url })
    const response = await fetch(url)
    const result = await handleResponse<string[]>(response)
    console.log("[v0] getMaps result:", result)
    return result
  }

  async getWeapons(): Promise<string[]> {
    const url = `${this.baseUrl}/api/weapons`
    console.log("[v0] API Request: getWeapons -", { url })
    const response = await fetch(url)
    const result = await handleResponse<string[]>(response)
    console.log("[v0] getWeapons result:", result)
    return result
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
    console.log("[v0] API Request: getUsers -", { url })
    const response = await fetch(url)
    const result =
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
    console.log("[v0] getUsers result:", result)
    return result
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
    console.log("[v0] API Request: getUser -", { name, url })
    const response = await fetch(url)
    const result = await handleResponse<{
      id: number
      name: string
      role: string
      averageScore: number
      totalKills: number
      totalDeaths: number
      totalMatches: number
      kdr: number
    }>(response)
    console.log("[v0] getUser result:", result)
    return result
  }

  async userExists(name: string): Promise<boolean> {
    const url = `${this.baseUrl}/api/users/exists/${encodeURIComponent(name)}`
    console.log("[v0] API Request: userExists -", { name, url })
    const response = await fetch(url)
    const result = await handleResponse<boolean>(response)
    console.log("[v0] userExists result:", result)
    return result
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
    console.log("[v0] API Request: getUsersByRole -", { role, url })
    const response = await fetch(url)
    const result =
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
    console.log("[v0] getUsersByRole result:", result)
    return result
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
    console.log("[v0] API Request: getTopPlayersByScore -", { url })
    const response = await fetch(url)
    const result =
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
    console.log("[v0] getTopPlayersByScore result:", result)
    return result
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
    console.log("[v0] API Request: getTopPlayersByKills -", { url })
    const response = await fetch(url)
    const result =
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
    console.log("[v0] getTopPlayersByKills result:", result)
    return result
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
    console.log("[v0] API Request: getTopPlayersByKDR -", { url })
    const response = await fetch(url)
    const result =
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
    console.log("[v0] getTopPlayersByKDR result:", result)
    return result
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
    const url = `${this.baseUrl}/api/users/top/matches?minMatches=${minMatches}`
    console.log("[v0] API Request: getTopPlayersByMatches -", { minMatches, url })
    const response = await fetch(url)
    const result =
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
    console.log("[v0] getTopPlayersByMatches result:", result)
    return result
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
    const url = `${this.baseUrl}/api/users`
    const body = { name, role }
    console.log("[v0] API Request: createUser -", { url, body })
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
    const result = await handleResponse<{
      id: number
      name: string
      role: string
      averageScore: number
      totalKills: number
      totalDeaths: number
      totalMatches: number
      kdr: number
    }>(response)
    console.log("[v0] createUser result:", result)
    return result
  }

  async getRoles(): Promise<string[]> {
    const url = `${this.baseUrl}/api/users/roles`
    console.log("[v0] API Request: getRoles -", { url })
    const response = await fetch(url)
    const result = await handleResponse<string[]>(response)
    console.log("[v0] getRoles result:", result)
    return result
  }

  async getUserStats(): Promise<{
    totalUsers: number
    averageScore: number
    totalKills: number
    totalDeaths: number
    totalMatches: number
    roleStats: Array<[string, number, number, number]>
  }> {
    const url = `${this.baseUrl}/api/users/stats`
    console.log("[v0] API Request: getUserStats -", { url })
    const response = await fetch(url)
    const result = await handleResponse<{
      totalUsers: number
      averageScore: number
      totalKills: number
      totalDeaths: number
      totalMatches: number
      roleStats: Array<[string, number, number, number]>
    }>(response)
    console.log("[v0] getUserStats result:", result)
    return result
  }

  // User Profile
  async getUserProfile(username?: string | null): Promise<UserProfile> {
    return fetchWithFallback(
      async () => {
        if (!username) {
          throw new Error("Username is required for profile lookup")
        }
        const url = `${this.baseUrl}/api/users/${encodeURIComponent(username)}/profile`
        console.log("[v0] API Request: getUserProfile -", { username, url })
        const response = await fetch(url)
        const profile = await handleResponse<UserProfile>(response)
        console.log("[v0] getUserProfile result:", profile)
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
    console.log("[v0] API Request: updateUserProfile -", { url, profile })
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profile),
    })
    const result = await handleResponse<UserProfile>(response)
    console.log("[v0] updateUserProfile result:", result)
    return result
  }

  async searchUsers(query: string): Promise<string[]> {
    return fetchWithFallback(
      async () => {
        const url = `${this.baseUrl}/api/users/search?name=${encodeURIComponent(query)}`
        console.log("[v0] API Request: searchUsers -", { query, url })
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
        console.log("[v0] searchUsers result:", users)
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
        console.log("[v0] API Request: validateUser -", { username, url })
        const response = await fetch(url)
        if (response.status === 404) {
          console.log("[v0] validateUser result: User not found")
          return { isValid: false, error: "Usuario no encontrado" }
        }
        const user = await handleResponse<any>(response)
        console.log("[v0] validateUser result:", { isValid: true, user })
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
  async uploadDemFile(
    file: File,
    onProgress?: (progress: number) => void,
  ): Promise<{
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
    console.log("[v0] Starting DEM file upload with progress tracking")

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      const formData = new FormData()
      formData.append("file", file)

      // Track upload progress
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100)
          console.log(`[v0] Upload progress: ${percentComplete}%`)
          onProgress?.(percentComplete)
        }
      })

      // Handle completion
      xhr.addEventListener("load", () => {
        console.log(`[v0] Upload completed with status: ${xhr.status}`)
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText)
            console.log("[v0] Upload response:", response)
            resolve(response)
          } catch (error) {
            console.error("[v0] Error parsing upload response:", error)
            reject(new Error("Error parsing response"))
          }
        } else {
          console.error("[v0] Upload failed with status:", xhr.status)
          reject(new Error(`Upload failed with status ${xhr.status}`))
        }
      })

      // Handle errors
      xhr.addEventListener("error", () => {
        console.error("[v0] Upload error occurred")
        reject(new Error("Upload failed"))
      })

      // Handle abort
      xhr.addEventListener("abort", () => {
        console.log("[v0] Upload was aborted")
        reject(new Error("Upload aborted"))
      })

      // Start upload with 10 minute timeout
      xhr.open("POST", `${this.baseUrl}/api/upload/dem`)
      xhr.timeout = 600000 // 10 minutes
      xhr.send(formData)
    })
  }

  async uploadVideoFile(
    file: File,
    matchId?: string,
    onProgress?: (progress: number) => void,
  ): Promise<{ id: string; matchId: string; status: string }> {
    console.log("[v0] Starting video file upload with progress tracking")

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      const formData = new FormData()
      formData.append("file", file)
      if (matchId) {
        formData.append("matchId", matchId)
      }

      // Track upload progress
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100)
          console.log(`[v0] Video upload progress: ${percentComplete}%`)
          onProgress?.(percentComplete)
        }
      })

      // Handle completion
      xhr.addEventListener("load", () => {
        console.log(`[v0] Video upload completed with status: ${xhr.status}`)
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText)
            console.log("[v0] Video upload response:", response)
            resolve(response)
          } catch (error) {
            console.error("[v0] Error parsing video upload response:", error)
            reject(new Error("Error parsing response"))
          }
        } else {
          console.error("[v0] Video upload failed with status:", xhr.status)
          reject(new Error(`Upload failed with status ${xhr.status}`))
        }
      })

      // Handle errors
      xhr.addEventListener("error", () => {
        console.error("[v0] Video upload error occurred")
        reject(new Error("Upload failed"))
      })

      // Handle abort
      xhr.addEventListener("abort", () => {
        console.log("[v0] Video upload was aborted")
        reject(new Error("Upload aborted"))
      })

      // Start upload with 15 minute timeout
      xhr.open("POST", `${this.baseUrl}/api/upload/video`)
      xhr.timeout = 900000 // 15 minutes
      xhr.send(formData)
    })
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

  async uploadMatch(
    demFile: File,
    videoFile?: File,
    metadata?: any,
    onProgress?: (progress: number) => void,
  ): Promise<{
    id: string
    status: string
    message: string
  }> {
    console.log("[v0] Starting match upload with progress tracking")

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      const formData = new FormData()
      formData.append("demFile", demFile)

      if (videoFile) {
        formData.append("videoFile", videoFile)
      }

      if (metadata) {
        formData.append("metadata", JSON.stringify(metadata))
      }

      // Track upload progress
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100)
          console.log(`[v0] Match upload progress: ${percentComplete}%`)
          onProgress?.(percentComplete)
        }
      })

      // Handle completion
      xhr.addEventListener("load", () => {
        console.log(`[v0] Match upload completed with status: ${xhr.status}`)
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText)
            console.log("[v0] Match upload response:", response)
            resolve(response)
          } catch (error) {
            console.error("[v0] Error parsing match upload response:", error)
            reject(new Error("Error parsing response"))
          }
        } else {
          console.error("[v0] Match upload failed with status:", xhr.status)
          reject(new Error(`Upload failed with status ${xhr.status}`))
        }
      })

      // Handle errors
      xhr.addEventListener("error", () => {
        console.error("[v0] Match upload error occurred")
        reject(new Error("Upload failed"))
      })

      // Handle abort
      xhr.addEventListener("abort", () => {
        console.log("[v0] Match upload was aborted")
        reject(new Error("Upload aborted"))
      })

      // Start upload with 15 minute timeout for matches (can include video)
      xhr.open("POST", `${this.baseUrl}/api/matches`)
      xhr.timeout = 900000 // 15 minutes
      xhr.send(formData)
    })
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
