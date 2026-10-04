"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Play, Plus, MonitorPlay, Cpu, Sparkles } from "lucide-react"
import Link from "next/link"

export default function TamVietQuangDashboard() {
  const [projects, setProjects] = useState<any[]>([])

  useEffect(() => {
    axios
      .get("/api/projects")
      .then((res) => setProjects(res.data))
      .catch((err) => console.error("Error:", err))
  }, [])

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#414141] overflow-x-hidden font-sans">
      {/* Background Accents */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-[#564EF5]/10 blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-[#7DD183]/10 blur-[140px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-[#414141]/10 bg-white/70 backdrop-blur-2xl">
        <div className="max-w-[1920px] mx-auto px-12 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              {/* Logo Placeholder */}
              <div className="bg-[#F5F5F5] border-2 border-dashed border-[#414141]/30 p-3 rounded-2xl flex items-center justify-center w-16 h-16 shadow-sm">
                <span className="text-[10px] font-bold text-[#414141]/50 text-center">LOGO<br/>TVQ</span>
              </div>

              {/* Divider */}
              <div className="h-12 w-[2px] bg-gradient-to-b from-transparent via-[#414141]/20 to-transparent" />

              {/* Branding */}
              <div>
                <h1 className="text-5xl font-black tracking-tighter text-[#414141] uppercase">
                  Tâm Việt Quang
                </h1>
                <p className="text-[#564EF5] font-bold tracking-[0.2em] text-sm mt-1 uppercase">
                  Eduverse & Tech Solutions
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
                bg-[#564EF5]
                hover:bg-[#453bc4]
                text-white
                shadow-lg
                shadow-[#564EF5]/30
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
            border-[#414141]/10
            rounded-[3rem]
            bg-white/50
            backdrop-blur-xl
          "
          >
            <MonitorPlay className="h-24 w-24 text-[#564EF5] mb-8" />
            <p className="text-3xl text-slate-500 font-medium">
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
                bg-white
                border
                border-[#414141]/10
                rounded-[2.5rem]
                overflow-hidden
                hover:border-[#564EF5]/50
                transition-all
                duration-500
                shadow-xl
                hover:shadow-2xl
                hover:shadow-[#564EF5]/10
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
                    opacity-90
                    group-hover:opacity-100
                  "
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                  
                  {/* AI Badge */}
                  <div className="absolute top-8 right-8 bg-[#F2D738] p-4 rounded-2xl shadow-lg shadow-yellow-500/20">
                    <Cpu className="h-8 w-8 text-[#414141]" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-10 -mt-12 relative z-20">
                  <h3 className="text-4xl font-bold mb-4 tracking-tight group-hover:text-[#564EF5] transition-colors duration-300">
                    {project.name || "Tên dự án"}
                  </h3>
                  <p className="text-slate-500 text-xl line-clamp-2 mb-10 font-light min-h-[4rem]">
                    {project.description || "Giải pháp công nghệ và giáo dục sáng tạo cho tương lai."}
                  </p>

                  <Link href={`/project/${project.id}/tam-viet-quang`}>
                    <Button
                      className="
                      w-full
                      h-20
                      text-2xl
                      font-black
                      gap-5
                      rounded-3xl
                      bg-[#564EF5]
                      hover:bg-[#453bc4]
                      text-white
                      transition-all
                      duration-500
                      shadow-lg
                      group-hover:shadow-[#564EF5]/40
                    "
                    >
                      <Play className="h-8 w-8 fill-current" />
                      KHÁM PHÁ
                    </Button>
                  </Link>
                </div>

                {/* Bottom Accent Line */}
                <div className="absolute bottom-0 left-0 w-0 h-1.5 bg-[#564EF5] transition-all duration-700 group-hover:w-full" />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="p-16 flex justify-center items-center space-x-4">
        <div className="h-[1px] w-20 bg-[#414141]/20" />
        <span className="text-[#564EF5] text-lg tracking-[0.5em] font-bold uppercase">
          Tâm Việt Quang × Eduverse
        </span>
        <div className="h-[1px] w-20 bg-[#414141]/20" />
      </footer>
    </div>
  )
}
