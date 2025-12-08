'use client'

import { use, useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CommentForm, CommentList } from '@/components/comments/CommentList'
import { config } from '@/lib/config'
import { MapPin, Building2, Globe, Phone, Info, MessageSquare } from 'lucide-react'
import { useNotification } from '@/components/ui/notification'
import { formatCompanyType, formatWorkingTime, formatCompanySize } from '@/lib/api/jobs'

interface Company {
  _id: string
  name: string
  avatarUrl?: string
  phone?: string
  taxCode: string
  workingTime: string
  size: string
  typeCompany: string
  province: string
  district: string
  ward: string
  description?: string
  website?: string
  status: string
  user?: {
    _id: string
    fullName: string
    email: string
    avatar?: string
  }
  plan?: {
    _id: string
    name: string
    type: string
  }
}

export default function CompanyProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { showError } = useNotification()
  const [company, setCompany] = useState<Company | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const hasFetchedRef = useRef(false)

  useEffect(() => {
    if (hasFetchedRef.current) return // Prevent multiple fetches
    if (!id) return

    const fetchCompany = async () => {
      hasFetchedRef.current = true
      try {
        const response = await fetch(`${config.api.baseUrl}/public/companies/${id}`)
        if (!response.ok) {
          throw new Error('Company not found')
        }
        const result = await response.json()
        setCompany(result.data.company)
      } catch (error: any) {
        showError('Lỗi', error.message || 'Không thể tải thông tin công ty')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCompany()
  }, [id]) // Only depend on id, not showError

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto max-w-6xl">
          <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white">
            <div className="px-4 py-12">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                <Skeleton className="size-24 md:size-32 rounded-full shrink-0 border-4 border-white" />
                <div className="flex-1 min-w-0 space-y-3">
                  <Skeleton className="h-10 w-64 bg-white/20" />
                  <Skeleton className="h-6 w-96 bg-white/20" />
                  <div className="flex gap-4">
                    <Skeleton className="h-8 w-32 bg-white/20 rounded-full" />
                    <Skeleton className="h-8 w-32 bg-white/20 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="px-4 -mt-6">
            <Card className="shadow-lg">
              <CardContent className="pt-6">
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto max-w-6xl">
          <div className="px-4 py-12">
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <p className="text-muted-foreground">Không tìm thấy công ty</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto max-w-6xl">
        {/* Company Header with Background */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white">
          <div className="px-4 py-12">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <Avatar className="size-24 md:size-32 shrink-0 border-4 border-white shadow-lg">
                <AvatarImage 
                  src={
                    company.avatarUrl
                      ? (company.avatarUrl.startsWith('http://') || company.avatarUrl.startsWith('https://')
                          ? company.avatarUrl
                          : company.avatarUrl.startsWith('/uploads')
                          ? `${config.api.baseUrl.replace('/api', '')}${company.avatarUrl}`
                          : `${config.api.baseUrl}${company.avatarUrl}`)
                      : undefined
                  }
                  alt={company.name} 
                />
                <AvatarFallback className="text-2xl bg-white text-blue-600">
                  <Building2 className="w-8 h-8" />
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <h1 className="text-3xl md:text-4xl font-bold mb-3">{company.name}</h1>
                <div className="flex flex-wrap gap-4 text-sm md:text-base">
                  {company.province && (
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {company.ward && `${company.ward}, `}
                        {company.district && `${company.district}, `}
                        {company.province}
                      </span>
                    </div>
                  )}
                  {company.phone && (
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      <Phone className="h-4 w-4" />
                      <span>{company.phone}</span>
                    </div>
                  )}
                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full hover:bg-white/30 transition-colors"
                    >
                      <Globe className="h-4 w-4" />
                      <span className="truncate max-w-[200px]">{company.website}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="px-4 -mt-6">
          <Card className="shadow-lg">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full justify-start h-auto p-1 bg-muted/50">
                <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-white">
                  <Info className="h-4 w-4" />
                  Tổng quan
                </TabsTrigger>
                <TabsTrigger value="comments" className="flex items-center gap-2 data-[state=active]:bg-white">
                  <MessageSquare className="h-4 w-4" />
                  Bình luận
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Company Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        Thông tin công ty
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                            Quy mô
                          </div>
                          <div className="font-semibold text-lg">{formatCompanySize(company.size)}</div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                            Loại hình
                          </div>
                          <div className="font-semibold text-lg">{formatCompanyType(company.typeCompany)}</div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                            Thời gian làm việc
                          </div>
                          <div className="font-semibold text-lg">{formatWorkingTime(company.workingTime)}</div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                            Mã số thuế
                          </div>
                          <div className="font-semibold text-lg font-mono">{company.taxCode}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Description */}
                  {company.description ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Info className="h-5 w-5 text-blue-600" />
                          Giới thiệu
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                          {company.description}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Info className="h-5 w-5 text-blue-600" />
                          Giới thiệu
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground italic">
                          Công ty chưa cập nhật thông tin giới thiệu
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="comments" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Bình luận</CardTitle>
                    <CardDescription>Chia sẻ đánh giá về công ty này</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <CommentList targetType="company" targetId={company._id} />
                    <CommentForm
                      targetType="company"
                      targetId={company._id}
                      onCommentCreated={() => {
                        // Refresh will be handled by CommentList
                      }}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  )
}

