"use client"

import { useState } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FileText,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Save,
  Download,
} from "lucide-react"

interface DocumentFile {
  id: string
  name: string
  type: string
  size: string
  url: string
  content?: string
  editable: boolean
}

interface DocumentEditorProps {
  files: DocumentFile[]
  onContentChange: () => void
  projectId: string // ✅ Add projectId prop
}

export default function DocumentEditor({ files, onContentChange, projectId }: DocumentEditorProps) {
  const [selectedDocument, setSelectedDocument] = useState(files[0])
  const [content, setContent] = useState(selectedDocument?.content || "")
  const [activeTab, setActiveTab] = useState("edit")

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    onContentChange()
  }

  const handleDocumentSelect = (doc: DocumentFile) => {
    setSelectedDocument(doc)
    setContent(doc.content || "")
  }

  const formatText = (format: string) => {
    console.log("Formatting text:", format)
    onContentChange()
  }

  const saveDocument = async () => {
    try {
      await axios.post(`http://127.0.0.1:8000/projects/${projectId}/save_doc`, {
        content,
      })
    const link = document.createElement("a")
    link.href = selectedDocument.url
    link.download = selectedDocument.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
      console.log("Document saved.")
      onContentChange()
    } catch (err) {
      console.error("Failed to save document:", err)
    }
  }

  const exportDocument = () => {
    const link = document.createElement("a")
    link.href = selectedDocument.url
    link.download = selectedDocument.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Document Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Document to Edit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file) => (
              <Card
                key={file.id}
                className={`cursor-pointer transition-colors ${
                  selectedDocument.id === file.id ? "ring-2 ring-primary" : "hover:bg-muted/50"
                }`}
                onClick={() => handleDocumentSelect(file)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{file.name}</h4>
                      <p className="text-sm text-muted-foreground">{file.size}</p>
                    </div>
                  </div>
                  {file.editable && <Badge variant="secondary">Editable</Badge>}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Document Editor */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Editing: {selectedDocument.name}</CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={saveDocument} className="gap-2 bg-transparent">
                <Save className="h-4 w-4" />
                Save
              </Button>
              <Button variant="outline" onClick={exportDocument} className="gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="space-y-4">
              {/* Formatting Toolbar */}
              <div className="flex items-center space-x-1 p-2 border rounded-lg bg-muted/50">
                <Button variant="ghost" size="sm" onClick={() => formatText("bold")}>
                  <Bold className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => formatText("italic")}>
                  <Italic className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => formatText("underline")}>
                  <Underline className="h-4 w-4" />
                </Button>

                <div className="w-px h-6 bg-border mx-2" />

                <Button variant="ghost" size="sm" onClick={() => formatText("bullet-list")}>
                  <List className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => formatText("numbered-list")}>
                  <ListOrdered className="h-4 w-4" />
                </Button>

                <div className="w-px h-6 bg-border mx-2" />

                <Button variant="ghost" size="sm" onClick={() => formatText("align-left")}>
                  <AlignLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => formatText("align-center")}>
                  <AlignCenter className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => formatText("align-right")}>
                  <AlignRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Text Editor */}
              <Textarea
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Start typing your document content..."
                className="min-h-[400px] font-mono text-sm"
              />

              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Characters: {content.length}</span>
                <span>Words: {content.split(/\s+/).filter((word) => word.length > 0).length}</span>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: content
                        .replace(/\n\n/g, "</p><p>")
                        .replace(/\n/g, "<br>")
                        .replace(/^/, "<p>")
                        .replace(/$/, "</p>")
                        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                        .replace(/\*(.*?)\*/g, "<em>$1</em>"),
                    }}
                  />
                  {!content && <p className="text-muted-foreground italic">No content to preview</p>}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
