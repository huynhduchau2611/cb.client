"use client"

import { useState, useEffect, useCallback, useMemo, Suspense, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { MapPin, Briefcase, Clock, Calendar, Building2, Users, Search, Filter } from "lucide-react"
import Link from "next/link"
import { Job, JobFilters, formatSalary, formatWorkType, formatCompanySize, formatWorkingTime, formatCompanyType, JobsAPI } from "@/lib/api/jobs"
import { useJobs } from "@/hooks/useJobs"
import { JobSearchBar } from "@/components/search/JobSearchBar"
import { Pagination } from "@/components/Pagination"
import { ChatButton } from "@/components/chat/ChatButton"
import Image from "next/image"
import { config } from "@/lib/config"

// Filter options - moved outside component to prevent re-creation
const jobLevels = [
  { value: "all", label: "Tất cả cấp bậc" },
  { value: "intern", label: "Thực tập sinh" },
  { value: "fresher", label: "Fresher" },
  { value: "junior", label: "Junior" },
  { value: "middle", label: "Middle" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead" },
  { value: "manager", label: "Manager" }
]

const districts = [
  { value: "hai-chau", label: "Hải Châu" },
  { value: "thanh-khe", label: "Thanh Khê" },
  { value: "son-tra", label: "Sơn Trà" },
  { value: "ngu-hanh-son", label: "Ngũ Hành Sơn" },
  { value: "lien-chieu", label: "Liên Chiểu" },
  { value: "cam-le", label: "Cẩm Lệ" },
  { value: "hoa-vang", label: "Hòa Vang" }
]

const workTypes = [
  { value: "all", label: "Tất cả hình thức" },
  { value: "full-time", label: "Toàn thời gian" },
  { value: "part-time", label: "Bán thời gian" },
  { value: "contract", label: "Hợp đồng" },
  { value: "internship", label: "Thực tập" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" }
]

const salaryRanges = [
  { value: "all", label: "Tất cả mức lương" },
  { value: "0-5", label: "Dưới 5 triệu" },
  { value: "5-10", label: "5 - 10 triệu" },
  { value: "10-15", label: "10 - 15 triệu" },
  { value: "15-20", label: "15 - 20 triệu" },
  { value: "20-30", label: "20 - 30 triệu" },
  { value: "30-50", label: "30 - 50 triệu" },
  { value: "50+", label: "Trên 50 triệu" }
]

const jobFields = [
  { value: "frontend", label: "Frontend" },
  { value: "backend", label: "Backend" },
  { value: "fullstack", label: "Fullstack" },
  { value: "mobile", label: "Mobile" },
  { value: "devops", label: "DevOps" },
  { value: "data", label: "Data Science" },
  { value: "ai", label: "AI/ML" },
  { value: "blockchain", label: "Blockchain" },
  { value: "game", label: "Game Development" }
]

function JobsPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Initialize filter states from URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || "")
  const [selectedLevel, setSelectedLevel] = useState("all")
  const [selectedDistrict, setSelectedDistrict] = useState("")
  const [selectedTypeWork, setSelectedTypeWork] = useState("all")
  const [selectedSalary, setSelectedSalary] = useState("all")
  const [selectedField, setSelectedField] = useState("")
  const [selectedLocation, setSelectedLocation] = useState(searchParams.get('location') || "")
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const jobCardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const jobDetailRef = useRef<HTMLDivElement | null>(null)
  const isNavigatingToJob = useRef(false) // Flag to prevent filter reset when navigating to job
  const isChangingPage = useRef(false) // Flag to prevent filter reset when changing page
  const [hasSearched, setHasSearched] = useState(false) // Track if user has performed a search
  
  // Use refs to store latest values to avoid closure issues
  const searchQueryRef = useRef(searchQuery)
  const selectedLocationRef = useRef(selectedLocation)
  
  // Update refs when state changes
  useEffect(() => {
    searchQueryRef.current = searchQuery
  }, [searchQuery])
  
  useEffect(() => {
    selectedLocationRef.current = selectedLocation
  }, [selectedLocation])

  // Build filters object with useMemo
  const filters: JobFilters = useMemo(() => {
    const filterObj: JobFilters = {
    search: searchQuery || undefined,
    location: selectedLocation || undefined,
    typeWork: selectedTypeWork !== "all" ? selectedTypeWork : undefined,
    }
    
    // Add salary filter
    if (selectedSalary !== "all") {
      const [min, max] = selectedSalary.split("-").map(s => s.replace("+", "").trim())
      if (min && min !== "") {
        filterObj.minSalary = parseInt(min) * 1000000 // Convert to VND
      }
      if (max && max !== "" && max !== "+") {
        filterObj.maxSalary = parseInt(max) * 1000000 // Convert to VND
      } else if (max === "+") {
        // For "50+" range, set minSalary only
        filterObj.minSalary = 50000000
      }
    }
    
    // Add tech stack filter if field is selected
    if (selectedField) {
      filterObj.techStack = selectedField
    }
    
    return filterObj
  }, [searchQuery, selectedLocation, selectedTypeWork, selectedSalary, selectedField])

  // Check if we should auto-fetch based on URL params
  const shouldAutoFetch = useMemo(() => {
    const hasSearchParam = searchParams.get('search')
    const hasLocationParam = searchParams.get('location')
    const hasJobSelected = searchParams.get('job_selected')
    // Always auto-fetch when entering the page (no search params means show all jobs)
    return !!(hasSearchParam || hasLocationParam || hasJobSelected || (!hasSearchParam && !hasLocationParam && !hasJobSelected))
  }, [searchParams])

  const { jobs: jobsFromHook, loading, error, pagination, fetchJobs } = useJobs({ 
    initialFilters: filters,
    autoFetch: true // Always auto fetch to show all jobs by default
  })
  
  // Local jobs state to allow adding fetched jobs
  const [jobs, setJobs] = useState<Job[]>([])
  
  // Sync jobs from hook to local state
  useEffect(() => {
    setJobs(jobsFromHook)
    
    // Don't auto-navigate to job page if user is actively changing pages
    if (isChangingPage.current) {
      return
    }
    
    // If there's a selected job in URL but it's not in the new list, find its page
    const jobSelectedId = searchParams.get('job_selected')
    if (jobSelectedId && selectedJob && selectedJob._id === jobSelectedId) {
      const existsInNewList = jobsFromHook.some(j => j._id === jobSelectedId)
      if (!existsInNewList && !loading) {
        // Job is no longer in current list (probably due to filter change), find its page
        // But only navigate if user is not actively changing pages
        isNavigatingToJob.current = true
        findJobPage(jobSelectedId, filters).then((jobPage) => {
          // Double check flag hasn't changed (user might have clicked pagination)
          if (!isChangingPage.current && jobPage && jobPage !== pagination.currentPage) {
            fetchJobs({ page: jobPage })
          } else {
            isNavigatingToJob.current = false
          }
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobsFromHook, searchParams])
  
  // Helper function to find which page contains a job
  const findJobPage = useCallback(async (jobId: string, currentFilters: JobFilters): Promise<number | null> => {
    const limit = 10 // Same limit as used in the page
    let page = 1
    const maxPages = 50 // Safety limit to prevent infinite loops
    
    while (page <= maxPages) {
      try {
        const response = await JobsAPI.getJobs({
          ...currentFilters,
          page,
          limit,
        })
        
        const found = response.data.posts.some((job: Job) => job._id === jobId)
        if (found) {
          return page
        }
        
        // If we've reached the last page, stop
        if (page >= response.data.pagination.totalPages) {
          break
        }
        
        page++
      } catch (error) {
        console.error('Error finding job page:', error)
        return null
      }
    }
    
    return null
  }, [])

  // Clear all filters function
  const clearAllFilters = useCallback(() => {
    setSearchQuery("")
    setSelectedLocation("")
    setSelectedLevel("all")
    setSelectedTypeWork("all")
    setSelectedSalary("all")
    setSelectedJob(null) // Clear selected job
  }, [])



  // Mark as searched if we have search params on mount or when URL params change
  // If no search params, still mark as searched to show all jobs
  useEffect(() => {
    const searchParam = searchParams.get('search')
    const locationParam = searchParams.get('location')
    // Always mark as searched - either with filters or without (showing all)
    setHasSearched(true)
  }, [searchParams])

  // Initial fetch when component mounts - always fetch to show all jobs
  useEffect(() => {
    const jobSelectedId = searchParams.get('job_selected')
    const searchParam = searchParams.get('search')
    const locationParam = searchParams.get('location')
    
    // Sync state with URL params
    if (searchParam) {
      setSearchQuery(searchParam)
      searchQueryRef.current = searchParam
    }
    if (locationParam) {
      setSelectedLocation(locationParam)
      selectedLocationRef.current = locationParam
    }
    
    // Always fetch jobs - with filters if provided, otherwise show all
    setHasSearched(true)
    const urlFilters: JobFilters = {
      page: 1,
      search: searchParam || undefined,
      location: locationParam || undefined,
    }
    fetchJobs(urlFilters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  // Sync URL params with state when they change (but not when state changes from user input)
  useEffect(() => {
    const searchParam = searchParams.get('search') || ""
    const locationParam = searchParams.get('location') || ""
    
    // Only update if URL param is different from current state to avoid loops
    // This ensures we sync when URL changes (e.g., browser back/forward) but not when user types
    if (searchParam !== searchQuery) {
      setSearchQuery(searchParam)
      searchQueryRef.current = searchParam
    }
    if (locationParam !== selectedLocation) {
      setSelectedLocation(locationParam)
      selectedLocationRef.current = locationParam
    }
  }, [searchParams]) // Only depend on searchParams, not on state values

  // Combined effect for ALL filter changes with debounce - only if hasSearched
  useEffect(() => {
    // Only auto-fetch if user has already performed a search
    if (!hasSearched) {
      return
    }
    
    // Don't reset page if we're navigating to a specific job, changing page, or if there's a job_selected in URL
    const jobSelectedId = searchParams.get('job_selected')
    if (isNavigatingToJob.current || isChangingPage.current || jobSelectedId) {
      // Don't reset flags here - let them be reset in their respective handlers
      return
    }
    
    const timeoutId = setTimeout(() => {
      // Double check flag hasn't changed during debounce
      if (!isChangingPage.current && !isNavigatingToJob.current) {
      fetchJobs({ page: 1 })
      }
    }, 500) // Debounce all filter changes

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTypeWork, selectedLevel, selectedSalary, searchQuery, selectedLocation, hasSearched]) // Removed searchParams to avoid unwanted triggers

  // Handle job selection from URL or set first job
  useEffect(() => {
    const jobSelectedId = searchParams.get('job_selected')
    
    if (!jobSelectedId) {
    // If no job selected in URL and no selected job, set first job
      if (!loading && jobs.length > 0 && !selectedJob) {
      const firstJob = jobs[0]
      setSelectedJob(firstJob)
      // Update URL with first job
      const params = new URLSearchParams(searchParams.toString())
      params.set('job_selected', firstJob._id)
      router.replace(`/jobs?${params.toString()}`, { scroll: false })
    } else if (jobs.length === 0 && selectedJob) {
      // Clear selected job when no results
      setSelectedJob(null)
      const params = new URLSearchParams(searchParams.toString())
      params.delete('job_selected')
      router.replace(`/jobs?${params.toString()}`, { scroll: false })
      }
      return
    }

    // If job is already selected and matches, don't do anything
    if (selectedJob && selectedJob._id === jobSelectedId) {
      return
    }

    // Try to find job in current list
    if (jobs.length > 0) {
      const job = jobs.find(j => j._id === jobSelectedId)
      if (job) {
        setSelectedJob(job)
        // Scroll will be handled by the separate useEffect that watches jobs changes
        return
      }
    } else if (jobs.length === 0 && !loading) {
      // If list is empty and not loading, job might be on a different page
      // This can happen when filters change and selected job is no longer in current page
      // We'll handle this in the fetch separately section below
    }

    // If job not found in list and not loading, fetch it separately and find its page
    if (!loading && jobSelectedId) {
      JobsAPI.getJobById(jobSelectedId)
        .then(async (response) => {
          if (response.data.post) {
            const fetchedJob = response.data.post
            
            // Check if job exists in current list first
            const existsInList = jobs.some(j => j._id === fetchedJob._id)
            if (!existsInList) {
              // Job is not in current page, find which page it's on
              // First try with current filters
              let jobPage = await findJobPage(jobSelectedId, filters)
              let foundWithEmptyFilters = false
              
              // If not found with current filters, try with empty filters (for featured jobs)
              if (!jobPage) {
                jobPage = await findJobPage(jobSelectedId, {})
                foundWithEmptyFilters = !!jobPage
              }
              
              if (jobPage && jobPage !== pagination.currentPage) {
                // Set flag to prevent filter effect from resetting page
                isNavigatingToJob.current = true
                
                // Set selected job first so it's ready when page loads
                setSelectedJob(fetchedJob)
                
                // If found with empty filters, clear current filters first
                if (foundWithEmptyFilters) {
                  setSearchQuery("")
                  setSelectedLocation("")
                  setSelectedTypeWork("all")
                  // Wait a bit for filters to clear, then fetch
                  setTimeout(async () => {
                    await fetchJobs({ page: jobPage! })
                  }, 100)
                } else {
                  // Navigate to the correct page with current filters
                  await fetchJobs({ page: jobPage })
                }
              } else if (jobPage) {
                // Job found but already on correct page
                setSelectedJob(fetchedJob)
              } else {
                // Job not found in any page, still show it (might be filtered out)
                setSelectedJob(fetchedJob)
              }
            } else {
              // Job exists in list
              setSelectedJob(fetchedJob)
              // Scroll will be handled by the separate useEffect that watches jobs changes
            }
          }
        })
        .catch((error) => {
          console.error('Error fetching job:', error)
          // If job not found, clear the selection
          const params = new URLSearchParams(searchParams.toString())
          params.delete('job_selected')
          router.replace(`/jobs?${params.toString()}`, { scroll: false })
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs, loading, searchParams, router])

  // Scroll selected job into view when jobs list updates and job is selected
  useEffect(() => {
    const jobSelectedId = searchParams.get('job_selected')
    if (!jobSelectedId || !selectedJob || selectedJob._id !== jobSelectedId) {
      return
    }

    // Wait for DOM to be fully updated with the job card
    const scrollToJob = () => {
      const jobCard = jobCardRefs.current[jobSelectedId]
      if (jobCard) {
        const detailTop = 64 // 4rem = 64px
        const jobCardRect = jobCard.getBoundingClientRect()
        const jobCardTop = jobCardRect.top + window.scrollY
        const targetScrollY = jobCardTop - detailTop
        
        window.scrollTo({
          top: Math.max(0, targetScrollY),
          behavior: 'smooth'
        })
        return true
      }
      return false
    }

    // Try multiple times with increasing delays to ensure DOM is ready
    let attempts = 0
    const maxAttempts = 5
    
    const tryScroll = () => {
      attempts++
      if (scrollToJob() || attempts >= maxAttempts) {
        return
      }
      // Try again after a delay
      setTimeout(tryScroll, 100 * attempts)
    }

    // Start trying after initial delay
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(tryScroll, 200)
      })
    })
  }, [jobs, selectedJob, searchParams]) // Depend on jobs to trigger when job is added

  // Handle job selection
  const handleJobSelect = useCallback((job: Job) => {
    // Check if job is in current list
    const existsInList = jobs.some(j => j._id === job._id)
    
    if (!existsInList) {
      // Job is not in current list, find its page and navigate
      isNavigatingToJob.current = true
      findJobPage(job._id, filters).then((jobPage) => {
        if (jobPage && jobPage !== pagination.currentPage) {
    setSelectedJob(job)
          fetchJobs({ page: jobPage }).then(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('job_selected', job._id)
    router.replace(`/jobs?${params.toString()}`, { scroll: false })
          })
        } else {
          // Job not found or already on correct page
          setSelectedJob(job)
          const params = new URLSearchParams(searchParams.toString())
          params.set('job_selected', job._id)
          router.replace(`/jobs?${params.toString()}`, { scroll: false })
        }
      })
    } else {
      // Job is in current list, just select it
      setSelectedJob(job)
      const params = new URLSearchParams(searchParams.toString())
      params.set('job_selected', job._id)
      router.replace(`/jobs?${params.toString()}`, { scroll: false })
    }
  }, [searchParams, router, jobs, filters, pagination, findJobPage, fetchJobs])

  // Handle search from SearchBar - just update state, debounced effect will handle fetch
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    // Don't call fetchJobs here - let the debounced effect handle it
  }, [])

  // Handle search button click - just update state, debounced effect will handle fetch
  const handleSearchClick = useCallback(() => {
    // Use refs to get latest values (avoid closure issues)
    const currentSearchQuery = searchQueryRef.current.trim()
    const currentLocation = selectedLocationRef.current
    
    // Update URL params
    const params = new URLSearchParams()
    if (currentSearchQuery) params.set('search', currentSearchQuery)
    if (currentLocation) params.set('location', currentLocation)
    
    // Remove job_selected if no search criteria
    if (!currentSearchQuery && !currentLocation) {
      params.delete('job_selected')
      setSelectedJob(null)
    }
    
    router.push(`/jobs?${params.toString()}`)
    setHasSearched(true)
    
    // Build filters with current values
    const currentFilters: JobFilters = {
      page: 1,
      search: currentSearchQuery || undefined,
      location: currentLocation || undefined,
      typeWork: selectedTypeWork !== "all" ? selectedTypeWork : undefined,
    }
    
    // Add salary filter
    if (selectedSalary !== "all") {
      const [min, max] = selectedSalary.split("-").map(s => s.replace("+", "").trim())
      if (min && min !== "") {
        currentFilters.minSalary = parseInt(min) * 1000000 // Convert to VND
      }
      if (max && max !== "" && max !== "+") {
        currentFilters.maxSalary = parseInt(max) * 1000000 // Convert to VND
      } else if (max === "+") {
        // For "50+" range, set minSalary only
        currentFilters.minSalary = 50000000
      }
    }
    
    // Add tech stack filter if field is selected
    if (selectedField) {
      currentFilters.techStack = selectedField
    }
    
    // Trigger fetch immediately with all filters
    fetchJobs(currentFilters)
  }, [searchQuery, selectedLocation, selectedTypeWork, selectedSalary, selectedField, router, fetchJobs])


  // Handle pagination
  const handlePageChange = useCallback((page: number) => {
    // Set flag to prevent filter effect from resetting page
    isChangingPage.current = true
    
    // Build filters object directly to ensure we have the latest values
    const currentFilters: JobFilters = {
      search: searchQuery || undefined,
      location: selectedLocation || undefined,
      typeWork: selectedTypeWork !== "all" ? selectedTypeWork : undefined,
      page,
    }
    
    // Add salary filter
    if (selectedSalary !== "all") {
      const [min, max] = selectedSalary.split("-").map(s => s.replace("+", "").trim())
      if (min && min !== "") {
        currentFilters.minSalary = parseInt(min) * 1000000 // Convert to VND
      }
      if (max && max !== "" && max !== "+") {
        currentFilters.maxSalary = parseInt(max) * 1000000 // Convert to VND
      } else if (max === "+") {
        // For "50+" range, set minSalary only
        currentFilters.minSalary = 50000000
      }
    }
    
    // Add tech stack filter if field is selected
    if (selectedField) {
      currentFilters.techStack = selectedField
    }
    
    // Fetch with current filters and new page
    fetchJobs(currentFilters).then(() => {
      // Reset flag after fetch completes with a longer delay to ensure useEffect doesn't trigger
      setTimeout(() => {
        isChangingPage.current = false
      }, 1000) // Increased delay to ensure useEffect doesn't interfere
    }).catch((error) => {
      console.error('Error fetching page:', error)
      // Reset flag even on error
      setTimeout(() => {
        isChangingPage.current = false
      }, 1000)
    })
  }, [fetchJobs, searchQuery, selectedLocation, selectedTypeWork, selectedSalary, selectedField])

  const getWorkLocationLabel = (type: string) => {
    switch (type) {
      case "remote":
        return "Remote"
      case "onsite":
        return "Tại văn phòng"
      case "hybrid":
        return "Hybrid"
      default:
        return type
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Search Bar */}
      <div className="bg-white py-6 border-b">
        <div className="container mx-auto max-w-7xl px-4">
          <JobSearchBar
            searchQuery={searchQuery}
            selectedLocation={selectedLocation}
            onSearchQueryChange={(query) => {
              setSearchQuery(query)
              searchQueryRef.current = query
            }}
            onLocationChange={(location) => {
              setSelectedLocation(location)
              selectedLocationRef.current = location
            }}
            onSearch={handleSearchClick}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white border-b">
        <div className="container mx-auto max-w-7xl px-4 py-6">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">việc làm IT tại Đà Nẵng</h1>

          <div className="space-y-4">
            {/* Filter Row */}
            <div className="flex gap-3 items-center">
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-44 h-10">
                  <SelectValue placeholder="Cấp bậc" />
                </SelectTrigger>
                <SelectContent>
                  {jobLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              

              <Select value={selectedTypeWork} onValueChange={setSelectedTypeWork}>
                <SelectTrigger className="w-44 h-10">
                  <SelectValue placeholder="Hình thức làm việc" />
                </SelectTrigger>
                <SelectContent>
                  {workTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedSalary} onValueChange={setSelectedSalary}>
                <SelectTrigger className="w-44 h-10">
                  <SelectValue placeholder="Mức lương" />
                </SelectTrigger>
                <SelectContent>
                  {salaryRanges.map((salary) => (
                    <SelectItem key={salary.value} value={salary.value}>
                      {salary.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

          

              <Button
                variant="outline"
                onClick={clearAllFilters}
                className="w-32 h-10 text-sm"
              >
                <Filter className="w-4 h-4 mr-2" />
                Bộ lọc
              </Button>
            </div>

            {hasSearched && (
            <p className="text-sm text-gray-600">
              Tìm thấy <span className="font-semibold text-gray-900">{pagination.totalItems}</span> công việc
            </p>
            )}
          </div>
        </div>
      </div>

      {/* Jobs List and Detail Container */}
      <div className="container mx-auto max-w-7xl px-4 pt-6">
        <div className="grid lg:grid-cols-5 gap-6" style={{ alignItems: 'start' }}>
          {/* Left: Job List - Scroll với trang */}
          <div className="lg:col-span-2 space-y-3 lg:pr-2 pb-6">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-3" />
                    <div className="flex items-center gap-2 mb-2">
                      <Skeleton className="w-8 h-8 rounded" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                    <Skeleton className="h-6 w-20 mb-2" />
                    <div className="flex gap-3 mb-3">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <div className="flex gap-1.5 mb-2">
                      <Skeleton className="h-5 w-12" />
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-14" />
                    </div>
                    <Skeleton className="h-3 w-24" />
                  </CardContent>
                </Card>
              ))
            ) : !hasSearched ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Nhập từ khóa hoặc chọn địa điểm để tìm kiếm công việc</p>
                  <p className="text-sm text-gray-500">Bạn có thể tìm theo: tên công việc, kỹ năng, công nghệ, công ty, địa điểm...</p>
                </CardContent>
              </Card>
            ) : error ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-red-600 mb-4">Lỗi: {error}</p>
                  <Button variant="outline" onClick={() => fetchJobs()}>
                    Thử lại
                  </Button>
                </CardContent>
              </Card>
            ) : jobs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-600">Không tìm thấy công việc phù hợp. Thử thay đổi bộ lọc.</p>
                </CardContent>
              </Card>
            ) : (
              jobs.map((job) => (
                <div
                  key={job._id}
                  ref={(el) => {
                    jobCardRefs.current[job._id] = el
                  }}
                >
                  <Card
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedJob?._id === job._id 
                        ? "border-2 border-blue-600 shadow-md" 
                        : "border border-gray-200"
                    }`}
                    onClick={() => handleJobSelect(job)}
                  >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="font-semibold text-base text-gray-900 line-clamp-2 flex-1">{job.title}</h3>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <Link href={`/companies/${job.company._id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center shrink-0 overflow-hidden border border-gray-200">
                          {job.company.avatarUrl ? (
                            <Image
                              src={
                                job.company.avatarUrl.startsWith('http://') || job.company.avatarUrl.startsWith('https://')
                                  ? job.company.avatarUrl
                                  : job.company.avatarUrl.startsWith('/uploads')
                                  ? `${config.api.baseUrl.replace('/api', '')}${job.company.avatarUrl}`
                                  : `${config.api.baseUrl}${job.company.avatarUrl}`
                              }
                              alt={job.company.name}
                              width={32}
                              height={32}
                              className="rounded-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder.svg'
                              }}
                            />
                          ) : (
                            <Building2 className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <span className="text-sm text-gray-700 font-medium hover:text-primary">{job.company.name}</span>
                      </Link>
                    </div>

                    <div className="mb-2">
                      <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                        💰 {formatSalary(job.salary)}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        <span>{formatWorkType(job.typeWork)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{job.company.province}, {job.company.district}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {job.techStack?.slice(0, 3).map((tech, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          {tech}
                        </Badge>
                      ))}
                      {job.techStack && job.techStack.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{job.techStack.length - 3}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(job.createdAt).toLocaleDateString("vi-VN")}</span>
                    </div>
                  </CardContent>
                </Card>
                </div>
              ))
            )}

            {/* Pagination */}
            <div className="mt-6">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                disabled={loading}
                variant="simple"
              />
            </div>
          </div>

          {/* Right: Job Detail - Sticky: đứng yên khi scroll trang, scroll riêng bên trong */}
          {jobs.length > 0 ? (
            <div 
              ref={jobDetailRef}
              className="lg:col-span-3 lg:sticky"
              style={{ 
                alignSelf: 'start',
                top: '4rem', // Header height (h-16 = 4rem = 64px)
                maxHeight: 'calc(100vh - 4rem)'
              }}
            >
              {selectedJob ? (
                <Card 
                  className="flex flex-col shadow-lg w-full" 
                  style={{ 
                    maxHeight: 'calc(100vh - 4rem)',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {/* Header Section - Fixed at top */}
                  <div className="flex-shrink-0 border-b bg-gradient-to-r from-blue-50 to-white p-6">
                    <div className="space-y-4">
                      {/* Job Title */}
                      <h1 className="text-2xl font-bold text-gray-900 leading-tight">{selectedJob.title}</h1>
                      
                      {/* Company Info */}
                      <Link 
                        href={`/companies/${selectedJob.company._id}`}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                      >
                        <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                          {selectedJob.company.avatarUrl ? (
                            <Image
                              src={
                                selectedJob.company.avatarUrl.startsWith('http://') || selectedJob.company.avatarUrl.startsWith('https://')
                                  ? selectedJob.company.avatarUrl
                                  : selectedJob.company.avatarUrl.startsWith('/uploads')
                                  ? `${config.api.baseUrl.replace('/api', '')}${selectedJob.company.avatarUrl}`
                                  : `${config.api.baseUrl}${selectedJob.company.avatarUrl}`
                              }
                              alt={selectedJob.company.name}
                              width={56}
                              height={56}
                              className="rounded-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder.svg'
                              }}
                            />
                          ) : (
                            <Building2 className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-base hover:text-primary transition-colors">{selectedJob.company.name}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>{selectedJob.company.province}, {selectedJob.company.district}</span>
                          </div>
                        </div>
                      </Link>

                      {/* Salary and Work Type Badges */}
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-green-600 text-white text-sm px-4 py-2 hover:bg-green-700">
                          💰 {formatSalary(selectedJob.salary)}
                        </Badge>
                        <Badge variant="outline" className="text-sm px-4 py-2 border-gray-300">
                          {formatWorkType(selectedJob.typeWork)}
                        </Badge>
                        {selectedJob.company.size && (
                          <Badge variant="outline" className="text-sm px-4 py-2 border-gray-300">
                            <Briefcase className="w-3 h-3 mr-1" />
                            {formatCompanySize(selectedJob.company.size)}
                          </Badge>
                        )}
                      </div>

                      {/* Quick Info */}
                      <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-200">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Đăng {new Date(selectedJob.createdAt).toLocaleDateString("vi-VN")}</span>
                        </div>
                        {selectedJob.candidateApplied > 0 && (
                          <div className="text-xs text-gray-400">
                            {selectedJob.candidateApplied} ứng viên đã ứng tuyển
                        </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Scrollable content area */}
                  <div 
                    className="overflow-y-auto flex-1 min-h-0 overscroll-contain"
                    style={{ 
                      maxHeight: 'calc(100vh - 420px)', // Adjusted for header + button area
                      flex: '1 1 auto'
                    }}
                    onWheel={(e) => {
                      const target = e.currentTarget
                      const { scrollTop, scrollHeight, clientHeight } = target
                      const isAtTop = scrollTop === 0
                      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1
                      
                      if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
                        e.stopPropagation()
                      }
                    }}
                    onTouchMove={(e) => {
                      const target = e.currentTarget
                      const { scrollTop, scrollHeight, clientHeight } = target
                      const touch = e.touches[0]
                      const rect = target.getBoundingClientRect()
                      const isAtTop = scrollTop === 0
                      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1
                      
                      if ((isAtTop && touch.clientY > rect.top) || (isAtBottom && touch.clientY < rect.bottom)) {
                        e.stopPropagation()
                      }
                    }}
                  >
                    <CardContent className="p-6 space-y-6">
                      {/* Job Details */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{selectedJob.company.province}, {selectedJob.company.district}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Briefcase className="w-4 h-4" />
                          <span>{formatCompanySize(selectedJob.company.size)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{formatWorkType(selectedJob.typeWork)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Building2 className="w-4 h-4" />
                          <span>{formatCompanyType(selectedJob.company.typeCompany)}</span>
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-3">Mô Tả Công Việc</h2>
                        <p className="text-gray-700 leading-relaxed">{selectedJob.description}</p>
                      </div>

                      {/* Tech Stack */}
                      {selectedJob.techStack && selectedJob.techStack.length > 0 && (
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900 mb-3">Kỹ Năng Yêu Cầu</h2>
                          <div className="flex flex-wrap gap-2">
                            {selectedJob.techStack.map((tech, idx) => (
                              <Badge key={idx} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {tech}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Company Info */}
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-3">Thông Tin Công Ty</h2>
                        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-600" />
                            <Link 
                              href={`/companies/${selectedJob.company._id}`}
                              className="font-medium hover:text-primary transition-colors"
                            >
                              {selectedJob.company.name}
                            </Link>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-600" />
                            <span>{selectedJob.company.province}, {selectedJob.company.district}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-600" />
                            <span>{formatCompanySize(selectedJob.company.size)}</span>
                          </div>
                          {selectedJob.company.workingTime && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-600" />
                              <span>{formatWorkingTime(selectedJob.company.workingTime)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                    </div>

                    {/* Chat and Apply Button - Fixed at bottom of card */}
                    <div className="border-t p-6 bg-white flex-shrink-0 space-y-3">
                      <ChatButton
                        employerUserId={typeof selectedJob.company.user === 'object' ? selectedJob.company.user._id : undefined}
                        companyId={selectedJob.company._id}
                        jobId={selectedJob._id}
                        employerName={typeof selectedJob.company.user === 'object' ? selectedJob.company.user.fullName : undefined}
                        employerAvatar={typeof selectedJob.company.user === 'object' ? selectedJob.company.user.avatar : undefined}
                      />
                      <Button asChild size="lg" className="w-full bg-blue-600 hover:bg-blue-700">
                        <Link href={`/jobs/${selectedJob._id}/apply`}>Ứng Tuyển Ngay</Link>
                      </Button>
                    </div>
                  </Card>
              ) : (
                <Card className="h-full flex items-center justify-center">
                  <CardContent className="text-center text-gray-600">
                    <p>Chọn một công việc để xem chi tiết</p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="lg:col-span-3 flex items-center justify-center">
              <Card className="w-full max-w-md">
                <CardContent className="py-12 text-center">
                  <div className="mb-4">
                    <Search className="w-16 h-16 text-gray-300 mx-auto" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy công việc</h3>
                  <p className="text-gray-600 mb-4">
                    Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc để tìm thêm cơ hội việc làm phù hợp.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={clearAllFilters}
                    className="text-sm"
                  >
                    Xóa bộ lọc
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function JobsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="w-12 h-12 rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    }>
      <JobsPageContent />
    </Suspense>
  )
}
