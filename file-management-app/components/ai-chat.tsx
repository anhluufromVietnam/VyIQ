"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, User, Loader2, Brain, X, Lightbulb, MessageSquare, FileText } from "lucide-react"

interface Message {
  id: string
  content: string
  sender: "user" | "assistant"
  timestamp: Date
  type?: "suggestion" | "normal"
}

interface ProjectData {
  id: string
  name: string
  description: string
  type: string
  videos: any[]
  documents: any[]
  modelStatus: string
  accuracy: number
}

interface AIChatProps {
  projectId: string
  projectName: string
  projectData: ProjectData
  currentVideo: any
  isOpen: boolean
  onClose: () => void
}

export default function AIChat({ projectId, projectName, projectData, currentVideo, isOpen, onClose }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: `Xin chà! Tôi là AI assistant đã được training từ dữ liệu dự án \"${projectName}\". Tôi có thể trả lời các câu hỏi về:\n\n• Nội dung và mục tiêu của dự án\n• Chiến lược và kế hoạch triển khai  \n• Phân tích thị trường và đối thủ cạnh tranh\n• Video demo và tính năng sản phẩm\n• Tài liệu và báo cáo dự án\n\nBạn muốn hỏi gì về dự án này?`,
      sender: "assistant",
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [suggestedQuestions] = useState([
    "Mục tiêu chính của dự án này là gì?",
    "Giải thích về video demo vừa xem?",
    "Chiến lược marketing có gì đặc biệt?",
    "Rủi ro và thách thức của dự án?",
    "Timeline triển khai như thế nào?",
    "Ngân sách và ROI dự kiến?",
  ])
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (isOpen && currentVideo) {
      const contextMessage: Message = {
        id: `video-context-${currentVideo.id}`,
        content: `Tôi thấy bạn đang xem video \"${currentVideo.name}\". ${
          currentVideo.description ? `Video này về: ${currentVideo.description}. ` : ""
        }Bạn có câu hỏi gì về nội dung video này không?`,
        sender: "assistant",
        timestamp: new Date(),
        type: "suggestion",
      }

      setMessages((prev) => {
        if (prev.some((msg) => msg.id === contextMessage.id)) {
          return prev
        }
        return [...prev, contextMessage]
      })
    }
  }, [currentVideo, isOpen])

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputMessage.trim()
    if (!textToSend || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: textToSend,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    try {
      const response = await fetch(`/projects/${projectId}/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: textToSend,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get AI response")
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        sender: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl h-[700px] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-primary" />
              <CardTitle>AI Q&A - {projectName}</CardTitle>
              <Badge variant="secondary" className="gap-1">
                <Brain className="h-3 w-3" />
                Trained Model ({projectData.accuracy}%)
              </Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <FileText className="h-4 w-4" />
              <span>Video hiện tại: {currentVideo.name}</span>
            </div>
            <div className="flex items-center space-x-1">
              <FileText className="h-4 w-4" />
              <span>{projectData.documents.length} tài liệu đã training</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-3 ${
                    message.sender === "user" ? "flex-row-reverse space-x-reverse" : ""
                  }`}
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>
                      {message.sender === "user" ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Brain className="h-4 w-4 text-primary" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`flex-1 max-w-[80%] p-3 rounded-lg ${
                      message.sender === "user"
                        ? "bg-primary text-primary-foreground ml-auto"
                        : message.type === "suggestion"
                        ? "bg-blue-50 border border-blue-200"
                        : "bg-muted"
                    }`}
                  >
                    {message.type === "suggestion" && (
                      <div className="flex items-center space-x-1 mb-2">
                        <Lightbulb className="h-3 w-3 text-blue-500" />
                        <span className="text-xs text-blue-600 font-medium">Context từ AI</span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">{message.timestamp.toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-start space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>
                      <Brain className="h-4 w-4 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">AI đang phân tích và trả lời...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="border-t p-4">
            <div className="mb-3">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Câu hỏi gợi ý về dự án:
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => sendMessage(question)}
                    disabled={isLoading}
                    className="text-xs bg-transparent justify-start h-auto py-2 px-3 whitespace-normal"
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Hỏi AI về dự án, video, chiến lược, hoặc bất kỳ nội dung nào..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button onClick={() => sendMessage()} disabled={!inputMessage.trim() || isLoading} size="sm">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Enter để gửi • AI được training từ {projectData.videos.length} video và {projectData.documents.length} tài liệu của dự án
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
