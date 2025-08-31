"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, Video, File, X, CheckCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
}

interface FileUpload {
  file: File
  preview?: string
  progress: number
  status: "idle" | "uploading" | "success" | "error"
  error?: string
}

export function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [demFile, setDemFile] = useState<FileUpload | null>(null)
  const [videoFile, setVideoFile] = useState<FileUpload | null>(null)
  const [isDragOver, setIsDragOver] = useState<"dem" | "video" | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const demInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent, type: "dem" | "video") => {
    e.preventDefault()
    setIsDragOver(type)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, type: "dem" | "video") => {
    e.preventDefault()
    setIsDragOver(null)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0], type)
    }
  }, [])

  const handleFileSelect = (file: File, type: "dem" | "video") => {
    if (type === "dem") {
      if (!file.name.endsWith(".dem")) {
        setDemFile({
          file,
          progress: 0,
          status: "error",
          error: "El archivo debe tener extensión .dem",
        })
        return
      }
      setDemFile({
        file,
        progress: 0,
        status: "idle",
      })
    } else {
      if (!file.type.startsWith("video/")) {
        setVideoFile({
          file,
          progress: 0,
          status: "error",
          error: "El archivo debe ser un video",
        })
        return
      }

      // Create video preview
      const videoUrl = URL.createObjectURL(file)
      setVideoFile({
        file,
        preview: videoUrl,
        progress: 0,
        status: "idle",
      })
    }
  }

  const simulateUpload = async (fileUpload: FileUpload, setter: (file: FileUpload) => void) => {
    setter({ ...fileUpload, status: "uploading", progress: 0 })

    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      setter({ ...fileUpload, status: "uploading", progress })
    }

    // Simulate random success/failure
    const success = Math.random() > 0.1 // 90% success rate
    if (success) {
      setter({ ...fileUpload, status: "success", progress: 100 })
    } else {
      setter({ ...fileUpload, status: "error", progress: 0, error: "Error al subir el archivo" })
    }
  }

  const handleUpload = async () => {
    if (!demFile || demFile.status === "error") return

    setIsUploading(true)

    try {
      // Upload .dem file
      await simulateUpload(demFile, setDemFile)

      // Upload video file if present
      if (videoFile && videoFile.status !== "error") {
        await simulateUpload(videoFile, setVideoFile)
      }

      // Wait a bit to show success state
      setTimeout(() => {
        setIsUploading(false)
        // Reset and close on success
        if (demFile.status === "success" && (!videoFile || videoFile.status === "success")) {
          handleClose()
        }
      }, 1000)
    } catch (error) {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    if (videoFile?.preview) {
      URL.revokeObjectURL(videoFile.preview)
    }
    setDemFile(null)
    setVideoFile(null)
    setIsUploading(false)
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

  const canUpload = demFile && demFile.status !== "error" && !isUploading

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading">Agregar Nueva Partida</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* DEM File Upload */}
          <div className="space-y-2">
            <Label htmlFor="dem-file">Archivo .dem (Requerido)</Label>
            {!demFile ? (
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                  isDragOver === "dem" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50",
                )}
                onDragOver={(e) => handleDragOver(e, "dem")}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, "dem")}
                onClick={() => demInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Arrastra tu archivo .dem aquí o haz clic para seleccionar
                </p>
                <Input
                  ref={demInputRef}
                  type="file"
                  accept=".dem"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], "dem")}
                />
              </div>
            ) : (
              <div className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <File className="h-4 w-4" />
                    <span className="text-sm font-medium">{demFile.file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({(demFile.file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {demFile.status === "success" && <CheckCircle className="h-4 w-4 text-green-400" />}
                    {demFile.status === "error" && <AlertCircle className="h-4 w-4 text-red-400" />}
                    <Button variant="ghost" size="sm" onClick={() => removeFile("dem")} disabled={isUploading}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {demFile.status === "uploading" && <Progress value={demFile.progress} className="mb-2" />}

                {demFile.status === "error" && demFile.error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{demFile.error}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          {/* Video File Upload */}
          <div className="space-y-2">
            <Label htmlFor="video-file">Video Complementario (Opcional)</Label>
            {!videoFile ? (
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                  isDragOver === "video"
                    ? "border-secondary bg-secondary/10"
                    : "border-border hover:border-secondary/50",
                )}
                onDragOver={(e) => handleDragOver(e, "video")}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, "video")}
                onClick={() => videoInputRef.current?.click()}
              >
                <Video className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Arrastra tu video aquí o haz clic para seleccionar</p>
                <Input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], "video")}
                />
              </div>
            ) : (
              <div className="border border-border rounded-lg p-4">
                <div className="flex items-start gap-4">
                  {videoFile.preview && (
                    <video src={videoFile.preview} className="w-24 h-16 object-cover rounded" muted />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        <span className="text-sm font-medium">{videoFile.file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(videoFile.file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {videoFile.status === "success" && <CheckCircle className="h-4 w-4 text-green-400" />}
                        {videoFile.status === "error" && <AlertCircle className="h-4 w-4 text-red-400" />}
                        <Button variant="ghost" size="sm" onClick={() => removeFile("video")} disabled={isUploading}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {videoFile.status === "uploading" && <Progress value={videoFile.progress} className="mb-2" />}

                    {videoFile.status === "error" && videoFile.error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{videoFile.error}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Upload Actions */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={handleClose} className="flex-1 bg-transparent" disabled={isUploading}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleUpload} disabled={!canUpload}>
              {isUploading ? "Subiendo..." : "Subir Archivos"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
