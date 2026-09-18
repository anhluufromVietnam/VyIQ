"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, Volume2, VolumeX, Maximize, Download, FileText, ImageIcon, Video, File } from "lucide-react"
import Image from "next/image"

interface FileViewerProps {
  file: {
    id: string
    name: string
    type: string
    size: string
    url: string
    thumbnail: string
  }
}

export default function FileViewer({ file }: FileViewerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  const getFileTypeIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="h-5 w-5" />
    if (type.startsWith("video/")) return <Video className="h-5 w-5" />
    if (type.includes("pdf") || type.includes("document")) return <FileText className="h-5 w-5" />
    return <File className="h-5 w-5" />
  }

  const renderFileContent = () => {
    if (file.type.startsWith("image/")) {
      return (
        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
          <Image src={file.url || "/placeholder.svg"} alt={file.name} fill className="object-contain" />
        </div>
      )
    }

    if (file.type.startsWith("video/")) {
      return (
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <video src={file.url} poster={file.thumbnail} className="w-full h-full object-contain" controls={false} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center space-x-4">
              <Button size="lg" onClick={() => setIsPlaying(!isPlaying)} className="rounded-full w-16 h-16">
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </Button>
            </div>
          </div>
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button variant="secondary" size="sm" onClick={() => setIsMuted(!isMuted)}>
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            </div>
            <Button variant="secondary" size="sm">
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )
    }

    if (file.type.includes("pdf")) {
      return (
        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
          <div className="text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">PDF Document</h3>
            <p className="text-sm text-muted-foreground mb-4">Click to view in a new tab</p>
            <Button onClick={() => window.open(file.url, "_blank")}>Open PDF</Button>
          </div>
        </div>
      )
    }

    if (file.type.includes("presentation")) {
      return (
        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
          <div className="text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">Presentation File</h3>
            <p className="text-sm text-muted-foreground mb-4">{file.name}</p>
            <div className="flex space-x-2 justify-center">
              <Button onClick={() => window.open(file.url, "_blank")}>Open File</Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </div>
      )
    }

    // Default file viewer
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center">
          {getFileTypeIcon(file.type)}
          <h3 className="font-medium mb-2 mt-4">File Preview</h3>
          <p className="text-sm text-muted-foreground mb-4">Preview not available for this file type</p>
          <div className="flex space-x-2 justify-center">
            <Button onClick={() => window.open(file.url, "_blank")}>Open File</Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {renderFileContent()}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getFileTypeIcon(file.type)}
          <span className="font-medium">{file.name}</span>
          <Badge variant="outline">{file.size}</Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.open(file.url, "_blank")}>
            <Maximize className="h-4 w-4 mr-2" />
            Full Screen
          </Button>
        </div>
      </div>
    </div>
  )
}
