"use client"

import { useRouter } from "next/navigation"
import axios from "axios"
import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MoreHorizontal,
  Eye,
  Edit,
  Brain,
  Play,
  Trash2,
  Video,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface Project {
  id: string
  name: string
  description: string
  status: string
  videoCount: number
  documentCount: number
  modelStatus: string
  accuracy: number
  lastTrained: string
  thumbnail: string
}

interface ProjectCardProps {
  project: Project
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-500"
    case "training":
      return "bg-blue-500"
    case "draft":
      return "bg-gray-500"
    default:
      return "bg-gray-500"
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case "training":
      return <Clock className="h-4 w-4 text-blue-500 animate-spin" />
    case "draft":
      return <AlertCircle className="h-4 w-4 text-gray-500" />
    default:
      return <AlertCircle className="h-4 w-4 text-gray-500" />
  }
}

const getModelStatusText = (status: string) => {
  switch (status) {
    case "trained":
      return "Đã training"
    case "training":
      return "Đang training"
    case "pending":
      return "Chờ training"
    default:
      return "Chưa xác định"
  }
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleAction = async (action: string) => {
    switch (action) {
      case "view":
        window.open(`/project/${project.id}`, "_blank")
        break
      case "edit":
        window.open(`/project/${project.id}/edit`, "_blank")
        break
      case "train":
        window.open(`/project/${project.id}/train`, "_blank")
        break
      case "delete":
        if (confirm("Bạn có chắc muốn xóa dự án này?")) {
          try {
            setIsDeleting(true)
            await axios.delete(`http://127.0.0.1:8000/projects/${project.id}`)
            router.refresh?.()
          } catch (err) {
            console.error("Xóa dự án thất bại:", err)
            alert("Xóa dự án thất bại.")
          } finally {
            setIsDeleting(false)
          }
        }
        break
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow group opacity-100">
      <CardHeader className="p-0">
        <div className="relative aspect-video rounded-t-lg overflow-hidden bg-muted">
          <Image src={project.thumbnail || "/placeholder.svg"} alt={project.name} fill className="object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Link href={`/project/${project.id}`}>
              <Button variant="secondary" size="sm" className="gap-2">
                <Play className="h-4 w-4" />
                Xem video
              </Button>
            </Link>
          </div>
          <div className="absolute top-2 right-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleAction("view")}>
                  <Eye className="h-4 w-4 mr-2" />
                  Xem chi tiết
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction("edit")}>
                  <Edit className="h-4 w-4 mr-2" />
                  Chỉnh sửa
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction("train")}>
                  <Brain className="h-4 w-4 mr-2" />
                  Training AI
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleAction("delete")}
                  className="text-destructive"
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeleting ? "Đang xóa..." : "Xóa"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="absolute top-2 left-2">
            <Badge variant={project.status === "completed" ? "default" : "secondary"}>
              {project.status === "completed" ? "Hoàn thành" : project.status === "training" ? "Đang xử lý" : "Nháp"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold truncate">{project.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Video className="h-4 w-4 text-red-500" />
                <span>{project.videoCount}</span>
              </div>
              <div className="flex items-center space-x-1">
                <FileText className="h-4 w-4 text-blue-500" />
                <span>{project.documentCount}</span>
              </div>
            </div>
            {getStatusIcon(project.status)}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Mô hình AI:</span>
              <Badge variant="outline" className="text-xs">
                {getModelStatusText(project.modelStatus)}
              </Badge>
            </div>

            {project.modelStatus === "trained" && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Độ chính xác</span>
                  <span>{project.accuracy}%</span>
                </div>
                <Progress value={project.accuracy} className="h-2" />
              </div>
            )}

            {project.modelStatus === "training" && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Đang training...</span>
                  <span>65%</span>
                </div>
                <Progress value={65} className="h-2" />
              </div>
            )}
          </div>

          <div className="text-xs text-muted-foreground">Cập nhật: {project.lastTrained}</div>
        </div>
      </CardContent>
    </Card>
  )
}
