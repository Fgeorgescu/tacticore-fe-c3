"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Home, TrendingUp } from "lucide-react"

interface SidebarProps {
  activeView: string
  onViewChange: (view: string) => void
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const navigation = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "analytics", label: "Análisis Histórico", icon: TrendingUp },
  ]

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border">
      <div className="p-6">
        <nav className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Button
                key={item.id}
                variant={activeView === item.id ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3",
                  activeView === item.id && "bg-sidebar-accent text-sidebar-accent-foreground",
                )}
                onClick={() => onViewChange(item.id)}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
