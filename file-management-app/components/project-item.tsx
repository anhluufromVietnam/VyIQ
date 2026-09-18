"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  Copy,
  Download,
  Trash2,
  Presentation,
  FileText,
  Video,
  ImageIcon,
  Folder,
  Edit2,
} from "lucide-react"
import Image from "next/image"
import EditProjectModal from "./edit-project-modal"

interface Project {
  id: string
  name: string
  description: string
  fileCount: number
  size: string
  lastModified: string
  type: string
  thumbnail: string
  status: string
  hasVideo?: boolean
  hasDocuments?: boolean
  canEdit?: boolean
}

interface ProjectItemProps {
  project: Project
  viewMode: "grid" | "list"
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case "presentation":
      return <Presentation className="h-4 w-4 text-blue-500" />
    case "video":
      return <Video className="h-4 w-4 text-red-500" />
    case "design":
      return <ImageIcon className="h-4 w-4 text-green-500" />
    case "document":
      return <FileText className="h-4 w-4 text-orange-500" />
    default:
      return <Folder className="h-4 w-4 text-gray-500" />
  }
}

export default function ProjectItem({ project, viewMode }: ProjectItemProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const handleAction = (action: string) => {
    switch (action) {
      case "view":
        // Navigate to project view
        window.open(`/project/${project.id}`, "_blank")
        break
      case "edit":
        setIsEditModalOpen(true)
        break
      case "copy":
        // Copy project logic
        console.log("Copying project:", project.id)
        break
      case "download":
        // Download project logic
        console.log("Downloading project:", project.id)
        break
      case "delete":
        // Delete project logic
        console.log("Deleting project:", project.id)
        break
      case "present":
        // Start presentation mode
        window.open(`/presentation/${project.id}`, "_blank")
        break
      case "edit-content":
        // Navigate to content editor
        window.open(`/project/${project.id}/edit`, "_blank")
        break
    }
  }

  if (viewMode === "list") {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted">
              <Image src={project.thumbnail || "/placeholder.svg"} alt={project.name} fill className="object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                {getTypeIcon(project.type)}
                <h3 className="font-semibold truncate">{project.name}</h3>
                <Badge variant={project.status === "active" ? "default" : "secondary"}>{project.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground truncate mb-2">{project.description}</p>
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <span>{project.fileCount} files</span>
                <span>{project.size}</span>
                <span>Modified {project.lastModified}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => handleAction("present")} className="gap-2">
                <Presentation className="h-4 w-4" />
                Present
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleAction("view")}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAction("edit")}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAction("edit-content")}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Content
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAction("copy")}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleAction("download")}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAction("delete")} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
        <EditProjectModal project={project} isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-md transition-shadow group">
      <CardHeader className="p-0">
        <div className="relative aspect-video rounded-t-lg overflow-hidden bg-muted">
          <Image src={project.thumbnail || "/placeholder.svg"} alt={project.name} fill className="object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Button variant="secondary" size="sm" onClick={() => handleAction("present")} className="gap-2">
              <Presentation className="h-4 w-4" />
              Present
            </Button>
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
                  View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction("edit")}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction("edit-content")}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Content
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction("copy")}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleAction("download")}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction("delete")} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="absolute top-2 left-2">
            <Badge variant={project.status === "active" ? "default" : "secondary"}>{project.status}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex items-center space-x-2 mb-2">
          {getTypeIcon(project.type)}
          <h3 className="font-semibold truncate">{project.name}</h3>
          {project.hasVideo && <Video className="h-3 w-3 text-blue-500" />}
          {project.hasDocuments && <FileText className="h-3 w-3 text-green-500" />}
          {project.canEdit && <Edit2 className="h-3 w-3 text-orange-500" />}
        </div>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{project.description}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{project.fileCount} files</span>
          <span>{project.size}</span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">Modified {project.lastModified}</div>
      </CardContent>
      <EditProjectModal project={project} isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />
    </Card>
  )
}
