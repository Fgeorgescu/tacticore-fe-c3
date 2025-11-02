import type { Match, Kill, ChatMessage, AnalyticsData, DashboardStats, UserProfile } from "./api"

// Mock data para desarrollo sin backend

const generateExtensiveMockKills = (): Kill[] => {
  const kills: Kill[] = []
  let killId = 1

  const players = ["karrigan", "ropz", "frozen", "Twistzz", "rain"]
  const opponents = ["NiKo", "s1mple", "ZywOo", "device", "electronic"]
  const weapons = ["AK-47", "M4A4", "M4A1-S", "AWP", "Desert Eagle", "USP-S", "Glock-18"]
  const positions = ["A Site", "B Site", "Mid", "Long A", "Catwalk", "Tunnels", "Connector"]

  for (let round = 1; round <= 20; round++) {
    for (let killNum = 0; killNum < 10; killNum++) {
      const killer = players[Math.floor(Math.random() * players.length)]
      const victim = opponents[Math.floor(Math.random() * opponents.length)]
      const weapon = weapons[Math.floor(Math.random() * weapons.length)]
      const position = positions[Math.floor(Math.random() * positions.length)]
      const isGoodPlay = Math.random() > 0.3 // 70% good plays

      // Generate time in format "M:SS"
      const minutes = Math.floor(Math.random() * 2)
      const seconds = Math.floor(Math.random() * 60)
      const time = `${minutes}:${seconds.toString().padStart(2, "0")}`

      // Generate random positions on map (1024x1024 image)
      const attackerX = Math.floor(Math.random() * 900) + 50
      const attackerY = Math.floor(Math.random() * 900) + 50
      const victimX = attackerX + (Math.random() * 100 - 50)
      const victimY = attackerY + (Math.random() * 100 - 50)

      kills.push({
        id: killId++,
        killer,
        victim,
        weapon,
        isGoodPlay,
        round,
        time,
        teamAlive: {
          ct: Math.floor(Math.random() * 5) + 1,
          t: Math.floor(Math.random() * 5) + 1,
        },
        position,
        attackerImagePosition: { x: attackerX, y: attackerY },
        victimImagePosition: { x: victimX, y: victimY },
      })
    }
  }

  return kills
}

export const mockMatches: Match[] = [
  {
    id: "processing-1",
    fileName: "nuke_processing.dem",
    hasVideo: true,
    map: "Unknown",
    gameType: "Ranked",
    kills: 0,
    deaths: 0,
    goodPlays: 0,
    badPlays: 0,
    duration: "00:00",
    score: 0,
    date: new Date(Date.now() - 5 * 60 * 1000).toISOString().slice(0, -1), // 5 minutos atrás
    status: "processing",
  },
  {
    id: "1",
    fileName: "Partida Competitiva - Dust2",
    hasVideo: true,
    map: "de_dust2",
    gameType: "Ranked",
    kills: 200, // Updated to reflect 200 kills
    deaths: 18,
    goodPlays: 140, // Approximately 70% of 200
    badPlays: 60,
    duration: "45:32",
    score: 8.5,
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString().slice(0, -1), // 2 horas atrás
    status: "completed",
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
    status: "completed",
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
    status: "completed",
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
    status: "completed",
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
    status: "completed",
  },
]

export const mockKills: Record<string, Kill[]> = {
  "1": generateExtensiveMockKills(), // Using generated extensive mock data
  "2": generateExtensiveMockKills(), // Using generated extensive mock data
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

export const mockUsersList = [
  "ProPlayer_CS",
  "karrigan",
  "NiKo",
  "s1mple",
  "ZywOo",
  "device",
  "electronic",
  "Twistzz",
  "ropz",
  "frozen",
]

export const createMockUserValidation = (username: string) => {
  const profile = createMockUserProfile(username)
  return {
    isValid: true,
    user: {
      id: profile.id,
      name: profile.username,
      role: profile.role || "Player",
      averageScore: profile.stats.averageScore,
      totalKills: profile.stats.totalKills,
      totalDeaths: profile.stats.totalDeaths,
      totalMatches: profile.stats.totalMatches,
      kdr: profile.stats.kdr,
    },
  }
}
