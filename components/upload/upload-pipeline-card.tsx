"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Check } from "lucide-react"
import { useEffect, useState } from "react"
import type { UploadingMatch } from "@/contexts/UploadContext"

interface UploadPipelineCardProps {
  match: UploadingMatch
}

type PipelineStep = "ready" | "uploading" | "processing" | "complete"

export function UploadPipelineCard({ match }: UploadPipelineCardProps) {
  const [elapsedTime, setElapsedTime] = useState(0)

  // Calculate current step based on match status
  const getCurrentStep = (): PipelineStep => {
    if (match.status === "error") return "ready"
    if (match.status === "uploading") return "uploading"
    if (match.status === "initiating-processing" || match.status === "processing") return "processing"
    return "ready"
  }

  const currentStep = getCurrentStep()

  // Track elapsed time for processing step
  useEffect(() => {
    if (match.status === "processing" || match.status === "initiating-processing") {
      const interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1)
      }, 1000)
      return () => clearInterval(interval)
    } else {
      setElapsedTime(0)
    }
  }, [match.status])

  const formatElapsedTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const getStatusMessage = () => {
    if (match.status === "uploading") {
      return `Subiendo archivo a S3... ${match.progress || 0}%`
    }
    if (match.status === "initiating-processing") {
      return "Iniciando procesamiento..."
    }
    if (match.status === "processing") {
      return `Procesando archivo... ${formatElapsedTime(elapsedTime)}`
    }
    if (match.status === "error") {
      return "Error en el procesamiento"
    }
    return "Preparando archivo..."
  }

  const getStepStatus = (step: PipelineStep): "pending" | "active" | "completed" => {
    const steps: PipelineStep[] = ["ready", "uploading", "processing", "complete"]
    const currentIndex = steps.indexOf(currentStep)
    const stepIndex = steps.indexOf(step)

    if (stepIndex < currentIndex) return "completed"
    if (stepIndex === currentIndex) return "active"
    return "pending"
  }

  const PipelineNode = ({ step, label, sublabel }: { step: PipelineStep; label: string; sublabel?: string }) => {
    const status = getStepStatus(step)

    return (
      <div className="flex flex-col items-center gap-2">
        <div
          className={`
          w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all
          ${
            status === "completed"
              ? "bg-blue-500 border-blue-500"
              : status === "active"
                ? "bg-orange-500 border-orange-500 shadow-lg shadow-orange-500/50"
                : "bg-gray-700 border-gray-600"
          }
        `}
        >
          {status === "completed" && <Check className="h-6 w-6 text-white" />}
          {status === "active" && <Loader2 className="h-6 w-6 text-white animate-spin" />}
        </div>
        <div className="text-center min-w-[80px]">
          <p className="text-xs font-semibold text-foreground whitespace-nowrap">{label}</p>
          {sublabel && <p className="text-xs text-blue-400 mt-0.5 font-medium">{sublabel}</p>}
        </div>
      </div>
    )
  }

  const PipelineConnector = ({ active }: { active: boolean }) => (
    <div className={`flex-1 h-0.5 ${active ? "bg-blue-500" : "bg-gray-600"} mx-2 transition-colors`} />
  )

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex-shrink-0">
            <p className="font-semibold text-base mb-1">{match.fileName}</p>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                {match.gameType}
              </Badge>
              {match.map !== "Unknown" && (
                <Badge variant="outline" className="text-xs">
                  {match.map}
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-muted-foreground">{getStatusMessage()}</p>
          </div>
        </div>

        {/* Pipeline visualization */}
        <div className="flex items-center justify-between">
          <PipelineNode step="ready" label="Archivo listo" />
          <PipelineConnector active={getStepStatus("uploading") !== "pending"} />
          <PipelineNode
            step="uploading"
            label="Preparando"
            sublabel={match.status === "uploading" && match.progress ? `${match.progress}%` : undefined}
          />
          <PipelineConnector active={getStepStatus("processing") !== "pending"} />
          <PipelineNode
            step="processing"
            label="Procesando"
            sublabel={
              match.status === "processing" || match.status === "initiating-processing"
                ? formatElapsedTime(elapsedTime)
                : undefined
            }
          />
          <PipelineConnector active={getStepStatus("complete") !== "pending"} />
          <PipelineNode step="complete" label="Completado" />
        </div>

        {/* Error message if exists */}
        {match.error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
            <p className="text-sm text-red-400">{match.error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
