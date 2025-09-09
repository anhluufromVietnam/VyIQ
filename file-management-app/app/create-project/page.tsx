"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Video, FileText, Brain, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import FileUploadZone from "@/components/file-upload-zone"

interface ProjectData {
  name: string
  description: string
  category: string
  videos: File[]
  documents: File[]
  additionalContent: string
}

export default function CreateProject() {
  const [currentStep, setCurrentStep] = useState(1)
  const [projectData, setProjectData] = useState<ProjectData>({
    name: "",
    description: "",
    category: "",
    videos: [],
    documents: [],
    additionalContent: "",
  })
  const [isCreating, setIsCreating] = useState(false)

  const totalSteps = 4

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleVideoUpload = (files: File[]) => {
    setProjectData((prev) => ({ ...prev, videos: files }))
  }

  const handleDocumentUpload = (files: File[]) => {
    setProjectData((prev) => ({ ...prev, documents: files }))
  }

  const handleCreateProject = async () => {
  setIsCreating(true)

  try {
    // 1. Submit basic project info
    const formData = new FormData()
    formData.append("name", projectData.name)
    formData.append("tag", projectData.category)
    formData.append("description", projectData.description)
    formData.append("status", "draft")
    formData.append("accuracy", "0")

    // Optional: include the first video and first document
    if (projectData.videos.length > 0) {
      formData.append("video", projectData.videos[0])
    }
    if (projectData.documents.length > 0) {
      formData.append("document", projectData.documents[0])
    }

    const res = await fetch("http://127.0.0.1:8000/projects", {
      method: "POST",
      body: formData,
    })

    const result = await res.json()

    if (!res.ok) throw new Error(result.detail || "Project creation failed")

    const projectId = result.id

    // 2. Upload remaining videos and documents (optional multi-upload logic)
    for (let i = 1; i < projectData.videos.length; i++) {
      const videoForm = new FormData()
      videoForm.append("file", projectData.videos[i])
      await fetch(`http://127.0.0.1:8000/projects/${projectId}/upload_video`, {
        method: "POST",
        body: videoForm,
      })
    }

    for (let i = 1; i < projectData.documents.length; i++) {
      const docForm = new FormData()
      docForm.append("file", projectData.documents[i])
      await fetch(`http://127.0.0.1:8000/projects/${projectId}/upload_doc`, {
        method: "POST",
        body: docForm,
      })
    }

    // ✅ Redirect to project or dashboard
    window.location.href = `/` // or `/project/${projectId}`
  } catch (error) {
    console.error("Error creating project:", error)
  } finally {
    setIsCreating(false)
  }
}

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return projectData.name && projectData.description && projectData.category
      case 2:
        return projectData.videos.length > 0
      case 3:
        return projectData.documents.length > 0
      case 4:
        return true
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Quay lại
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Tạo dự án mới</h1>
                <p className="text-sm text-muted-foreground">
                  Bước {currentStep} / {totalSteps}:{" "}
                  {currentStep === 1
                    ? "Thông tin cơ bản"
                    : currentStep === 2
                      ? "Upload video"
                      : currentStep === 3
                        ? "Upload tài liệu"
                        : "Xác nhận và tạo"}
                </p>
              </div>
            </div>
            <Badge variant="secondary">{Math.round((currentStep / totalSteps) * 100)}% hoàn thành</Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Progress Bar */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <Progress value={(currentStep / totalSteps) * 100} className="mb-4" />
            <div className="flex justify-between text-sm">
              <div
                className={`flex items-center space-x-2 ${currentStep >= 1 ? "text-primary" : "text-muted-foreground"}`}
              >
                {currentStep > 1 ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-current" />
                )}
                <span>Thông tin</span>
              </div>
              <div
                className={`flex items-center space-x-2 ${currentStep >= 2 ? "text-primary" : "text-muted-foreground"}`}
              >
                {currentStep > 2 ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-current" />
                )}
                <span>Video</span>
              </div>
              <div
                className={`flex items-center space-x-2 ${currentStep >= 3 ? "text-primary" : "text-muted-foreground"}`}
              >
                {currentStep > 3 ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-current" />
                )}
                <span>Tài liệu</span>
              </div>
              <div
                className={`flex items-center space-x-2 ${currentStep >= 4 ? "text-primary" : "text-muted-foreground"}`}
              >
                <div className="w-4 h-4 rounded-full border-2 border-current" />
                <span>Hoàn thành</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <div className="max-w-2xl mx-auto">
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Thông tin dự án
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Tên dự án *</Label>
                  <Input
                    id="name"
                    value={projectData.name}
                    onChange={(e) => setProjectData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Nhập tên dự án của bạn"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Mô tả dự án *</Label>
                  <Textarea
                    id="description"
                    value={projectData.description}
                    onChange={(e) => setProjectData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Mô tả chi tiết về dự án, mục tiêu và nội dung chính"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Danh mục *</Label>
                  <Select
                    value={projectData.category}
                    onValueChange={(value) => setProjectData((prev) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn danh mục dự án" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="product">Sản phẩm</SelectItem>
                      <SelectItem value="technology">Công nghệ</SelectItem>
                      <SelectItem value="business">Kinh doanh</SelectItem>
                      <SelectItem value="education">Giáo dục</SelectItem>
                      <SelectItem value="other">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Upload video dự án
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Upload các video thuyết minh, demo hoặc giới thiệu về dự án của bạn
                </p>
              </CardHeader>
              <CardContent>
                <FileUploadZone
                  onFilesChange={handleVideoUpload}
                  acceptedTypes={{
                    "video/*": [".mp4", ".avi", ".mov", ".wmv", ".mkv"],
                  }}
                  maxSize={1000 * 1024 * 1024} // 500MB
                  multiple={true}
                />
                {projectData.videos.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Đã chọn {projectData.videos.length} video</p>
                    <div className="text-xs text-muted-foreground">
                      Các video này sẽ được sử dụng để training mô hình AI hiểu về nội dung dự án
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Upload tài liệu dự án
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Upload các tài liệu, báo cáo, kế hoạch liên quan đến dự án
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <FileUploadZone
                  onFilesChange={handleDocumentUpload}
                  acceptedTypes={{
                    "application/pdf": [".pdf"],
                    "application/msword": [".doc"],
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
                    "text/plain": [".txt"],
                    "application/vnd.ms-powerpoint": [".ppt"],
                    "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
                  }}
                  maxSize={1000 * 1024 * 1024} // 50MB
                  multiple={true}
                />

                <div className="space-y-2">
                  <Label htmlFor="additional">Nội dung bổ sung (tùy chọn)</Label>
                  <Textarea
                    id="additional"
                    value={projectData.additionalContent}
                    onChange={(e) => setProjectData((prev) => ({ ...prev, additionalContent: e.target.value }))}
                    placeholder="Thêm bất kỳ thông tin nào khác về dự án mà bạn muốn AI hiểu..."
                    rows={4}
                  />
                </div>

                {projectData.documents.length > 0 && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Đã chọn {projectData.documents.length} tài liệu</p>
                    <div className="text-xs text-muted-foreground">
                      Các tài liệu này sẽ được phân tích để tạo ra kiến thức cho mô hình AI
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Xác nhận và tạo dự án
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Thông tin dự án</h4>
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="font-medium">Tên:</span> {projectData.name}
                      </p>
                      <p>
                        <span className="font-medium">Danh mục:</span> {projectData.category}
                      </p>
                      <p>
                        <span className="font-medium">Mô tả:</span> {projectData.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Video className="h-4 w-4 text-red-500" />
                        <span className="font-medium">Video</span>
                      </div>
                      <p className="text-2xl font-bold">{projectData.videos.length}</p>
                      <p className="text-xs text-muted-foreground">file video</p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">Tài liệu</span>
                      </div>
                      <p className="text-2xl font-bold">{projectData.documents.length}</p>
                      <p className="text-xs text-muted-foreground">tài liệu</p>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900">Quá trình tiếp theo</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Sau khi tạo dự án, hệ thống sẽ tự động bắt đầu quá trình training mô hình AI. Quá trình này có
                          thể mất từ 30 phút đến vài giờ tùy thuộc vào lượng dữ liệu.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 1} className="bg-transparent">
              Quay lại
            </Button>

            {currentStep < totalSteps ? (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Tiếp tục
              </Button>
            ) : (
              <Button onClick={handleCreateProject} disabled={isCreating} className="gap-2">
                {isCreating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4" />
                    Tạo dự án & Bắt đầu Training
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
