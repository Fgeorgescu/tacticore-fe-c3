"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Upload, Video, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { apiService } from "@/lib/api"

interface VideoFile {
  file: File
  url: string
  name: string
}

export default function VideoUpload() {
  const [selectedVideo, setSelectedVideo] = useState<VideoFile | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadComplete, setUploadComplete] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    if (!file.type.startsWith("video/")) {
      alert("Por favor selecciona un archivo de video válido")
      return
    }

    const url = URL.createObjectURL(file)
    setSelectedVideo({
      file,
      url,
      name: file.name,
    })
    setUploadProgress(0)
    setIsUploading(false)
    setUploadComplete(false)
    setUploadError(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    handleFileSelect(e.dataTransfer.files)
  }

  const handleUpload = async () => {
    if (!selectedVideo) return

    setIsUploading(true)
    setUploadProgress(0)
    setUploadError(null)

    try {
      const result = await apiService.uploadVideoFile(selectedVideo.file, undefined, (progress) => {
        // Update progress in real-time
        console.log(`[v0] Video upload received progress: ${progress}%`)
        setUploadProgress(progress)
      })

      if (result.status === "completed" || result.id) {
        setUploadProgress(100)
        setUploadComplete(true)
      } else {
        setUploadError("Upload completed but status is unclear")
      }
    } catch (error) {
      console.error("[v0] Video upload error:", error)
      setUploadError(error instanceof Error ? error.message : "Error al subir el video")
    } finally {
      setIsUploading(false)
    }
  }

  const handleReset = () => {
    if (selectedVideo) {
      URL.revokeObjectURL(selectedVideo.url)
    }
    setSelectedVideo(null)
    setUploadProgress(0)
    setIsUploading(false)
    setUploadComplete(false)
    setUploadError(null)
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
        <Card>
          <CardContent className="p-8">
            <div
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-primary/50"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Arrastra tu video aquí</h3>
              <p className="text-muted-foreground mb-4">O haz clic para seleccionar un archivo de video</p>
              <Button variant="outline">
                <Video className="h-4 w-4 mr-2" />
                Seleccionar Video
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Video Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Previsualización del Video</span>
                <Button variant="ghost" size="sm" onClick={handleReset} disabled={isUploading}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <video src={selectedVideo.url} className="w-full h-64 object-cover rounded-lg" controls />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{selectedVideo.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {(selectedVideo.file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload Progress */}
          {isUploading && (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="font-medium">Subiendo video...</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                  <span className="text-sm text-muted-foreground">{uploadProgress}% completado</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upload Success */}
          {uploadComplete && (
            <Card className="border-green-500/20 bg-green-500/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">¡Video subido exitosamente!</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  El video ha sido procesado y está disponible para análisis.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Upload Error */}
          {uploadError && (
            <Card className="border-red-500/20 bg-red-500/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Error al subir el video</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{uploadError}</p>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleReset} disabled={isUploading}>
              Cancelar
            </Button>
            <Button onClick={handleUpload} disabled={isUploading || uploadComplete} className="gap-2">
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Subir Video
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
