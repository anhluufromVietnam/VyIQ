"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Brain, Clock, Database, TrendingUp, Play, Settings, Trash2 } from "lucide-react"

interface Model {
  id: string
  name: string
  projectId: string
  status: string
  accuracy: number
  trainingTime: string
  dataPoints: number
  lastUpdated: string
}

interface ModelCardProps {
  model: Model
}

export default function ModelCard({ model }: ModelCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "training":
        return "bg-blue-500"
      case "inactive":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const handleAction = (action: string) => {
    switch (action) {
      case "test":
        window.open(`/model/${model.id}/test`, "_blank")
        break
      case "settings":
        window.open(`/model/${model.id}/settings`, "_blank")
        break
      case "delete":
        console.log("Deleting model:", model.id)
        break
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{model.name}</CardTitle>
          </div>
          <Badge variant={model.status === "active" ? "default" : "secondary"} className="gap-1">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(model.status)}`} />
            {model.status === "active"
              ? "Hoạt động"
              : model.status === "training"
                ? "Đang training"
                : "Không hoạt động"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Model Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>Độ chính xác</span>
            </div>
            {model.status === "active" ? (
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{model.accuracy}%</span>
                </div>
                <Progress value={model.accuracy} className="h-2" />
              </div>
            ) : (
              <p className="text-sm font-medium">Đang training...</p>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Thời gian training</span>
            </div>
            <p className="text-sm font-medium">{model.trainingTime}</p>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <Database className="h-4 w-4" />
            <span>Dữ liệu training</span>
          </div>
          <p className="text-sm font-medium">{model.dataPoints.toLocaleString()} điểm dữ liệu</p>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction("test")}
            disabled={model.status !== "active"}
            className="flex-1 gap-2 bg-transparent"
          >
            <Play className="h-4 w-4" />
            Test mô hình
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleAction("settings")} className="gap-2 bg-transparent">
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction("delete")}
            className="gap-2 bg-transparent text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-xs text-muted-foreground pt-2 border-t">Cập nhật lần cuối: {model.lastUpdated}</div>
      </CardContent>
    </Card>
  )
}
