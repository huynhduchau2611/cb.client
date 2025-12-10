"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Sparkles, Loader2, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { plansApi, Plan } from "@/lib/api/plans"
import { partnerApi, Company } from "@/lib/api/partner"
import { paymentsApi } from "@/lib/api/payments"
import { useNotification } from "@/lib/notification-context"
import { Skeleton } from "@/components/ui/skeleton"

// Helper function to format plan data for display
function formatPlanForDisplay(plan: Plan) {
  // Calculate period from durationInDays
  let period = ""
  if (plan.price === 0) {
    period = "mãi mãi"
  } else if (plan.durationInDays >= 365) {
    const years = Math.floor(plan.durationInDays / 365)
    period = years === 1 ? "năm" : `${years} năm`
  } else if (plan.durationInDays >= 30) {
    const months = Math.floor(plan.durationInDays / 30)
    period = months === 1 ? "tháng" : `${months} tháng`
  } else {
    period = `${plan.durationInDays} ngày`
  }

  // Plan metadata
  const planMetadata: Record<string, { name: string; description: string; popular: boolean; cta: string }> = {
    free: {
      name: plan.name || "Miễn Phí",
      description: "Dùng thử cho nhà tuyển dụng mới",
      popular: false,
      cta: "Bắt Đầu Miễn Phí",
    },
    basic: {
      name: plan.name || "Cơ Bản",
      description: "Phù hợp cho doanh nghiệp nhỏ",
      popular: true,
      cta: "Chọn Gói Cơ Bản",
    },
    expert: {
      name: plan.name || "Chuyên Nghiệp",
      description: "Dành cho doanh nghiệp lớn",
      popular: false,
      cta: "Chọn Gói Chuyên Nghiệp",
    },
  }

  const metadata = planMetadata[plan.type] || {
    name: plan.name,
    description: "",
    popular: false,
    cta: "Chọn Gói",
  }

  // Format price
  const price = plan.price === 0 
    ? "0đ" 
    : `${plan.price.toLocaleString('vi-VN')}đ`

  // Build features list
  const features: string[] = [
    `Đăng ${plan.limit.limitPost} tin tuyển dụng`,
    `Hiển thị trong ${plan.limit.postDuration} ngày${plan.limit.limitPost > 1 ? ' mỗi tin' : ''}`,
    "Nhận đơn ứng tuyển không giới hạn",
  ]

  if (plan.feature.highlightBadge) {
    features.push("Badge 'Đang tuyển' nổi bật")
  }

  if (plan.feature.urgentBadge) {
    features.push("Badge 'Khẩn cấp' ưu tiên")
  }

  if (plan.feature.trainingSupport) {
    features.push("Hỗ trợ đào tạo nhân viên")
  }

  if (plan.price > 0) {
    features.push("Hỗ trợ qua email & điện thoại")
    features.push("Thống kê cơ bản")
  } else {
    features.push("Hỗ trợ qua email")
  }

  // Build limitations list
  const limitations: string[] = []
  if (!plan.feature.highlightBadge) {
    limitations.push("Không ưu tiên hiển thị")
  }
  if (!plan.feature.highlightBadge && !plan.feature.urgentBadge) {
    limitations.push("Không có badge nổi bật")
  }

  return {
    id: plan.type,
    name: metadata.name,
    period,
    description: metadata.description,
    popular: metadata.popular,
    cta: metadata.cta,
    price,
    features,
    limitations,
  }
}

export default function PricingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { showSuccess, showError } = useNotification()
  const [plans, setPlans] = useState<Plan[]>([])
  const [company, setCompany] = useState<Company | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingPlan, setProcessingPlan] = useState<string | null>(null)

  useEffect(() => {
    loadAllData()
    
    // Check for payment return URL params
    const urlParams = new URLSearchParams(window.location.search)
    const paymentStatus = urlParams.get('payment')
    
    if (paymentStatus === 'success') {
      showSuccess('Thanh toán thành công!', 'Gói dịch vụ của bạn đã được nâng cấp.')
      // Reload company data to show updated plan
      if (user?.role === 'employer') {
        loadAllData()
      }
      // Clean URL
      window.history.replaceState({}, '', '/pricing')
    } else if (paymentStatus === 'cancel') {
      showError('Thanh toán đã bị hủy', 'Bạn có thể thử lại bất cứ lúc nào.')
      // Clean URL
      window.history.replaceState({}, '', '/pricing')
    }
  }, [user])

  const loadAllData = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Load plans
      const plansData = await plansApi.getPlanTemplates()
      setPlans(plansData)

      // Load company if user is employer
      if (user?.role === "employer") {
        try {
          const companyData = await partnerApi.getMyCompany()
          setCompany(companyData)
        } catch (err: any) {
          // Company not found is OK - user might not have created company yet
          // Connection errors are also OK - we'll show plans without company info
          if (!err.message?.includes("Company not found") && !err.message?.includes("kết nối")) {
            console.error("Error loading company:", err)
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách gói dịch vụ")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpgradePlan = async (planType: 'basic' | 'expert') => {
    // Check if user is authenticated
    if (!user) {
      showError('Yêu cầu đăng nhập', 'Bạn cần đăng nhập để nâng cấp gói dịch vụ')
      router.push('/auth/login')
      return
    }

    // Check if user is employer
    if (user.role !== 'employer') {
      showError(
        'Yêu cầu tài khoản nhà tuyển dụng', 
        'Chỉ nhà tuyển dụng mới có thể nâng cấp gói dịch vụ. Vui lòng đăng ký trở thành đối tác trước.'
      )
      // Redirect to partner application page
      setTimeout(() => {
        router.push('/dashboard/partner/apply')
      }, 2000)
      return
    }

    setProcessingPlan(planType)
    
    try {
      // Create payment link - this will also create a transaction in the database
      const response = await paymentsApi.createPaymentLink(planType)
      
      if (response.data?.paymentLink) {
        // Transaction has been created in database with status PENDING
        // Open PayOS payment page in new tab
        window.open(response.data.paymentLink, '_blank', 'noopener,noreferrer')
        setProcessingPlan(null) // Reset loading state
        showSuccess('Đang mở trang thanh toán...', 'Vui lòng hoàn tất thanh toán trong tab mới')
      } else {
        throw new Error('Không nhận được link thanh toán')
      }
    } catch (error: any) {
      console.error('Error creating payment link:', error)
      
      // Handle specific error cases
      const errorMessage = error.message || 'Không thể tạo link thanh toán. Vui lòng thử lại.'
      
      // If error is about insufficient permissions, redirect to partner page
      if (errorMessage.includes('nhà tuyển dụng') || errorMessage.includes('Insufficient permissions')) {
        showError(
          'Yêu cầu tài khoản nhà tuyển dụng',
          'Chỉ nhà tuyển dụng mới có thể nâng cấp gói dịch vụ. Vui lòng đăng ký trở thành đối tác trước.'
        )
        setTimeout(() => {
          router.push('/dashboard/partner/apply')
        }, 2000)
      } else {
        showError('Lỗi', errorMessage)
      }
      
      setProcessingPlan(null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header Skeleton */}
          <div className="text-center mb-12">
            <Skeleton className="h-12 w-80 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>

          {/* Banner Skeleton */}
          <Card className="mb-12">
            <CardContent className="py-8">
              <Skeleton className="h-8 w-96 mx-auto mb-4" />
              <Skeleton className="h-4 w-2/3 mx-auto mb-4" />
              <Skeleton className="h-10 w-32 mx-auto" />
            </CardContent>
          </Card>

          {/* Pricing Cards Skeleton */}
          <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-6xl mx-auto">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="relative">
                <Skeleton className="absolute -top-4 left-1/2 -translate-x-1/2 h-6 w-24" />
                <CardHeader>
                  <Skeleton className="h-7 w-24 mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-4" />
                  <div className="flex items-baseline gap-2">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <div key={j} className="flex gap-2">
                        <Skeleton className="w-5 h-5 rounded" />
                        <Skeleton className="h-4 flex-1" />
                      </div>
                    ))}
                  </div>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* FAQ Skeleton */}
          <div className="max-w-3xl mx-auto">
            <Skeleton className="h-8 w-64 mx-auto mb-8" />
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    const isConnectionError = error.includes('kết nối') || error.includes('CONNECTION_REFUSED')
    
    return (
      <div className="min-h-screen py-12 px-4 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Không thể tải gói dịch vụ</h3>
            <p className="text-muted-foreground mb-2">{error}</p>
            {isConnectionError && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-left">
                <p className="font-semibold text-yellow-800 mb-2">💡 Hướng dẫn:</p>
                <ol className="list-decimal list-inside space-y-1 text-yellow-700">
                  <li>Kiểm tra server backend có đang chạy không</li>
                  <li>Chạy lệnh: <code className="bg-yellow-100 px-2 py-1 rounded">cd careerbridge.server && npm run dev</code></li>
                  <li>Đảm bảo server chạy trên port 4000</li>
                </ol>
              </div>
            )}
            <Button onClick={loadAllData} className="mt-4">Thử Lại</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (plans.length === 0 && !isLoading) {
    return (
      <div className="min-h-screen py-12 px-4 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-semibold mb-2">Chưa có gói dịch vụ</h3>
            <p className="text-muted-foreground mb-4">Hiện chưa có gói dịch vụ nào trong hệ thống.</p>
            <Button onClick={loadAllData}>Tải Lại</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get current plan from company
  // Plan can be populated (object with _id and type) or just an ID string
  const currentPlanType = company?.plan?.type || null
  const currentPlanId = company?.plan?._id?.toString() || (typeof company?.plan === 'string' ? company.plan : null)

  const displayPlans = plans.map(plan => {
    const formatted = formatPlanForDisplay(plan)
    // Check if this is the current plan by type or _id
    const isCurrentPlan = currentPlanType === plan.type || currentPlanId === plan._id
    return {
      ...formatted,
      isCurrentPlan,
      _id: plan._id,
      originalPlan: plan, // Keep reference to original plan for debugging
    }
  })

  // Sort plans: Free first, then Basic, then others
  const sortedPlans = [...displayPlans].sort((a, b) => {
    const order: Record<string, number> = { free: 0, basic: 1, expert: 2 }
    return (order[a.id] ?? 99) - (order[b.id] ?? 99)
  })

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Bảng Giá Dịch Vụ</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Chọn gói phù hợp với nhu cầu tuyển dụng của bạn. Miễn phí cho người tìm việc.
          </p>
        </div>

        {/* Free for Job Seekers Banner */}
        <Card className="mb-12 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="py-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Hoàn Toàn Miễn Phí Cho Người Tìm Việc</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Tìm kiếm, ứng tuyển không giới hạn công việc. Không có chi phí ẩn.
            </p>
            <Button asChild size="lg">
              <Link href="/jobs">Tìm Việc Ngay</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Pricing Cards */}
        <div className={`grid gap-6 mb-12 max-w-6xl mx-auto ${
          sortedPlans.length === 1 ? "md:grid-cols-1 max-w-md" :
          sortedPlans.length === 2 ? "md:grid-cols-2" :
          "md:grid-cols-3"
        }`}>
          {sortedPlans.map((plan) => {
            const isCurrent = plan.isCurrentPlan
            const isPopular = plan.popular
            
            return (
              <Card 
                key={plan._id || plan.id} 
                className={`relative transition-all ${
                  isCurrent 
                    ? "border-2 border-green-500 shadow-xl bg-green-50/50" 
                    : isPopular 
                    ? "border-2 border-primary shadow-lg" 
                    : "border"
                }`}
              >
                {/* Current Plan Badge */}
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="px-4 py-1 bg-green-600 text-white flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Đang Sử Dụng
                    </Badge>
                  </div>
                )}
                
                {/* Popular Badge */}
                {!isCurrent && isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="px-4 py-1">Phổ Biến Nhất</Badge>
                  </div>
                )}

                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && <span className="text-muted-foreground">/{plan.period}</span>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className={`w-5 h-5 shrink-0 mt-0.5 ${
                          isCurrent ? "text-green-600" : "text-primary"
                        }`} />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {plan.limitations.length > 0 && (
                    <div className="pt-4 border-t">
                      <p className="text-xs text-muted-foreground mb-2">Hạn chế:</p>
                      <ul className="space-y-1">
                        {plan.limitations.map((limitation, index) => (
                          <li key={index} className="text-xs text-muted-foreground">
                            • {limitation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {isCurrent ? (
                    <Button 
                      className="w-full" 
                      variant="outline" 
                      size="lg"
                      disabled
                    >
                      <span className="cursor-not-allowed">Gói Hiện Tại</span>
                    </Button>
                  ) : processingPlan === plan.id ? (
                    <Button 
                      className="w-full" 
                      variant={isPopular ? "default" : "outline"} 
                      size="lg"
                      disabled
                    >
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang xử lý...
                    </Button>
                  ) : plan.id === "enterprise" ? (
                    <Button 
                      asChild
                      className="w-full" 
                      variant={isPopular ? "default" : "outline"} 
                      size="lg"
                    >
                      <Link href="/contact">{plan.cta}</Link>
                    </Button>
                  ) : plan.id === "free" ? (
                    <Button 
                      className="w-full" 
                      variant={isPopular ? "default" : "outline"} 
                      size="lg"
                    >
                      {plan.cta}
                    </Button>
                  ) : user?.role === "employer" ? (
                    <Button 
                      className="w-full" 
                      variant={isPopular ? "default" : "outline"} 
                      size="lg"
                      onClick={() => handleUpgradePlan(plan.id as 'basic' | 'expert')}
                    >
                      {plan.cta}
                    </Button>
                  ) : (
                    <Button 
                      asChild
                      className="w-full" 
                      variant={isPopular ? "default" : "outline"} 
                      size="lg"
                    >
                      <Link href="/auth/register?role=employer">{plan.cta}</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Câu Hỏi Thường Gặp</h2>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tôi có thể thay đổi gói sau khi đăng ký không?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Có, bạn có thể nâng cấp hoặc hạ cấp gói bất cứ lúc nào. Phí sẽ được tính theo tỷ lệ thời gian sử dụng.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Có phí ẩn nào không?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Không có phí ẩn. Giá niêm yết là giá cuối cùng bạn phải trả. Người tìm việc hoàn toàn miễn phí.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tôi có thể hủy bất cứ lúc nào không?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Có, bạn có thể hủy đăng ký bất cứ lúc nào. Không có cam kết dài hạn hay phí hủy.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Phương thức thanh toán nào được chấp nhận?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Chúng tôi chấp nhận thẻ tín dụng/ghi nợ, chuyển khoản ngân hàng, và ví điện tử (Momo, ZaloPay).
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="py-12">
              <h2 className="text-2xl font-bold mb-4">Bạn cần tư vấn thêm?</h2>
              <p className="text-muted-foreground mb-6">
                Đội ngũ của chúng tôi sẵn sàng hỗ trợ bạn chọn gói phù hợp nhất
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link href="/contact">Liên Hệ Tư Vấn</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/about">Tìm Hiểu Thêm</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
