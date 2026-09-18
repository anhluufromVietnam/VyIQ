"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Play, Plus, MonitorPlay, Cpu } from "lucide-react"
import Link from "next/link"

export default function Dashboard() {
  const [projects, setProjects] = useState([])

  useEffect(() => {
    axios.get("/api/projects")
      .then(res => setProjects(res.data))
      .catch(err => console.error("Error:", err))
  }, [])

  return (
    // Theme dựa trên logo Swinburne: Đỏ (Red) - Đen (Dark) - Trắng (White)
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
      
      {/* Hiệu ứng ánh sáng nền (Theme-based Glow) */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-[#E63946]/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-[#1b1b1b]/30 blur-[120px]" />
      </div>

      <header className="relative z-10 border-b border-white/5 bg-black/40 backdrop-blur-2xl">
        <div className="max-w-[1920px] mx-auto px-12 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              {/* Chèn Logo Swinburne */}
              <div className="bg-white p-3 rounded-xl shadow-lg shadow-white/5">
                <img
                  src="https://asia-vn.edu.vn/wp-content/uploads/2025/09/asia-logo.svg"
                  alt="Swinburne Logo"
                  className="h-12 w-auto object-contain"
                />
              </div>
              
              {/* Divider */}
              <div className="h-12 w-[2px] bg-gradient-to-b from-transparent via-white/20 to-transparent" />

              <div>
                <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent uppercase">
                  RobotGPT
                </h1>
                <p className="text-[#E63946] font-bold tracking-[0.3em] text-sm mt-1 uppercase">
                  AI Innovation Center
                </p>
              </div>
            </div>
            
            <Link href="/create-project">
              <Button size="lg" className="h-16 px-10 text-xl font-bold gap-3 rounded-2xl bg-[#E63946] hover:bg-[#c12e39] text-white shadow-[0_0_30px_rgba(230,57,70,0.3)] transition-all active:scale-95">
                <Plus className="h-7 w-7" />
                DỰ ÁN MỚI
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-[1920px] mx-auto px-12 py-16">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] border-[3px] border-dashed border-white/5 rounded-[4rem] bg-white/[0.02]">
            <MonitorPlay className="h-24 w-24 text-zinc-700 mb-8" />
            <p className="text-3xl text-zinc-500 font-medium">Hệ thống sẵn sàng. Vui lòng thêm dự án.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-12">
            {projects.map((project: any) => (
              <div
                key={project.id}
                className="group relative bg-[#111] border border-white/5 rounded-[3rem] overflow-hidden hover:border-[#E63946]/50 transition-all duration-500 shadow-2xl"
              >
                {/* Thumbnail Area */}
                <div className="aspect-[16/10] w-full overflow-hidden relative">
                  <img
                    src={`/api/projects/${project.id}/thumbnail` || "/placeholder.svg"}
                    alt={project.name}
                    className="object-cover w-full h-full transition-transform duration-1000 group-hover:scale-110 opacity-70 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent" />
                  
                  {/* Floating AI Chip */}
                  <div className="absolute top-8 right-8 bg-[#E63946] p-4 rounded-2xl shadow-xl">
                    <Cpu className="h-8 w-8 text-white" />
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-10 -mt-12 relative z-20">
                  <h3 className="text-4xl font-bold mb-4 tracking-tight group-hover:text-[#E63946] transition-colors duration-300">
                    {project.name || "Tên dự án AI"}
                  </h3>
                  <p className="text-zinc-400 text-xl line-clamp-2 mb-10 font-light min-h-[4rem]">
                    {project.description || "Hệ thống tự động hóa và đào tạo mô hình ngôn ngữ lớn cho doanh nghiệp."}
                  </p>

                  <Link href={`/project/${project.id}/presentation`}>
                    <Button
                      className="w-full h-20 text-2xl font-black gap-5 rounded-3xl bg-white text-black hover:bg-[#E63946] hover:text-white transition-all duration-500 shadow-xl group-hover:shadow-[#E63946]/20"
                    >
                      <Play className="h-8 w-8 fill-current" />
                      PLAY PROJECT
                    </Button>
                  </Link>
                </div>

                {/* Decorative Line */}
                <div className="absolute bottom-0 left-0 w-0 h-1.5 bg-[#E63946] transition-all duration-700 group-hover:w-full" />
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="p-16 flex justify-center items-center space-x-4">
        <div className="h-[1px] w-20 bg-zinc-800" />
        <span className="text-zinc-600 text-lg tracking-[0.5em] font-bold">ROBOTGPT x SWINBURNE</span>
        <div className="h-[1px] w-20 bg-zinc-800" />
      </footer>
    </div>
  )
}
