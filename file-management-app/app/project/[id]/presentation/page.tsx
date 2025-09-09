"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ArrowRight, MessageSquare, Brain, Maximize } from "lucide-react"
import Image from "next/image"
import AIChat from "@/components/ai-chat"

// Mock presentation data được tạo tự động từ AI
const mockPresentation = {
  id: "1",
  name: "Dự án Marketing Q4 2024",
  description: "Thuyết minh tự động được tạo bởi AI từ nội dung dự án",
  slides: [
    {
      id: "1",
      title: "Tổng quan Dự án Marketing Q4 2024",
      content:
        "Chào mừng đến với thuyết minh dự án Marketing Q4. Dự án này tập trung vào digital transformation và tăng trưởng bền vững.",
      image: "/placeholder.svg?height=600&width=800",
      type: "intro",
      aiGenerated: true,
      notes: "Slide giới thiệu được tạo tự động từ phân tích nội dung dự án",
    },
    {
      id: "2",
      title: "Video Demo Sản phẩm",
      content: "Xem video demo chi tiết về sản phẩm và tính năng mới",
      videoUrl: "/placeholder.svg?height=600&width=800",
      type: "video",
      duration: "3:45",
      aiGenerated: false,
      notes: "Video gốc từ dự án, sẽ có Q&A sau khi xem xong",
    },
    {
      id: "3",
      title: "Phân tích Thị trường",
      content: "Dựa trên dữ liệu đã phân tích, thị trường có tiềm năng tăng trưởng 25% trong Q4",
      image: "/placeholder.svg?height=600&width=800",
      type: "analysis",
      aiGenerated: true,
      notes: "Phân tích được tạo từ AI dựa trên tài liệu dự án",
    },
    {
      id: "4",
      title: "Chiến lược Triển khai",
      content: "3 giai đoạn triển khai: Chuẩn bị (2 tuần), Thực hiện (6 tuần), Đánh giá (2 tuần)",
      image: "/placeholder.svg?height=600&width=800",
      type: "strategy",
      aiGenerated: true,
      notes: "Chiến lược được AI đề xuất dựa trên best practices",
    },
    {
      id: "5",
      title: "Q&A và Thảo luận",
      content: "Hãy đặt câu hỏi về dự án. AI sẽ trả lời dựa trên kiến thức đã được training.",
      image: "/placeholder.svg?height=600&width=800",
      type: "qna",
      aiGenerated: true,
      notes: "Phần Q&A với AI được training từ dữ liệu dự án",
    },
  ],
}

export default function PresentationPage({ params }: { params: { id: string } }) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showAIChat, setShowAIChat] = useState(false)
  const [videoEnded, setVideoEnded] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const slides = mockPresentation.slides
  const totalSlides = slides.length

  // Auto-show AI chat after video ends
  useEffect(() => {
    if (slides[currentSlide].type === "video" && videoEnded) {
      setTimeout(() => {
        setShowAIChat(true)
      }, 2000)
    }
  }, [videoEnded, currentSlide, slides])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
        case " ":
          nextSlide()
          break
        case "ArrowLeft":
          prevSlide()
          break
        case "Escape":
          if (isFullscreen) {
            exitFullscreen()
          }
          break
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [currentSlide, isFullscreen])

  const nextSlide = () => {
    setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1))
    setVideoEnded(false)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0))
    setVideoEnded(false)
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
    setVideoEnded(false)
  }

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      exitFullscreen()
    }
  }

  const exitFullscreen = () => {
    document.exitFullscreen()
    setIsFullscreen(false)
  }

  const handleVideoEnd = () => {
    setVideoEnded(true)
    setIsPlaying(false)
  }

  return (
    <div className={`min-h-screen bg-black text-white ${isFullscreen ? "fixed inset-0 z-50" : ""}`}>
      {/* Header */}
      {!isFullscreen && (
        <header className="bg-black/90 backdrop-blur border-b border-gray-800">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.history.back()}
                  className="text-white hover:bg-gray-800"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Quay lại
                </Button>
                <div>
                  <h1 className="font-semibold">{mockPresentation.name}</h1>
                  <p className="text-sm text-gray-400">
                    Slide {currentSlide + 1} / {totalSlides} • {mockPresentation.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="gap-2">
                  <Brain className="h-3 w-3" />
                  AI Generated
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAIChat(true)}
                  className="text-white hover:bg-gray-800 gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Hỏi AI
                </Button>
                <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="text-white hover:bg-gray-800">
                  <Maximize className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <div className={`flex items-center justify-center ${isFullscreen ? "h-screen" : "h-[calc(100vh-80px)]"} p-8`}>
        <Card className="w-full max-w-6xl bg-white text-black">
          <CardContent className="p-0">
            <div className="relative aspect-video">
              {slides[currentSlide].type === "video" ? (
                <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
                  <video
                    src={slides[currentSlide].videoUrl || "/placeholder.svg"}
                    className="w-full h-full object-contain"
                    controls
                    onEnded={handleVideoEnd}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                  {videoEnded && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                      <div className="text-center text-white">
                        <h3 className="text-2xl font-bold mb-4">Video đã kết thúc</h3>
                        <p className="mb-6">Bạn có muốn thảo luận về nội dung video với AI không?</p>
                        <Button onClick={() => setShowAIChat(true)} className="gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Bắt đầu Q&A với AI
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Image
                  src={slides[currentSlide].image || "/placeholder.svg"}
                  alt={slides[currentSlide].title}
                  fill
                  className="object-cover rounded-lg"
                />
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent rounded-lg" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center space-x-2 mb-2">
                  <h2 className="text-3xl font-bold text-white">{slides[currentSlide].title}</h2>
                  {slides[currentSlide].aiGenerated && (
                    <Badge variant="secondary" className="gap-1">
                      <Brain className="h-3 w-3" />
                      AI
                    </Badge>
                  )}
                </div>
                <p className="text-lg text-white/90 mb-4">{slides[currentSlide].content}</p>

                {slides[currentSlide].type === "qna" && (
                  <Button onClick={() => setShowAIChat(true)} className="gap-2" variant="secondary">
                    <MessageSquare className="h-4 w-4" />
                    Bắt đầu hỏi đáp với AI
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Controls */}
      <div className="bg-black/90 backdrop-blur border-t border-gray-800 p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className="text-white hover:bg-gray-800"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={nextSlide}
              disabled={currentSlide === totalSlides - 1}
              className="text-white hover:bg-gray-800"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Slide Indicators */}
          <div className="flex items-center space-x-2">
            {slides.map((slide, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors relative ${
                  index === currentSlide ? "bg-white" : "bg-gray-600 hover:bg-gray-400"
                }`}
              >
                {slide.aiGenerated && <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <Badge variant="secondary">
              {currentSlide + 1} / {totalSlides}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAIChat(true)}
              className="text-white hover:bg-gray-800 gap-2"
            >
              <Brain className="h-4 w-4" />
              AI Q&A
            </Button>
          </div>
        </div>
      </div>

      {/* AI Chat Component */}
      <AIChat
        projectId={params.id}
        projectName={mockPresentation.name}
        currentSlide={slides[currentSlide]}
        isOpen={showAIChat}
        onClose={() => setShowAIChat(false)}
      />
    </div>
  )
}
