"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { categories, locations, levels, jobTypes } from "@/lib/mock-data"
import { JobsAPI, Job } from "@/lib/api/jobs"
import { Search, MapPin, Briefcase, DollarSign, Filter, Loader2 } from "lucide-react"
import Link from "next/link"
import { formatSalary, formatWorkType } from "@/lib/api/jobs"
import { Skeleton } from "@/components/ui/skeleton"

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLocation, setSelectedLocation] = useState("Tất cả")
  const [selectedType, setSelectedType] = useState("all")
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadJobs()
  }, [selectedLocation, selectedType, searchQuery])

  const loadJobs = async () => {
    setIsLoading(true)
    try {
      const filters: any = {
        status: 'approved',
        page: 1,
        limit: 50,
      }
      
      if (searchQuery) {
        filters.search = searchQuery
      }
      
      if (selectedLocation !== "Tất cả") {
        filters.location = selectedLocation
      }
      
      if (selectedType !== "all") {
        filters.typeWork = selectedType
      }

      const response = await JobsAPI.getJobs(filters)
      setJobs(response.data.posts || [])
    } catch (error) {
      console.error('Error loading jobs:', error)
      setJobs([])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Tìm Kiếm Việc Làm</h1>
          <p className="text-muted-foreground">Khám phá hàng nghìn cơ hội việc làm phù hợp với bạn</p>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm công việc, công ty..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button size="lg" className="gap-2" onClick={loadJobs}>
                <Search className="w-5 h-5" />
                Tìm Kiếm
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Filter className="w-5 h-5" />
                  Bộ Lọc
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Địa Điểm</label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => (
                        <SelectItem key={loc} value={loc}>
                          {loc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Loại Hình</label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {jobTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() => {
                    setSelectedLocation("Tất cả")
                    setSelectedType("all")
                    setSearchQuery("")
                  }}
                >
                  Xóa Bộ Lọc
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Job Results */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-muted-foreground">
                Tìm thấy <strong>{jobs.length}</strong> công việc
              </p>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-6 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                        <Skeleton className="h-6 w-20" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-5/6 mb-4" />
                      <div className="flex gap-3 mb-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <div className="flex gap-2 mb-4">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-14" />
                      </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-10 w-32" />
                        <Skeleton className="h-10 w-32" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="font-medium mb-1">Không tìm thấy công việc phù hợp</p>
                  <p className="text-sm text-muted-foreground">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                </CardContent>
              </Card>
            ) : (
              jobs.map((job) => (
                <Card key={job._id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <CardTitle className="text-xl hover:text-primary">
                          <Link href={`/jobs?job_selected=${job._id}`}>{job.title}</Link>
                        </CardTitle>
                        <CardDescription className="text-base">{job.company?.name}</CardDescription>
                      </div>
                      <Badge variant="secondary" className="text-base px-3 py-1">
                        {formatSalary(job.salary)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4 line-clamp-2">{job.description}</p>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {job.company?.province || job.location || 'N/A'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {formatWorkType(job.typeWork)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.techStack?.slice(0, 3).map((tech, idx) => (
                        <Badge key={idx} variant="outline">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button asChild>
                        <Link href={`/jobs?job_selected=${job._id}`}>Xem Chi Tiết</Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href={`/jobs/${job._id}/apply`}>Ứng Tuyển Ngay</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
