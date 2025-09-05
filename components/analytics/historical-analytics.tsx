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
import { TrendingUp, TrendingDown, Target, Skull, Trophy, Loader2 } from "lucide-react"
import { useState } from "react"
import { useApi } from "@/hooks/useApi"
import { apiService, AnalyticsData } from "@/lib/api"

export function HistoricalAnalytics() {
  const [timeRange, setTimeRange] = useState("all")
  const [metric, setMetric] = useState("kdr")

  // Fetch historical analytics data
  const { data: historicalData, loading, error, refetch } = useApi(
    () => apiService.getHistoricalAnalytics(),
    []
  );

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-white">Cargando datos históricos...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <h3 className="text-destructive font-semibold mb-2">Error al cargar datos históricos</h3>
          <p className="text-sm text-white">{error}</p>
          <button 
            className="mt-2 text-sm text-primary hover:underline"
            onClick={() => refetch()}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Use real data or fallback to empty array
  const data = historicalData || [];

  const getFilteredData = () => {
    // For now, return all data regardless of time range
    return data;
  };

  const getCumulativeData = () => {
    return data.map((item, index) => {
      const previousData = data.slice(0, index + 1);
      const totalKills = previousData.reduce((sum, d) => sum + d.kills, 0);
      const totalDeaths = previousData.reduce((sum, d) => sum + d.deaths, 0);
      const totalGoodPlays = previousData.reduce((sum, d) => sum + d.goodPlays, 0);
      const totalBadPlays = previousData.reduce((sum, d) => sum + d.badPlays, 0);
      const avgScore = previousData.reduce((sum, d) => sum + d.score, 0) / previousData.length;

      return {
        ...item,
        totalKills,
        totalDeaths,
        totalGoodPlays,
        totalBadPlays,
        avgScore: Number(avgScore.toFixed(2)),
        cumulativeKDR: Number((totalKills / totalDeaths).toFixed(2)),
      };
    });
  };

  const getMetricData = () => {
    const filteredData = getFilteredData();
    switch (metric) {
      case "kdr":
        return filteredData.map((d) => ({ ...d, value: d.kdr, label: "K/D Ratio" }));
      case "score":
        return filteredData.map((d) => ({ ...d, value: d.score, label: "Puntaje" }));
      case "kills":
        return filteredData.map((d) => ({ ...d, value: d.kills, label: "Kills" }));
      case "goodPlays":
        return filteredData.map((d) => ({ ...d, value: d.goodPlays, label: "Buenas Jugadas" }));
      default:
        return filteredData.map((d) => ({ ...d, value: d.kdr, label: "K/D Ratio" }));
    }
  };

  const latestData = data[data.length - 1];
  const previousData = data[data.length - 2];

  const kdrTrend = latestData && previousData ? latestData.kdr > previousData.kdr : false;
  const scoreTrend = latestData && previousData ? latestData.score > previousData.score : false;
  const killsTrend = latestData && previousData ? latestData.kills > previousData.kills : false;

  if (data.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Trophy className="h-16 w-16 text-white mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No hay datos históricos</h3>
          <p className="text-white">Sube algunas partidas para comenzar a ver tu progreso histórico.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-heading text-white">Análisis Histórico</h1>
        <div className="flex items-center gap-4">
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
          <Select value={metric} onValueChange={setMetric}>
            <SelectTrigger className="w-40">
              <SelectValue />
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card/50 border-card-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">K/D Ratio Actual</p>
                <p className="text-2xl font-bold text-foreground">
                  {latestData ? latestData.kdr.toFixed(2) : "0.00"}
                </p>
              </div>
              {kdrTrend ? (
                <TrendingUp className="h-8 w-8 text-green-400" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-400" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-card-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Puntaje Promedio</p>
                <p className="text-2xl font-bold text-foreground">
                  {latestData ? latestData.score.toFixed(1) : "0.0"}
                </p>
              </div>
              {scoreTrend ? (
                <TrendingUp className="h-8 w-8 text-green-400" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-400" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-card-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Kills por Partida</p>
                <p className="text-2xl font-bold text-foreground">
                  {latestData ? latestData.kills : 0}
                </p>
              </div>
              {killsTrend ? (
                <TrendingUp className="h-8 w-8 text-green-400" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-400" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Metric Chart */}
        <Card className="bg-card/50 border-card-border">
          <CardHeader>
            <CardTitle>Progreso de {getMetricData()[0]?.label || "Métrica"}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getMetricData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF"
                  tick={{ fill: "#9CA3AF" }}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  tick={{ fill: "#9CA3AF" }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#374151", 
                    border: "1px solid #4B5563",
                    borderRadius: "8px"
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#ff851b" 
                  strokeWidth={2}
                  dot={{ fill: "#ff851b", strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cumulative Stats */}
        <Card className="bg-card/50 border-card-border">
          <CardHeader>
            <CardTitle>Estadísticas Acumulativas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={getCumulativeData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF"
                  tick={{ fill: "#9CA3AF" }}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  tick={{ fill: "#9CA3AF" }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#374151", 
                    border: "1px solid #4B5563",
                    borderRadius: "8px"
                  }}
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

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Good vs Bad Plays */}
        <Card className="bg-card/50 border-card-border">
          <CardHeader>
            <CardTitle>Buenas vs Malas Jugadas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getFilteredData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF"
                  tick={{ fill: "#9CA3AF" }}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  tick={{ fill: "#9CA3AF" }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#374151", 
                    border: "1px solid #4B5563",
                    borderRadius: "8px"
                  }}
                />
                <Bar dataKey="goodPlays" fill="#10B981" />
                <Bar dataKey="badPlays" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Score Distribution */}
        <Card className="bg-card/50 border-card-border">
          <CardHeader>
            <CardTitle>Distribución de Puntajes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getFilteredData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF"
                  tick={{ fill: "#9CA3AF" }}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  tick={{ fill: "#9CA3AF" }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#374151", 
                    border: "1px solid #4B5563",
                    borderRadius: "8px"
                  }}
                />
                <Bar dataKey="score" fill="#ff851b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
