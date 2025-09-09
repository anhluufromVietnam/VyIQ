"use client"

import { useState, useRef, forwardRef, useImperativeHandle, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Volume2, VolumeX, Maximize, MessageSquare } from "lucide-react"

interface Video {
  id: string
  name: string
  type: string
  size: string
  duration: string
  url: string
  thumbnail: string
  description?: string
}

interface VideoPlayerProps {
  video: Video
  onVideoEnd: () => void
  onOpenChat: () => void
  showChatButton?: boolean
  autoPlay?: boolean
}

export interface VideoPlayerHandles {
  getCurrentTime: () => number
  getDuration: () => number
  seekTo: (time: number) => void
}

const VideoPlayer = forwardRef<VideoPlayerHandles, VideoPlayerProps>(
  ({ video, onVideoEnd, onOpenChat, showChatButton = false, autoPlay = false }, ref) => {
    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [volume, setVolume] = useState([80])
    const videoRef = useRef<HTMLVideoElement>(null)

    useImperativeHandle(ref, () => ({
      getCurrentTime: () => currentTime,
      getDuration: () => duration,
      seekTo: (time: number) => {
        if (videoRef.current) {
          videoRef.current.currentTime = time
          setCurrentTime(time)
        }
      },
    }))

    useEffect(() => {
      // Auto play video when component mounts
      if (videoRef.current && autoPlay) {
        const playVideo = async () => {
          try {
            await videoRef.current?.play()
            setIsPlaying(true)
          } catch (error) {
            console.log("Auto-play was prevented by browser:", error)
            // Auto-play was prevented, user needs to interact first
          }
        }

        // Small delay to ensure video is loaded
        setTimeout(playVideo, 500)
      }
    }, [video.url, autoPlay])

    const handlePlayPause = () => {
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause()
        } else {
          videoRef.current.play()
        }
        setIsPlaying(!isPlaying)
      }
    }

    const handleTimeUpdate = () => {
      if (videoRef.current) {
        setCurrentTime(videoRef.current.currentTime)
        setDuration(videoRef.current.duration || 0)
      }
    }

    const handleSeek = (value: number[]) => {
      if (videoRef.current) {
        videoRef.current.currentTime = value[0]
        setCurrentTime(value[0])
      }
    }

    const handleVolumeChange = (value: number[]) => {
      if (videoRef.current) {
        videoRef.current.volume = value[0] / 100
        setVolume(value)
        setIsMuted(value[0] === 0)
      }
    }

    const toggleMute = () => {
      if (videoRef.current) {
        videoRef.current.muted = !isMuted
        setIsMuted(!isMuted)
      }
    }

    const toggleFullscreen = () => {
      if (videoRef.current) {
        if (videoRef.current.requestFullscreen) {
          videoRef.current.requestFullscreen()
        }
      }
    }

    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins}:${secs.toString().padStart(2, "0")}`
    }

    const handleVideoEnded = () => {
      setIsPlaying(false)
      onVideoEnd()
    }

    return (
      <div className="space-y-4">
        {/* Video Container */}
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden group">
          <video
            ref={videoRef}
            src={video.url}
            poster={video.thumbnail}
            className="w-full h-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleVideoEnded}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />

          {/* Video Overlay Controls */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button size="lg" onClick={handlePlayPause} className="rounded-full w-16 h-16">
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </Button>
          </div>

          {/* Top Right Controls */}
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="secondary" size="sm" onClick={toggleFullscreen}>
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Video Controls */}
        <div className="space-y-4">
          {/* Timeline */}
          <div className="space-y-2">
            <Slider
              value={[currentTime]}
              onValueChange={handleSeek}
              max={duration || 100}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={handlePlayPause}>
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>

              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={toggleMute}>
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <Slider value={volume} onValueChange={handleVolumeChange} max={100} step={1} className="w-20" />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={onOpenChat} className="gap-2 bg-transparent">
                <MessageSquare className="h-4 w-4" />
                Hỏi AI
              </Button>
              <Button variant="outline" size="sm" onClick={toggleFullscreen} className="bg-transparent">
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  },
)

VideoPlayer.displayName = "VideoPlayer"

export default VideoPlayer
