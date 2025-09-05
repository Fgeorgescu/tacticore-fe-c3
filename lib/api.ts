const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Tipos de datos
export interface Match {
  id: string;
  fileName: string;
  hasVideo?: boolean;
  map: string;
  gameType: string;
  kills: number;
  deaths: number;
  goodPlays: number;
  badPlays: number;
  duration: string;
  score: number;
  date: string;
}

export interface Kill {
  id: number;
  killer: string;
  victim: string;
  weapon: string;
  isGoodPlay: boolean;
  round: number;
  time: string;
  teamAlive: { ct: number; t: number };
  position: string;
}

export interface ChatMessage {
  id: number;
  user: string;
  message: string;
  timestamp: string;
}

export interface AnalyticsData {
  date: string;
  kills: number;
  deaths: number;
  kdr: number;
  score: number;
  goodPlays: number;
  badPlays: number;
  matches: number;
}

export interface DashboardStats {
  totalMatches: number;
  totalKills: number;
  totalDeaths: number;
  totalGoodPlays: number;
  totalBadPlays: number;
  averageScore: number;
  kdr: number;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  preferences?: any;
}

// Función helper para manejar errores de fetch
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
  }
  return response.json();
}

// API Service
export class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // Matches
  async getMatches(): Promise<Match[]> {
    const response = await fetch(`${this.baseUrl}/api/matches`);
    const result = await handleResponse<{ matches: Match[] }>(response);
    return result.matches;
  }

  async getMatch(id: string): Promise<Match> {
    const response = await fetch(`${this.baseUrl}/api/matches/${id}`);
    return handleResponse<Match>(response);
  }

  async getMatchKills(id: string): Promise<Kill[]> {
    const response = await fetch(`${this.baseUrl}/api/matches/${id}/kills`);
    const result = await handleResponse<{ kills: Kill[] }>(response);
    return result.kills;
  }

  async getMatchChat(id: string): Promise<ChatMessage[]> {
    const response = await fetch(`${this.baseUrl}/api/matches/${id}/chat`);
    return handleResponse<ChatMessage[]>(response);
  }

  async addChatMessage(matchId: string, message: string): Promise<ChatMessage> {
    const response = await fetch(`${this.baseUrl}/api/matches/${matchId}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });
    return handleResponse<ChatMessage>(response);
  }

  async deleteMatch(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/matches/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete match: ${response.statusText}`);
    }
  }

  // Analytics
  async getHistoricalAnalytics(): Promise<AnalyticsData[]> {
    const response = await fetch(`${this.baseUrl}/api/analytics/historical`);
    const result = await handleResponse<{ data: AnalyticsData[] }>(response);
    return result.data;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const response = await fetch(`${this.baseUrl}/api/analytics/dashboard`);
    return handleResponse<DashboardStats>(response);
  }

  // Maps and Weapons
  async getMaps(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/api/maps`);
    return handleResponse<string[]>(response);
  }

  async getWeapons(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/api/weapons`);
    return handleResponse<string[]>(response);
  }

  // User Profile
  async getUserProfile(): Promise<UserProfile> {
    const response = await fetch(`${this.baseUrl}/api/user/profile`);
    return handleResponse<UserProfile>(response);
  }

  async updateUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    const response = await fetch(`${this.baseUrl}/api/user/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profile),
    });
    return handleResponse<UserProfile>(response);
  }

  // File Uploads
  async uploadDemFile(file: File): Promise<{ 
    success: boolean; 
    message: string; 
    id?: string;
    fileName?: string;
    status?: string;
    aiResponse?: any;
    totalKills?: number;
    map?: string;
    tickrate?: number;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/api/upload/dem`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<{ 
      success: boolean; 
      message: string; 
      id?: string;
      fileName?: string;
      status?: string;
      aiResponse?: any;
      totalKills?: number;
      map?: string;
      tickrate?: number;
    }>(response);
  }

  async uploadVideoFile(file: File): Promise<{ success: boolean; message: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/api/upload/video`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  }

  async processUpload(metadata: any): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/api/upload/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  }

  // Health check
  async ping(): Promise<{ status: string; timestamp: string; service: string }> {
    const response = await fetch(`${this.baseUrl}/api/health`);
    const healthText = await response.text();
    return {
      status: response.ok ? "ok" : "error",
      timestamp: new Date().toISOString(),
      service: healthText
    };
  }
}

// Instancia global del servicio
export const apiService = new ApiService();
