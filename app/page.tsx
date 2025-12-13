"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Briefcase,
  Users,
  TrendingUp,
  ArrowRight,
  Building2,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useFeaturedJobs, useJobStats, useFeaturedCompanies } from "@/hooks/useJobs"
import { formatSalary, formatWorkType } from "@/lib/api/jobs"
import { normalizeAvatarUrl } from "@/lib/utils/avatar"
import { useState, useEffect } from "react"
import { JobSearchBar } from "@/components/search/JobSearchBar"
import { Skeleton } from "@/components/ui/skeleton"

export default function HomePage() {
  const router = useRouter()
  const [currentCompanySlide, setCurrentCompanySlide] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLocation, setSelectedLocation] = useState("")

  // Fetch data from API
  const { jobs: featuredJobs, loading: featuredLoading } = useFeaturedJobs({ limit: 6 })
  const { stats: jobStats, loading: statsLoading } = useJobStats()
  const { companies: featuredCompanies, loading: companiesLoading } = useFeaturedCompanies({ limit: 6 })

  const handleSearch = (query: string) => {
    console.log('🏠 Homepage handleSearch called:', query)
    setSearchQuery(query)
    // When user presses Enter or clicks search in SearchBar, trigger navigation
    const trimmedQuery = query.trim()
    if (trimmedQuery) {
      const params = new URLSearchParams()
      params.set('search', trimmedQuery)
      if (selectedLocation) params.set('location', selectedLocation)
      console.log('🏠 Homepage search from SearchBar:', { searchQuery: trimmedQuery, selectedLocation, params: params.toString() })
      router.push(`/jobs?${params.toString()}`)
    }
  }

  const handleSearchClick = () => {
    const trimmedQuery = searchQuery.trim()
    console.log('🏠 Homepage search button click:', { searchQuery: trimmedQuery, selectedLocation, stateSearchQuery: searchQuery })
    
    if (!trimmedQuery && !selectedLocation) {
      // No search criteria, don't navigate
      console.log('⚠️ No search criteria, skipping navigation')
      return
    }
    
    const params = new URLSearchParams()
    if (trimmedQuery) params.set('search', trimmedQuery)
    if (selectedLocation) params.set('location', selectedLocation)
    console.log('🏠 Homepage navigating to:', `/jobs?${params.toString()}`)
    router.push(`/jobs?${params.toString()}`)
  }



  const nextCompanySlide = () => {
    if (featuredCompanies.length > 0) {
      setCurrentCompanySlide((prev) => (prev + 1) % Math.ceil(featuredCompanies.length / 3))
    }
  }

  const prevCompanySlide = () => {
    if (featuredCompanies.length > 0) {
      setCurrentCompanySlide((prev) => (prev - 1 + Math.ceil(featuredCompanies.length / 3)) % Math.ceil(featuredCompanies.length / 3))
    }
  }

  return (
    <div className="min-h-screen">
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center space-y-8">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-balance text-white">
              Tìm Việc Làm <br />
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Mơ Ước
              </span>{" "}
              Của Bạn
            </h1>
            <p className="text-lg md:text-xl text-blue-100 text-pretty max-w-2xl mx-auto">
              Kết nối với hàng nghìn cơ hội việc làm từ các công ty uy tín. Đơn giản, nhanh chóng và hoàn toàn miễn phí.
            </p>

            {/* Search Bar */}
            <JobSearchBar
              searchQuery={searchQuery}
              selectedLocation={selectedLocation}
              onSearchQueryChange={(query) => {
                console.log('🏠 Homepage SearchBar onChange:', query)
                setSearchQuery(query)
              }}
              onLocationChange={(location) => {
                setSelectedLocation(location)
              }}
              onSearch={handleSearchClick}
            />

          </div>
        </div>
      </section>

      <section className="py-12 px-4 bg-white border-b">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {statsLoading || !jobStats ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="text-center space-y-2">
                  <Skeleton className="w-12 h-12 rounded-xl mx-auto mb-3" />
                  <Skeleton className="h-10 w-24 mx-auto" />
                  <Skeleton className="h-5 w-20 mx-auto" />
                </div>
              ))
            ) : (
              [
                { 
                  number: jobStats.totalJobs ? (jobStats.totalJobs >= 1000 ? `${(jobStats.totalJobs / 1000).toFixed(1)}K+` : jobStats.totalJobs.toLocaleString('vi-VN')) : "0", 
                  label: "Việc làm", 
                  icon: Briefcase 
                },
                { 
                  number: jobStats.totalCompanies ? (jobStats.totalCompanies >= 1000 ? `${(jobStats.totalCompanies / 1000).toFixed(1)}K+` : jobStats.totalCompanies.toLocaleString('vi-VN')) : "0", 
                  label: "Công ty", 
                  icon: Building2 
                },
                { 
                  number: jobStats.totalCandidates ? (jobStats.totalCandidates >= 1000 ? `${(jobStats.totalCandidates / 1000).toFixed(0)}K+` : jobStats.totalCandidates.toLocaleString('vi-VN')) : "0", 
                  label: "Ứng viên", 
                  icon: Users 
                },
                { 
                  number: jobStats.averageSalary ? `${Math.round(jobStats.averageSalary / 1000000)}M+` : "0", 
                  label: "Lương trung bình (VNĐ)", 
                  icon: TrendingUp 
                },
              ].map((stat, i) => (
                <div key={i} className="text-center space-y-2">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <stat.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-gray-900">{stat.number}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900">Việc Làm Nổi Bật</h2>
              <p className="text-lg text-gray-600">Các cơ hội việc làm hấp dẫn đang chờ bạn</p>
            </div>
            <Button asChild variant="outline" className="hidden md:flex border-blue-600 text-blue-600 bg-transparent">
              <Link href="/jobs">
                Xem Tất Cả
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="border-gray-200 h-full">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="w-14 h-14 bg-gray-200 rounded-xl animate-pulse"></div>
                      <div className="w-20 h-6 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                      <div className="h-5 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : featuredJobs && featuredJobs.length > 0 ? (
              featuredJobs.map((job) => (
                <Card 
                  key={job._id}
                  className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-gray-200 h-full group cursor-pointer"
                  onClick={() => router.push(`/jobs?job_selected=${job._id}`)}
                >
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-start justify-between">
                      {job.company.avatarUrl ? (
                        <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50 flex-shrink-0">
                          <Image
                            src={normalizeAvatarUrl(job.company.avatarUrl) || "/placeholder.svg"}
                            alt={job.company.name || "Company logo"}
                            width={56}
                            height={56}
                            className="object-cover w-full h-full"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder.svg'
                            }}
                          />
                        </div>
                      ) : (
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Building2 className="w-7 h-7 text-white" />
                      </div>
                      )}
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                        {formatWorkType(job.typeWork)}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2 text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {job.title}
                      </h3>
                      {job.company._id ? (
                        <Link 
                          href={`/companies/${job.company._id}`}
                          className="text-sm text-gray-600 font-medium hover:text-primary transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {job.company.name}
                        </Link>
                      ) : (
                        <p className="text-sm text-gray-600 font-medium">{job.company.name}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{job.company.province}, {job.company.district}</span>
                      </div>
                      <div className="text-blue-600 font-bold text-lg">{formatSalary(job.salary)}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {job.techStack?.slice(0, 3).map((tech, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-600">Hiện chưa có việc làm nổi bật nào.</p>
                <Button asChild variant="outline" className="mt-4">
                  <Link href="/jobs">Xem Tất Cả Việc Làm</Link>
                </Button>
              </div>
            )}
          </div>

          <div className="text-center mt-8 md:hidden">
            <Button asChild variant="outline" className="border-blue-600 text-blue-600 bg-transparent">
              <Link href="/jobs">
                Xem Tất Cả Việc Làm
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-gradient-to-br from-blue-50 to-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Công Ty Hàng Đầu</h2>
            <p className="text-lg text-gray-600">Các doanh nghiệp uy tín đang tuyển dụng</p>
          </div>

          <div className="relative">
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentCompanySlide * 100}%)` }}
              >
                {companiesLoading ? (
                  <div className="min-w-full grid md:grid-cols-3 gap-6 px-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Card key={i} className="border-gray-200">
                        <CardContent className="pt-8 text-center space-y-4">
                          <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 animate-pulse"></div>
                          <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto animate-pulse"></div>
                          <div className="h-5 bg-gray-200 rounded w-1/2 mx-auto animate-pulse"></div>
                          <div className="h-9 bg-gray-200 rounded w-full animate-pulse"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : featuredCompanies.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>Chưa có công ty nổi bật</p>
                  </div>
                ) : (
                  Array.from({ length: Math.ceil(featuredCompanies.length / 3) }).map((_, slideIndex) => (
                    <div key={slideIndex} className="min-w-full grid md:grid-cols-3 gap-6 px-2">
                      {featuredCompanies.slice(slideIndex * 3, slideIndex * 3 + 3).map((company) => (
                        <Card
                          key={company._id}
                          className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-gray-200 group"
                        >
                          <CardContent className="pt-8 text-center space-y-4">
                            <div className="relative w-20 h-20 mb-4 flex items-center justify-center mx-auto">
                              {company.avatarUrl ? (
                                <Image
                                  src={normalizeAvatarUrl(company.avatarUrl) || "/placeholder.svg"}
                                  alt={company.name}
                                  width={80}
                                  height={80}
                                  className="object-cover rounded-full"
                                  onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg' }}
                                />
                              ) : (
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                                  <Building2 className="w-10 h-10 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <Link 
                              href={`/companies/${company._id}`}
                              className="font-bold text-lg text-gray-900 hover:text-primary transition-colors block"
                            >
                              {company.name}
                            </Link>
                            <p className="text-blue-600 font-semibold">{company.jobCount || 0} vị trí đang tuyển</p>
                            <Link href={`/companies/${company._id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full border-blue-600 text-blue-600 bg-transparent hover:bg-blue-50"
                              >
                                Xem Việc Làm
                              </Button>
                            </Link>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              onClick={prevCompanySlide}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <button
              onClick={nextCompanySlide}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Cách Thức Hoạt Động</h2>
            <p className="text-lg text-gray-600">Chỉ 3 bước đơn giản để tìm việc làm phù hợp</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Tạo Tài Khoản",
                desc: "Đăng ký miễn phí và tạo hồ sơ của bạn trong vài phút",
                image: "/account-creation.png",
              },
              {
                step: "02",
                title: "Tìm Kiếm Việc Làm",
                desc: "Lọc và tìm kiếm công việc phù hợp với kỹ năng của bạn",
                image: "/person-searching-jobs-on-computer.jpg",
              },
              {
                step: "03",
                title: "Ứng Tuyển Ngay",
                desc: "Nộp CV hoặc điền form đơn giản để ứng tuyển",
                image: "/person-submitting-job-application.jpg",
              },
            ].map((item, i) => (
              <div key={i} className="text-center space-y-4 group">
                <div className="relative h-48 rounded-2xl overflow-hidden mb-4">
                  <Image
                    src={item.image || "/placeholder.svg"}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {item.step}
                  </div>
                </div>
                <h3 className="font-bold text-xl text-gray-900">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="container mx-auto max-w-4xl text-center space-y-8 relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold">Sẵn Sàng Bắt Đầu Hành Trình Mới?</h2>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
            Tham gia cùng hàng nghìn người đã tìm được việc làm mơ ước. Hoàn toàn miễn phí cho người tìm việc!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8">
              <Link href="/jobs">
                Khám Phá Việc Làm
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10 bg-transparent text-lg px-8"
            >
              <Link href="/auth/register">Đăng Ký Ngay</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <Card className="border-0 shadow-xl overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              <div className="relative h-64 md:h-auto">
                <Image src="/professional-business-team-meeting.png" alt="Employer" fill className="object-cover" />
              </div>
              <div className="p-8 md:p-12 flex flex-col justify-center space-y-6">
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 w-fit">Dành cho nhà tuyển dụng</Badge>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Tìm Ứng Viên Tài Năng</h2>
                <p className="text-gray-600 text-lg">
                  Đăng tin tuyển dụng và tiếp cận hàng nghìn ứng viên chất lượng. Gói miễn phí có sẵn!
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
                    <Link href="/auth/register?role=employer">Đăng Ký Ngay</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-blue-600 text-blue-600 bg-transparent">
                    <Link href="/pricing">Xem Gói Dịch Vụ</Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  )
}
