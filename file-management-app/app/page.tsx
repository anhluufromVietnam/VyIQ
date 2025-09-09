"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Brain, Video, FileText, TrendingUp } from "lucide-react"
import Link from "next/link"
import ProjectCard from "@/components/project-card"
import ModelCard from "@/components/model-card"

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("projects")
  const [projects, setProjects] = useState([])

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/projects")
      .then(res => setProjects(res.data))
      .catch(err => console.error("Lỗi khi fetch projects:", err))
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Brain className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">AI Training Platform</h1>
                <p className="text-sm text-muted-foreground">Tạo và training mô hình LLM từ dự án của bạn</p>
              </div>
            </div>
            <Link href="/create-project">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Tạo dự án mới
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card><CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{projects.length}</p>
                <p className="text-sm text-muted-foreground">Dự án</p>
              </div>
            </div>
          </CardContent></Card>

          <Card><CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Mô hình AI</p>
              </div>
            </div>
          </CardContent></Card>

          <Card><CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Video className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{projects.filter(p => p.video_path).length}</p>
                <p className="text-sm text-muted-foreground">Video</p>
              </div>
            </div>
          </CardContent></Card>

          <Card><CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">
                  {projects.length > 0 ? `${(
                    projects.reduce((sum, p) => sum + (p.accuracy || 0), 0) / projects.length
                  ).toFixed(1)}%` : "0%"}
                </p>
                <p className="text-sm text-muted-foreground">Độ chính xác TB</p>
              </div>
            </div>
          </CardContent></Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="projects" className="gap-2">
              <FileText className="h-4 w-4" />
              Dự án ({projects.length})
            </TabsTrigger>
            <TabsTrigger value="models" className="gap-2">
              <Brain className="h-4 w-4" />
              Mô hình AI (0)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Dự án của bạn</h2>
              <Link href="/create-project">
                <Button variant="outline" className="gap-2 bg-transparent">
                  <Plus className="h-4 w-4" />
                  Thêm dự án
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project: any) => (
                <ProjectCard key={project.id} project={{
                  ...project,
                  videoCount: project.video_path ? 1 : 0,
                  documentCount: project.document_path ? 1 : 0,
                  lastTrained: "2 giờ trước",
                  thumbnail: `http://127.0.0.1:8000/projects/${project.id}/thumbnail` || "/placeholder.svg?height=200&width=300"
                }} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="models" className="space-y-6">
            <p className="text-sm text-muted-foreground">Chưa có mô hình</p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
