"use client"

import { useEffect, useRef, useState } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Download, Share2, Edit, Play, MessageSquare, Brain, Video, FileText, Mic } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import VideoPlayer from "@/components/video-player"
import AIChatEmbed from "@/components/ai-chat-embed"
//import vosk from "vosk-browser"

export default function ProjectView() {
const hasStartedRecognition = useRef<boolean>(false);
  const { id } = useParams()
  const [project, setProject] = useState<any>(null)
  const [selectedVideo, setSelectedVideo] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("video")
  const [isVideoReady, setIsVideoReady] = useState(false)
  const videoRef = useRef<any>(null)
  const [isListening, setIsListening] = useState(false)
    
    const [transcript, setTranscript] = useState<string>("")
    const [partial, setPartial] = useState<string>("")

    const modelRef = useRef<any>(null)
    const recognizerRef = useRef<any>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const workletNodeRef = useRef<AudioWorkletNode | null>(null)
    
const isRecognitionActive = useRef(false);
    const manuallyStoppedRef = useRef(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    

    const handleTabChange = (tab: string) => {
      setActiveTab(tab)
      if (tab === "chat") {
        console.log("🧠 Switched to chat tab, recognition stopped")
      } else if (tab === "video") {
        console.log("🎬 Returned to video tab, recognition restarted")
      }
    }

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await axios.get(`http://127.0.0.1:8000/projects/${id}`)
        const p = res.data

        const video = {
          id: "1",
          name: p.video_path?.split("/").pop(),
          type: "video/mp4",
          size: "Không rõ",
          duration: "Không rõ",
          url: `http://127.0.0.1:8000/${p.video_path}`,
          thumbnail: `http://127.0.0.1:8000/${p.thumbnail}`,
          description: p.description,
        }

        const doc = {
          id: "1",
          name: p.document_path?.split("/").pop(),
          type: "application/pdf",
          size: "Không rõ",
          url: `http://127.0.0.1:8000/${p.document_path}`,
        }

        setProject({
          ...p,
          createdAt: "N/A",
          lastModified: "N/A",
          size: "N/A",
          modelStatus: p.accuracy > 0 ? "trained" : "draft",
          videos: [video],
          documents: [doc],
        })
        setSelectedVideo(video)
        setIsVideoReady(true)
      } catch (err) {
        console.error("Error fetching project:", err)
      }
    }

    if (id) fetchProject()
  }, [id])

  const handleVideoEnd = () => setActiveTab("chat")
  const handleDownload = () => selectedVideo && window.open(selectedVideo.url, "_blank")
  const handleShare = () => console.log("Sharing project:", id)
  const handleEdit = () => window.open(`/project/${id}/edit`, "_blank")

  const getStatusColor = (status: string) =>
    status === "completed" ? "default" : status === "training" ? "secondary" : "outline"

  const getStatusText = (status: string) =>
    status === "completed" ? "Hoàn thành" : status === "training" ? "Đang xử lý" : status === "draft" ? "Nháp" : status

  if (!project) return <div className="p-6 text-center">Đang tải dữ liệu...</div>

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Quay lại
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            {isListening && (
              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                <Mic className="h-3 w-3" /> Listening for "Hey Assistant"
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleShare} className="gap-2 bg-transparent">
              <Share2 className="h-4 w-4" /> Chia sẻ
            </Button>
            <Button variant="outline" onClick={handleEdit} className="gap-2 bg-transparent">
              <Edit className="h-4 w-4" /> Chỉnh sửa
            </Button>
            <Button variant="outline" onClick={handleDownload} className="gap-2 bg-transparent">
              <Download className="h-4 w-4" /> Tải xuống
            </Button>
            <Button onClick={() => setActiveTab("chat")} className="gap-2">
              <MessageSquare className="h-4 w-4" /> Hỏi AI
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs
  value={activeTab}
          onValueChange={(tab) => {
              setActiveTab(tab);
              // When switching tabs:
              if (tab === "chat") {
                      stopRecognition().then(() => {
                          console.log("Switched to chat tab, stopped recognition.");
                      });
                  } else if (tab === "video") {
                      manuallyStoppedRef.current = false;
                      restartRecognition();
                      console.log("Returned to video tab, restarted recognition.");
                  }
          }
          }
  className="space-y-6"
>

              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="video" className="gap-2">
                  <Video className="h-4 w-4" />
                  Video
                </TabsTrigger>
                <TabsTrigger value="chat" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  AI Chat
                  {project.modelStatus === "trained" && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {project.accuracy}%
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="info" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Thông tin
                </TabsTrigger>
              </TabsList>

              <TabsContent value="video" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{selectedVideo.name}</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{selectedVideo.size}</Badge>
                        <Badge variant="outline">{selectedVideo.duration}</Badge>
                      </div>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{selectedVideo.description}</p>
                  </CardHeader>
                  <CardContent>
                    {isVideoReady ? (
                      <VideoPlayer
                        ref={videoRef}
                        video={selectedVideo}
                        onVideoEnd={handleVideoEnd}
                        onOpenChat={() => setActiveTab("chat")}
                        showChatButton={false}
                        autoPlay={true}
                      />
                    ) : (
                      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                          <p className="text-sm text-muted-foreground">Đang tải video...</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="chat" className="space-y-6">
                <Card className="h-[600px]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-primary" />
                      AI Chat - {project.name}
                      {project.modelStatus === "trained" && (
                        <Badge variant="secondary" className="gap-1">
                          <Brain className="h-3 w-3" />
                          Trained ({project.accuracy}%)
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Hỏi AI về dự án, video, chiến lược hoặc bất kỳ nội dung nào
                    </p>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-120px)]">
                    <AIChatEmbed
                      projectId={id as string}
                      projectName={project.name}
                      projectData={project}
                      currentVideo={selectedVideo}
          onReturnToVideo={() => setActiveTab("video")}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="info" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Về dự án này</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{project.description}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Tạo:</span>
                        <p className="text-muted-foreground">{project.createdAt}</p>
                      </div>
                      <div>
                        <span className="font-medium">Cập nhật:</span>
                        <p className="text-muted-foreground">{project.lastModified}</p>
                      </div>
                      <div>
                        <span className="font-medium">Loại:</span>
                        <p className="text-muted-foreground capitalize">{project.type}</p>
                      </div>
                      <div>
                        <span className="font-medium">Kích thước:</span>
                        <p className="text-muted-foreground">{project.size}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Mô hình AI</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>Trạng thái:</span>
                        <Badge variant={project.modelStatus === "trained" ? "default" : "secondary"}>
                          {project.modelStatus === "trained" ? "Đã training" : "Chưa training"}
                        </Badge>
                      </div>
                      {project.modelStatus === "trained" && (
                        <div className="flex items-center justify-between">
                          <span>Độ chính xác:</span>
                          <span className="font-medium">{project.accuracy}%</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span>Dữ liệu training:</span>
                        <span>
                          {project.videos.length} video + {project.documents.length} tài liệu
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Video dự án</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {project.videos.map((video: any) => (
                    <div
                      key={video.id}
                      className={`flex items-center space-x-3 p-3 rounded cursor-pointer transition-colors ${
                        selectedVideo.id === video.id ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedVideo(video)}
                    >
                      <div className="w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                        <img
                          src={video.thumbnail || "/placeholder.svg"}
                          alt={video.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{video.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {video.duration} • {video.size}
                        </p>
                      </div>
                      {selectedVideo.id === video.id && <Play className="h-4 w-4 text-primary" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tài liệu ({project.documents.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {project.documents.map((doc: any) => (
                    <div key={doc.id} className="flex items-center space-x-3 p-2 rounded hover:bg-muted/50">
                      <div className="w-8 h-8 bg-muted rounded flex items-center justify-center flex-shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{doc.size}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hành động nhanh</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 bg-transparent"
                  onClick={() => setActiveTab("chat")}
                >
                  <MessageSquare className="h-4 w-4" />
                  Hỏi AI về dự án
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 bg-transparent"
                  onClick={() => setActiveTab("video")}
                >
                  <Play className="h-4 w-4" />
                  Xem video
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 bg-transparent" onClick={handleEdit}>
                  <Edit className="h-4 w-4" />
                  Chỉnh sửa dự án
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
