// ai-chat-speech-embed.tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Mic, Pause, Play } from "lucide-react"
import AIChatEmbed from "@/components/ai-chat-embed"

export default function AIChatSpeechWrapper({ projectId, projectName, projectData, currentVideo, videoRef }: any) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [silenceTimeout, setSilenceTimeout] = useState<any>(null)
  const [timer, setTimer] = useState(0)
  const recognitionRef = useRef<any>(null)
  const countdownRef = useRef<any>(null)

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window)) return alert("Trình duyệt không hỗ trợ speech recognition")

    const SpeechRecognition = (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = "vi-VN"

    recognition.onstart = () => {
      setIsListening(true)
      setTimer(5)
      clearInterval(countdownRef.current)
      countdownRef.current = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            clearInterval(countdownRef.current)
            recognition.stop()
            return 0
          }
          return t - 1
        })
      }, 1000)
      videoRef?.current?.pause()
    }

    recognition.onresult = (event: any) => {
      const result = event.results[0][0].transcript
      setTranscript(result)
      sendToAI(result)
    }

    recognition.onerror = (event: any) => {
      console.error("Recognition error:", event)
      stopListening()
    }

    recognition.onend = () => {
      setIsListening(false)
      clearInterval(countdownRef.current)
      if (!transcript) videoRef?.current?.play()
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setIsListening(false)
    clearInterval(countdownRef.current)
  }

  const sendToAI = async (text: string) => {
    try {
      const response = await fetch(`http://localhost:8000/projects/${projectId}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
      })

      const data = await response.json()
      const answer = data.answer || "Không thể trả lời."

      speak(answer)
    } catch (error) {
      console.error("Error sending question:", error)
    }
  }

  const speak = (text: string) => {
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = "vi-VN"
    window.speechSynthesis.speak(utter)
  }

  return (
    <div className="relative h-full">
      <AIChatEmbed
        projectId={projectId}
        projectName={projectName}
        projectData={projectData}
        currentVideo={currentVideo}
      />

      <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-background p-2 rounded-lg shadow-md">
        <Button onClick={isListening ? stopListening : startListening} variant="outline" size="sm">
          {isListening ? <Pause className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </Button>
        {isListening && <div className="text-sm text-muted-foreground">⏳ {timer}s</div>}
      </div>
    </div>
  )
}
