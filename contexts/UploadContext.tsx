"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export interface UploadingMatch {
  id: string
  fileName: string
  map: string
  date: string
  status: "uploading" | "processing"
  gameType: string
  progress?: number
}

interface UploadContextType {
  uploadingMatches: UploadingMatch[]
  addUploadingMatch: (match: UploadingMatch) => void
  updateMatchStatus: (id: string, status: "uploading" | "processing") => void
  updateMatchProgress: (id: string, progress: number) => void
  removeUploadingMatch: (id: string) => void
  clearUploadingMatches: () => void
}

const UploadContext = createContext<UploadContextType | undefined>(undefined)

export function UploadProvider({ children }: { children: ReactNode }) {
  const [uploadingMatches, setUploadingMatches] = useState<UploadingMatch[]>([])

  const addUploadingMatch = (match: UploadingMatch) => {
    console.log("[v0] Adding uploading match to context:", match)
    setUploadingMatches((prev) => [...prev, match])
  }

  const updateMatchStatus = (id: string, status: "uploading" | "processing") => {
    console.log("[v0] Updating match status in context:", id, status)
    setUploadingMatches((prev) => prev.map((match) => (match.id === id ? { ...match, status } : match)))
  }

  const updateMatchProgress = (id: string, progress: number) => {
    setUploadingMatches((prev) => prev.map((match) => (match.id === id ? { ...match, progress } : match)))
  }

  const removeUploadingMatch = (id: string) => {
    console.log("[v0] Removing match from context:", id)
    setUploadingMatches((prev) => prev.filter((match) => match.id !== id))
  }

  const clearUploadingMatches = () => {
    console.log("[v0] Clearing all uploading matches from context")
    setUploadingMatches([])
  }

  return (
    <UploadContext.Provider
      value={{
        uploadingMatches,
        addUploadingMatch,
        updateMatchStatus,
        updateMatchProgress,
        removeUploadingMatch,
        clearUploadingMatches,
      }}
    >
      {children}
    </UploadContext.Provider>
  )
}

export function useUpload() {
  const context = useContext(UploadContext)
  if (context === undefined) {
    throw new Error("useUpload must be used within an UploadProvider")
  }
  return context
}
