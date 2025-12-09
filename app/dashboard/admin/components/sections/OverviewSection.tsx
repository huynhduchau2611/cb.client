import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Briefcase, Building2, FileText } from "lucide-react"
import { AdminSection } from "../types"
import { AdminJobsAPI } from "@/lib/api/admin"
import { useState, useEffect } from "react"

interface OverviewSectionProps {
  setActiveSection: (section: AdminSection) => void
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
  }
}

export function OverviewSection({ setActiveSection, pagination }: OverviewSectionProps) {
  const [stats, setStats] = useState([
    {
      title: "Tổng người dùng",
      value: "0",
      icon: Users,
      change: "Đang tải...",
      action: () => setActiveSection("users"),
    },
    {
      title: "Tin tuyển dụng",
      value: "0",
      icon: Briefcase,
      change: "Đang tải...",
      action: () => setActiveSection("jobs"),
    },
    {
      title: "Đối tác mới",
      value: "0",
      icon: Building2,
      change: "Đang tải...",
      action: () => setActiveSection("partners"),
    },
    {
      title: "Blogs",
      value: "0",
      icon: FileText,
      change: "Đang tải...",
      action: () => setActiveSection("blogs"),
    },
  ])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const response = await AdminJobsAPI.getOverviewStats()
        const data = response.data

        setStats([
          {
            title: "Tổng người dùng",
            value: data.totalUsers.toString(),
            icon: Users,
            change: `${data.usersByRole.candidate} ứng viên, ${data.usersByRole.employer} nhà tuyển dụng`,
            action: () => setActiveSection("users"),
          },
          {
            title: "Tin tuyển dụng",
            value: data.totalJobs.toString(),
            icon: Briefcase,
            change: `${data.totalJobs} tin đã duyệt`,
            action: () => setActiveSection("jobs"),
          },
          {
            title: "Đối tác mới",
            value: data.pendingPartners.toString(),
            icon: Building2,
            change: `${data.pendingPartners} yêu cầu chờ xử lý`,
            action: () => setActiveSection("partners"),
          },
          {
            title: "Blogs",
            value: data.totalBlogs.toString(),
            icon: FileText,
            change: `${data.totalBlogs} bài viết đã duyệt`,
            action: () => setActiveSection("blogs"),
          },
        ])
      } catch (error: any) {
        console.error('Error fetching overview stats:', error)
        setStats([
          {
            title: "Tổng người dùng",
            value: "0",
            icon: Users,
            change: "Lỗi tải dữ liệu",
            action: () => setActiveSection("users"),
          },
          {
            title: "Tin tuyển dụng",
            value: "0",
            icon: Briefcase,
            change: "Lỗi tải dữ liệu",
            action: () => setActiveSection("jobs"),
          },
          {
            title: "Đối tác mới",
            value: pagination.totalItems.toString(),
            icon: Building2,
            change: `${pagination.totalItems} yêu cầu chờ xử lý`,
            action: () => setActiveSection("partners"),
          },
          {
            title: "Blogs",
            value: "0",
            icon: FileText,
            change: "Lỗi tải dữ liệu",
            action: () => setActiveSection("blogs"),
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [setActiveSection, pagination.totalItems])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tổng quan</h1>
        <p className="text-gray-600">Thống kê và phân tích hệ thống</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-2 text-xs"
                onClick={stat.action}
              >
                Xem chi tiết
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
