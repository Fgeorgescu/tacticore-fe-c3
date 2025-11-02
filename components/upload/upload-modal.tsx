"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { apiService } from "@/lib/api"

interface FileUpload {
  file: File
  preview?: string
  status: "idle" | "uploading" | "success" | "error"
  progress: number
  error?: string
}

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
}

// Lista de mapas disponibles
const AVAILABLE_MAPS = [
  // Mapas competitivos principales
  "Ancient",
  "Anubis",
  "Dust II",
  "Inferno",
  "Mirage",
  "Nuke",
  "Overpass",
  "Train",
  "Vertigo",
  // Mapas adicionales
  "Agency",
  "Grail",
  "Jura",
  "Office",
  "Italy",
  // Mapas de modo casual
  "Dogtown",
  "Pool Day",
]

export function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [demFile, setDemFile] = useState<FileUpload | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentMatchId, setCurrentMatchId] = useState<string | null>(null)
  const [metadata, setMetadata] = useState({
    map: "",
    gameType: "Ranked", // Valor por defecto
    description: "",
  })

  const demInputRef = useRef<HTMLInputElement>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    const fileUpload: FileUpload = {
      file,
      status: "idle",
      progress: 0,
    }

    setDemFile(fileUpload)
  }

  const handleUpload = async () => {
    if (!demFile || demFile.status === "error") return

    setIsUploading(true)

    try {
      // Prepare metadata for the new endpoint
      const matchMetadata = {
        playerName: "Player", // Default value
        notes: metadata.map || metadata.description || "Unknown map",
      }

      const result = await apiService.uploadMatch(
        demFile.file,
        undefined, // No video file
        matchMetadata,
      )

      if (result.status === "processing") {
        setCurrentMatchId(result.id)
        setIsProcessing(true)
        setDemFile((prev) => (prev ? { ...prev, status: "success", progress: 100 } : null))

        // Start polling for status updates
        startPolling(result.id)
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error("Upload error:", error)
      setDemFile((prev) =>
        prev ? { ...prev, status: "error", error: error instanceof Error ? error.message : "Upload failed" } : null,
      )
    } finally {
      setIsUploading(false)
    }
  }

  // Polling function to check match status
  const startPolling = (matchId: string) => {
    // Clear any existing interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
    }

    pollIntervalRef.current = setInterval(async () => {
      try {
        const statusResult = await apiService.getMatchStatus(matchId)

        if (statusResult.status === "completed") {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
            pollIntervalRef.current = null
          }
          setIsProcessing(false)
          setCurrentMatchId(null)

          // Wait a bit to show success state
          setTimeout(() => {
            handleClose()
          }, 1000)
        } else if (statusResult.status === "failed") {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
            pollIntervalRef.current = null
          }
          setIsProcessing(false)
          setCurrentMatchId(null)
          setDemFile((prev) => (prev ? { ...prev, status: "error", error: statusResult.message } : null))
        }
        // If still processing, continue polling
      } catch (error) {
        console.error("Error checking match status:", error)
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
        setIsProcessing(false)
        setCurrentMatchId(null)
        setDemFile((prev) => (prev ? { ...prev, status: "error", error: "Error checking status" } : null))
      }
    }, 2000) // Poll every 2 seconds

    // Stop polling after 30 seconds to avoid infinite polling
    setTimeout(() => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
      if (isProcessing) {
        setIsProcessing(false)
        setCurrentMatchId(null)
        console.warn("Polling timeout - match processing may still be in progress")
      }
    }, 30000)
  }

  const handleClose = () => {
    // Clear any active polling
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }

    setDemFile(null)
    setIsUploading(false)
    setIsProcessing(false)
    setCurrentMatchId(null)
    setMetadata({ map: "", gameType: "Ranked", description: "" })
    onClose()
  }

  const removeFile = () => {
    setDemFile(null)
  }

  const canUpload = demFile && demFile.status !== "error" && !isUploading && !isProcessing

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Subir Nueva Partida
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload Section */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <File className="h-4 w-4" />
                  <Label htmlFor="dem-file">Archivo DEM (Requerido)</Label>
                </div>

                {!demFile ? (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                    <input
                      ref={demInputRef}
                      type="file"
                      id="dem-file"
                      accept=".dem"
                      onChange={(e) => handleFileSelect(e.target.files)}
                      className="hidden"
                    />
                    <Button variant="outline" onClick={() => demInputRef.current?.click()} className="w-full">
                      <Upload className="h-4 w-4 mr-2" />
                      Seleccionar archivo .dem
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <File className="h-4 w-4 text-black dark:text-white" />
                        <span className="text-sm font-medium text-black dark:text-white">{demFile.file.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {demFile.status === "success" && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {demFile.status === "error" && <AlertCircle className="h-4 w-4 text-red-500" />}
                        <Button variant="ghost" size="sm" onClick={removeFile} disabled={isUploading || isProcessing}>
                          <X className="h-4 w-4 text-black dark:text-white" />
                        </Button>
                      </div>
                    </div>

                    {demFile.status === "uploading" && <Progress value={demFile.progress} className="h-2" />}

                    {demFile.status === "error" && demFile.error && (
                      <p className="text-sm text-red-500">{demFile.error}</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Metadata Section */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4">Información de la Partida</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="map">Mapa</Label>
                  <div className="relative">
                    <Input
                      id="map"
                      list="map-options"
                      placeholder="Seleccionar mapa..."
                      value={metadata.map}
                      onChange={(e) => setMetadata((prev) => ({ ...prev, map: e.target.value }))}
                      disabled={isUploading}
                      className={
                        !AVAILABLE_MAPS.includes(metadata.map) && metadata.map !== ""
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }
                    />
                    <datalist id="map-options">
                      {AVAILABLE_MAPS.map((map) => (
                        <option key={map} value={map} />
                      ))}
                    </datalist>
                    {!AVAILABLE_MAPS.includes(metadata.map) && metadata.map !== "" && (
                      <p className="text-sm text-red-500 mt-1">⚠️ Mapa no reconocido. Verifica el nombre.</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Juego</Label>
                  <RadioGroup
                    value={metadata.gameType}
                    onValueChange={(value) => setMetadata((prev) => ({ ...prev, gameType: value }))}
                    disabled={isUploading}
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Ranked" id="ranked" />
                      <Label htmlFor="ranked" className="cursor-pointer">
                        Ranked
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Casual" id="casual" />
                      <Label htmlFor="casual" className="cursor-pointer">
                        Casual
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="description">Descripción (Opcional)</Label>
                <Textarea
                  id="description"
                  placeholder="Notas sobre la partida..."
                  value={metadata.description}
                  onChange={(e) => setMetadata((prev) => ({ ...prev, description: e.target.value }))}
                  disabled={isUploading}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Processing Status */}
          {isProcessing && currentMatchId && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  <div>
                    <h3 className="font-semibold text-blue-600">Procesando partida...</h3>
                    <p className="text-sm text-muted-foreground">ID: {currentMatchId}</p>
                    <p className="text-sm text-muted-foreground">Analizando archivo DEM y generando estadísticas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upload Button */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose} disabled={isUploading || isProcessing}>
              Cancelar
            </Button>
            <Button onClick={handleUpload} disabled={!canUpload} className="gap-2">
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Subiendo...
                </>
              ) : isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Subir Partida
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
