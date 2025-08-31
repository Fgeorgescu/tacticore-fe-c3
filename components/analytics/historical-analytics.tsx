"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { TrendingUp, TrendingDown, Target, Skull, Trophy } from "lucide-react"
import { useState } from "react"

// Mock historical data
const historicalData = [
  { date: "2024-01-01", kills: 18, deaths: 22, kdr: 0.82, score: 6.5, goodPlays: 4, badPlays: 8, matches: 1 },
  { date: "2024-01-03", kills: 21, deaths: 19, kdr: 1.11, score: 7.2, goodPlays: 6, badPlays: 6, matches: 2 },
  { date: "2024-01-05", kills: 24, deaths: 18, kdr: 1.33, score: 8.1, goodPlays: 8, badPlays: 4, matches: 3 },
  { date: "2024-01-07", kills: 19, deaths: 25, kdr: 0.76, score: 5.8, goodPlays: 3, badPlays: 9, matches: 4 },
  { date: "2024-01-09", kills: 27, deaths: 16, kdr: 1.69, score: 8.7, goodPlays: 11, badPlays: 3, matches: 5 },
  { date: "2024-01-11", kills: 22, deaths: 20, kdr: 1.1, score: 7.5, goodPlays: 7, badPlays: 5, matches: 6 },
  { date: "2024-01-13", kills: 31, deaths: 12, kdr: 2.58, score: 9.1, goodPlays: 12, badPlays: 2, matches: 7 },
  { date: "2024-01-15", kills: 24, deaths: 18, kdr: 1.33, score: 8.5, goodPlays: 8, badPlays: 3, matches: 8 },
]

const cumulativeData = historicalData.map((item, index) => {
  const previousData = historicalData.slice(0, index + 1)
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

export function HistoricalAnalytics() {
  const [timeRange, setTimeRange] = useState("all")
  const [metric, setMetric] = useState("kdr")

  const getFilteredData = () => {
    // For now, return all data regardless of time range
    return historicalData
  }

  const getCumulativeData = () => {
    return cumulativeData
  }

  const getMetricData = () => {
    const data = getFilteredData()
    switch (metric) {
      case "kdr":
        return data.map((d) => ({ ...d, value: d.kdr, label: "K/D Ratio" }))
      case "score":
        return data.map((d) => ({ ...d, value: d.score, label: "Puntaje" }))
      case "kills":
        return data.map((d) => ({ ...d, value: d.kills, label: "Kills" }))
      case "goodPlays":
        return data.map((d) => ({ ...d, value: d.goodPlays, label: "Buenas Jugadas" }))
      default:
        return data.map((d) => ({ ...d, value: d.kdr, label: "K/D Ratio" }))
    }
  }

  const latestData = historicalData[historicalData.length - 1]
  const previousData = historicalData[historicalData.length - 2]

  const kdrTrend = latestData.kdr > previousData.kdr
  const scoreTrend = latestData.score > previousData.score
  const killsTrend = latestData.kills > previousData.kills

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-heading">Análisis Histórico</h1>
        <div className="flex gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo el tiempo</SelectItem>
              <SelectItem value="30d">Últimos 30 días</SelectItem>
              <SelectItem value="7d">Últimos 7 días</SelectItem>
            </SelectContent>
          </Select>

          <Select value={metric} onValueChange={setMetric}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Métrica" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kdr">K/D Ratio</SelectItem>
              <SelectItem value="score">Puntaje</SelectItem>
              <SelectItem value="kills">Kills</SelectItem>
              <SelectItem value="goodPlays">Buenas Jugadas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Trend Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="py-2 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                <span className="text-sm font-medium text-white">K/D Ratio</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold">{latestData.kdr}</span>
                <Badge variant={kdrTrend ? "default" : "destructive"} className="p-1">
                  {kdrTrend ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="py-2 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                <span className="text-sm font-medium text-white">Puntaje Promedio</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold">{latestData.score}</span>
                <Badge variant={scoreTrend ? "default" : "destructive"} className="p-1">
                  {scoreTrend ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="py-2 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skull className="h-4 w-4" />
                <span className="text-sm font-medium text-white">Kills por Partida</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold">{latestData.kills}</span>
                <Badge variant={killsTrend ? "default" : "destructive"} className="p-1">
                  {killsTrend ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Main Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Evolución de {getMetricData()[0]?.label}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getMetricData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  stroke="#9ca3af"
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString("es-ES", { month: "short", day: "numeric" })
                  }
                />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#374151",
                    border: "none",
                    borderRadius: "8px",
                    color: "#ffffff",
                  }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString("es-ES")}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#ff851b"
                  strokeWidth={3}
                  dot={{ fill: "#ff851b", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "#ff851b", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Performance Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Kills vs Deaths por Partida</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getFilteredData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="date"
                    stroke="#9ca3af"
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString("es-ES", { month: "short", day: "numeric" })
                    }
                  />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#374151",
                      border: "none",
                      borderRadius: "8px",
                      color: "#ffffff",
                    }}
                  />
                  <Bar dataKey="kills" fill="#10b981" name="Kills" />
                  <Bar dataKey="deaths" fill="#ef4444" name="Deaths" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Jugadas Buenas vs Malas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getFilteredData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="date"
                    stroke="#9ca3af"
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString("es-ES", { month: "short", day: "numeric" })
                    }
                  />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#374151",
                      border: "none",
                      borderRadius: "8px",
                      color: "#ffffff",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="goodPlays"
                    stackId="1"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.6}
                    name="Buenas Jugadas"
                  />
                  <Area
                    type="monotone"
                    dataKey="badPlays"
                    stackId="1"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.6}
                    name="Malas Jugadas"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cumulative Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Progreso Acumulativo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getCumulativeData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  stroke="#9ca3af"
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString("es-ES", { month: "short", day: "numeric" })
                  }
                />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#374151",
                    border: "none",
                    borderRadius: "8px",
                    color: "#ffffff",
                  }}
                />
                <Line type="monotone" dataKey="totalKills" stroke="#10b981" strokeWidth={2} name="Total Kills" />
                <Line type="monotone" dataKey="totalDeaths" stroke="#ef4444" strokeWidth={2} name="Total Deaths" />
                <Line type="monotone" dataKey="cumulativeKDR" stroke="#ff851b" strokeWidth={3} name="K/D Acumulativo" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
