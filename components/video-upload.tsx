"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Upload, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface VideoFile {
  file: File
  url: string
  duration: number
  size: string
}

export default function VideoUpload() {
  const [selectedVideo, setSelectedVideo] = useState<VideoFile | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadComplete, setUploadComplete] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleVideoLoad = useCallback((file: File) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement("video")

    video.onloadedmetadata = () => {
      setSelectedVideo({
        file,
        url,
        duration: video.duration,
        size: formatFileSize(file.size),
      })
    }

    video.src = url
  }, [])

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    if (!file.type.startsWith("video/")) {
      alert("Por favor selecciona un archivo de video válido")
      return
    }

    handleVideoLoad(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleUpload = async () => {
    if (!selectedVideo) return

    setIsUploading(true)
    setUploadProgress(0)

    // Mock upload simulation
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsUploading(false)
          setUploadComplete(true)
          return 100
        }
        return prev + Math.random() * 15
      })
    }, 200)
  }

  const handleReset = () => {
    if (selectedVideo) {
      URL.revokeObjectURL(selectedVideo.url)
    }
    setSelectedVideo(null)
    setUploadProgress(0)
    setIsUploading(false)
    setUploadComplete(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Subir Video</h1>
        <p className="text-muted-foreground">Selecciona un video para subir, previsualizar y confirmar</p>
      </div>

      {!selectedVideo ? (
        <Card className="border-2 border-dashed border-border hover:border-primary/50 transition-colors">
          <CardContent className="p-8">
            <div
              className={cn(
                "flex flex-col items-center justify-center space-y-4 text-center cursor-pointer",
                isDragging && "bg-muted/50 rounded-lg",
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="p-4 bg-primary/10 rounded-full">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Arrastra y suelta tu video aquí</h3>
                <p className="text-muted-foreground">o haz clic para seleccionar un archivo</p>
                <p className="text-sm text-muted-foreground">Formatos soportados: MP4, MOV, AVI, WebM</p>
              </div>
              <Button variant="outline" className="mt-4 bg-transparent">
                Seleccionar Archivo
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Video Preview */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Vista Previa</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cambiar
                  </Button>
                </div>

                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    src={selectedVideo.url}
                    controls
                    className="w-full h-auto max-h-96"
                    preload="metadata"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Nombre del archivo</p>
                    <p className="font-medium truncate">{selectedVideo.file.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Tamaño</p>
                    <p className="font-medium">{selectedVideo.size}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Duración</p>
                    <p className="font-medium">{formatDuration(selectedVideo.duration)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Tipo</p>
                    <p className="font-medium">{selectedVideo.file.type}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload Progress */}
          {(isUploading || uploadComplete) && (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{uploadComplete ? "Subida Completada" : "Subiendo Video"}</h3>
                    {uploadComplete && (
                      <div className="flex items-center text-primary">
                        <Check className="h-5 w-5 mr-1" />
                        Completado
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progreso</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>

                  {uploadComplete && (
                    <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                      <p className="text-sm text-primary font-medium">✅ Tu video se ha subido exitosamente</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        El video está ahora disponible en tu biblioteca
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {!uploadComplete && !isUploading && (
              <Button onClick={handleUpload} className="flex-1" size="lg">
                <Upload className="h-4 w-4 mr-2" />
                Confirmar Subida
              </Button>
            )}

            {uploadComplete && (
              <Button onClick={handleReset} variant="outline" className="flex-1 bg-transparent" size="lg">
                Subir Otro Video
              </Button>
            )}

            {!uploadComplete && (
              <Button onClick={handleReset} variant="outline" size="lg">
                Cancelar
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
