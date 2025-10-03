const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

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

import {
  mockMatches,
  mockKills,
  mockChatMessages,
  mockAnalyticsData,
  mockDashboardStats,
  mockUserProfile,
  createMockUserProfile,
} from "./mockData"

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
        const result = await handleResponse<{ kills: Kill[] }>(response)
        return result.kills
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

  // Analytics
  async getHistoricalAnalytics(user?: string | null): Promise<AnalyticsData[]> {
    return fetchWithFallback(
      async () => {
        const url = user
          ? `${this.baseUrl}/api/analytics/historical?user=${encodeURIComponent(user)}`
          : `${this.baseUrl}/api/analytics/historical`
        console.log("API: getHistoricalAnalytics called with user:", user, "URL:", url)
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

  // User Profile
  async getUserProfile(username?: string | null): Promise<UserProfile> {
    return fetchWithFallback(
      async () => {
        const url = username
          ? `${this.baseUrl}/api/users/${encodeURIComponent(username)}/profile`
          : `${this.baseUrl}/api/user/profile`
        const response = await fetch(url)
        return handleResponse<UserProfile>(response)
      },
      username ? createMockUserProfile(username) : mockUserProfile,
      "getUserProfile",
    )
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

  // Method to check match processing status
  async getMatchStatus(matchId: string): Promise<{
    id: string
    status: string
    message: string
  }> {
    const response = await fetch(`${this.baseUrl}/api/matches/${matchId}/status`)
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
