"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"
import { Trophy, Loader2 } from "lucide-react"
import { useState } from "react"
import { useApi } from "@/hooks/useApi"
import { apiService } from "@/lib/api"
import { useUser } from "@/contexts/UserContext"

const CustomTooltip = ({ active, payload, label, labelMap }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-700 border border-gray-600 rounded-lg p-3">
        <p className="text-white font-semibold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {labelMap[entry.dataKey] || entry.dataKey}: {entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function HistoricalAnalytics() {
  const [timeRange, setTimeRange] = useState("all")
  const { selectedUser } = useUser()

  const {
    data: historicalData,
    loading,
    error,
    refetch,
  } = useApi(() => apiService.getHistoricalAnalytics(selectedUser?.value), [selectedUser])

  if (!selectedUser.value) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white mb-2">
            Para la demo, esta vista requiere seleccionar un usuario
          </h3>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-white">Cargando datos históricos...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <h3 className="text-destructive font-semibold mb-2">Error al cargar datos históricos</h3>
          <p className="text-sm text-white">{error}</p>
          <button className="mt-2 text-sm text-primary hover:underline" onClick={() => refetch()}>
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  const data = historicalData || []

  const getFilteredData = () => {
    return data
  }

  const getCumulativeData = () => {
    return data.map((item, index) => {
      const previousData = data.slice(0, index + 1)
      const totalKills = previousData.reduce((sum, d) => sum + d.kills, 0)
      const totalDeaths = previousData.reduce((sum, d) => sum + d.deaths, 0)
      const totalGoodPlays = previousData.reduce((sum, d) => sum + d.goodPlays, 0)
      const totalBadPlays = previousData.reduce((sum, d) => sum + d.badPlays, 0)
      const avgScore = previousData.reduce((sum, d) => sum + d.score, 0) / previousData.length

      return {
        ...item,
        totalKills,
        totalDeaths,
        totalGoodPlays,
        totalBadPlays,
        avgScore: Number(avgScore.toFixed(2)),
        cumulativeKDR: Number((totalKills / totalDeaths).toFixed(2)),
      }
    })
  }

  if (data.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Trophy className="h-16 w-16 text-white mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No hay datos históricos</h3>
          <p className="text-white">Sube algunas partidas para comenzar a ver tu progreso histórico.</p>
        </div>
      </div>
    )
  }

  const totalMatches = data.length
  const totalRounds = data.reduce((sum, d) => sum + (d.rounds || 1), 0)
  const totalKills = data.reduce((sum, d) => sum + d.kills, 0)
  const totalDeaths = data.reduce((sum, d) => sum + d.deaths, 0)
  const kdRatio = totalDeaths > 0 ? (totalKills / totalDeaths).toFixed(2) : totalKills.toFixed(2)
  const totalWins = data.filter((d) => d.result === "win").length
  const winRate = totalMatches > 0 ? ((totalWins / totalMatches) * 100).toFixed(1) : "0.0"
  const totalGoodPlays = data.reduce((sum, d) => sum + d.goodPlays, 0)
  const totalBadPlays = data.reduce((sum, d) => sum + d.badPlays, 0)
  const avgScore = totalMatches > 0 ? (data.reduce((sum, d) => sum + d.score, 0) / totalMatches).toFixed(0) : "0"
  const totalHours = data.reduce((sum, d) => sum + (d.duration || 0), 0) / 3600
  const favoriteMap = data.reduce((acc: any, d) => {
    acc[d.map] = (acc[d.map] || 0) + 1
    return acc
  }, {})
  const mostPlayedMap = Object.entries(favoriteMap).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || "N/A"
  const favoriteWeapon = data.reduce((acc: any, d) => {
    if (d.weapon) {
      acc[d.weapon] = (acc[d.weapon] || 0) + 1
    }
    return acc
  }, {})
  const mostUsedWeapon = Object.entries(favoriteWeapon).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || "N/A"

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 border-card-border">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center">
              <Trophy className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{selectedUser.label}</h2>
              <p className="text-white">Estadísticas Generales</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="bg-background/50 rounded-lg p-4">
              <p className="text-sm text-white mb-1">Total Partidas</p>
              <p className="text-2xl font-bold text-white">{totalMatches}</p>
            </div>
            <div className="bg-background/50 rounded-lg p-4">
              <p className="text-sm text-white mb-1">Total Rondas</p>
              <p className="text-2xl font-bold text-white">{totalRounds}</p>
            </div>
            <div className="bg-background/50 rounded-lg p-4">
              <p className="text-sm text-white mb-1">Total Kills</p>
              <p className="text-2xl font-bold text-green-500">{totalKills}</p>
            </div>
            <div className="bg-background/50 rounded-lg p-4">
              <p className="text-sm text-white mb-1">Total Deaths</p>
              <p className="text-2xl font-bold text-red-500">{totalDeaths}</p>
            </div>
            <div className="bg-background/50 rounded-lg p-4">
              <p className="text-sm text-white mb-1">K/D Ratio</p>
              <p className="text-2xl font-bold text-primary">{kdRatio}</p>
            </div>
            <div className="bg-background/50 rounded-lg p-4">
              <p className="text-sm text-white mb-1">Win Rate</p>
              <p className="text-2xl font-bold text-primary">{winRate}%</p>
            </div>
            <div className="bg-background/50 rounded-lg p-4">
              <p className="text-sm text-white mb-1">Buenas Jugadas</p>
              <p className="text-2xl font-bold text-green-500">{totalGoodPlays}</p>
            </div>
            <div className="bg-background/50 rounded-lg p-4">
              <p className="text-sm text-white mb-1">Malas Jugadas</p>
              <p className="text-2xl font-bold text-red-500">{totalBadPlays}</p>
            </div>
            <div className="bg-background/50 rounded-lg p-4">
              <p className="text-sm text-white mb-1">Puntaje Promedio</p>
              <p className="text-2xl font-bold text-primary">{avgScore}</p>
            </div>
            <div className="bg-background/50 rounded-lg p-4">
              <p className="text-sm text-white mb-1">Horas Jugadas</p>
              <p className="text-2xl font-bold text-white">{totalHours.toFixed(1)}</p>
            </div>
            <div className="bg-background/50 rounded-lg p-4">
              <p className="text-sm text-white mb-1">Mapa Favorito</p>
              <p className="text-lg font-bold text-white truncate">{mostPlayedMap}</p>
            </div>
            <div className="bg-background/50 rounded-lg p-4">
              <p className="text-sm text-white mb-1">Arma Favorita</p>
              <p className="text-lg font-bold text-white truncate">{mostUsedWeapon}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-heading text-white">Análisis Histórico</h1>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo</SelectItem>
            <SelectItem value="week">Última Semana</SelectItem>
            <SelectItem value="month">Último Mes</SelectItem>
            <SelectItem value="year">Último Año</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card/50 border-card-border">
          <CardHeader>
            <CardTitle>Progreso de Puntaje Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getFilteredData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fill: "#9CA3AF" }} />
                <YAxis stroke="#9CA3AF" tick={{ fill: "#9CA3AF" }} />
                <Tooltip content={<CustomTooltip labelMap={{ score: "Puntaje" }} />} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#ff851b"
                  strokeWidth={2}
                  dot={{ fill: "#ff851b", strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-card-border">
          <CardHeader>
            <CardTitle>Historial de Kills y Deaths</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={getCumulativeData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fill: "#9CA3AF" }} />
                <YAxis stroke="#9CA3AF" tick={{ fill: "#9CA3AF" }} />
                <Tooltip
                  content={<CustomTooltip labelMap={{ totalKills: "Total Kills", totalDeaths: "Total Deaths" }} />}
                />
                <Area
                  type="monotone"
                  dataKey="totalKills"
                  stackId="1"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="totalDeaths"
                  stackId="1"
                  stroke="#EF4444"
                  fill="#EF4444"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
