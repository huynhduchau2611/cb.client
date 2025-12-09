"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useNotification } from "@/lib/notification-context"
import { partnerApi, Company } from "@/lib/api/partner"
import { formatWorkingTime, formatCompanyType, formatCompanySize } from "@/lib/api/jobs"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Building2, CheckCircle, Clock, XCircle, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"

function PartnerStatusPageContent() {
  const router = useRouter()
  const { user, refreshUserToken } = useAuth()
  const { showError, showSuccess } = useNotification()
  const [company, setCompany] = useState<Company | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    loadCompanyStatus()
  }, [])

  const loadCompanyStatus = async () => {
    try {
      const data = await partnerApi.getMyCompany()
      setCompany(data)
    } catch (error: any) {
      if (error.message.includes('Company not found')) {
        // User hasn't submitted request yet
        setCompany(null)
      } else {
        showError("Lỗi", error.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleActivateAccount = async () => {
    setIsRefreshing(true)
    try {
      await refreshUserToken()
      showSuccess(
        "Kích hoạt thành công!",
        "Tài khoản của bạn đã được nâng cấp lên Employer. Đang chuyển đến dashboard..."
      )
      setTimeout(() => {
        router.push("/dashboard/employer")
      }, 1500)
    } catch (error) {
      showError("Lỗi", "Không thể kích hoạt tài khoản. Vui lòng thử lại sau.")
    } finally {
      setIsRefreshing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <Skeleton className="h-10 w-32 mb-6" />
          
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <Skeleton className="w-24 h-24 rounded-full" />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-5 w-3/4" />
                </div>
                <div>
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-5 w-3/4" />
                </div>
                <div>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-5 w-3/4" />
                </div>
                <div>
                  <Skeleton className="h-4 w-28 mb-2" />
                  <Skeleton className="h-5 w-3/4" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-20 w-full" />
              </div>
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="container mx-auto max-w-2xl">
          <Card>
            <CardContent className="py-12 text-center space-y-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <Building2 className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Chưa Có Đăng Ký</h2>
                <p className="text-gray-600">
                  Bạn chưa gửi đăng ký trở thành đối tác. Hãy đăng ký ngay để bắt đầu!
                </p>
              </div>
              <Button
                onClick={() => router.push("/dashboard/partner/apply")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Đăng Ký Ngay
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending":
        return {
          icon: Clock,
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          iconColor: "text-yellow-600",
          title: "Đang Chờ Duyệt",
          description: "Yêu cầu của bạn đang được xem xét bởi admin",
        }
      case "approved":
        return {
          icon: CheckCircle,
          color: "bg-green-100 text-green-800 border-green-200",
          iconColor: "text-green-600",
          title: "Đã Phê Duyệt",
          description: "Chúc mừng! Bạn đã trở thành đối tác của chúng tôi",
        }
      case "rejected":
        return {
          icon: XCircle,
          color: "bg-red-100 text-red-800 border-red-200",
          iconColor: "text-red-600",
          title: "Đã Từ Chối",
          description: "Rất tiếc, yêu cầu của bạn đã bị từ chối",
        }
      default:
        return {
          icon: Clock,
          color: "bg-gray-100 text-gray-800 border-gray-200",
          iconColor: "text-gray-600",
          title: "Đang Xử Lý",
          description: "Yêu cầu của bạn đang được xử lý",
        }
    }
  }

  const statusInfo = getStatusInfo(company.status)
  const StatusIcon = statusInfo.icon

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>

        {/* Status Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Trạng Thái Đăng Ký</CardTitle>
                <CardDescription>
                  Đơn đăng ký trở thành đối tác của bạn
                </CardDescription>
              </div>
              <Badge className={statusInfo.color}>
                <StatusIcon className="w-4 h-4 mr-1" />
                {statusInfo.title}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border ${statusInfo.color}`}>
                <div className="flex items-start gap-3">
                  <StatusIcon className={`w-6 h-6 ${statusInfo.iconColor} flex-shrink-0 mt-0.5`} />
                  <div>
                    <h3 className="font-semibold mb-1">{statusInfo.title}</h3>
                    <p className="text-sm">{statusInfo.description}</p>
                    {company.status === "rejected" && company.rejectionReason && (
                      <div className="mt-3 pt-3 border-t border-red-200">
                        <p className="text-sm font-medium mb-1">Lý do từ chối:</p>
                        <p className="text-sm">{company.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {company.status === "approved" && (
                <>
                  {user?.role === "candidate" ? (
                    <div className="space-y-3">
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800 mb-3">
                          🎉 <strong>Chúc mừng!</strong> Đơn đăng ký của bạn đã được phê duyệt. 
                          Nhấn nút bên dưới để kích hoạt tài khoản Employer và bắt đầu đăng tin tuyển dụng!
                        </p>
                        <Button
                          onClick={handleActivateAccount}
                          disabled={isRefreshing}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          {isRefreshing ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Đang kích hoạt...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Kích Hoạt Tài Khoản Employer
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <Button
                        asChild
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        <Link href="/dashboard/employer">
                          Vào Dashboard
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        className="flex-1"
                      >
                        <Link href="/dashboard/employer/post-job">
                          Đăng Tin Tuyển Dụng
                        </Link>
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Company Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Thông Tin Công Ty</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Company Logo */}
            {company.avatarUrl && (
              <div className="flex justify-center mb-4">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-200">
                  <Image
                    src={company.avatarUrl}
                    alt={company.name}
                    width={96}
                    height={96}
                    className="object-cover w-full h-full"
                  />
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Tên Công Ty</p>
                <p className="font-medium">{company.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Mã Số Thuế</p>
                <p className="font-medium">{company.taxCode}</p>
              </div>
              {company.phone && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Số Điện Thoại</p>
                  <p className="font-medium">{company.phone}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500 mb-1">Lĩnh Vực</p>
                <p className="font-medium">{formatCompanyType(company.typeCompany)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Quy Mô</p>
                <p className="font-medium">{formatCompanySize(company.size)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Thời Gian Làm Việc</p>
                <p className="font-medium">
                  {formatWorkingTime(company.workingTime)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Địa Chỉ</p>
                <p className="font-medium">
                  {company.ward}, {company.district}, {company.province}
                </p>
              </div>
            </div>

            {company.website && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Website</p>
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {company.website}
                </a>
              </div>
            )}

            {company.description && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Giới Thiệu</p>
                <p className="text-gray-700 whitespace-pre-wrap">{company.description}</p>
              </div>
            )}

            <div className="pt-4 border-t">
              <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-500">
                <div>
                  <p>Ngày đăng ký: {new Date(company.createdAt).toLocaleDateString("vi-VN")}</p>
                </div>
                <div>
                  <p>Cập nhật: {new Date(company.updatedAt).toLocaleDateString("vi-VN")}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function PartnerStatusPage() {
  return (
    <ProtectedRoute allowedRoles={["candidate", "employer", "admin"]}>
      <PartnerStatusPageContent />
    </ProtectedRoute>
  )
}

