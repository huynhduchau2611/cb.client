import { useState, useEffect, useCallback, useRef } from 'react'
import { JobsAPI, EmployerJobsAPI, Job, JobFilters, JobListResponse } from '@/lib/api/jobs'
import { partnerApi, Company } from '@/lib/api/partner'

// Module-level promise cache to prevent multiple concurrent fetches
let featuredJobsPromise: Promise<any> | null = null
let jobStatsPromise: Promise<any> | null = null
let featuredCompaniesPromise: Promise<any> | null = null
// Module-level flags to track if data has been fetched (persists across remounts)
let hasFetchedJobStats = false
let hasFetchedFeaturedJobs = false
let hasFetchedFeaturedCompanies = false

interface UseJobsOptions {
  initialFilters?: JobFilters
  autoFetch?: boolean
}

interface UseJobsReturn {
  jobs: Job[]
  loading: boolean
  error: string | null
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
  fetchJobs: (filters?: JobFilters) => Promise<void>
  refreshJobs: () => Promise<void>
  setError: (error: string | null) => void
}

export function useJobs(options: UseJobsOptions = {}): UseJobsReturn {
  const { initialFilters = {}, autoFetch = true } = options

  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false
  })

  // Use ref to store initialFilters to avoid recreating fetchJobs
  const initialFiltersRef = useRef(initialFilters)
  useEffect(() => {
    initialFiltersRef.current = initialFilters
  }, [initialFilters])

  const fetchJobs = useCallback(async (filters: JobFilters = {}) => {
    try {
      setLoading(true)
      setError(null)

      const finalFilters = {
        ...initialFiltersRef.current,
        ...filters // filters passed in will override initialFilters (including page)
      }

      // Always use the latest initialFilters from ref
      const response: JobListResponse = await JobsAPI.getJobs(finalFilters)

      setJobs(response.data.posts)
      setPagination(response.data.pagination)
    } catch (err) {
      console.error('Error fetching jobs:', err)
      setError(err instanceof Error ? err.message : 'Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }, []) // No dependencies - use refs instead

  const refreshJobs = useCallback(async () => {
    await fetchJobs()
  }, [fetchJobs])

  // Only fetch once on mount if autoFetch is true
  const hasFetchedRef = useRef(false)
  useEffect(() => {
    if (autoFetch && !hasFetchedRef.current) {
      hasFetchedRef.current = true
      fetchJobs()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch]) // Only depend on autoFetch, not fetchJobs

  return {
    jobs,
    loading,
    error,
    pagination,
    fetchJobs,
    refreshJobs,
    setError
  }
}

// Hook for single job
interface UseJobOptions {
  autoFetch?: boolean
}

interface UseJobReturn {
  job: Job | null
  loading: boolean
  error: string | null
  fetchJob: (id: string) => Promise<void>
  setError: (error: string | null) => void
}

export function useJob(options: UseJobOptions = {}): UseJobReturn {
  const { autoFetch = false } = options

  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchJob = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await JobsAPI.getJobById(id)
      setJob(response.data.post)
    } catch (err) {
      console.error('Error fetching job:', err)
      setError(err instanceof Error ? err.message : 'Failed to load job')
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    job,
    loading,
    error,
    fetchJob,
    setError
  }
}

// Hook for job stats
interface UseJobStatsReturn {
  stats: {
    totalJobs: number
    jobsByType: Array<{ _id: string; count: number }>
    jobsByLocation: Array<{ _id: string; count: number }>
    averageSalary: number
    totalCompanies: number
    totalCandidates: number
  } | null
  loading: boolean
  error: string | null
  fetchStats: () => Promise<void>
  setError: (error: string | null) => void
}

export function useJobStats(): UseJobStatsReturn {
  const [stats, setStats] = useState<UseJobStatsReturn['stats']>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    // If data has already been fetched successfully, don't fetch again
    if (hasFetchedJobStats && jobStatsPromise) {
      try {
        const response = await jobStatsPromise
        setStats(response.data)
        return
      } catch (err) {
        // If cached promise failed, allow retry
        hasFetchedJobStats = false
        jobStatsPromise = null
      }
    }

    // If there's already a request in progress, wait for it
    if (jobStatsPromise) {
      try {
        const response = await jobStatsPromise
        setStats(response.data)
        hasFetchedJobStats = true
      } catch (err) {
        // Error already handled by the original request
      }
      return
    }

    // Create new request and cache the promise IMMEDIATELY to prevent race conditions
    // Set promise before calling API to ensure atomicity
    const promise = JobsAPI.getJobStats()
    jobStatsPromise = promise

    try {
      setLoading(true)
      setError(null)

      const response = await promise
      setStats(response.data)
      hasFetchedJobStats = true
      // Keep promise in cache for longer to handle React Strict Mode and multiple component mounts
      setTimeout(() => {
        // Don't clear if it's still the same promise
        if (jobStatsPromise === promise) {
          jobStatsPromise = null
        }
      }, 5000) // Increased to 5 seconds
    } catch (err) {
      console.error('Error fetching job stats:', err)
      // Don't set error for network failures - just log it
      // This allows the UI to continue working even if stats fail to load
      const errorMessage = err instanceof Error ? err.message : 'Failed to load job stats'
      if (!errorMessage.includes('kết nối')) {
        setError(errorMessage)
      }
      hasFetchedJobStats = false
      // Clear promise on error after a delay to allow other components to catch the error
      setTimeout(() => {
        if (jobStatsPromise === promise) {
          jobStatsPromise = null
        }
      }, 2000)
    } finally {
      setLoading(false)
    }
  }, [])

  // Only fetch once per app session (handles React Strict Mode remounts)
  useEffect(() => {
    // Only fetch if not already fetched
    if (!hasFetchedJobStats) {
      fetchStats()
    } else if (jobStatsPromise) {
      // If already fetched, set loading while awaiting cached promise
      setLoading(true)
      jobStatsPromise.then(response => {
        setStats(response.data)
        setLoading(false)
      }).catch(() => {
        // Ignore errors, already handled
        setLoading(false)
      })
    } else if (hasFetchedJobStats && !stats) {
      // If marked as fetched but no stats yet, we're still loading
      setLoading(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty deps - only fetch once

  return {
    stats,
    loading,
    error,
    fetchStats,
    setError
  }
}

// Hook for featured jobs
interface UseFeaturedJobsOptions {
  limit?: number
  autoFetch?: boolean
}

interface UseFeaturedJobsReturn {
  jobs: Job[]
  loading: boolean
  error: string | null
  fetchFeaturedJobs: () => Promise<void>
  setError: (error: string | null) => void
}

export function useFeaturedJobs(options: UseFeaturedJobsOptions = {}): UseFeaturedJobsReturn {
  const { limit = 5, autoFetch = true } = options

  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const limitRef = useRef(limit)

  // Update limit ref when it changes
  useEffect(() => {
    limitRef.current = limit
  }, [limit])

  const fetchFeaturedJobs = useCallback(async () => {
    // If data has already been fetched successfully, don't fetch again
    if (hasFetchedFeaturedJobs && featuredJobsPromise) {
      try {
        const response = await featuredJobsPromise
        setJobs(response.data.posts)
        return
      } catch (err) {
        // If cached promise failed, allow retry
        hasFetchedFeaturedJobs = false
        featuredJobsPromise = null
      }
    }

    // If there's already a request in progress, wait for it
    if (featuredJobsPromise) {
      try {
        const response = await featuredJobsPromise
        setJobs(response.data.posts)
        hasFetchedFeaturedJobs = true
      } catch (err) {
        // Error already handled by the original request
        setJobs([])
      }
      return
    }

    // Create new request and cache the promise IMMEDIATELY to prevent race conditions
    // Set promise before calling API to ensure atomicity
    const promise = JobsAPI.getFeaturedJobs(limitRef.current)
    featuredJobsPromise = promise

    try {
      setLoading(true)
      setError(null)

      const response = await promise
      setJobs(response.data.posts)
      hasFetchedFeaturedJobs = true
      // Keep promise in cache for longer to handle React Strict Mode and multiple component mounts
      setTimeout(() => {
        // Don't clear if it's still the same promise
        if (featuredJobsPromise === promise) {
          featuredJobsPromise = null
        }
      }, 5000) // Increased to 5 seconds
    } catch (err) {
      console.error('Error fetching featured jobs:', err)
      // Don't set error for network failures - just log it
      // This allows the UI to continue working even if featured jobs fail to load
      const errorMessage = err instanceof Error ? err.message : 'Failed to load featured jobs'
      if (!errorMessage.includes('kết nối')) {
        setError(errorMessage)
      }
      // Set empty array on failure so UI doesn't break
      setJobs([])
      hasFetchedFeaturedJobs = false
      // Clear promise on error after a delay to allow other components to catch the error
      setTimeout(() => {
        if (featuredJobsPromise === promise) {
          featuredJobsPromise = null
        }
      }, 2000)
    } finally {
      setLoading(false)
    }
  }, []) // No dependencies - use refs instead

  // Only fetch once per app session when autoFetch is true (handles React Strict Mode remounts)
  useEffect(() => {
    if (autoFetch) {
      // Always try to fetch, the function will handle caching
        fetchFeaturedJobs()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch]) // Only depend on autoFetch

  return {
    jobs,
    loading,
    error,
    fetchFeaturedJobs,
    setError
  }
}

// Hook for featured companies
interface UseFeaturedCompaniesOptions {
  limit?: number
  autoFetch?: boolean
}

interface UseFeaturedCompaniesReturn {
  companies: Company[]
  loading: boolean
  error: string | null
  fetchFeaturedCompanies: () => Promise<void>
  setError: (error: string | null) => void
}

export function useFeaturedCompanies(options: UseFeaturedCompaniesOptions = {}): UseFeaturedCompaniesReturn {
  const { limit = 6, autoFetch = true } = options

  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const limitRef = useRef(limit)

  // Update limit ref when it changes
  useEffect(() => {
    limitRef.current = limit
  }, [limit])

  const fetchFeaturedCompanies = useCallback(async () => {
    // If data has already been fetched successfully, don't fetch again
    if (hasFetchedFeaturedCompanies && featuredCompaniesPromise) {
      try {
        const response = await featuredCompaniesPromise
        setCompanies(response.companies)
        return
      } catch (err) {
        // If cached promise failed, allow retry
        hasFetchedFeaturedCompanies = false
        featuredCompaniesPromise = null
      }
    }

    // If there's already a request in progress, wait for it
    if (featuredCompaniesPromise) {
      try {
        const response = await featuredCompaniesPromise
        setCompanies(response.companies)
        hasFetchedFeaturedCompanies = true
      } catch (err) {
        // Error already handled by the original request
        setCompanies([])
      }
      return
    }

    // Create new request and cache the promise IMMEDIATELY to prevent race conditions
    // Set promise before calling API to ensure atomicity
    const promise = partnerApi.getFeaturedCompanies(limitRef.current)
    featuredCompaniesPromise = promise

    try {
      setLoading(true)
      setError(null)

      const response = await promise
      setCompanies(response.companies)
      hasFetchedFeaturedCompanies = true
      // Keep promise in cache for longer to handle React Strict Mode and multiple component mounts
      setTimeout(() => {
        // Don't clear if it's still the same promise
        if (featuredCompaniesPromise === promise) {
          featuredCompaniesPromise = null
        }
      }, 5000) // Increased to 5 seconds
    } catch (err) {
      console.error('Error fetching featured companies:', err)
      // Don't set error for network failures - just log it
      // This allows the UI to continue working even if featured companies fail to load
      const errorMessage = err instanceof Error ? err.message : 'Failed to load featured companies'
      if (!errorMessage.includes('kết nối')) {
        setError(errorMessage)
      }
      // Set empty array on failure so UI doesn't break
      setCompanies([])
      hasFetchedFeaturedCompanies = false
      // Clear promise on error after a delay to allow other components to catch the error
      setTimeout(() => {
        if (featuredCompaniesPromise === promise) {
          featuredCompaniesPromise = null
        }
      }, 2000)
    } finally {
      setLoading(false)
    }
  }, []) // No dependencies - use refs instead

  // Only fetch once per app session when autoFetch is true (handles React Strict Mode remounts)
  useEffect(() => {
    if (autoFetch) {
      // Always try to fetch, the function will handle caching
      fetchFeaturedCompanies()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch]) // Only depend on autoFetch

  return {
    companies,
    loading,
    error,
    fetchFeaturedCompanies,
    setError
  }
}

// Hook for employer to view their own job (can see any status)
export function useMyJob(options: UseJobOptions = {}): UseJobReturn {
  const { autoFetch = false } = options

  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchJob = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      // Use employer-specific endpoint that allows viewing any status
      const response = await EmployerJobsAPI.getMyJobById(id)
      setJob(response.data.post)
    } catch (err) {
      console.error('Error fetching my job:', err)
      setError(err instanceof Error ? err.message : 'Failed to load job')
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    job,
    loading,
    error,
    fetchJob,
    setError
  }
}
