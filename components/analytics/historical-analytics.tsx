"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from "recharts"
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

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card/50 border-card-border">
          <CardHeader>
            <CardTitle>Buenas vs Malas Jugadas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getFilteredData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fill: "#9CA3AF" }} />
                <YAxis stroke="#9CA3AF" tick={{ fill: "#9CA3AF" }} />
                <Tooltip
                  content={<CustomTooltip labelMap={{ goodPlays: "Buenas Jugadas", badPlays: "Malas Jugadas" }} />}
                />
                <Bar dataKey="goodPlays" fill="#10B981" />
                <Bar dataKey="badPlays" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-card-border">
          <CardHeader>
            <CardTitle>Distribución de Puntajes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getFilteredData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fill: "#9CA3AF" }} />
                <YAxis stroke="#9CA3AF" tick={{ fill: "#9CA3AF" }} />
                <Tooltip content={<CustomTooltip labelMap={{ score: "Puntaje" }} />} />
                <Bar dataKey="score" fill="#ff851b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
