"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { HardDrive, Trash2, RefreshCw } from "lucide-react"

export default function StorageInfo() {
  // Mock data - replace with API calls
  const storageData = {
    used: 2.4, // GB
    total: 10, // GB
    files: 156,
    projects: 12,
  }

  const usagePercentage = (storageData.used / storageData.total) * 100

  const handleClearCache = () => {
    // TODO: Implement cache clearing
    console.log("Clearing cache...")
  }

  const handleRefreshStorage = () => {
    // TODO: Implement storage refresh
    console.log("Refreshing storage info...")
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          Storage Usage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Used</span>
            <span>
              {storageData.used} GB of {storageData.total} GB
            </span>
          </div>
          <Progress value={usagePercentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{usagePercentage.toFixed(1)}% used</span>
            <span>{(storageData.total - storageData.used).toFixed(1)} GB free</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="text-center">
            <div className="text-2xl font-bold">{storageData.projects}</div>
            <div className="text-xs text-muted-foreground">Projects</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{storageData.files}</div>
            <div className="text-xs text-muted-foreground">Files</div>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <Button variant="outline" size="sm" className="w-full gap-2 bg-transparent" onClick={handleClearCache}>
            <Trash2 className="h-4 w-4" />
            Clear Cache
          </Button>
          <Button variant="ghost" size="sm" className="w-full gap-2" onClick={handleRefreshStorage}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {usagePercentage > 80 && (
          <div className="pt-2">
            <Badge variant="destructive" className="w-full justify-center">
              Storage Almost Full
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
