"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { mockApplications, mockJobs } from "@/lib/mock-data"
import { useAuth } from "@/lib/auth-context"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, Clock, XCircle, Eye, Briefcase, Calendar } from "lucide-react"
import { ProtectedRoute } from "@/components/ProtectedRoute"

export default function ApplicationsPage() {
  return (
    <ProtectedRoute allowedRoles={["candidate", "employer", "admin"]}>
      <ApplicationsPageContent />
    </ProtectedRoute>
  )
}

function ApplicationsPageContent() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 5000)
    }
  }, [searchParams])

  if (!user || user.role !== "candidate") {
    router.push("/auth/login")
    return null
  }

  const userApplications = mockApplications.filter((app) => app.userId === user.id)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="w-3 h-3" />
            Đang chờ
          </Badge>
        )
      case "reviewed":
        return (
          <Badge variant="secondary" className="gap-1 bg-blue-500/10 text-blue-700 dark:text-blue-400">
            <Eye className="w-3 h-3" />
            Đã xem
          </Badge>
        )
      case "accepted":
        return (
          <Badge variant="secondary" className="gap-1 bg-green-500/10 text-green-700 dark:text-green-400">
            <CheckCircle2 className="w-3 h-3" />
            Chấp nhận
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="secondary" className="gap-1 bg-red-500/10 text-red-700 dark:text-red-400">
            <XCircle className="w-3 h-3" />
            Từ chối
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-5xl">
        {showSuccess && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2 text-green-700 dark:text-green-400">
            <CheckCircle2 className="w-5 h-5" />
            <p>Đơn ứng tuyển của bạn đã được gửi thành công!</p>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Đơn Ứng Tuyển Của Tôi</h1>
          <p className="text-muted-foreground">Theo dõi trạng thái các đơn ứng tuyển của bạn</p>
        </div>

        {userApplications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Briefcase className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium mb-1">Chưa có đơn ứng tuyển nào</p>
                <p className="text-sm text-muted-foreground">Bắt đầu tìm kiếm và ứng tuyển công việc phù hợp với bạn</p>
              </div>
              <Button asChild>
                <Link href="/jobs">Tìm Việc Làm</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {userApplications.map((application) => {
              const job = mockJobs.find((j) => j.id === application.jobId)
              if (!job) return null

              return (
                <Card key={application.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <CardTitle className="text-xl">
                          <Link href={`/jobs/${job.id}`} className="hover:text-primary transition-colors">
                            {job.title}
                          </Link>
                        </CardTitle>
                        <CardDescription className="text-base">{job.company}</CardDescription>
                      </div>
                      {getStatusBadge(application.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Ứng tuyển: {new Date(application.appliedDate).toLocaleDateString("vi-VN")}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          <span>{application.cvUrl ? "Nộp CV" : "Điền form"}</span>
                        </div>
                      </div>

                      {application.formData && (
                        <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                          <p>
                            <strong>Số điện thoại:</strong> {application.formData.phone}
                          </p>
                          <p>
                            <strong>Kỹ năng:</strong> {application.formData.skills}
                          </p>
                          <p>
                            <strong>Thời gian có thể làm việc:</strong> {application.formData.availability}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/jobs/${job.id}`}>Xem Công Việc</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
