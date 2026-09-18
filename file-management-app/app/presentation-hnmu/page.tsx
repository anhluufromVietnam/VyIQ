"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Play, Plus, MonitorPlay, Cpu } from "lucide-react"
import Link from "next/link"

export default function Dashboard() {
  const [projects, setProjects] = useState<any[]>([])

  useEffect(() => {
    axios
      .get("/api/projects")
      .then((res) => setProjects(res.data))
      .catch((err) => console.error("Error:", err))
  }, [])

  return (
    <div className="min-h-screen bg-[#030712] text-white overflow-x-hidden">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-[#4F46E5]/15 blur-[140px]" />

        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-[#1E40AF]/15 blur-[140px]" />

        <div className="absolute top-[30%] left-[30%] w-[25%] h-[25%] rounded-full bg-[#D4AF37]/10 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-[#020617]/70 backdrop-blur-2xl">
        <div className="max-w-[1920px] mx-auto px-12 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              {/* Logo */}
              <div className="bg-white p-3 rounded-2xl shadow-xl shadow-blue-500/10">
                <img
                  src="/images/hnmu.png"
                  alt="HNMU Logo"
                  className="h-12 w-auto object-contain"
                />
              </div>

              {/* Divider */}
              <div className="h-12 w-[2px] bg-gradient-to-b from-transparent via-white/20 to-transparent" />

              {/* Branding */}
              <div>
                <h1
                  className="
                  text-5xl
                  font-black
                  tracking-tighter
                  bg-gradient-to-r
                  from-white
                  via-[#93C5FD]
                  to-[#4F46E5]
                  bg-clip-text
                  text-transparent
                  uppercase
                "
                >
                  RobotGPT
                </h1>

                <p
                  className="
                  text-[#D4AF37]
                  font-bold
                  tracking-[0.3em]
                  text-sm
                  mt-1
                  uppercase
                "
                >
                  HNMU AI Innovation Center
                </p>
              </div>
            </div>

            {/* Create Project */}
            <Link href="/create-project">
              <Button
                size="lg"
                className="
                h-16
                px-10
                text-xl
                font-bold
                gap-3
                rounded-2xl

                bg-gradient-to-r
                from-[#1E40AF]
                to-[#4F46E5]

                hover:from-[#2563EB]
                hover:to-[#6366F1]

                text-white

                shadow-[0_0_40px_rgba(79,70,229,0.35)]

                transition-all
                active:scale-95
                "
              >
                <Plus className="h-7 w-7" />
                DỰ ÁN MỚI
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 max-w-[1920px] mx-auto px-12 py-16">
        {projects.length === 0 ? (
          <div
            className="
            flex flex-col
            items-center
            justify-center
            min-h-[50vh]
            border-[3px]
            border-dashed
            border-white/10
            rounded-[4rem]
            bg-white/[0.02]
            backdrop-blur-xl
          "
          >
            <MonitorPlay className="h-24 w-24 text-[#4F46E5] mb-8" />

            <p className="text-3xl text-slate-400 font-medium">
              Hệ thống sẵn sàng. Vui lòng thêm dự án.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-12">
            {projects.map((project: any) => (
              <div
                key={project.id}
                className="
                group
                relative
                bg-[#0F172A]
                border
                border-white/10
                rounded-[3rem]
                overflow-hidden
                hover:border-[#4F46E5]/50
                transition-all
                duration-500
                shadow-2xl
              "
              >
                {/* Thumbnail */}
                <div className="aspect-[16/10] w-full overflow-hidden relative">
                  <img
                    src={`/api/projects/${project.id}/thumbnail`}
                    alt={project.name}
                    className="
                    object-cover
                    w-full
                    h-full
                    transition-transform
                    duration-1000
                    group-hover:scale-110
                    opacity-70
                    group-hover:opacity-100
                  "
                  />

                  <div
                    className="
                    absolute
                    inset-0
                    bg-gradient-to-t
                    from-[#0F172A]
                    via-transparent
                    to-transparent
                  "
                  />

                  {/* AI Badge */}
                  <div
                    className="
                    absolute
                    top-8
                    right-8
                    bg-gradient-to-br
                    from-[#D4AF37]
                    to-[#FACC15]
                    p-4
                    rounded-2xl
                    shadow-xl
                    shadow-yellow-500/30
                  "
                  >
                    <Cpu className="h-8 w-8 text-black" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-10 -mt-12 relative z-20">
                  <h3
                    className="
                    text-4xl
                    font-bold
                    mb-4
                    tracking-tight
                    group-hover:text-[#93C5FD]
                    transition-colors
                    duration-300
                  "
                  >
                    {project.name || "Tên dự án AI"}
                  </h3>

                  <p
                    className="
                    text-slate-400
                    text-xl
                    line-clamp-2
                    mb-10
                    font-light
                    min-h-[4rem]
                  "
                  >
                    {project.description ||
                      "Hệ thống AI, Robotics và Conversational Intelligence dành cho giáo dục và doanh nghiệp."}
                  </p>

                  <Link href={`/project/${project.id}/hnmu`}>
                    <Button
                      className="
                      w-full
                      h-20
                      text-2xl
                      font-black
                      gap-5
                      rounded-3xl

                      bg-gradient-to-r
                      from-[#1E40AF]
                      to-[#4F46E5]

                      hover:from-[#2563EB]
                      hover:to-[#6366F1]

                      text-white

                      transition-all
                      duration-500

                      shadow-xl

                      group-hover:shadow-[#4F46E5]/40
                    "
                    >
                      <Play className="h-8 w-8 fill-current" />
                      PLAY PROJECT
                    </Button>
                  </Link>
                </div>

                {/* Bottom Accent Line */}
                <div
                  className="
                  absolute
                  bottom-0
                  left-0

                  w-0
                  h-1.5

                  bg-gradient-to-r
                  from-[#1E40AF]
                  via-[#4F46E5]
                  to-[#D4AF37]

                  transition-all
                  duration-700

                  group-hover:w-full
                "
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="p-16 flex justify-center items-center space-x-4">
        <div className="h-[1px] w-20 bg-slate-700" />

        <span
          className="
          text-[#D4AF37]
          text-lg
          tracking-[0.5em]
          font-bold
        "
        >
          ROBOTGPT × HNMU
        </span>

        <div className="h-[1px] w-20 bg-slate-700" />
      </footer>
    </div>
  )
}
