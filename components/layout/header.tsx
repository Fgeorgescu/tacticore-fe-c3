"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, LogOut, User } from "lucide-react"
import { UserInput } from "@/components/ui/user-input"
import { useAuth } from "@/contexts/AuthContext"

interface HeaderProps {
  onAddMatch: () => void
}

export function Header({ onAddMatch }: HeaderProps) {
  const { user, logout, isAuthenticated } = useAuth()

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Image src="/tacticore-logo.png" alt="TACTICORE" width={200} height={60} className="h-12 w-auto" />
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <UserInput />
                <Button onClick={onAddMatch} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Agregar Nueva Partida
                </Button>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4" />
                    <span>{user?.email}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={logout} className="gap-2">
                    <LogOut className="h-4 w-4" />
                    Salir
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="outline">Iniciar Sesión</Button>
                </Link>
                <Link href="/register">
                  <Button>Registrarse</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
