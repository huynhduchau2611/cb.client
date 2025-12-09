import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings } from "lucide-react"

export function SettingsSection() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Cài Đặt Hệ Thống</h1>
        <p className="text-gray-600">Quản lý cấu hình hệ thống</p>
      </div>

      <Card>
        <CardContent className="py-12 text-center">
          <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Tính năng cài đặt đang được phát triển</p>
        </CardContent>
      </Card>
    </div>
  )
}
