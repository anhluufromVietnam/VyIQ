"use client"

import Lottie from "lottie-react"
import animationData from "@/public/avatar.json"

export default function AvatarLottie({ isSpeaking }: { isSpeaking: boolean }) {
  return (
    <div className="w-32 h-32">
      <Lottie
        animationData={animationData}
        loop
        autoplay
        style={{
          background: "transparent" // 🔥 QUAN TRỌNG
        }}
        rendererSettings={{
          preserveAspectRatio: "xMidYMid slice",
          clearCanvas: true, // 🔥 đảm bảo không vẽ nền
        }}
      />
    </div>
  )
}
