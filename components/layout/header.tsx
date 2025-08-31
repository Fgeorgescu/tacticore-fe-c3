"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface HeaderProps {
  onAddMatch: () => void
}

export function Header({ onAddMatch }: HeaderProps) {
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image src="/tacticore-logo.png" alt="TACTICORE" width={200} height={60} className="h-12 w-auto" />
          </div>
          <Button onClick={onAddMatch} className="gap-2">
            <Plus className="h-4 w-4" />
            Agregar Nueva Partida
          </Button>
        </div>
      </div>
    </header>
  )
}
