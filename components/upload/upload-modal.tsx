"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, File, Video, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
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

export function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [demFile, setDemFile] = useState<FileUpload | null>(null)
  const [videoFile, setVideoFile] = useState<FileUpload | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentMatchId, setCurrentMatchId] = useState<string | null>(null)
  const [metadata, setMetadata] = useState({
    map: "",
    gameType: "",
    description: "",
  })

  const demInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const handleFileSelect = (files: FileList | null, type: "dem" | "video") => {
    if (!files || files.length === 0) return

    const file = files[0]
    const fileUpload: FileUpload = {
      file,
      status: "idle",
      progress: 0,
    }

    if (type === "dem") {
      setDemFile(fileUpload)
    } else {
      // Create preview for video files
      const preview = URL.createObjectURL(file)
      fileUpload.preview = preview
      setVideoFile(fileUpload)
    }
  }

  const handleUpload = async () => {
    if (!demFile || demFile.status === "error") return

    setIsUploading(true)

    try {
      // Prepare metadata for the new endpoint
      const matchMetadata = {
        playerName: "Player", // Default value
        notes: metadata.map || metadata.description || "Unknown map"
      }

      // Upload match using the new endpoint
      const result = await apiService.uploadMatch(
        demFile.file, 
        videoFile?.file, 
        matchMetadata
      )

      if (result.status === "processing") {
        setCurrentMatchId(result.id)
        setIsProcessing(true)
        setDemFile(prev => prev ? { ...prev, status: "success", progress: 100 } : null)
        
        if (videoFile) {
          setVideoFile(prev => prev ? { ...prev, status: "success", progress: 100 } : null)
        }

        // Start polling for status updates
        startPolling(result.id)
      } else {
        throw new Error(result.message)
      }

    } catch (error) {
      console.error("Upload error:", error)
      setDemFile(prev => prev ? { ...prev, status: "error", error: error instanceof Error ? error.message : "Upload failed" } : null)
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
          setDemFile(prev => prev ? { ...prev, status: "error", error: statusResult.message } : null)
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
        setDemFile(prev => prev ? { ...prev, status: "error", error: "Error checking status" } : null)
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
    
    if (videoFile?.preview) {
      URL.revokeObjectURL(videoFile.preview)
    }
    setDemFile(null)
    setVideoFile(null)
    setIsUploading(false)
    setIsProcessing(false)
    setCurrentMatchId(null)
    setMetadata({ map: "", gameType: "", description: "" })
    onClose()
  }

  const removeFile = (type: "dem" | "video") => {
    if (type === "dem") {
      setDemFile(null)
    } else {
      if (videoFile?.preview) {
        URL.revokeObjectURL(videoFile.preview)
      }
      setVideoFile(null)
    }
  }

  const canUpload = demFile && demFile.status !== "error" && !isUploading && !isProcessing

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Subir Nueva Partida
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* DEM File Upload */}
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
                        onChange={(e) => handleFileSelect(e.target.files, "dem")}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        onClick={() => demInputRef.current?.click()}
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Seleccionar archivo .dem
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <File className="h-4 w-4" />
                          <span className="text-sm font-medium">{demFile.file.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {demFile.status === "success" && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          {demFile.status === "error" && (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile("dem")}
                            disabled={isUploading || isProcessing}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {demFile.status === "uploading" && (
                        <Progress value={demFile.progress} className="h-2" />
                      )}

                      {demFile.status === "error" && demFile.error && (
                        <p className="text-sm text-red-500">{demFile.error}</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Video File Upload */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    <Label htmlFor="video-file">Video (Opcional)</Label>
                  </div>

                  {!videoFile ? (
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                      <input
                        ref={videoInputRef}
                        type="file"
                        id="video-file"
                        accept="video/*"
                        onChange={(e) => handleFileSelect(e.target.files, "video")}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        onClick={() => videoInputRef.current?.click()}
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Seleccionar video
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4" />
                          <span className="text-sm font-medium">{videoFile.file.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {videoFile.status === "success" && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          {videoFile.status === "error" && (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile("video")}
                            disabled={isUploading || isProcessing}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {videoFile.preview && (
                        <video
                          src={videoFile.preview}
                          className="w-full h-32 object-cover rounded-lg"
                          controls
                        />
                      )}

                      {videoFile.status === "uploading" && (
                        <Progress value={videoFile.progress} className="h-2" />
                      )}

                      {videoFile.status === "error" && videoFile.error && (
                        <p className="text-sm text-red-500">{videoFile.error}</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Metadata Section */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4">Información de la Partida</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="map">Mapa</Label>
                  <Input
                    id="map"
                    placeholder="ej. Dust2, Mirage, Inferno..."
                    value={metadata.map}
                    onChange={(e) => setMetadata(prev => ({ ...prev, map: e.target.value }))}
                    disabled={isUploading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gameType">Tipo de Juego</Label>
                  <Input
                    id="gameType"
                    placeholder="ej. Ranked, Casual, Entrenamiento..."
                    value={metadata.gameType}
                    onChange={(e) => setMetadata(prev => ({ ...prev, gameType: e.target.value }))}
                    disabled={isUploading}
                  />
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="description">Descripción (Opcional)</Label>
                <Textarea
                  id="description"
                  placeholder="Notas sobre la partida..."
                  value={metadata.description}
                  onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
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
                    <p className="text-sm text-muted-foreground">
                      ID: {currentMatchId}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Analizando archivo DEM y generando estadísticas
                    </p>
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
            <Button
              onClick={handleUpload}
              disabled={!canUpload}
              className="gap-2"
            >
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
