const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

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
  isBot?: boolean
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
  role?: string
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
    console.warn(`API call failed for ${operationName}, falling back to mock data:`, error)
    return mockData
  }
}

export class ApiService {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  async getMatches(user?: string | null): Promise<Match[]> {
    return fetchWithFallback(
      async () => {
        const url = user
          ? `${this.baseUrl}/api/matches?user=${encodeURIComponent(user)}`
          : `${this.baseUrl}/api/matches`
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

        const data = await response.json()

        if (data.predictions && Array.isArray(data.predictions)) {
          const processed = processBackendResponse(data)
          return processed.kills
        }

        if (data.kills && Array.isArray(data.kills)) {
          return data.kills
        }

        console.warn("Unknown response format for kills:", data)
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

  async addChatMessage(matchId: string, message: string): Promise<ChatMessage> {
    return fetchWithFallback(
      async () => {
        const response = await fetch(`${this.baseUrl}/api/matches/${matchId}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message }),
        })
        return handleResponse<ChatMessage>(response)
      },
      {
        id: Date.now(),
        user: "Usuario",
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

  async getHistoricalAnalytics(user?: string | null): Promise<AnalyticsData[]> {
    return fetchWithFallback(
      async () => {
        const url = user
          ? `${this.baseUrl}/api/analytics/historical?user=${encodeURIComponent(user)}`
          : `${this.baseUrl}/api/analytics/historical`
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
        const response = await fetch(url)
        return handleResponse<DashboardStats>(response)
      },
      mockDashboardStats,
      "getDashboardStats",
    )
  }

  async getMaps(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/api/maps`)
    return handleResponse<string[]>(response)
  }

  async getWeapons(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/api/weapons`)
    return handleResponse<string[]>(response)
  }

  async getUserProfile(username?: string | null): Promise<UserProfile> {
    return fetchWithFallback(
      async () => {
        if (!username) {
          throw new Error("Username is required for profile lookup")
        }
        const url = `${this.baseUrl}/api/users/${encodeURIComponent(username)}`
        const response = await fetch(url)
        const userDto = await handleResponse<any>(response)
        return this.mapUserDtoToProfile(userDto, username)
      },
      username ? createMockUserProfile(username) : mockUserProfile,
      "getUserProfile",
    )
  }

  private mapUserDtoToProfile(userDto: any, username: string): UserProfile {
    const totalGoodPlays = Math.floor((userDto.totalKills || 0) * 0.4)
    const totalBadPlays = Math.floor((userDto.totalKills || 0) * 0.15)
    const winRate = Math.min(Math.max((userDto.kdr || 0) * 45, 30), 85)
    const hoursPlayed = Math.floor((userDto.totalMatches || 0) * 0.8)

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
        totalRounds: Math.floor((userDto.totalMatches || 0) * 18),
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
        memberSince: "2024-01-15T00:00:00Z",
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
        const result = await handleResponse<{ users: Array<{ name: string }> }>(response)
        return result.users.map((u) => u.name)
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

  async uploadVideoFile(file: File): Promise<{ success: boolean; message: string }> {
    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch(`${this.baseUrl}/api/upload/video`, {
      method: "POST",
      body: formData,
    })
    return handleResponse<{ success: boolean; message: string }>(response)
  }

  async processUpload(metadata: any): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/api/upload/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(metadata),
    })
    return handleResponse<{ success: boolean; message: string }>(response)
  }

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

  async getMatchStatus(matchId: string): Promise<{
    id: string
    status: string
    message: string
  }> {
    const response = await fetch(`${this.baseUrl}/api/matches/${matchId}/status`)
    return handleResponse<{ id: string; status: string; message: string }>(response)
  }

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

export const apiService = new ApiService()
