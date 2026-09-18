// Updated VideoEditor.tsx with working video playback
"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Play, Pause, SkipBack, SkipForward, Volume2, Scissors, Type, MessageSquare, Download } from "lucide-react"

interface VideoFile {
  id: string
  name: string
  type: string
  size: string
  duration: string
  url: string
  thumbnail: string
  editable: boolean
}

interface VideoEditorProps {
  files: VideoFile[]
  onContentChange: () => void
}

export default function VideoEditor({ files, onContentChange }: VideoEditorProps) {
  const [selectedVideo, setSelectedVideo] = useState(files[0])
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(100)
  const [volume, setVolume] = useState([80])
  const [annotations, setAnnotations] = useState<
    Array<{
      time: number
      text: string
      id: string
    }>
  >([])
  const [newAnnotation, setNewAnnotation] = useState("")
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (video) {
      video.volume = volume[0] / 100
    }
  }, [volume])

  const handlePlayPause = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
    setIsPlaying(!isPlaying)
    onContentChange()
  }

  const handleTimeChange = (value: number[]) => {
    const video = videoRef.current
    if (video) {
      video.currentTime = value[0]
    }
    setCurrentTime(value[0])
    onContentChange()
  }

  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current
    if (video) {
      video.volume = value[0] / 100
    }
    setVolume(value)
    onContentChange()
  }

  const addAnnotation = () => {
    if (newAnnotation.trim()) {
      const annotation = {
        id: Date.now().toString(),
        time: currentTime,
        text: newAnnotation.trim(),
      }
      setAnnotations([...annotations, annotation])
      setNewAnnotation("")
      onContentChange()
    }
  }

  const removeAnnotation = (id: string) => {
    setAnnotations(annotations.filter((ann) => ann.id !== id))
    onContentChange()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Select Video to Edit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file) => (
              <Card
                key={file.id}
                className={`cursor-pointer transition-colors ${
                  selectedVideo.id === file.id ? "ring-2 ring-primary" : "hover:bg-muted/50"
                }`}
                onClick={() => setSelectedVideo(file)}
              >
                <CardContent className="p-4">
                  <div className="aspect-video bg-muted rounded mb-3 overflow-hidden">
                    <img
                      src={file.thumbnail || "/placeholder.svg"}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h4 className="font-medium truncate">{file.name}</h4>
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>{file.duration}</span>
                    <span>{file.size}</span>
                  </div>
                  {file.editable && (
                    <Badge variant="secondary" className="mt-2">
                      Editable
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  src={selectedVideo.url}
                  poster={selectedVideo.thumbnail}
                  className="w-full h-full object-contain"
                  onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                  onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                  controls={false}
                />

                <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button size="lg" onClick={handlePlayPause} className="rounded-full w-16 h-16">
                    {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                  </Button>
                </div>

                {annotations.map((annotation) => (
                  <div
                    key={annotation.id}
                    className="absolute top-4 left-4 bg-black/80 text-white px-3 py-1 rounded text-sm"
                    style={{ display: Math.abs(currentTime - annotation.time) < 5 ? "block" : "none" }}
                  >
                    {annotation.text}
                  </div>
                ))}
              </div>

              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <Slider
                    value={[currentTime]}
                    onValueChange={handleTimeChange}
                    max={duration}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handlePlayPause}>
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button variant="outline" size="sm">
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Volume2 className="h-4 w-4" />
                    <Slider value={volume} onValueChange={handleVolumeChange} max={100} step={1} className="w-20" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Editing Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Button variant="outline" className="gap-2 bg-transparent">
                  <Scissors className="h-4 w-4" />
                  Trim
                </Button>
                <Button variant="outline" className="gap-2 bg-transparent">
                  <Type className="h-4 w-4" />
                  Add Text
                </Button>
                <Button variant="outline" className="gap-2 bg-transparent">
                  <MessageSquare className="h-4 w-4" />
                  Annotations
                </Button>
                <Button variant="outline" className="gap-2 bg-transparent">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Annotation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Time: {formatTime(currentTime)}</Label>
              </div>
              <Textarea
                placeholder="Enter annotation text..."
                value={newAnnotation}
                onChange={(e) => setNewAnnotation(e.target.value)}
                rows={3}
              />
              <Button onClick={addAnnotation} className="w-full" disabled={!newAnnotation.trim()}>
                Add Annotation
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Annotations ({annotations.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {annotations.map((annotation) => (
                  <div key={annotation.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline">{formatTime(annotation.time)}</Badge>
                      <Button variant="ghost" size="sm" onClick={() => removeAnnotation(annotation.id)}>
                        ×
                      </Button>
                    </div>
                    <p className="text-sm">{annotation.text}</p>
                  </div>
                ))}
                {annotations.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No annotations yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}