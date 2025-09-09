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

interface Project {
  id: string
  name: string
  description: string
  type: string
  fileCount: number
  size: string
  lastModified: string
  thumbnail: string
  status: string
}

interface EditProjectModalProps {
  project: Project
  isOpen: boolean
  onClose: () => void
}

export default function EditProjectModal({ project, isOpen, onClose }: EditProjectModalProps) {
  const [formData, setFormData] = useState({
    name: project.name,
    description: project.description,
    type: project.type,
    status: project.status,
    files: [] as File[],
  })
  const [isUpdating, setIsUpdating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)

    try {
      // TODO: Replace with actual API call
      console.log("Updating project:", project.id, formData)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      onClose()
    } catch (error) {
      console.error("Error updating project:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleFilesChange = (files: File[]) => {
    setFormData((prev) => ({ ...prev, files }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>Update project details and replace files as needed.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Project Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter project name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-type">Project Type *</Label>
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
            <Label htmlFor="edit-status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Enter project description (optional)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Replace Files (Optional)</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Current: {project.fileCount} files ({project.size})
            </p>
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
              maxSize={100 * 1024 * 1024} // 100MB
              multiple={true}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isUpdating}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
