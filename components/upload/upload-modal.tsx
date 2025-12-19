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
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { apiService } from "@/lib/api"
import { useUpload } from "@/contexts/UploadContext"

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

const AVAILABLE_MAPS = [
  "Ancient",
  "Anubis",
  "Dust II",
  "Inferno",
  "Mirage",
  "Nuke",
  "Overpass",
  "Train",
  "Vertigo",
  "Agency",
  "Grail",
  "Jura",
  "Office",
  "Italy",
  "Dogtown",
  "Pool Day",
]

export function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [demFile, setDemFile] = useState<FileUpload | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [metadata, setMetadata] = useState({
    name: "", // Added optional name field for custom match naming
    map: "",
    gameType: "Ranked",
    description: "",
  })

  const { addUploadingMatch, updateMatchStatus, updateMatchProgress, removeUploadingMatch } = useUpload()

  const demInputRef = useRef<HTMLInputElement>(null)

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
    setDemFile((prev) => (prev ? { ...prev, status: "uploading", progress: 0 } : null))

    const tempMatchId = `match-${Date.now()}`
    const matchName = metadata.name ? `${metadata.name}.dem` : demFile.file.name

    const uploadingMatch = {
      id: tempMatchId,
      fileName: matchName,
      map: metadata.map || "Unknown",
      date: new Date().toISOString(),
      status: "uploading" as const,
      gameType: metadata.gameType,
      progress: 0,
    }

    addUploadingMatch(uploadingMatch)
    handleClose()

    try {
      const result = await apiService.uploadDemFile(
        demFile.file,
        {
          playerName: matchName,
          notes: metadata.description || `${metadata.gameType} match on ${metadata.map}`,
        },
        (progress) => {
          updateMatchProgress(tempMatchId, progress)
        },
        (status) => {
          updateMatchStatus(tempMatchId, status)
        },
      )

      if (result.success && result.id) {
        setTimeout(() => {
          removeUploadingMatch(tempMatchId)
        }, 30000)
      } else {
        updateMatchStatus(
          tempMatchId,
          "error",
          result.message || "Error al subir archivo. Por favor, intente más tarde.",
        )
        setTimeout(() => {
          removeUploadingMatch(tempMatchId)
        }, 30000)
      }
    } catch (error: any) {
      console.error("Upload error:", error)
      updateMatchStatus(tempMatchId, "error", error.message || "Error al subir archivo. Por favor, intente más tarde.")
      setTimeout(() => {
        removeUploadingMatch(tempMatchId)
      }, 30000)
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    if (isUploading) return
    setDemFile(null)
    setIsUploading(false)
    setMetadata({ name: "", map: "", gameType: "Ranked", description: "" }) // Reset name field
    onClose()
  }

  const removeFile = () => {
    setDemFile(null)
  }

  const canUpload = demFile && demFile.status !== "error" && !isUploading

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
                        {demFile.status === "uploading" && <Loader2 className="h-4 w-4 animate-spin" />}
                        {demFile.status === "idle" && (
                          <Button variant="ghost" size="sm" onClick={removeFile} disabled={isUploading}>
                            <X className="h-4 w-4 text-black dark:text-white" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {demFile.status === "uploading" && (
                      <div className="space-y-1">
                        <Progress value={demFile.progress} className="h-2" />
                        <p className="text-sm text-muted-foreground text-center">{demFile.progress}% completado</p>
                      </div>
                    )}

                    {demFile.status === "error" && demFile.error && (
                      <p className="text-sm text-red-500">{demFile.error}</p>
                    )}

                    {demFile.status === "success" && (
                      <p className="text-sm text-green-500">✓ Archivo subido exitosamente</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4">Información de la Partida</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre (Opcional)</Label>
                  <InputGroup>
                    <InputGroupInput
                      id="name"
                      placeholder="Nombre de la partida"
                      value={metadata.name}
                      onChange={(e) => setMetadata((prev) => ({ ...prev, name: e.target.value }))}
                      disabled={isUploading}
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupText className="text-muted-foreground">.dem</InputGroupText>
                    </InputGroupAddon>
                  </InputGroup>
                </div>
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
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose} disabled={isUploading}>
              Cancelar
            </Button>
            <Button onClick={handleUpload} disabled={!canUpload} className="gap-2">
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Subiendo...
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
