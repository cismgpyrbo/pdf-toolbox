
import { Card, CardContent } from "@/components/ui"

interface StatsDisplayProps {
  totalPages: number
  selectedPages: number
  totalFiles: number
}

export function StatsDisplay({ totalPages, selectedPages, totalFiles }: StatsDisplayProps) {
  return (
    <div className="flex justify-center gap-6 mb-8 flex-wrap">
      <Card className="bg-white border-gray-200 text-black">
        <CardContent className="p-4 text-center">
          <div className="text-3xl font-bold">{totalPages}</div>
          <div className="text-sm opacity-70">總頁數</div>
        </CardContent>
      </Card>

      <Card className="bg-white border-gray-200 text-black">
        <CardContent className="p-4 text-center">
          <div className="text-3xl font-bold">{selectedPages}</div>
          <div className="text-sm opacity-70">已選頁數</div>
        </CardContent>
      </Card>

      <Card className="bg-white border-gray-200 text-black">
        <CardContent className="p-4 text-center">
          <div className="text-3xl font-bold">{totalFiles}</div>
          <div className="text-sm opacity-70">檔案數量</div>
        </CardContent>
      </Card>
    </div>
  )
}
