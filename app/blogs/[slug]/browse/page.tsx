"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatSalary, formatWorkType } from "@/lib/api/jobs"
import { useFeaturedJobs, useJobStats } from "@/hooks/useJobs"
import { Briefcase, TrendingUp, MapPin, Building2 } from "lucide-react"
import Link from "next/link"

export default function BrowsePage() {
  const { jobs: featuredJobs, loading: featuredLoading, error: featuredError } = useFeaturedJobs({ limit: 6 })
  const { stats: jobStats, loading: statsLoading, error: statsError } = useJobStats()

  const loading = featuredLoading || statsLoading
  const error = featuredError || statsError

  // Create categories from job stats
  const jobsByCategory = jobStats?.jobsByType.map(item => ({
    category: formatWorkType(item._id),
    count: item.count
  })) || []

  // Create top companies from job stats
  const topCompanies = jobStats?.jobsByLocation.slice(0, 8).map(item => ({
    name: item._id,
    count: item.count
  })) || []

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Khám Phá Việc Làm</h1>
          <p className="text-muted-foreground">Duyệt qua các danh mục và công ty hàng đầu</p>
        </div>

        {/* Featured Jobs */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              Việc Làm Nổi Bật
            </h2>
            <Button variant="outline" asChild>
              <Link href="/jobs">Xem Tất Cả</Link>
            </Button>
          </div>
          
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-16 w-full mb-3" />
                    <Skeleton className="h-4 w-1/3 mb-3" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-red-600">Lỗi: {error}</p>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()} 
                  className="mt-4"
                >
                  Thử lại
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredJobs.map((job) => (
                <Card key={job._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge variant="secondary">Nổi bật</Badge>
                      <Badge variant="outline">{formatSalary(job.salary)}</Badge>
                    </div>
                    <CardTitle className="text-lg hover:text-primary">
                      <Link href={`/jobs/${job._id}`}>{job.title}</Link>
                    </CardTitle>
                    <CardDescription>{job.company.name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {job.company.province}, {job.company.district}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Briefcase className="w-4 h-4" />
                        {formatWorkType(job.typeWork)}
                      </div>
                      <Button asChild className="w-full">
                        <Link href={`/jobs/${job._id}`}>Xem Chi Tiết</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Browse by Category */}
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
              <Briefcase className="w-6 h-6" />
              Duyệt Theo Loại Hình Công Việc
            </h2>
            <p className="text-muted-foreground">Tìm công việc theo loại hình bạn quan tâm</p>
          </div>
          
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Skeleton className="h-6 w-24 mb-2" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="w-12 h-12 rounded-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobsByCategory.map((item) => (
                <Link key={item.category} href={`/jobs?typeWork=${encodeURIComponent(item.category.toLowerCase().replace(' ', '-'))}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-lg mb-1">{item.category}</p>
                          <p className="text-sm text-muted-foreground">{item.count} việc làm</p>
                        </div>
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <Briefcase className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Top Companies */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
              <Building2 className="w-6 h-6" />
              Địa Điểm Hàng Đầu
            </h2>
            <p className="text-muted-foreground">Các địa điểm có nhiều cơ hội việc làm</p>
          </div>
          
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-3">
                      <Skeleton className="w-16 h-16 rounded-full mx-auto" />
                      <div>
                        <Skeleton className="h-5 w-20 mx-auto mb-2" />
                        <Skeleton className="h-4 w-16 mx-auto" />
                      </div>
                      <Skeleton className="h-8 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {topCompanies.map((location) => (
                <Card key={location.name} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-3">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                        <Building2 className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold mb-1">{location.name}</p>
                        <p className="text-sm text-muted-foreground">{location.count} việc làm</p>
                      </div>
                      <Button variant="outline" size="sm" className="w-full bg-transparent" asChild>
                        <Link href={`/jobs?location=${encodeURIComponent(location.name)}`}>Xem Việc Làm</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
