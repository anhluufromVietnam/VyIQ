"use client"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft, Save, Play, FileText, Video, ImageIcon, Upload
} from "lucide-react"
import Link from "next/link"
import VideoEditor from "@/components/video-editor"
import DocumentEditor from "@/components/document-editor"

export default function ProjectEditor() {
  const params = useParams()
  const { id } = params as { id: string }

  const [project, setProject] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("video")
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [documentContent, setDocumentContent] = useState<string>("")

  const videoInputRef = useRef<HTMLInputElement>(null)
  const docInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    axios.get(`http://127.0.0.1:8000/projects/${id}`)
      .then(async res => {
        const project = res.data
        if (project.document_path) {
          const textRes = await axios.get(`http://127.0.0.1:8000/projects/${id}/doc_text`)
          project.document_content = textRes.data.content
          setDocumentContent(textRes.data.content)
        }
        setProject(project)
      })
      .catch(err => console.error("Error loading project:", err))
  }, [id])

  const handleSave = async () => {
    if (project?.document_path) {
      await axios.post(`http://127.0.0.1:8000/projects/${id}/save_doc`, { content: documentContent })
    }
    setHasUnsavedChanges(false)
  }

  const handlePreview = () => {
    window.open(`/presentation/${id}`, "_blank")
  }

  const handleUpload = async (type: 'video' | 'doc', file: File) => {
    const formData = new FormData()
    formData.append("file", file)
    const endpoint = type === 'video' ? 'upload_video' : 'upload_doc'
    await axios.post(`http://127.0.0.1:8000/projects/${id}/${endpoint}`, formData)
    location.reload()
  }

  if (!project) return <p className="p-6 text-muted-foreground">Đang tải dữ liệu dự án...</p>

  const videoName = project.video_path?.split("/").pop()
  const docName = project.document_path?.split("/").pop()

  const videoFiles = project.video_path
    ? [{
        id: "video",
        name: videoName,
        type: "video/mp4",
        size: "--",
        duration: "--",
        url: `http://127.0.0.1:8000/project_files/${id}/video/${videoName}`,
        thumbnail: `http://127.0.0.1:8000/projects/${id}/thumbnail`,
        editable: true,
      }]
    : []

  const documentFiles = project.document_path
    ? [{
        id: "doc",
        name: docName,
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        size: "--",
        url: `http://127.0.0.1:8000/project_files/${id}/docs/${docName}`,
        content: documentContent,
        editable: true,
      }]
    : []

  const imageFiles = project.thumbnail
    ? [{
        id: "thumb",
        name: "thumbnail.jpg",
        type: "image/jpeg",
        size: "--",
        url: `http://127.0.0.1:8000/projects/${id}/thumbnail`,
        thumbnail: `http://127.0.0.1:8000/projects/${id}/thumbnail`,
        editable: false,
      }]
    : []

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href={`/project/${id}`}>
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Quay lại
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Chỉnh sửa: {project.name}</h1>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="secondary">Editor</Badge>
                  {hasUnsavedChanges && <Badge variant="destructive">Unsaved Changes</Badge>}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={handlePreview} className="gap-2 bg-transparent">
                <Play className="h-4 w-4" />
                Preview
              </Button>
              <Button onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" />
                Save
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="video" className="gap-2">
              <Video className="h-4 w-4" />
              Video ({videoFiles.length})
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <FileText className="h-4 w-4" />
              Documents ({documentFiles.length})
            </TabsTrigger>
            <TabsTrigger value="assets" className="gap-2">
              <ImageIcon className="h-4 w-4" />
              Assets ({imageFiles.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="video" className="space-y-6">
            <div className="flex items-center space-x-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Upload className="h-4 w-4" />
                <span className="text-sm font-medium">Upload Video</span>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => e.target.files && handleUpload('video', e.target.files[0])}
                />
              </label>
            </div>
            {videoFiles.length > 0 ? (
              <VideoEditor files={videoFiles} onContentChange={() => setHasUnsavedChanges(true)} />
            ) : (
              <Card><CardContent className="p-8 text-center">Không có video</CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <div className="flex items-center space-x-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Upload className="h-4 w-4" />
                <span className="text-sm font-medium">Upload Document</span>
                <input
                  ref={docInputRef}
                  type="file"
                  accept=".doc,.docx,.pdf,.txt,.csv"
                  className="hidden"
                  onChange={(e) => e.target.files && handleUpload('doc', e.target.files[0])}
                />
              </label>
            </div>
            {documentFiles.length > 0 ? (
              <DocumentEditor
                files={documentFiles}
                onContentChange={() => {
                  setHasUnsavedChanges(true)
                }}
  		projectId={id}
                onUpdateContent={(newContent) => {
                  setDocumentContent(newContent)
                  setHasUnsavedChanges(true)
                }}
              />
            ) : (
              <Card><CardContent className="p-8 text-center">Không có tài liệu</CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="assets" className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Thumbnail</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imageFiles.map((file) => (
                    <Card key={file.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <img src={file.thumbnail} alt={file.name} className="w-full h-full object-cover" />
                        <div className="p-3">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{file.size}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}