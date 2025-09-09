"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, User, Loader2, Brain, Lightbulb, MessageSquare, FileText, Mic, MicOff, Volume2 } from "lucide-react"

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

interface AIChatEmbedProps {
  projectId: string
  projectName: string
  projectData: ProjectData
  currentVideo: any
  onReturnToVideo?: () => void
}

declare global {
  interface Window {
    webkitSpeechRecognition: any
    SpeechRecognition: any
  }
}

export default function AIChatEmbed({ projectId, projectName, projectData, currentVideo, onReturnToVideo }: AIChatEmbedProps) {
  const [messages, setMessages] = useState<Message[]>([{
    id: "1",
    content: `Xin chào! Tôi là AI assistant được training từ dữ liệu dự án "${projectName}" 🧠\n\n• Giải thích nội dung và mục tiêu dự án\n• Phân tích chiến lược & rủi ro\n• Trả lời từ tài liệu và video demo\n\nBạn muốn hỏi gì về dự án này?`,
    sender: "assistant",
    timestamp: new Date(),
  }])

  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [actualVoice, setActualVoice] = useState<string>("")
  const [suggestedQuestions] = useState([
    "Mục tiêu chính của dự án?",
    "Chiến lược marketing?",
    "Giải thích video demo?",
    "Rủi ro và thách thức?",
    "Timeline triển khai?",
    "ROI và ngân sách?",
  ])

  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (currentVideo) {
      const contextMessage: Message = {
        id: `video-context-${currentVideo.id}`,
        content: `📹 Video hiện tại: "${currentVideo.name}"\n\n${currentVideo.description ? `Nội dung: ${currentVideo.description}` : ""}\n\nBạn có câu hỏi gì về video này không?`,
        sender: "assistant",
        timestamp: new Date(),
        type: "suggestion",
      }
      setMessages((prev) => {
        if (prev.some((msg) => msg.id === contextMessage.id)) return prev
        return [...prev, contextMessage]
      })
    }
  }, [currentVideo])

  const speak = (text: string, onEndCallback?: () => void) => {
    const synth = window.speechSynthesis
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "en-US"
    utterance.pitch = 1
    utterance.rate = 1
    utterance.volume = 1
    const voice = synth.getVoices().find((v) => v.lang.startsWith("en"))
    if (voice) {
      utterance.voice = voice
      setActualVoice(voice.name)
    }
    utterance.onend = () => {
      if (onEndCallback) onEndCallback()
    }
    synthRef.current = utterance
    synth.speak(utterance)
  }

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return
    recognitionRef.current = new SpeechRecognition()
    recognitionRef.current.continuous = false
    recognitionRef.current.lang = "en-US"
    recognitionRef.current.interimResults = false
    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.trim().toLowerCase()
      if (!transcript) return
      if (transcript.includes("go back") || transcript.includes("return") || transcript.includes("exit")) {
        if (onReturnToVideo) onReturnToVideo()
      } else {
        setInputMessage(transcript)
        setTimeout(() => sendMessage(transcript), 500)
      }
    }
    recognitionRef.current.onstart = () => setIsRecording(true)
    recognitionRef.current.onend = () => setIsRecording(false)
    recognitionRef.current.start()
  }

  const stopRecording = () => {
    if (recognitionRef.current) recognitionRef.current.stop()
  }

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        startRecording()
      } else {
        stopRecording()
      }
    }
    document.addEventListener("visibilitychange", handleVisibility)
    handleVisibility()
    return () => document.removeEventListener("visibilitychange", handleVisibility)
  }, [])

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
      const response = await fetch(`http://localhost:8000/projects/${projectId}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: textToSend }),
      })
      const data = await response.json()
      const answer = data.answer || "AI không thể trả lời câu hỏi này dựa trên dữ liệu hiện có."
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: answer,
        sender: "assistant",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      speak(answer, () => {
        startRecording() // after speaking the answer, begin recording again for follow-up
      })
    } catch (err) {
      const fallback: Message = {
        id: (Date.now() + 1).toString(),
        content: "⚠️ Đã xảy ra lỗi khi kết nối tới máy chủ. Vui lòng thử lại sau.",
        sender: "assistant",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, fallback])
      speak(fallback.content)
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

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex items-start space-x-3 ${message.sender === "user" ? "flex-row-reverse space-x-reverse" : ""}`}>
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback>
                  {message.sender === "user" ? <User className="h-4 w-4" /> : <Brain className="h-4 w-4 text-primary" />}
                </AvatarFallback>
              </Avatar>
              <div className={`flex-1 max-w-[85%] p-3 rounded-lg ${message.sender === "user" ? "bg-primary text-primary-foreground ml-auto" : message.type === "suggestion" ? "bg-blue-50 border border-blue-200" : "bg-muted"}`}>
                {message.type === "suggestion" && (
                  <div className="flex items-center space-x-1 mb-2">
                    <Lightbulb className="h-3 w-3 text-blue-500" />
                    <span className="text-xs text-blue-600 font-medium">Gợi ý từ AI</span>
                  </div>
                )}
                <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                <p className="text-xs opacity-70 mt-2">{message.timestamp.toLocaleTimeString()}</p>
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
                  <span className="text-sm">AI đang trả lời...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t pt-4 mt-4">
        <div className="mb-3">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Câu hỏi gợi ý:
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {suggestedQuestions.map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => sendMessage(question)}
                disabled={isLoading}
                className="text-xs bg-transparent justify-start h-auto py-2 px-3"
              >
                {question}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pb-2">
          <Button onClick={isRecording ? stopRecording : startRecording} variant={isRecording ? "destructive" : "outline"}>
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />} Ghi âm
          </Button>
          <Button onClick={() => speak(inputMessage)} variant="ghost">
            <Volume2 className="h-4 w-4" /> Nói
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Hỏi AI về dự án, tài liệu, video..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={() => sendMessage()} disabled={!inputMessage.trim() || isLoading} size="sm">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>
            AI training từ {projectData.videos.length} video + {projectData.documents.length} tài liệu
          </span>
          <div className="flex items-center space-x-1">
            <FileText className="h-3 w-3" />
            <span>Video: {currentVideo.name}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
