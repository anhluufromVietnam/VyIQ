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

export default function PresentationPage() {
  const { id } = useParams()
  const videoRef = useRef<HTMLVideoElement>(null)

  // =========================================================
  // HNMU BRAND COLORS
  // White + Blue + Indigo + Gold
  // =========================================================
  const HNMU_BLUE = "#1E40AF"
  const HNMU_INDIGO = "#4F46E5"
  const HNMU_GOLD = "#D4AF37"

  // =========================================================
  // SERIAL REFS & STATE
  // =========================================================
  const portRef = useRef<any>(null)
  const writerRef =
    useRef<WritableStreamDefaultWriter<Uint8Array> | null>(null)

  const [isSerialConnected, setIsSerialConnected] = useState(false)

  // =========================================================
  // VIDEO & UI STATES
  // =========================================================
  const [videoUrl, setVideoUrl] = useState("")
  const [showAssistant, setShowAssistant] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isPlaying, setIsPlaying] = useState(true)
  const [showControls, setShowControls] = useState(true)

  // =========================================================
  // INPUT & Q&A HISTORY
  // =========================================================
  const [textInput, setTextInput] = useState("")
  const [history, setHistory] = useState<
    { q: string; a: string }[]
  >([])

  // =========================================================
  // DRAG & UI STATES
  // =========================================================
  const [position, setPosition] = useState<{
    x?: number
    y?: number
  }>({})

  const [dragging, setDragging] = useState(false)

  const dragStart = useRef({
    x: 0,
    y: 0,
  })

  // =========================================================
  // LANGUAGE DETECTION
  // =========================================================
  const detectLanguage = (
    text: string
  ): "vi-VN" | "en-US" => {
    const vietnamesePattern =
      /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệđìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]/i

    return vietnamesePattern.test(text)
      ? "vi-VN"
      : "en-US"
  }

  // =========================================================
  // SERIAL LOGIC
  // =========================================================
  const connectSerial = async () => {
    try {
      if (!("serial" in navigator)) {
        alert(
          "Trình duyệt không hỗ trợ Web Serial API"
        )
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
      console.error(
        "Serial connection failed:",
        err
      )
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
      console.error(
        "Failed to send serial command:",
        err
      )
    }
  }

  // =========================================================
  // FETCH PROJECT DATA
  // =========================================================
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await axios.get(
          `/api/projects/${id}`
        )

        setVideoUrl(
          `/api/${res.data.video_path}`
        )
      } catch (e) {
        console.error(e)
      }
    }

    if (id) {
      fetchProject()
    }

    return () => {
      if (portRef.current) {
        writerRef.current?.releaseLock()
        portRef.current.close()
      }
    }
  }, [id])

  // =========================================================
  // AUTO HIDE CONTROLS
  // =========================================================
  useEffect(() => {
    let timeout: any

    if (showControls) {
      timeout = setTimeout(
        () => setShowControls(false),
        3500
      )
    }

    return () => clearTimeout(timeout)
  }, [showControls])

  // =========================================================
  // DRAG LOGIC
  // =========================================================
  const handleMouseDown = (
    e: React.MouseEvent
  ) => {
    // Không kích hoạt drag khi click input/button
    if (
      (e.target as HTMLElement).closest(
        ".interactive-area"
      )
    ) {
      return
    }

    setDragging(true)

    dragStart.current = {
      x:
        e.clientX -
        (position.x ||
          window.innerWidth - 480),

      y:
        e.clientY -
        (position.y ||
          window.innerHeight - 700),
    }
  }

  useEffect(() => {
    const handleMouseMove = (
      e: MouseEvent
    ) => {
      if (!dragging) return

      setPosition({
        x:
          e.clientX -
          dragStart.current.x,

        y:
          e.clientY -
          dragStart.current.y,
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

  // =========================================================
  // AI RESPONSE PROCESSING
  // =========================================================
  const processAIResponse = (
    raw: string
  ) => {
    if (!raw) return ""

    return raw
      .replace(
        /<think>[\s\S]*?<\/think>/g,
        ""
      )
      .replace(/[#*_>~\-]/g, "")
      .replace(/\s+/g, " ")
      .trim()
  }

  // =========================================================
  // TEXT TO SPEECH
  // =========================================================
  const speak = useCallback(
    (text: string) => {
      const synth =
        window.speechSynthesis

      synth.cancel()

      const clean =
        processAIResponse(text)

      const utter =
        new SpeechSynthesisUtterance(
          clean
        )

      const lang =
        detectLanguage(clean)

      utter.lang = lang

      const setVoice = () => {
        const voices =
          synth.getVoices()

        let voice

        if (lang === "vi-VN") {
          voice = voices.find(
            (v) =>
              v.lang.startsWith("vi") ||
              v.name.includes(
                "Vietnamese"
              ) ||
              v.name.includes("Linh")
          )
        } else {
          voice =
            voices.find((v) =>
              v.name.includes(
                "Google US English"
              )
            ) ||
            voices.find(
              (v) => v.lang === "en-US"
            ) ||
            voices.find((v) =>
              v.lang.startsWith("en")
            )
        }

        if (voice) {
          utter.voice = voice
        }
      }

      setVoice()

      if (
        speechSynthesis.onvoiceschanged !==
        undefined
      ) {
        speechSynthesis.onvoiceschanged =
          setVoice
      }

      utter.onstart = () => {
        setIsSpeaking(true)
        sendCommand("1")
      }

      utter.onend = () => {
        setTimeout(() => {
          setIsSpeaking(false)
          sendCommand("0")
        }, 600)
      }

      synth.speak(utter)
    },
    [id]
  )

  // =========================================================
  // ASK AI
  // =========================================================
  const handleAskAI = async (
    questionText: string
  ) => {
    if (!questionText.trim()) return

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
            question:
              "Answer in the same language as the user's question: " +
              questionText,
          }),
        }
      )

      const data = await res.json()

      const answer =
        processAIResponse(
          data.answer ||
            "Xin lỗi, tôi không thể trả lời câu hỏi này."
        )

      // Lưu tối đa 2 Q&A gần nhất
      setHistory((prev) =>
        [
          {
            q: questionText,
            a: answer,
          },
          ...prev,
        ].slice(0, 2)
      )

      speak(answer)
    } catch (err) {
      console.error(
        "AI API Error:",
        err
      )
    }
  }

  // =========================================================
  // SPEECH TO TEXT
  // =========================================================
  const startListening = () => {
    const SpeechRecognition =
      (window as any)
        .webkitSpeechRecognition ||
      (window as any).SpeechRecognition

    if (!SpeechRecognition) {
      alert(
        "Trình duyệt không hỗ trợ Speech Recognition."
      )
      return
    }

    const recognition =
      new SpeechRecognition()

    recognition.lang = "vi-VN"

    recognition.onstart = () =>
      setIsListening(true)

    recognition.onresult = async (
      e: any
    ) => {
      const text =
        e.results[0][0]
          .transcript

      setTextInput(text)

      await handleAskAI(text)
    }

    recognition.onend = () =>
      setIsListening(false)

    recognition.start()
  }

  // =========================================================
  // TEXT SUBMIT
  // =========================================================
  const handleTextSubmit = (
    e: React.FormEvent
  ) => {
    e.preventDefault()

    if (
      !textInput.trim() ||
      isSpeaking
    ) {
      return
    }

    handleAskAI(textInput)

    setTextInput("")
  }

  // =========================================================
  // VIDEO LOGIC
  // =========================================================
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
      "Buổi thuyết trình đã kết thúc. Bạn có câu hỏi nào dành cho tôi không?"
    )
  }

  if (!videoUrl) {
    return (
      <div className="w-screen h-screen bg-[#030712] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#1E40AF]/30 border-t-[#D4AF37] animate-spin" />

          <p className="text-white/60 text-sm tracking-wide">
            Đang tải dự án...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="
        w-screen
        h-screen
        bg-[#030712]
        relative
        overflow-hidden
        font-sans
      "
      onMouseMove={() =>
        setShowControls(true)
      }
    >
      {/* =====================================================
          AMBIENT BACKGROUND
      ===================================================== */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div
          className="
            absolute
            top-[-15%]
            right-[-10%]
            w-[55%]
            h-[55%]
            rounded-full
            bg-[#4F46E5]/10
            blur-[150px]
          "
        />

        <div
          className="
            absolute
            bottom-[-15%]
            left-[-10%]
            w-[55%]
            h-[55%]
            rounded-full
            bg-[#1E40AF]/10
            blur-[150px]
          "
        />

        <div
          className="
            absolute
            top-[35%]
            left-[40%]
            w-[25%]
            h-[25%]
            rounded-full
            bg-[#D4AF37]/5
            blur-[120px]
          "
        />
      </div>

      {/* =====================================================
          VIDEO
      ===================================================== */}
      <video
        ref={videoRef}
        src={videoUrl}
        autoPlay
        onEnded={handleVideoEnd}
        className="
          relative
          z-10
          w-full
          h-full
          object-contain
          bg-black
        "
      />

      {/* =====================================================
          AI OVERLAY
      ===================================================== */}
      <div
        className={`
          absolute
          inset-0
          bg-[#020617]/65
          backdrop-blur-[2px]
          transition-opacity
          duration-700
          pointer-events-none
          z-20
          ${
            showAssistant
              ? "opacity-100"
              : "opacity-0"
          }
        `}
      />

      {/* =====================================================
          HEADER
      ===================================================== */}
      <div
        className={`
          absolute
          top-8
          left-8
          z-50
          transition-all
          duration-700

          flex
          items-center
          gap-4

          ${
            showControls
              ? "translate-y-0 opacity-100"
              : "-translate-y-10 opacity-0"
          }
        `}
      >
        {/* HNMU BRAND */}
        <div
          className="
            flex
            items-center
            space-x-4

            bg-[#020617]/75
            backdrop-blur-2xl

            p-3
            pr-5

            rounded-2xl

            border
            border-white/10

            shadow-2xl
            shadow-black/40
          "
        >
          {/* Logo */}
          <div
            className="
              bg-white
              p-2.5
              rounded-xl
              shadow-lg
              shadow-white/10
            "
          >
            <img
              src="/images/hnmu.png"
              alt="HNMU Logo"
              className="
                h-11
                w-auto
                object-contain
              "
            />
          </div>

          {/* Divider */}
          <div
            className="
              h-9
              w-[1px]
              bg-gradient-to-b
              from-transparent
              via-white/30
              to-transparent
            "
          />

          {/* Brand */}
          <div>
            <h2
              className="
                text-lg
                font-black
                tracking-tight
                bg-gradient-to-r
                from-white
                via-[#93C5FD]
                to-[#818CF8]
                bg-clip-text
                text-transparent
              "
            >
              HNMU AI
            </h2>

            <p
              className="
                text-[9px]
                font-bold
                tracking-[0.25em]
                uppercase
                text-[#D4AF37]
              "
            >
              Innovation Center
            </p>
          </div>
        </div>

        {/* CONNECT ROBOT */}
        <button
          onClick={connectSerial}
          className={`
            p-4
            rounded-xl
            border
            backdrop-blur-xl

            transition-all

            font-bold
            text-[10px]
            tracking-widest

            shadow-lg

            ${
              isSerialConnected
                ? `
                  border-[#D4AF37]
                  bg-[#D4AF37]/15
                  text-[#F4D06F]
                  shadow-[#D4AF37]/10
                `
                : `
                  border-white/15
                  bg-[#020617]/70
                  text-white/80
                  hover:border-[#4F46E5]/50
                  hover:bg-[#4F46E5]/10
                  hover:text-white
                `
            }
          `}
        >
          {isSerialConnected
            ? "🔗 ROBOT ONLINE"
            : "🔗 CONNECT ROBOT"}
        </button>
      </div>

      {/* =====================================================
          CENTER PLAY BUTTON
      ===================================================== */}
      {!isPlaying &&
        !showAssistant && (
          <button
            onClick={togglePlay}
            className="
              absolute
              inset-0

              flex
              items-center
              justify-center

              group
              z-30
            "
          >
            <div
              className="
                bg-gradient-to-br
                from-[#1E40AF]
                via-[#4F46E5]
                to-[#6366F1]

                rounded-full
                p-10

                shadow-[0_0_80px_rgba(79,70,229,0.45)]

                group-hover:scale-110

                transition-transform
                duration-300
              "
            >
              <Play
                size={60}
                className="
                  text-white
                  fill-current
                  ml-2
                "
              />
            </div>
          </button>
        )}

      {/* =====================================================
          BOTTOM CONTROL BAR
      ===================================================== */}
      <div
        className={`
          absolute
          bottom-8
          left-1/2
          -translate-x-1/2

          flex
          items-center
          gap-5

          px-6
          py-4

          bg-[#020617]/85
          backdrop-blur-2xl

          rounded-2xl

          border
          border-white/10

          transition-all
          duration-500

          shadow-2xl

          z-40

          ${
            showControls
              ? "translate-y-0 opacity-100"
              : "translate-y-20 opacity-0"
          }
        `}
      >
        {/* PLAY / PAUSE */}
        <button
          onClick={togglePlay}
          className="
            text-white/80
            hover:text-[#93C5FD]
            transition-colors
          "
        >
          {isPlaying ? (
            <Pause
              size={30}
              fill="currentColor"
            />
          ) : (
            <Play
              size={30}
              fill="currentColor"
            />
          )}
        </button>

        {/* Divider */}
        <div className="h-8 w-[1px] bg-white/15" />

        {/* ASK AI */}
        <button
          onClick={() => {
            videoRef.current?.pause()
            setIsPlaying(false)
            setShowAssistant(true)

            speak(
              "Tôi đang sẵn sàng lắng nghe, bạn cần hỗ trợ thông tin gì?"
            )
          }}
          className="
            bg-gradient-to-r
            from-[#1E40AF]
            via-[#4F46E5]
            to-[#6366F1]

            hover:from-[#2563EB]
            hover:via-[#6366F1]
            hover:to-[#818CF8]

            text-white

            px-7
            py-3

            rounded-xl

            flex
            items-center
            gap-3

            font-bold
            text-base

            transition-all

            active:scale-95

            shadow-lg
            shadow-[#4F46E5]/30
          "
        >
          <Sparkles size={19} />
          ASK HNMU AI
        </button>

        {/* GOLD ACCENT */}
        <div
          className="
            h-8
            w-[1px]
            bg-[#D4AF37]/40
          "
        />

        {/* RESET */}
        <button
          onClick={() =>
            window.location.reload()
          }
          className="
            text-white/50
            hover:text-[#D4AF37]
            transition-colors
          "
          title="Restart presentation"
        >
          <RotateCcw size={22} />
        </button>
      </div>

      {/* =====================================================
          AI ASSISTANT
      ===================================================== */}
      {showAssistant && (
        <div
          className="
            absolute
            z-50
            transition-shadow
            duration-300
          "
          style={{
            left:
              position.x ?? "auto",

            top:
              position.y ?? "auto",

            right:
              position.x === undefined
                ? 50
                : "auto",

            bottom:
              position.y === undefined
                ? 50
                : "auto",
          }}
        >
          <div
            onMouseDown={
              handleMouseDown
            }
            className={`
              w-[520px]

              bg-[#0F172A]/95
              backdrop-blur-3xl

              border
              border-[#4F46E5]/30

              rounded-[2rem]

              p-6

              shadow-[0_40px_120px_rgba(0,0,0,0.85)]

              cursor-grab
              active:cursor-grabbing

              transition-all
              duration-300

              ${
                dragging
                  ? `
                    scale-[1.01]
                    border-[#D4AF37]/40
                    shadow-[0_40px_120px_rgba(79,70,229,0.25)]
                  `
                  : ""
              }
            `}
          >
            {/* =================================================
                AI WINDOW HEADER
            ================================================= */}
            <div
              className="
                flex
                justify-between
                items-center
                mb-4

                interactive-area
              "
            >
              <div className="flex items-center gap-3">
                {/* Status */}
                <div
                  className={`
                    w-3
                    h-3
                    rounded-full

                    shadow-lg

                    ${
                      isListening
                        ? `
                          bg-[#D4AF37]
                          shadow-[#D4AF37]/50
                          animate-pulse
                        `
                        : `
                          bg-[#4F46E5]
                          shadow-[#4F46E5]/50
                        `
                    }
                  `}
                />

                <div>
                  <span
                    className="
                      block
                      text-[10px]
                      uppercase
                      font-black
                      text-white/80
                      tracking-[0.2em]
                    "
                  >
                    HNMU AI Assistant
                  </span>

                  <span
                    className="
                      block
                      text-[8px]
                      text-[#D4AF37]
                      uppercase
                      tracking-[0.18em]
                      mt-0.5
                    "
                  >
                    Conversational Intelligence
                  </span>
                </div>
              </div>

              {/* Close */}
              <button
                onClick={() =>
                  setShowAssistant(false)
                }
                className="
                  p-1.5
                  hover:bg-white/10

                  rounded-full

                  text-white/40
                  hover:text-white

                  transition-all

                  interactive-area
                "
              >
                <X size={20} />
              </button>
            </div>

            {/* =================================================
                GOLD DIVIDER
            ================================================= */}
            <div
              className="
                h-[1px]
                w-full

                bg-gradient-to-r
                from-transparent
                via-[#D4AF37]/30
                to-transparent

                mb-5
              "
            />

            {/* =================================================
                AVATAR
            ================================================= */}
            <div
              className="
                flex
                flex-col
                items-center
              "
            >
              <div className="relative group">
                {/* AI Glow */}
                <div
                  className={`
                    absolute
                    inset-0

                    bg-[#4F46E5]/20

                    blur-3xl
                    rounded-full

                    transition-all
                    duration-500

                    ${
                      isSpeaking
                        ? "opacity-100 scale-110"
                        : "opacity-0"
                    }
                  `}
                />

                {/* Gold ring when speaking */}
                <div
                  className={`
                    absolute
                    inset-[-10px]

                    rounded-full

                    border

                    transition-all
                    duration-500

                    ${
                      isSpeaking
                        ? `
                          border-[#D4AF37]/50
                          shadow-[0_0_40px_rgba(212,175,55,0.25)]
                        `
                        : `
                          border-transparent
                        `
                    }
                  `}
                />

                <AvatarLottie
                  isSpeaking={isSpeaking}
                />
              </div>

              {/* =================================================
                  LISTENING STATE
              ================================================= */}
              {isListening && (
                <div
                  className="
                    mt-4
                    text-center
                    min-h-[40px]
                    w-full
                    px-2
                  "
                >
                  <div
                    className="
                      flex
                      flex-col
                      items-center
                      gap-2
                    "
                  >
                    <p
                      className="
                        text-[#D4AF37]
                        text-sm
                        font-bold
                        animate-pulse
                        italic
                      "
                    >
                      Đang ghi âm câu hỏi...
                    </p>

                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(
                        (i) => (
                          <div
                            key={i}
                            className="
                              w-1
                              h-4
                              bg-gradient-to-t
                              from-[#1E40AF]
                              to-[#D4AF37]
                              rounded-full
                              animate-bounce
                            "
                            style={{
                              animationDelay: `${
                                i * 0.1
                              }s`,
                            }}
                          />
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* =================================================
                  INPUT FORM
              ================================================= */}
              <form
                onSubmit={
                  handleTextSubmit
                }
                className="
                  mt-6
                  w-full

                  flex
                  items-center
                  gap-2

                  bg-[#020617]/70

                  p-2

                  rounded-xl

                  border
                  border-white/10

                  focus-within:border-[#4F46E5]/50
                  focus-within:shadow-[0_0_25px_rgba(79,70,229,0.10)]

                  transition-all

                  interactive-area
                "
              >
                {/* MICROPHONE */}
                <button
                  type="button"
                  onClick={
                    startListening
                  }
                  disabled={
                    isSpeaking ||
                    isListening
                  }
                  className={`
                    p-3

                    rounded-lg

                    transition-all

                    shrink-0

                    ${
                      isListening
                        ? `
                          bg-[#D4AF37]
                          text-black
                          animate-pulse
                          shadow-lg
                          shadow-[#D4AF37]/20
                        `
                        : `
                          bg-[#1E293B]
                          text-white
                          hover:bg-[#1E40AF]
                          hover:text-white
                        `
                    }
                  `}
                  title="Nói với AI"
                >
                  <Mic size={20} />
                </button>

                {/* INPUT */}
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) =>
                    setTextInput(
                      e.target.value
                    )
                  }
                  placeholder={
                    isSpeaking
                      ? "AI đang trả lời, vui lòng đợi..."
                      : "Nhập câu hỏi của bạn tại đây..."
                  }
                  disabled={isSpeaking}
                  className="
                    w-full

                    bg-transparent

                    text-white

                    placeholder-slate-500

                    text-sm

                    focus:outline-none

                    px-2

                    disabled:opacity-50
                  "
                />

                {/* SEND */}
                <button
                  type="submit"
                  disabled={
                    !textInput.trim() ||
                    isSpeaking
                  }
                  className="
                    p-3

                    bg-gradient-to-br
                    from-[#1E40AF]
                    to-[#4F46E5]

                    hover:from-[#2563EB]
                    hover:to-[#6366F1]

                    text-white

                    rounded-lg

                    transition-all

                    disabled:opacity-30
                    disabled:cursor-not-allowed
                  "
                >
                  <Send size={18} />
                </button>
              </form>
            </div>

            {/* =================================================
                Q&A HISTORY
            ================================================= */}
            <div
              className="
                mt-6
                pt-4

                border-t
                border-white/10

                space-y-3

                interactive-area
              "
            >
              <div className="flex items-center justify-between">
                <p
                  className="
                    text-[10px]
                    font-black
                    text-slate-500
                    uppercase
                    tracking-widest
                  "
                >
                  Hỏi đáp gần nhất
                </p>

                <span
                  className="
                    text-[9px]
                    font-bold
                    text-[#D4AF37]
                    bg-[#D4AF37]/10
                    px-2
                    py-1
                    rounded-full
                  "
                >
                  TỐI ĐA 2
                </span>
              </div>

              {history.length === 0 ? (
                <div
                  className="
                    bg-white/[0.03]

                    p-4

                    rounded-xl

                    border
                    border-dashed
                    border-white/10

                    text-center
                  "
                >
                  <p className="text-slate-500 text-xs">
                    Chưa có câu hỏi nào
                    được thực hiện.
                  </p>
                </div>
              ) : (
                <div
                  className="
                    space-y-3
                    max-h-[220px]
                    overflow-y-auto
                    pr-1
                    subtle-scrollbar
                  "
                >
                  {history.map(
                    (item, i) => (
                      <div
                        key={i}
                        onClick={() =>
                          speak(item.a)
                        }
                        className="
                          group

                          bg-[#020617]/60

                          hover:bg-[#111C35]

                          p-3.5

                          rounded-xl

                          cursor-pointer

                          transition-all

                          border
                          border-white/5

                          hover:border-[#4F46E5]/40

                          hover:shadow-lg
                          hover:shadow-[#4F46E5]/5
                        "
                      >
                        <div className="space-y-2">
                          {/* QUESTION */}
                          <div
                            className="
                              flex
                              gap-2
                              items-start
                            "
                          >
                            <span
                              className="
                                text-[10px]

                                bg-[#1E40AF]/30
                                text-[#93C5FD]

                                font-bold

                                px-1.5
                                py-0.5

                                rounded

                                shrink-0
                              "
                            >
                              Hỏi
                            </span>

                            <p
                              className="
                                text-white/80
                                text-xs
                                font-semibold
                                italic
                                line-clamp-1
                              "
                            >
                              "{item.q}"
                            </p>
                          </div>

                          {/* ANSWER */}
                          <div
                            className="
                              flex
                              gap-2
                              items-start
                            "
                          >
                            <span
                              className="
                                text-[10px]

                                bg-[#D4AF37]/15
                                text-[#D4AF37]

                                font-bold

                                px-1.5
                                py-0.5

                                rounded

                                shrink-0
                              "
                            >
                              Đáp
                            </span>

                            <p
                              className="
                                text-slate-300

                                text-xs

                                leading-relaxed

                                line-clamp-2

                                group-hover:text-white

                                transition-colors
                              "
                            >
                              {item.a}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* =================================================
                FOOTER BRAND
            ================================================= */}
            <div
              className="
                mt-5

                flex
                items-center
                justify-center
                gap-3
              "
            >
              <div
                className="
                  h-[1px]
                  flex-1
                  bg-gradient-to-r
                  from-transparent
                  to-white/10
                "
              />

              <span
                className="
                  text-[8px]
                  font-black
                  tracking-[0.3em]
                  text-[#D4AF37]/60
                  uppercase
                "
              >
                HNMU • AI • ROBOTICS
              </span>

              <div
                className="
                  h-[1px]
                  flex-1
                  bg-gradient-to-l
                  from-transparent
                  to-white/10
                "
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
