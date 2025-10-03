import type { Match, Kill, ChatMessage, AnalyticsData, DashboardStats, UserProfile } from "./api"

// Mock data para desarrollo sin backend
export const mockMatches: Match[] = [
  {
    id: "1",
    fileName: "Partida Competitiva - Dust2",
    hasVideo: true,
    map: "de_dust2",
    gameType: "Ranked",
    kills: 24,
    deaths: 18,
    goodPlays: 8,
    badPlays: 3,
    duration: "45:32",
    score: 8.5,
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString().slice(0, -1), // 2 horas atrás
  },
  {
    id: "2",
    fileName: "Entrenamiento - Mirage",
    hasVideo: false,
    map: "de_mirage",
    gameType: "Entrenamiento",
    kills: 31,
    deaths: 12,
    goodPlays: 12,
    badPlays: 2,
    duration: "38:15",
    score: 9.2,
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, -1), // 1 día atrás
  },
  {
    id: "3",
    fileName: "Casual - Inferno",
    hasVideo: true,
    map: "de_inferno",
    gameType: "Casual",
    kills: 18,
    deaths: 22,
    goodPlays: 5,
    badPlays: 7,
    duration: "42:18",
    score: 6.3,
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, -1), // 3 días atrás
  },
  {
    id: "4",
    fileName: "Ranked - Nuke",
    hasVideo: false,
    map: "de_nuke",
    gameType: "Ranked",
    kills: 22,
    deaths: 19,
    goodPlays: 9,
    badPlays: 4,
    duration: "48:45",
    score: 7.8,
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, -1), // 5 días atrás
  },
  {
    id: "5",
    fileName: "Competitiva - Overpass",
    hasVideo: true,
    map: "de_overpass",
    gameType: "Ranked",
    kills: 27,
    deaths: 15,
    goodPlays: 11,
    badPlays: 2,
    duration: "51:22",
    score: 8.9,
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, -1), // 7 días atrás
  },
]

export const mockKills: Record<string, Kill[]> = {
  "1": [
    {
      id: 1,
      killer: "karrigan",
      victim: "NiKo",
      weapon: "AK-47",
      isGoodPlay: true,
      round: 3,
      time: "1:45",
      teamAlive: { ct: 4, t: 3 },
      position: "A Site",
    },
    {
      id: 2,
      killer: "karrigan",
      victim: "s1mple",
      weapon: "AWP",
      isGoodPlay: true,
      round: 5,
      time: "1:23",
      teamAlive: { ct: 3, t: 4 },
      position: "Mid",
    },
    {
      id: 3,
      killer: "karrigan",
      victim: "ZywOo",
      weapon: "M4A4",
      isGoodPlay: false,
      round: 8,
      time: "0:58",
      teamAlive: { ct: 2, t: 2 },
      position: "B Site",
    },
  ],
}

export const mockChatMessages: Record<string, ChatMessage[]> = {
  "1": [
    {
      id: 1,
      user: "Sistema",
      message: "Análisis de partida iniciado",
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      isBot: true,
    },
    {
      id: 2,
      user: "AI Coach",
      message: "Excelente control del retroceso en la ronda 3. Tu posicionamiento en A Site fue óptimo.",
      timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      isBot: true,
    },
  ],
}

export const mockAnalyticsData: AnalyticsData[] = [
  {
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    kills: 18,
    deaths: 22,
    kdr: 0.82,
    score: 6.5,
    goodPlays: 4,
    badPlays: 8,
    matches: 3,
  },
  {
    date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    kills: 22,
    deaths: 19,
    kdr: 1.16,
    score: 7.2,
    goodPlays: 7,
    badPlays: 5,
    matches: 4,
  },
  {
    date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    kills: 25,
    deaths: 18,
    kdr: 1.39,
    score: 7.8,
    goodPlays: 9,
    badPlays: 4,
    matches: 5,
  },
  {
    date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    kills: 28,
    deaths: 16,
    kdr: 1.75,
    score: 8.3,
    goodPlays: 11,
    badPlays: 3,
    matches: 6,
  },
  {
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    kills: 31,
    deaths: 14,
    kdr: 2.21,
    score: 8.7,
    goodPlays: 13,
    badPlays: 2,
    matches: 7,
  },
  {
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    kills: 29,
    deaths: 15,
    kdr: 1.93,
    score: 8.5,
    goodPlays: 12,
    badPlays: 3,
    matches: 6,
  },
  {
    date: new Date().toISOString().split("T")[0],
    kills: 27,
    deaths: 16,
    kdr: 1.69,
    score: 8.2,
    goodPlays: 10,
    badPlays: 4,
    matches: 5,
  },
]

export const mockDashboardStats: DashboardStats = {
  totalMatches: 35,
  totalKills: 856,
  totalDeaths: 623,
  totalGoodPlays: 312,
  totalBadPlays: 145,
  averageScore: 7.8,
  kdr: 1.37,
}

export const createMockUserProfile = (username: string): UserProfile => ({
  id: `user_${username}`,
  username: username,
  email: `${username.toLowerCase()}@tacticore.gg`,
  avatar: "/gamer-avatar.png",
  role: "Entry Fragger",
  stats: {
    totalMatches: 156,
    totalRounds: 2847,
    totalKills: 3421,
    totalDeaths: 2156,
    totalGoodPlays: 892,
    totalBadPlays: 234,
    averageScore: 78.5,
    kdr: 1.59,
    winRate: 62.5,
    favoriteMap: "Dust 2",
    favoriteWeapon: "AK-47",
    hoursPlayed: 342.5,
    memberSince: "2024-01-15T00:00:00Z",
  },
  recentActivity: {
    lastMatchDate: "2025-02-10T18:30:00Z",
    matchesThisWeek: 12,
    matchesThisMonth: 45,
  },
  preferences: {
    theme: "dark",
    notifications: true,
  },
})

// Mantener la exportación original para compatibilidad
export const mockUserProfile: UserProfile = createMockUserProfile("ProPlayer_CS")
