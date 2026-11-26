
import { Card, Badge } from "@/components/ui"
import { AlertCircle, Plus, Minus } from "lucide-react"

interface DifferencePanelProps {
  differences: Array<{ type: "added" | "removed"; value: string }>
  pageNumber: number
  text1: string
  text2: string
}

export function DifferencePanel({ differences, pageNumber, text1, text2 }: DifferencePanelProps) {
  if (differences.length === 0) {
    return (
      <div className="mt-6 rounded-lg border border-border bg-muted/30 p-8 text-center">
        <AlertCircle className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">此頁面沒有發現差異</p>
        <p className="text-xs text-muted-foreground">兩份文件在第 {pageNumber} 頁的內容相同</p>
      </div>
    )
  }

  const addedCount = differences.filter((d) => d.type === "added").length
  const removedCount = differences.filter((d) => d.type === "removed").length

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">差異詳情 - 第 {pageNumber} 頁</h4>
        <div className="flex gap-2">
          <Badge
            variant="outline"
            className="gap-1 border-green-500/50 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
          >
            <Plus className="h-3 w-3" />
            {addedCount} 新增
          </Badge>
          <Badge
            variant="outline"
            className="gap-1 border-red-500/50 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
          >
            <Minus className="h-3 w-3" />
            {removedCount} 刪除
          </Badge>
        </div>
      </div>

      <Card className="border-border bg-muted/30">
        <div className="h-[300px] overflow-y-auto p-4">
          <div className="space-y-3">
            {differences.map((change, index) => (
              <div
                key={index}
                className={`rounded-lg border p-3 ${
                  change.type === "added"
                    ? "border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-950/20"
                    : "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20"
                }`}
              >
                <div className="mb-2 flex items-center gap-2">
                  {change.type === "added" ? (
                    <Plus className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <Minus className="h-4 w-4 text-red-600 dark:text-red-400" />
                  )}
                  <span
                    className={`text-xs font-semibold ${
                      change.type === "added" ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
                    }`}
                  >
                    {change.type === "added" ? "新增內容" : "刪除內容"}
                  </span>
                </div>
                <p
                  className={`text-sm leading-relaxed ${
                    change.type === "added" ? "text-green-900 dark:text-green-100" : "text-red-900 dark:text-red-100"
                  }`}
                >
                  {change.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
