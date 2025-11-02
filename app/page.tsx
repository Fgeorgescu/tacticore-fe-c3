"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { Dashboard } from "@/components/dashboard/dashboard"
import { MatchDetails } from "@/components/match-details/match-details"
import { HistoricalAnalytics } from "@/components/analytics/historical-analytics"
import { UserComparison } from "@/components/comparison/user-comparison"
import { UploadModal } from "@/components/upload/upload-modal"
import { ConnectionStatus } from "@/components/ui/connection-status"

export default function Home() {
  const [activeView, setActiveView] = useState("dashboard")
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  const handleViewDetails = (matchId: string) => {
    setSelectedMatch(matchId)
    setActiveView("match-details")
  }

  const handleBackToDashboard = () => {
    setSelectedMatch(null)
    setActiveView("dashboard")
  }

  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return <Dashboard onViewDetails={handleViewDetails} />
      case "match-details":
        return <MatchDetails matchId={selectedMatch} onBack={handleBackToDashboard} />
      case "analytics":
        return <HistoricalAnalytics />
      case "comparison":
        return <UserComparison />
      default:
        return <Dashboard onViewDetails={handleViewDetails} />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <ConnectionStatus />
      <Header onAddMatch={() => setIsUploadModalOpen(true)} />
      <div className="flex">
        <Sidebar activeView={activeView} onViewChange={setActiveView} />
        <main className="flex-1 p-6">{renderContent()}</main>
      </div>
      <UploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} />
    </div>
  )
}
