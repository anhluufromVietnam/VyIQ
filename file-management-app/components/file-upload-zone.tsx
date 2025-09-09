"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, X, File, ImageIcon, Video, FileText } from "lucide-react"

interface FileUploadZoneProps {
  onFilesChange: (files: File[]) => void
  acceptedTypes?: Record<string, string[]>
  maxSize?: number
  multiple?: boolean
}

interface FileWithPreview extends File {
  preview?: string
  progress?: number
}

const getFileIcon = (file: File) => {
  if (file.type.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
  if (file.type.startsWith("video/")) return <Video className="h-4 w-4" />
  if (file.type.includes("pdf") || file.type.includes("document")) return <FileText className="h-4 w-4" />
  return <File className="h-4 w-4" />
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export default function FileUploadZone({
  onFilesChange,
  acceptedTypes = {},
  maxSize = 10 * 1024 * 1024,
  multiple = true,
}: FileUploadZoneProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = acceptedFiles.map((file) => {
        const fileWithPreview = Object.assign(file, {
          preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
        })
        return fileWithPreview
      })

      const updatedFiles = multiple ? [...files, ...newFiles] : newFiles
      setFiles(updatedFiles)
      onFilesChange(updatedFiles)

      // Simulate upload progress
      newFiles.forEach((file) => {
        const fileName = file.name
        let progress = 0
        const interval = setInterval(() => {
          progress += Math.random() * 30
          if (progress >= 100) {
            progress = 100
            clearInterval(interval)
          }
          setUploadProgress((prev) => ({ ...prev, [fileName]: progress }))
        }, 200)
      })
    },
    [files, multiple, onFilesChange],
  )

  const removeFile = (fileToRemove: FileWithPreview) => {
    const updatedFiles = files.filter((file) => file !== fileToRemove)
    setFiles(updatedFiles)
    onFilesChange(updatedFiles)

    if (fileToRemove.preview) {
      URL.revokeObjectURL(fileToRemove.preview)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes,
    maxSize,
    multiple,
  })

  return (
    <div className="space-y-4">
      <Card
        {...getRootProps()}
        className={`border-2 border-dashed cursor-pointer transition-colors ${
          isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
        }`}
      >
        <CardContent className="p-8 text-center">
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          {isDragActive ? (
            <p className="text-lg font-medium">Thả file vào đây...</p>
          ) : (
            <div>
              <p className="text-lg font-medium mb-2">Kéo thả file vào đây hoặc click để chọn</p>
              <p className="text-sm text-muted-foreground mb-4">Kích thước tối đa: {formatFileSize(maxSize)}</p>
              <Button variant="outline">Chọn file</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">File đã chọn ({files.length})</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {files.map((file, index) => (
              <Card key={`${file.name}-${index}`}>
                <CardContent className="p-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {file.preview ? (
                        <img
                          src={file.preview || "/placeholder.svg"}
                          alt={file.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                          {getFileIcon(file)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {formatFileSize(file.size)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{file.type || "Unknown type"}</span>
                      </div>
                      {uploadProgress[file.name] !== undefined && uploadProgress[file.name] < 100 && (
                        <Progress value={uploadProgress[file.name]} className="mt-2 h-1" />
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeFile(file)} className="flex-shrink-0">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
