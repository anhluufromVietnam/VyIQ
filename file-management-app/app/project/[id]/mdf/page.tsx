"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import axios from "axios"
import { useParams } from "next/navigation"
import AvatarLottie from "@/components/AvatarLottie"

import {
  Mic,
  Sparkles,
  Pause,
  Play,
  X,
  RotateCcw,
  Send,
} from "lucide-react"

type LangType = "vi-VN" | "en-US" | "zh-CN"

export default function PresentationPage() {
  const { id } = useParams()

  const videoRef = useRef<HTMLVideoElement>(null)
  const recognitionRef = useRef<any>(null)

  // ================= COLORS =================
  const AU_GREEN = "#009543"
  const AU_DARK_GREEN = "#006b31"

  // ================= SERIAL =================
  const portRef = useRef<any>(null)
  const writerRef =
    useRef<WritableStreamDefaultWriter<Uint8Array> | null>(null)

  const [isSerialConnected, setIsSerialConnected] = useState(false)

  // ================= UI =================
  const [videoUrl, setVideoUrl] = useState("")
  const [showAssistant, setShowAssistant] = useState(false)

  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isPlaying, setIsPlaying] = useState(true)
  const [showControls, setShowControls] = useState(true)

  // ================= LANGUAGE =================
  const [language, setLanguage] =
    useState<LangType>("vi-VN")

  // ================= CHAT =================
  const [inputText, setInputText] = useState("")
  const [currentQuestion, setCurrentQuestion] =
    useState("")
  const [currentAnswer, setCurrentAnswer] =
    useState("")

  const [history, setHistory] = useState<
    { q: string; a: string }[]
  >([])

  // ================= DRAG =================
  const [position, setPosition] = useState<{
    x?: number
    y?: number
  }>({})

  const [dragging, setDragging] = useState(false)

  const dragStart = useRef({
    x: 0,
    y: 0,
  })

  // ================= SERIAL =================
  const connectSerial = async () => {
    try {
      if (!("serial" in navigator)) {
        alert("Web Serial API not supported")
        return
      }

      const port = await (navigator as any).serial.requestPort()

      await port.open({
        baudRate: 9600,
      })

      portRef.current = port
      writerRef.current = port.writable.getWriter()

      setIsSerialConnected(true)
    } catch (err) {
      console.error(err)
    }
  }

  const sendCommand = async (cmd: string) => {
    if (!writerRef.current) return

    try {
      const encoder = new TextEncoder()

      await writerRef.current.write(
        encoder.encode(cmd)
      )
    } catch (err) {
      console.error(err)
    }
  }

  // ================= FETCH =================
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await axios.get(
          `/api/projects/${id}`
        )

        setVideoUrl(`/api/${res.data.video_path}`)
      } catch (e) {
        console.error(e)
      }
    }

    if (id) fetchProject()

    return () => {
      if (portRef.current) {
        writerRef.current?.releaseLock()
        portRef.current.close()
      }
    }
  }, [id])

  // ================= AUTO HIDE =================
  useEffect(() => {
    let timeout: any

    if (showControls) {
      timeout = setTimeout(() => {
        setShowControls(false)
      }, 3500)
    }

    return () => clearTimeout(timeout)
  }, [showControls])

  // ================= DRAG =================
  const handleMouseDown = (
    e: React.MouseEvent
  ) => {
    setDragging(true)

    dragStart.current = {
      x:
        e.clientX -
        (position.x || window.innerWidth - 460),

      y:
        e.clientY -
        (position.y || window.innerHeight - 600),
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging) return

      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      })
    }

    const handleMouseUp = () =>
      setDragging(false)

    window.addEventListener(
      "mousemove",
      handleMouseMove
    )

    window.addEventListener(
      "mouseup",
      handleMouseUp
    )

    return () => {
      window.removeEventListener(
        "mousemove",
        handleMouseMove
      )

      window.removeEventListener(
        "mouseup",
        handleMouseUp
      )
    }
  }, [dragging])

  // ================= CLEAN RESPONSE =================
  const processAIResponse = (raw: string) => {
    if (!raw) return ""

    return raw
      .replace(/<think>[\s\S]*?<\/think>/g, "")
      .replace(/[#*_>~\-]/g, "")
      .replace(/\s+/g, " ")
      .trim()
  }

  // ================= TTS =================
  const speak = useCallback(
    (text: string) => {
      const synth = window.speechSynthesis

      synth.cancel()

      const clean = processAIResponse(text)

      const utter =
        new SpeechSynthesisUtterance(clean)

      utter.lang = language

      const setVoice = () => {
        const voices = synth.getVoices()

        let voice

        if (language === "vi-VN") {
          voice = voices.find(
            (v) =>
              v.lang.startsWith("vi") ||
              v.name.includes("Vietnamese")
          )
        }

        if (language === "en-US") {
          voice = voices.find(
            (v) =>
              v.lang.startsWith("en") ||
              v.name.includes("English")
          )
        }

        if (language === "zh-CN") {
          voice = voices.find(
            (v) =>
              v.lang.startsWith("zh") ||
              v.name.includes("Chinese")
          )
        }

        if (voice) {
          utter.voice = voice
        }
      }

      setVoice()

      speechSynthesis.onvoiceschanged =
        setVoice

      utter.onstart = () => {
        setIsSpeaking(true)
        sendCommand("1")
      }

      utter.onend = () => {
        setIsSpeaking(false)
        sendCommand("0")
      }

      synth.speak(utter)
    },
    [language]
  )

  // ================= ASK AI =================
  const askAI = async (question: string) => {
    if (!question.trim()) return

    setCurrentQuestion(question)

    try {
      const res = await fetch(
        `/api/projects/${id}/ask`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            question,
          }),
        }
      )

      const data = await res.json()

      const answer =
        processAIResponse(data.answer) ||
        "Sorry, I cannot answer that."

      setCurrentAnswer(answer)

      setHistory((prev) => [
        {
          q: question,
          a: answer,
        },
        ...prev,
      ])

      speak(answer)
    } catch (err) {
      console.error(err)

      setCurrentAnswer(
        "Connection failed."
      )
    }
  }

  // ================= STT =================
  const startListening = () => {
    const SpeechRecognition =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition

    if (!SpeechRecognition) {
      alert(
        "Speech Recognition not supported"
      )
      return
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }

    const recognition =
      new SpeechRecognition()

    recognition.lang = language

    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = async (
      event: any
    ) => {
      const transcript =
        event.results[0][0].transcript

      setIsListening(false)

      await askAI(transcript)
    }

    recognition.onerror = (err: any) => {
      console.error(err)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition

    recognition.start()
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }

    setIsListening(false)
  }

  // ================= VIDEO =================
  const togglePlay = () => {
    if (!videoRef.current) return

    if (videoRef.current.paused) {
      videoRef.current.play()
      setIsPlaying(true)
    } else {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }

  const handleVideoEnd = () => {
    setShowAssistant(true)
    setIsPlaying(false)

    speak(
      "Presentation finished. Do you have any questions?"
    )
  }

  if (!videoUrl) return null

  return (
    <div
      className="w-screen h-screen bg-[#050505] relative overflow-hidden font-sans"
      onMouseMove={() =>
        setShowControls(true)
      }
    >
      {/* VIDEO */}
      <video
        ref={videoRef}
        src={videoUrl}
        autoPlay
        onEnded={handleVideoEnd}
        className="w-full h-full object-contain bg-black"
      />

      {/* OVERLAY */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-700 pointer-events-none ${
          showAssistant
            ? "opacity-100"
            : "opacity-0"
        }`}
      />

      {/* HEADER */}
      <div
        className={`absolute top-10 left-10 z-50 transition-all duration-1000 flex items-center gap-4 ${
          showControls
            ? "translate-y-0 opacity-100"
            : "-translate-y-10 opacity-0"
        }`}
      >
        <div className="flex items-center space-x-4 bg-black/40 backdrop-blur-md p-4 rounded-3xl border border-white/10 shadow-xl">
          <img
            src="https://asia-vn.edu.vn/wp-content/uploads/2025/09/asia-logo.svg"
            alt="Asia University"
            className="h-10 p-1"
          />

          <div className="h-8 w-[1px] bg-white/30" />

          <h2 className="text-2xl font-black italic tracking-tighter text-white">
            ASIA
            <span
              style={{
                color: AU_GREEN,
              }}
            >
              BOT
            </span>
          </h2>
        </div>

        <button
          onClick={connectSerial}
          className={`p-4 rounded-2xl border backdrop-blur-md transition-all font-bold text-[10px] tracking-widest shadow-lg ${
            isSerialConnected
              ? "border-[#009543] bg-[#009543]/20 text-[#009543]"
              : "border-white/20 bg-black/20 text-white hover:bg-white/10"
          }`}
        >
          {isSerialConnected
            ? "🔌 ROBOT LIVE"
            : "🔌 CONNECT ROBOT"}
        </button>
      </div>

      {/* PLAY */}
      {!isPlaying && !showAssistant && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center group z-30"
        >
          <div className="bg-[#009543] rounded-full p-10 shadow-[0_0_60px_rgba(0,149,67,0.5)] group-hover:scale-110 transition-transform duration-300">
            <Play
              size={60}
              className="text-white fill-current ml-2"
            />
          </div>
        </button>
      )}

      {/* CONTROLS */}
      <div
        className={`absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6 px-8 py-5 bg-black/70 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 transition-all duration-500 shadow-2xl z-40 ${
          showControls
            ? "translate-y-0 opacity-100"
            : "translate-y-20 opacity-0"
        }`}
      >
        <button
          onClick={togglePlay}
          className="text-white hover:text-[#009543] transition-colors"
        >
          {isPlaying ? (
            <Pause
              size={32}
              fill="currentColor"
            />
          ) : (
            <Play size={32} fill="currentColor" />
          )}
        </button>

        <div className="h-8 w-[1px] bg-white/20" />

        <button
          onClick={() => {
            videoRef.current?.pause()
            setIsPlaying(false)
            setShowAssistant(true)
          }}
          className="bg-[#009543] hover:bg-[#006b31] text-white px-8 py-3 rounded-full flex items-center gap-3 font-bold text-lg transition-all active:scale-95 shadow-lg shadow-[#009543]/30"
        >
          <Sparkles size={20} />
          ASK ASIA BOT
        </button>

        <button
          onClick={() =>
            window.location.reload()
          }
          className="text-white/60 hover:text-white transition-colors"
        >
          <RotateCcw size={24} />
        </button>
      </div>

      {/* ASSISTANT */}
      {showAssistant && (
        <div
          className="absolute z-50"
          style={{
            left: position.x ?? "auto",
            top: position.y ?? "auto",
            right:
              position.x === undefined
                ? 60
                : "auto",
            bottom:
              position.y === undefined
                ? 60
                : "auto",
          }}
        >
          <div
            onMouseDown={handleMouseDown}
            className={`w-[520px] bg-zinc-900/95 backdrop-blur-3xl border-2 border-[#009543]/30 rounded-[3rem] p-8 shadow-[0_40px_100px_rgba(0,0,0,0.7)] cursor-grab active:cursor-grabbing ${
              dragging
                ? "scale-[1.02]"
                : ""
            }`}
          >
            {/* TOP */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isListening
                      ? "bg-green-400 animate-pulse"
                      : "bg-[#009543]"
                  }`}
                />

                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-[0.2em]">
                  Asia University AI
                </span>
              </div>

              <button
                onClick={() =>
                  setShowAssistant(false)
                }
                className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* AVATAR */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div
                  className={`absolute inset-0 bg-[#009543]/20 blur-3xl rounded-full ${
                    isSpeaking
                      ? "opacity-100"
                      : "opacity-0"
                  }`}
                />

                <AvatarLottie
                  isSpeaking={isSpeaking}
                />
              </div>

              {/* LANGUAGE */}
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() =>
                    setLanguage("vi-VN")
                  }
                  className={`px-4 py-2 rounded-xl text-sm font-bold ${
                    language === "vi-VN"
                      ? "bg-[#009543] text-white"
                      : "bg-white/10 text-white"
                  }`}
                >
                  🇻🇳 Vietnamese
                </button>

                <button
                  onClick={() =>
                    setLanguage("en-US")
                  }
                  className={`px-4 py-2 rounded-xl text-sm font-bold ${
                    language === "en-US"
                      ? "bg-[#009543] text-white"
                      : "bg-white/10 text-white"
                  }`}
                >
                  🇺🇸 English
                </button>

                <button
                  onClick={() =>
                    setLanguage("zh-CN")
                  }
                  className={`px-4 py-2 rounded-xl text-sm font-bold ${
                    language === "zh-CN"
                      ? "bg-[#009543] text-white"
                      : "bg-white/10 text-white"
                  }`}
                >
                  🇨🇳 Chinese
                </button>
              </div>

              {/* LISTENING */}
              {isListening && (
                <div className="mt-6 flex flex-col items-center gap-3">
                  <p className="text-[#009543] text-xl font-bold animate-pulse italic">
                    Listening...
                  </p>

                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-1.5 h-6 bg-[#009543] rounded-full animate-bounce"
                        style={{
                          animationDelay: `${i * 0.15}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* QUESTION */}
              {currentQuestion && (
                <div className="w-full mt-6 bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2">
                    YOUR QUESTION
                  </p>

                  <p className="text-white text-base leading-relaxed">
                    {currentQuestion}
                  </p>
                </div>
              )}

              {/* ANSWER */}
              {currentAnswer && (
                <div className="w-full mt-4 bg-[#009543]/10 border border-[#009543]/30 rounded-2xl p-5">
                  <p className="text-xs uppercase tracking-widest text-[#6dffaf] mb-3 font-bold">
                    ASIA BOT RESPONSE
                  </p>

                  <div className="max-h-[240px] overflow-y-auto">
                    <p className="text-white text-lg leading-8 whitespace-pre-wrap">
                      {currentAnswer}
                    </p>
                  </div>
                </div>
              )}

              {/* INPUT */}
              <div className="w-full mt-6 flex gap-3">
                <input
                  value={inputText}
                  onChange={(e) =>
                    setInputText(
                      e.target.value
                    )
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      askAI(inputText)
                      setInputText("")
                    }
                  }}
                  placeholder="Type your question..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#009543]"
                />

                <button
                  onClick={() => {
                    askAI(inputText)
                    setInputText("")
                  }}
                  className="px-5 rounded-2xl bg-[#009543] hover:bg-[#007735] text-white"
                >
                  <Send size={22} />
                </button>
              </div>

              {/* MIC */}
              <button
                onClick={() => {
                  if (isListening) {
                    stopListening()
                  } else {
                    startListening()
                  }
                }}
                disabled={isSpeaking}
                className={`mt-6 p-6 rounded-full transition-all duration-300 shadow-2xl ${
                  isListening
                    ? "bg-red-500 text-white scale-110"
                    : "bg-white text-black hover:bg-[#009543] hover:text-white"
                }`}
              >
                <Mic size={34} />
              </button>
            </div>

            {/* HISTORY */}
            {history.length > 0 && (
              <div className="mt-10 pt-6 border-t border-white/10 space-y-3">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">
                  Conversation History
                </p>

                {history.map((item, i) => (
                  <div
                    key={i}
                    onClick={() =>
                      speak(item.a)
                    }
                    className="group bg-white/5 hover:bg-white/10 p-4 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-[#009543]/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#009543]" />

                      <p className="text-white/70 text-sm truncate group-hover:text-white italic">
                        "{item.q}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
