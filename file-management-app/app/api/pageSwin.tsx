"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import axios from "axios"
import { useParams } from "next/navigation"
import AvatarLottie from "@/components/AvatarLottie"
import { Mic, Sparkles, Pause, Play, X, RotateCcw } from "lucide-react"

export default function PresentationPage() {
  const { id } = useParams()
  const videoRef = useRef<HTMLVideoElement>(null)
  
  // ===== SERIAL REFS & STATE =====
  const portRef = useRef<any>(null);
  const writerRef = useRef<WritableStreamDefaultWriter<Uint8Array> | null>(null);
  const [isSerialConnected, setIsSerialConnected] = useState(false);

  const [videoUrl, setVideoUrl] = useState("")
  const [showAssistant, setShowAssistant] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isPlaying, setIsPlaying] = useState(true)
  const [showControls, setShowControls] = useState(true)

  // Drag logic states
  const [position, setPosition] = useState<{ x?: number; y?: number }>({})
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })

  // History state (lưu 3 câu hỏi gần nhất)
  const [history, setHistory] = useState<{ q: string; a: string }[]>([])

  // ================= SERIAL LOGIC =================
  const connectSerial = async () => {
    try {
      if (!('serial' in navigator)) {
        alert('Browser does not support Web Serial API')
        return
      }
      const port = await (navigator as any).serial.requestPort()
      await port.open({ baudRate: 9600 })
      portRef.current = port
      writerRef.current = port.writable.getWriter()
      setIsSerialConnected(true)
    } catch (err) {
      console.error('Serial connection failed:', err)
    }
  }

  const sendCommand = async (cmd: string) => {
    if (!writerRef.current) return
    try {
      const encoder = new TextEncoder()
      await writerRef.current.write(encoder.encode(cmd))
    } catch (err) {
      console.error('Failed to send serial command:', err)
    }
  }

  // ================= FETCH DATA =================
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await axios.get(`/api/projects/${id}`)
        setVideoUrl(`/api/${res.data.video_path}`)
      } catch (e) { console.error(e) }
    }
    if (id) fetchProject()

    return () => {
      if (portRef.current) {
        writerRef.current?.releaseLock()
        portRef.current.close()
      }
    }
  }, [id])

  // ================= AUTO HIDE CONTROLS =================
  useEffect(() => {
    let timeout: any
    if (showControls) {
      timeout = setTimeout(() => setShowControls(false), 3500)
    }
    return () => clearTimeout(timeout)
  }, [showControls])

  // ================= DRAG LOGIC =================
  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true)
    dragStart.current = {
      x: e.clientX - (position.x || window.innerWidth - 460),
      y: e.clientY - (position.y || window.innerHeight - 600)
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging) return
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      })
    }
    const handleMouseUp = () => setDragging(false)

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [dragging])

  // ================= TTS & STT LOGIC =================
  const processAIResponse = (raw: string) => {
    if (!raw) return ""
    return raw.replace(/<think>[\s\S]*?<\/think>/g, "").replace(/[#*_>~\-]/g, "").replace(/\s+/g, " ").trim()
  }

  const speak = useCallback((text: string) => {
    const synth = window.speechSynthesis
    synth.cancel()
    const clean = processAIResponse(text)
    const utter = new SpeechSynthesisUtterance(clean)
    
    const setVoice = () => {
      const voices = synth.getVoices()
      const voice = voices.find(v => v.name.includes("Google US English")) || voices.find(v => v.lang === "en-US")
      if (voice) utter.voice = voice
    }
    
    setVoice()
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = setVoice;
    }
    
    utter.onstart = () => {
      setIsSpeaking(true)
      sendCommand('1')
    }

    utter.onend = () => {
      setTimeout(() => {
        setIsSpeaking(false)
        sendCommand('0')
        startListening()
      }, 600)
    }
    
    synth.speak(utter)
  }, [id])

  const startListening = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SpeechRecognition) return
    const recognition = new SpeechRecognition()
    recognition.lang = "en-US"
    recognition.onstart = () => setIsListening(true)
    recognition.onresult = async (e: any) => {
      const text = e.results[0][0].transcript
      const res = await fetch(`/api/projects/${id}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: "Answer in English only: " + text }),
      })
      const data = await res.json()
      const answer = processAIResponse(data.answer || "I cannot answer")
      
      // Cập nhật lịch sử: Giữ lại 3 câu gần nhất
      setHistory(prev => [{ q: text, a: answer }, ...prev].slice(0, 3))
      speak(answer)
    }
    recognition.onend = () => setIsListening(false)
    recognition.start()
  }

  // ================= VIDEO LOGIC =================
  const togglePlay = () => {
    if (!videoRef.current) return
    if (videoRef.current.paused) { videoRef.current.play(); setIsPlaying(true) }
    else { videoRef.current.pause(); setIsPlaying(false) }
  }

  const handleVideoEnd = () => {
    setShowAssistant(true)
    setIsPlaying(false)
    speak("The presentation has ended. Do you have any questions for me?")
  }

  if (!videoUrl) return null

  return (
    <div className="w-screen h-screen bg-black relative overflow-hidden font-sans" onMouseMove={() => setShowControls(true)}>
      
      {/* VIDEO NỀN */}
      <video ref={videoRef} src={videoUrl} autoPlay onEnded={handleVideoEnd} className="w-full h-full object-contain bg-black" />

      {/* LỚP PHỦ KHI AI XUẤT HIỆN */}
      <div className={`absolute inset-0 bg-black/40 transition-opacity duration-700 pointer-events-none ${showAssistant ? 'opacity-100' : 'opacity-0'}`} />

      {/* HEADER LOGO & SERIAL */}
      <div className={`absolute top-10 left-10 z-50 transition-all duration-1000 flex items-center gap-4 ${showControls ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0"}`}>
        <div className="flex items-center space-x-4 bg-black/20 backdrop-blur-md p-4 rounded-3xl border border-white/10">
          <img src="https://asia-vn.edu.vn/wp-content/uploads/2025/09/asia-logo.svg" alt="Swinburne" className="h-8 bg-white p-1 rounded-lg" />
          <div className="h-8 w-[1px] bg-white/30" />
          <h2 className="text-2xl font-black italic tracking-tighter text-white">ROBOT<span className="text-[#E63946]">GPT</span></h2>
        </div>

        <button
          onClick={connectSerial}
          className={`p-4 rounded-2xl border backdrop-blur-md transition-all font-bold text-[10px] tracking-widest ${isSerialConnected ? 'border-green-500 bg-green-500/20 text-green-400' : 'border-white/20 bg-black/20 text-white hover:bg-white/10'}`}
        >
          {isSerialConnected ? '🔌 ROBOT LIVE' : '🔌 CONNECT ROBOT'}
        </button>
      </div>

      {/* NÚT PLAY GIỮA MÀN HÌNH */}
      {!isPlaying && !showAssistant && (
        <button onClick={togglePlay} className="absolute inset-0 flex items-center justify-center group z-30">
          <div className="bg-[#E63946] rounded-full p-10 shadow-[0_0_50px_rgba(230,57,70,0.5)] group-hover:scale-110 transition-transform duration-300">
            <Play size={60} className="text-white fill-current ml-2" />
          </div>
        </button>
      )}

      {/* THANH ĐIỀU KHIỂN DƯỚI CÙNG */}
      <div className={`absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6 px-8 py-5 bg-black/60 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 transition-all duration-500 shadow-2xl z-40 ${showControls ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"}`}>
        <button onClick={togglePlay} className="text-white hover:text-[#E63946] transition-colors">
          {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
        </button>
        <div className="h-8 w-[1px] bg-white/20" />
        <button
          onClick={() => {
            videoRef.current?.pause(); setIsPlaying(false);
            setShowAssistant(true); speak("I am listening. How can I help you?");
          }}
          className="bg-[#E63946] hover:bg-[#c12e39] text-white px-8 py-3 rounded-full flex items-center gap-3 font-bold text-lg transition-all active:scale-95 shadow-lg shadow-[#E63946]/30"
        >
          <Sparkles size={20} /> ASK ROBOTGPT
        </button>
        <button onClick={() => window.location.reload()} className="text-white/60 hover:text-white transition-colors">
          <RotateCcw size={24} />
        </button>
      </div>

      {/* CỬA SỔ TRỢ LÝ AI (HỖ TRỢ DRAG) */}
      {showAssistant && (
        <div
          className="absolute z-50 transition-shadow duration-300"
          style={{
            left: position.x ?? 'auto',
            top: position.y ?? 'auto',
            right: position.x === undefined ? 60 : 'auto',
            bottom: position.y === undefined ? 60 : 'auto'
          }}
        >
          <div
            onMouseDown={handleMouseDown}
            className={`w-[420px] bg-zinc-900/95 backdrop-blur-3xl border-2 border-[#E63946]/30 rounded-[3rem] p-8 shadow-[0_40px_100px_rgba(0,0,0,0.7)] cursor-grab active:cursor-grabbing ${dragging ? 'scale-[1.02] shadow-[#E63946]/10' : ''}`}
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-[#E63946]'}`} />
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-[0.2em]">AI Intelligence</span>
              </div>
              <button onClick={() => setShowAssistant(false)} className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-all">
                <X size={24} />
              </button>
            </div>

            <div className="flex flex-col items-center">
              {/* AVATAR LOTTIE */}
              <div className="relative group">
                <div className={`absolute inset-0 bg-[#E63946]/20 blur-3xl rounded-full transition-opacity duration-500 ${isSpeaking ? 'opacity-100' : 'opacity-0'}`} />
                <AvatarLottie isSpeaking={isSpeaking} />
              </div>

              {/* HIỂN THỊ CÂU TRẢ LỜI ĐANG NÓI (VĂN BẢN) */}
              <div className="mt-8 text-center min-h-[80px] w-full px-2">
                {isListening ? (
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-[#E63946] text-xl font-bold animate-pulse italic">Listening...</p>
                    <div className="flex gap-1.5">
                      {[1,2,3,4].map(i => <div key={i} className="w-1.5 h-6 bg-[#E63946] rounded-full animate-bounce" style={{animationDelay: `${i*0.15}s`}} />)}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                     <p className="text-white/90 text-lg font-medium leading-relaxed line-clamp-3">
                      {history[0]?.a || "Hello! I am ready to answer your questions about the project."}
                    </p>
                    {history[0]?.a && <div className="w-12 h-1 bg-[#E63946]/50 mx-auto rounded-full" />}
                  </div>
                )}
              </div>

              {/* NÚT MIC */}
              <button
                onClick={startListening}
                disabled={isSpeaking}
                className={`mt-8 p-7 rounded-full transition-all duration-300 shadow-2xl ${isListening ? 'bg-zinc-800 scale-90 opacity-50' : 'bg-white hover:bg-[#E63946] hover:text-white text-black scale-110 active:scale-95'}`}
              >
                <Mic size={40} />
              </button>
            </div>

            {/* DANH SÁCH 3 CÂU HỎI GẦN NHẤT */}
            {history.length > 0 && (
              <div className="mt-10 pt-6 border-t border-white/10 space-y-3">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Recent Questions</p>
                {history.map((item, i) => (
                  <div
                    key={i}
                    onClick={() => speak(item.a)}
                    className="group bg-white/5 hover:bg-white/10 p-4 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-[#E63946]/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#E63946] shrink-0" />
                      <p className="text-white/70 text-sm truncate font-medium group-hover:text-white transition-colors italic">
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
