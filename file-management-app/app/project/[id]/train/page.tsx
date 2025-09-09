"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Brain,
  Play,
  Pause,
  Square,
  Settings,
  TrendingUp,
  Clock,
  Database,
  Cpu,
  Activity,
} from "lucide-react"
import Link from "next/link"

// Mock training data
const mockTrainingData = {
  projectId: "1",
  projectName: "Dự án Marketing Q4 2024",
  status: "training", // training, completed, paused, error
  progress: 67,
  currentEpoch: 15,
  totalEpochs: 25,
  accuracy: 0.89,
  loss: 0.23,
  learningRate: 0.001,
  estimatedTimeRemaining: "45 phút",
  startTime: "14:30",
  dataPoints: 1250,
  batchSize: 32,
  modelSize: "2.3 GB",
}

export default function TrainingPage({ params }: { params: { id: string } }) {
  const [trainingData, setTrainingData] = useState(mockTrainingData)
  const [isTraining, setIsTraining] = useState(true)
  const [logs, setLogs] = useState<string[]>([
    "[14:30:15] Bắt đầu quá trình training...",
    "[14:30:20] Đang tải dữ liệu video và tài liệu...",
    "[14:32:45] Hoàn thành preprocessing dữ liệu",
    "[14:33:10] Khởi tạo mô hình neural network",
    "[14:33:15] Bắt đầu training epoch 1/25",
    "[14:45:30] Epoch 5/25 - Loss: 0.45, Accuracy: 0.72",
    "[14:58:12] Epoch 10/25 - Loss: 0.31, Accuracy: 0.84",
    "[15:12:45] Epoch 15/25 - Loss: 0.23, Accuracy: 0.89",
    "[15:15:20] Đang tiếp tục training...",
  ])

  // Simulate real-time updates
  useEffect(() => {
    if (isTraining) {
      const interval = setInterval(() => {
        setTrainingData((prev) => ({
          ...prev,
          progress: Math.min(prev.progress + Math.random() * 2, 100),
          accuracy: Math.min(prev.accuracy + Math.random() * 0.01, 0.95),
          loss: Math.max(prev.loss - Math.random() * 0.01, 0.1),
        }))

        // Add new log occasionally
        if (Math.random() < 0.3) {
          const newLog = `[${new Date().toLocaleTimeString()}] Training update - Loss: ${trainingData.loss.toFixed(3)}, Accuracy: ${trainingData.accuracy.toFixed(3)}`
          setLogs((prev) => [...prev.slice(-8), newLog])
        }
      }, 3000)

      return () => clearInterval(interval)
    }
  }, [isTraining, trainingData.loss, trainingData.accuracy])

  const handlePauseResume = () => {
    setIsTraining(!isTraining)
    const action = isTraining ? "Tạm dừng" : "Tiếp tục"
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${action} quá trình training`])
  }

  const handleStop = () => {
    setIsTraining(false)
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Dừng quá trình training`])
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "training":
        return "bg-blue-500"
      case "completed":
        return "bg-green-500"
      case "paused":
        return "bg-yellow-500"
      case "error":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "training":
        return "Đang training"
      case "completed":
        return "Hoàn thành"
      case "paused":
        return "Tạm dừng"
      case "error":
        return "Lỗi"
      default:
        return "Không xác định"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href={`/project/${params.id}`}>
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Quay lại dự án
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Training AI Model</h1>
                <p className="text-sm text-muted-foreground">{trainingData.projectName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="gap-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(trainingData.status)}`} />
                {getStatusText(trainingData.status)}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Training Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Training Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Tiến độ Training
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Tổng tiến độ</span>
                    <span>{trainingData.progress.toFixed(1)}%</span>
                  </div>
                  <Progress value={trainingData.progress} className="h-3" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Epoch hiện tại</span>
                    <span>
                      {trainingData.currentEpoch} / {trainingData.totalEpochs}
                    </span>
                  </div>
                  <Progress value={(trainingData.currentEpoch / trainingData.totalEpochs) * 100} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-500" />
                    <p className="text-2xl font-bold">{(trainingData.accuracy * 100).toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">Độ chính xác</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <Activity className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                    <p className="text-2xl font-bold">{trainingData.loss.toFixed(3)}</p>
                    <p className="text-sm text-muted-foreground">Loss</p>
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center space-x-2 pt-4">
                  <Button onClick={handlePauseResume} variant="outline" className="gap-2 bg-transparent">
                    {isTraining ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {isTraining ? "Tạm dừng" : "Tiếp tục"}
                  </Button>
                  <Button onClick={handleStop} variant="outline" className="gap-2 bg-transparent">
                    <Square className="h-4 w-4" />
                    Dừng
                  </Button>
                  <Button variant="outline" className="gap-2 bg-transparent">
                    <Settings className="h-4 w-4" />
                    Cài đặt
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Training Logs */}
            <Card>
              <CardHeader>
                <CardTitle>Training Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
                  {logs.map((log, index) => (
                    <div key={index} className="mb-1">
                      {log}
                    </div>
                  ))}
                  {isTraining && (
                    <div className="flex items-center">
                      <span className="animate-pulse">▋</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Training Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Thông số Training</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Thời gian còn lại</span>
                  </div>
                  <span className="text-sm font-medium">{trainingData.estimatedTimeRemaining}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Dữ liệu</span>
                  </div>
                  <span className="text-sm font-medium">{trainingData.dataPoints.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Cpu className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Batch Size</span>
                  </div>
                  <span className="text-sm font-medium">{trainingData.batchSize}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Brain className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">Kích thước mô hình</span>
                  </div>
                  <span className="text-sm font-medium">{trainingData.modelSize}</span>
                </div>
              </CardContent>
            </Card>

            {/* Training Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Cấu hình</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Learning Rate:</span>
                  <span className="font-mono">{trainingData.learningRate}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Optimizer:</span>
                  <span>AdamW</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Scheduler:</span>
                  <span>CosineAnnealingLR</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Model Type:</span>
                  <span>Transformer</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Hành động</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                  <TrendingUp className="h-4 w-4" />
                  Xem biểu đồ chi tiết
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                  <Settings className="h-4 w-4" />
                  Điều chỉnh tham số
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                  <Database className="h-4 w-4" />
                  Xuất dữ liệu training
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
