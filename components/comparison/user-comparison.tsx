"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Plus, X, TrendingUp, TrendingDown, Loader2 } from "lucide-react"
import { useApi } from "@/hooks/useApi"
import { apiService, type UserProfile } from "@/lib/api"
import { useUser } from "@/contexts/UserContext"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ComparisonUser {
  username: string
  profile: UserProfile | null
  loading: boolean
}

export function UserComparison() {
  const { selectedUser } = useUser()
  const [comparisonUsers, setComparisonUsers] = useState<ComparisonUser[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newUsername, setNewUsername] = useState("")
  const [isLoadingNewUser, setIsLoadingNewUser] = useState(false)
  const [isPremiumMode, setIsPremiumMode] = useState(false)

  const { data: currentUserProfile, loading: currentUserLoading } = useApi(
    () => apiService.getUserProfile(selectedUser?.value),
    [selectedUser],
  )

  const maxUsers = isPremiumMode ? 5 : 1

  if (!selectedUser.value) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white mb-2">
            Para la demo de esta sección debes seleccionar un usuario
          </h3>
        </div>
      </div>
    )
  }

  const handleAddUser = async () => {
    if (!newUsername.trim() || comparisonUsers.length >= maxUsers) return

    setIsLoadingNewUser(true)
    try {
      const profile = await apiService.getUserProfile(newUsername.trim())
      setComparisonUsers([...comparisonUsers, { username: newUsername.trim(), profile, loading: false }])
      setNewUsername("")
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error("Error loading user profile:", error)
      setComparisonUsers([...comparisonUsers, { username: newUsername.trim(), profile: null, loading: false }])
      setNewUsername("")
      setIsAddDialogOpen(false)
    } finally {
      setIsLoadingNewUser(false)
    }
  }

  const handleRemoveUser = (username: string) => {
    setComparisonUsers(comparisonUsers.filter((u) => u.username !== username))
  }

  const handlePremiumModeChange = (checked: boolean) => {
    setIsPremiumMode(checked)
    if (!checked && comparisonUsers.length > 1) {
      setComparisonUsers(comparisonUsers.slice(0, 1))
    }
  }

  const getComparisonIndicator = (currentValue: number, compareValue: number, higherIsBetter = true) => {
    if (currentValue === compareValue) return null

    const isBetter = higherIsBetter ? currentValue > compareValue : currentValue < compareValue

    return isBetter ? (
      <TrendingUp className="h-4 w-4 text-green-400 inline ml-2" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-400 inline ml-2" />
    )
  }

  const stats = [
    { key: "kdr", label: "K/D Ratio", higherIsBetter: true, format: (v: number) => v.toFixed(2) },
    { key: "winRate", label: "Win Rate (%)", higherIsBetter: true, format: (v: number) => v.toFixed(1) },
    { key: "averageScore", label: "Puntaje Promedio", higherIsBetter: true, format: (v: number) => v.toFixed(1) },
    { key: "totalGoodPlays", label: "Buenas Jugadas", higherIsBetter: true },
    { key: "totalBadPlays", label: "Malas Jugadas", higherIsBetter: false },
    { key: "totalMatches", label: "Partidas Totales", higherIsBetter: true },
    { key: "totalKills", label: "Kills Totales", higherIsBetter: true },
    { key: "totalDeaths", label: "Deaths Totales", higherIsBetter: false },
    { key: "hoursPlayed", label: "Horas Jugadas", higherIsBetter: true, format: (v: number) => v.toFixed(1) },
    { key: "favoriteWeapon", label: "Arma Favorita", higherIsBetter: null },
    { key: "favoriteMap", label: "Mapa Favorito", higherIsBetter: null },
  ]

  if (currentUserLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-white">Cargando datos...</span>
        </div>
      </div>
    )
  }

  const allUsers = [
    { username: selectedUser.value, profile: currentUserProfile, isCurrentUser: true },
    ...comparisonUsers.map((u) => ({ ...u, isCurrentUser: false })),
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-heading text-white">Comparación de Usuarios</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch id="premium-mode" checked={isPremiumMode} onCheckedChange={handlePremiumModeChange} />
            <Label htmlFor="premium-mode" className="text-white cursor-pointer">
              Modo Premium
            </Label>
          </div>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            disabled={comparisonUsers.length >= maxUsers}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Agregar Usuario {comparisonUsers.length > 0 && `(${comparisonUsers.length}/${maxUsers})`}
          </Button>
        </div>
      </div>

      <Card className="bg-card/50 border-card-border">
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-white font-semibold text-sm">Estadística</th>
                  {allUsers.map((user) => (
                    <th key={user.username} className="text-center p-3 min-w-[150px]">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-white font-semibold">{user.username}</span>
                        {user.isCurrentUser && <Badge variant="secondary">Tú</Badge>}
                        {!user.isCurrentUser && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveUser(user.username)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.map((stat) => (
                  <tr key={stat.key} className="border-b border-border/50 hover:bg-background/30">
                    <td className="p-3 text-white font-medium text-sm">{stat.label}</td>
                    {allUsers.map((user, userIndex) => {
                      const value = user.profile?.stats[stat.key as keyof typeof user.profile.stats]
                      const formattedValue =
                        stat.format && typeof value === "number" ? stat.format(value) : value?.toString() || "N/A"

                      let indicator = null
                      if (
                        !user.isCurrentUser &&
                        currentUserProfile &&
                        user.profile &&
                        stat.higherIsBetter !== null &&
                        typeof value === "number"
                      ) {
                        const currentValue = currentUserProfile.stats[stat.key as keyof typeof currentUserProfile.stats]
                        if (typeof currentValue === "number") {
                          indicator = getComparisonIndicator(value, currentValue, stat.higherIsBetter as boolean)
                        }
                      }

                      return (
                        <td key={`${user.username}-${stat.key}`} className="p-3 text-center">
                          <span
                            className={user.isCurrentUser ? "text-primary font-semibold text-sm" : "text-white text-sm"}
                          >
                            {formattedValue}
                          </span>
                          {indicator}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Usuario para Comparar</DialogTitle>
            <DialogDescription>
              Ingresa el nombre de usuario que deseas comparar.{" "}
              {isPremiumMode ? "Máximo 5 usuarios." : "Máximo 1 usuario (activa Modo Premium para comparar hasta 5)."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Nombre de usuario"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddUser()
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddUser} disabled={!newUsername.trim() || isLoadingNewUser}>
              {isLoadingNewUser ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Cargando...
                </>
              ) : (
                "Agregar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
