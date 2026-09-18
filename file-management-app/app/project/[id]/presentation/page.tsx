"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import axios from "axios"
import { useParams } from "next/navigation"
import AvatarLottie from "@/components/AvatarLottie"
import { Mic, Sparkles, Pause, Play, X, RotateCcw, Send } from "lucide-react"

export default function PresentationPage() {
  const { id } = useParams()
  const videoRef = useRef<HTMLVideoElement>(null)
  
  // Swinburne Vietnam Branding Colors
  const SWIN_RED = "#E61A33"
  const SWIN_CHARCOAL = "#2D2D2D"

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

  // Input & Q&A History States
  const [textInput, setTextInput] = useState("")
  const [history, setHistory] = useState<{ q: string; a: string }[]>([])

  // Drag & UI States
  const [position, setPosition] = useState<{ x?: number; y?: number }>({})
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })

  // ================= LANGUAGE DETECTION =================
  const detectLanguage = (text: string): "vi-VN" | "en-US" => {
    const vietnamesePattern = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệđìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]/i;
    return vietnamesePattern.test(text) ? "vi-VN" : "en-US";
  };

  // ================= SERIAL LOGIC =================
  const connectSerial = async () => {
    try {
      if (!('serial' in navigator)) {
        alert('Trình duyệt không hỗ trợ Web Serial API')
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
    // Không kích hoạt drag khi click vào input hoặc button để tránh lỗi focus/gõ chữ
    if ((e.target as HTMLElement).closest('.interactive-area')) return;

    setDragging(true)
    dragStart.current = {
      x: e.clientX - (position.x || window.innerWidth - 480),
      y: e.clientY - (position.y || window.innerHeight - 700)
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
    
    const lang = detectLanguage(clean);
    utter.lang = lang;

    const setVoice = () => {
      const voices = synth.getVoices()
      let voice;

      if (lang === "vi-VN") {
        voice = voices.find(v => v.lang.startsWith("vi") || v.name.includes("Vietnamese") || v.name.includes("Linh"));
      } else {
        voice = voices.find(v => v.name.includes("Google US English")) ||
                voices.find(v => v.lang === "en-US") ||
                voices.find(v => v.lang.startsWith("en"));
      }
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
      }, 600)
    }
    
    synth.speak(utter)
  }, [id])

  const handleAskAI = async (questionText: string) => {
    if (!questionText.trim()) return

    try {
      const res = await fetch(`/api/projects/${id}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: "Answer in the same language as the user's question: " + questionText
        }),
      })
      
      const data = await res.json()
      const answer = processAIResponse(data.answer || "Xin lỗi, tôi không thể trả lời câu hỏi này.")
      
      // Lưu trữ và giới hạn chỉ lấy tối đa 2 phần hỏi đáp gần nhất
      setHistory(prev => [{ q: questionText, a: answer }, ...prev].slice(0, 2))
      speak(answer)
    } catch (err) {
      console.error("AI API Error:", err)
    }
  }

  const startListening = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SpeechRecognition) return
    
    const recognition = new SpeechRecognition()
    recognition.lang = "vi-VN"
    
    recognition.onstart = () => setIsListening(true)
    recognition.onresult = async (e: any) => {
      const text = e.results[0][0].transcript
      setTextInput(text) // Đồng bộ text nhận dạng được vào textbox
      await handleAskAI(text)
    }
    recognition.onend = () => setIsListening(false)
    recognition.start()
  }

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!textInput.trim() || isSpeaking) return
    handleAskAI(textInput)
    setTextInput("") // Xóa text input sau khi gửi
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
    speak("Buổi thuyết trình đã kết thúc. Bạn có câu hỏi nào dành cho tôi không?")
  }

  if (!videoUrl) return null

  return (
    <div className="w-screen h-screen bg-[#0A0A0A] relative overflow-hidden font-sans" onMouseMove={() => setShowControls(true)}>
      
      {/* VIDEO NỀN */}
      <video ref={videoRef} src={videoUrl} autoPlay onEnded={handleVideoEnd} className="w-full h-full object-contain bg-black" />

      {/* LỚP PHỦ AI */}
      <div className={`absolute inset-0 bg-black/50 transition-opacity duration-700 pointer-events-none ${showAssistant ? 'opacity-100' : 'opacity-0'}`} />

      {/* HEADER LOGO & SERIAL */}
      <div className={`absolute top-10 left-10 z-50 transition-all duration-1000 flex items-center gap-4 ${showControls ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0"}`}>
        <div className="flex items-center space-x-4 bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-xl">
          {/* Logo Swinburne Vietnam dạng SVG Placeholder (Có thể thay thế bằng link ảnh chính thức nếu cần) */}
          <div className="flex items-center gap-2">
            <span className="text-white font-black text-xl tracking-tighter">Swinburne</span>
            <span style={{ color: SWIN_RED }} className="font-bold text-sm bg-white/10 px-2 py-0.5 rounded">VIETNAM</span>
          </div>
          <div className="h-8 w-[1px] bg-white/30" />
          <h2 className="text-xl font-extrabold tracking-tight text-white">SWIN<span style={{ color: SWIN_RED }}>BOT</span></h2>
        </div>

        <button
          onClick={connectSerial}
          className={`p-4 rounded-xl border backdrop-blur-md transition-all font-bold text-[10px] tracking-widest shadow-lg ${isSerialConnected ? 'border-[#E61A33] bg-[#E61A33]/20 text-[#E61A33]' : 'border-white/20 bg-black/40 text-white hover:bg-white/10'}`}
        >
          {isSerialConnected ? '🔗 ROBOT ONLINE' : '🔗 CONNECT ROBOT'}
        </button>
      </div>

      {/* NÚT PLAY GIỮA MÀN HÌNH */}
      {!isPlaying && !showAssistant && (
        <button onClick={togglePlay} className="absolute inset-0 flex items-center justify-center group z-30">
          <div className="bg-[#E61A33] rounded-full p-10 shadow-[0_0_60px_rgba(230,26,51,0.5)] group-hover:scale-110 transition-transform duration-300">
            <Play size={60} className="text-white fill-current ml-2" />
          </div>
        </button>
      )}

      {/* THANH ĐIỀU KHIỂN DƯỚI CÙNG */}
      <div className={`absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6 px-8 py-5 bg-black/80 backdrop-blur-2xl rounded-3xl border border-white/10 transition-all duration-500 shadow-2xl z-40 ${showControls ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"}`}>
        <button onClick={togglePlay} className="text-white hover:text-[#E61A33] transition-colors">
          {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
        </button>
        <div className="h-8 w-[1px] bg-white/20" />
        <button
          onClick={() => {
            videoRef.current?.pause(); setIsPlaying(false);
            setShowAssistant(true); speak("Tôi đang sẵn sàng lắng nghe, bạn cần hỗ trợ thông tin gì?");
          }}
          className="bg-[#E61A33] hover:bg-[#b81427] text-white px-8 py-3 rounded-xl flex items-center gap-3 font-bold text-lg transition-all active:scale-95 shadow-lg shadow-[#E61A33]/30"
        >
          <Sparkles size={20} /> ASK SWIN BOT
        </button>
        <button onClick={() => window.location.reload()} className="text-white/60 hover:text-white transition-colors">
          <RotateCcw size={24} />
        </button>
      </div>

      {/* CỬA SỔ TRỢ LÝ AI (DRAGGABLE) */}
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
            className={`w-[460px] bg-[#1F1F1F]/95 backdrop-blur-3xl border-2 border-[#E61A33]/30 rounded-[2rem] p-6 shadow-[0_40px_100px_rgba(0,0,0,0.8)] cursor-grab active:cursor-grabbing ${dragging ? 'scale-[1.01] shadow-[#E61A33]/10' : ''}`}
          >
            {/* Header AI Window */}
            <div className="flex justify-between items-center mb-4 interactive-area">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-[#E61A33]'}`} />
                <span className="text-[10px] uppercase font-black text-zinc-400 tracking-[0.2em]">Swinburne AI Assistant</span>
              </div>
              <button onClick={() => setShowAssistant(false)} className="p-1.5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-all">
                <X size={20} />
              </button>
            </div>

            {/* Avatar & Trạng thái câu hỏi hiện tại */}
            <div className="flex flex-col items-center">
              <div className="relative group">
                <div className={`absolute inset-0 bg-[#E61A33]/15 blur-3xl rounded-full transition-opacity duration-500 ${isSpeaking ? 'opacity-100' : 'opacity-0'}`} />
                <AvatarLottie isSpeaking={isSpeaking} />
              </div>

              {/* Ô hiển thị Realtime khi Speech Recognition đang chạy */}
              {isListening && (
                <div className="mt-4 text-center min-h-[40px] w-full px-2">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-[#E61A33] text-md font-bold animate-pulse italic">Đang ghi âm câu hỏi...</p>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(i => <div key={i} className="w-1 h-4 bg-[#E61A33] rounded-full animate-bounce" style={{animationDelay: `${i*0.1}s`}} />)}
                    </div>
                  </div>
                </div>
              )}

              {/* FORM NHẬP TEXTBOX + MICRO (INTERACTIVE AREA) */}
              <form onSubmit={handleTextSubmit} className="mt-6 w-full flex items-center gap-2 bg-black/40 p-2 rounded-xl border border-white/10 interactive-area">
                <button
                  type="button"
                  onClick={startListening}
                  disabled={isSpeaking || isListening}
                  className={`p-3 rounded-lg transition-all shrink-0 ${isListening ? 'bg-[#E61A33] text-white animate-pulse' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}
                  title="Nói với AI"
                >
                  <Mic size={20} />
                </button>
                
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={isSpeaking ? "AI đang trả lời, vui lòng đợi..." : "Nhập câu hỏi của bạn tại đây..."}
                  disabled={isSpeaking}
                  className="w-full bg-transparent text-white placeholder-zinc-500 text-sm focus:outline-none px-2 disabled:opacity-50"
                />

                <button
                  type="submit"
                  disabled={!textInput.trim() || isSpeaking}
                  className="p-3 bg-[#E61A33] hover:bg-[#b81427] text-white rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-[#E61A33]"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>

            {/* HIỂN THỊ 2 PHẦN HỎI ĐÁP GẦN NHẤT */}
            <div className="mt-6 pt-4 border-t border-white/10 space-y-3 interactive-area">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Hỏi đáp gần nhất (Tối đa 2)</p>
              
              {history.length === 0 ? (
                <div className="bg-white/5 p-4 rounded-xl border border-dashed border-white/5 text-center">
                  <p className="text-zinc-400 text-xs">Chưa có câu hỏi nào được thực hiện.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 subtle-scrollbar">
                  {history.map((item, i) => (
                    <div
                      key={i}
                      onClick={() => speak(item.a)}
                      className="group bg-zinc-900/60 hover:bg-zinc-800/80 p-3.5 rounded-xl cursor-pointer transition-all border border-white/5 hover:border-[#E61A33]/30"
                    >
                      <div className="space-y-2">
                        {/* Phần Hỏi */}
                        <div className="flex gap-2 items-start">
                          <span className="text-[10px] bg-zinc-700 text-zinc-300 font-bold px-1.5 py-0.5 rounded shrink-0">Hỏi</span>
                          <p className="text-white/80 text-xs font-semibold italic line-clamp-1">"{item.q}"</p>
                        </div>
                        {/* Phần Đáp */}
                        <div className="flex gap-2 items-start">
                          <span className="text-[10px] bg-[#E61A33]/20 text-[#E61A33] font-bold px-1.5 py-0.5 rounded shrink-0">Đáp</span>
                          <p className="text-zinc-300 text-xs leading-relaxed line-clamp-2 group-hover:text-white transition-colors">{item.a}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
