"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import FileUploadZone from "./file-upload-zone"

interface UploadProjectModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function UploadProjectModal({ isOpen, onClose }: UploadProjectModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "",
    files: [] as File[],
  })
  const [isUploading, setIsUploading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUploading(true)

    try {
      // TODO: Replace with actual API call
      console.log("Creating project:", formData)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Reset form and close modal
      setFormData({ name: "", description: "", type: "", files: [] })
      onClose()
    } catch (error) {
      console.error("Error creating project:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFilesChange = (files: File[]) => {
    setFormData((prev) => ({ ...prev, files }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>Upload files and create a new project to organize your content.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter project name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Project Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="presentation">Presentation</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Enter project description (optional)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Files</Label>
            <FileUploadZone
              onFilesChange={handleFilesChange}
              acceptedTypes={{
                "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
                "video/*": [".mp4", ".avi", ".mov", ".wmv"],
                "application/pdf": [".pdf"],
                "application/vnd.ms-powerpoint": [".ppt"],
                "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
                "application/msword": [".doc"],
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
              }}
              maxSize={1000 * 1024 * 1024} // 100MB
              multiple={true}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading || !formData.name || !formData.type}>
              {isUploading ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
