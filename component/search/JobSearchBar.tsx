"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, MapPin } from "lucide-react"
import ProvincesAPI, { Province } from "@/lib/api/provinces"

interface JobSearchBarProps {
  searchQuery?: string
  selectedLocation?: string
  onSearchQueryChange?: (query: string) => void
  onLocationChange?: (location: string) => void
  onSearch?: () => void
  className?: string
}

export const JobSearchBar = React.memo(function JobSearchBar({
  searchQuery = "",
  selectedLocation = "",
  onSearchQueryChange,
  onLocationChange,
  onSearch,
  className = "",
}: JobSearchBarProps) {
  const router = useRouter()
  const [provinces, setProvinces] = useState<Province[]>([])
  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [locationSearchQuery, setLocationSearchQuery] = useState("")
  const [isLocationSelectOpen, setIsLocationSelectOpen] = useState(false)
  // Internal location state to handle selection independently
  const [internalSelectedLocation, setInternalSelectedLocation] = useState(selectedLocation || "all")
  const locationUpdateRef = useRef(false)
  const locationSearchFocusedRef = useRef(false)
  const locationSearchSelectionRef = useRef<number | null>(null)
  const isComposingRef = useRef(false) // Track IME composition state
  
  // Sync internal location state with prop when it changes from outside (not from our own selection)
  useEffect(() => {
    if (!locationUpdateRef.current) {
      const newValue = selectedLocation || "all"
      if (newValue !== internalSelectedLocation) {
        setInternalSelectedLocation(newValue)
      }
    }
    locationUpdateRef.current = false
  }, [selectedLocation, internalSelectedLocation])
  // Internal state for search input - completely independent to avoid re-render issues
  const [internalSearchQuery, setInternalSearchQuery] = useState(searchQuery)
  const inputRef = useRef<HTMLInputElement>(null)
  const locationSearchInputRef = useRef<HTMLInputElement>(null)
  const isInternalUpdateRef = useRef(false)
  const wasFocusedRef = useRef(false)
  const selectionStartRef = useRef<number | null>(null)
  
  // Only sync with prop when it changes from outside (e.g., URL change, not from our onChange)
  // Use a ref to track the last prop value
  const lastPropValueRef = useRef(searchQuery)
  
  useEffect(() => {
    // Only sync if prop changed from outside AND we're not currently updating internally
    // AND input is not focused (to prevent losing focus while typing)
    const isInputFocused = document.activeElement === inputRef.current
    
    if (!isInternalUpdateRef.current && searchQuery !== lastPropValueRef.current && !isInputFocused) {
      setInternalSearchQuery(searchQuery)
      lastPropValueRef.current = searchQuery
    }
    // Reset the flag after checking
    isInternalUpdateRef.current = false
    
    // Restore focus if it was focused before
    if (wasFocusedRef.current && inputRef.current && document.activeElement !== inputRef.current) {
      const selectionStart = selectionStartRef.current ?? inputRef.current.value.length
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.setSelectionRange(selectionStart, selectionStart)
        wasFocusedRef.current = false
        selectionStartRef.current = null
      }, 0)
    }
  }, [searchQuery])
  
  // Auto-focus search input when location dropdown opens
  useEffect(() => {
    if (isLocationSelectOpen) {
      // Multiple attempts with increasing delays to handle animation and DOM rendering
      const attemptFocus = (attempt = 0) => {
        if (attempt > 5) return // Max 5 attempts
        
        if (locationSearchInputRef.current && isLocationSelectOpen) {
          locationSearchInputRef.current.focus()
          // Verify focus was successful
          if (document.activeElement === locationSearchInputRef.current) {
            locationSearchFocusedRef.current = true
            return
          }
        }
        
        // Retry with increasing delays
        const delays = [50, 100, 150, 200, 300]
        setTimeout(() => {
          if (isLocationSelectOpen) {
            attemptFocus(attempt + 1)
          }
        }, delays[attempt] || 300)
      }
      
      // Start focusing attempts
      requestAnimationFrame(() => {
        attemptFocus(0)
      })
    }
  }, [isLocationSelectOpen])
  
  // Restore focus after typing if lost due to re-render
  useEffect(() => {
    if (!isLocationSelectOpen || isComposingRef.current || !locationSearchInputRef.current) {
      return
    }
    
    // Always restore focus if dropdown is open and input exists (unless composing)
    if (document.activeElement !== locationSearchInputRef.current && !isComposingRef.current) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (locationSearchInputRef.current && isLocationSelectOpen && !isComposingRef.current) {
            locationSearchInputRef.current.focus()
            locationSearchFocusedRef.current = true
          }
        })
      })
    }
  }, [locationSearchQuery, isLocationSelectOpen])

  // Load provinces
  useEffect(() => {
    const loadProvinces = async () => {
      setLoadingProvinces(true)
      try {
        const data = await ProvincesAPI.getProvinces()
        setProvinces(data)
      } catch (error) {
        console.error('Error loading provinces:', error)
      } finally {
        setLoadingProvinces(false)
      }
    }
    loadProvinces()
  }, [])

  const handleSearchClick = () => {
    // Use internal state for search query
    const trimmedQuery = internalSearchQuery.trim()
    if (onSearchQueryChange && trimmedQuery !== searchQuery) {
      onSearchQueryChange(trimmedQuery)
    }
    if (onSearch) {
      onSearch()
    } else {
      // Default behavior: navigate to /jobs with params
      const params = new URLSearchParams()
      if (trimmedQuery) params.set('search', trimmedQuery)
      if (selectedLocation && selectedLocation !== "all") params.set('location', selectedLocation)
      router.push(`/jobs?${params.toString()}`)
    }
  }

  return (
    <div className={`max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-2 ${className}`}>
      <div className="flex gap-0 items-stretch -space-x-px">
        {/* Location Select */}
        <div className="w-56 relative">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-6 bg-gray-300 z-10 pointer-events-none"></div>
          <Select
            value={internalSelectedLocation}
            onValueChange={(value) => {
              const location = value === "all" ? "" : value
              // Set flag to prevent sync from prop
              locationUpdateRef.current = true
              // Update internal state immediately
              setInternalSelectedLocation(value)
              // Clear location search query
              setLocationSearchQuery("")
              // Update parent component
              onLocationChange?.(location)
              // Close dropdown after selection
              setIsLocationSelectOpen(false)
            }}
            onOpenChange={(open) => {
              setIsLocationSelectOpen(open)
              if (open) {
                // Clear search query when opening
                setLocationSearchQuery("")
                // Mark that we want to focus
                locationSearchFocusedRef.current = true
                // Multiple attempts to focus after dropdown opens
                const attemptFocus = (attempt = 0) => {
                  if (attempt > 4) return
                  
                  if (locationSearchInputRef.current) {
                    locationSearchInputRef.current.focus()
                    if (document.activeElement === locationSearchInputRef.current) {
                      return
                    }
                  }
                  
                  setTimeout(() => {
                    if (open && isLocationSelectOpen) {
                      attemptFocus(attempt + 1)
                    }
                  }, [100, 200, 300, 400][attempt] || 400)
                }
                
                // Start focusing after a short delay
                setTimeout(() => {
                  attemptFocus(0)
                }, 50)
              } else {
                // Clear search when closing
                setLocationSearchQuery("")
                locationSearchFocusedRef.current = false
              }
            }}
            open={isLocationSelectOpen}
          >
            <SelectTrigger className="!h-12 min-h-[48px] border-t border-b border-l border-gray-200 !border-r-0 bg-white rounded-l-2xl rounded-r-none focus:ring-0 focus:ring-offset-0 !px-3 !py-0 flex items-center shadow-none !m-0 h-full w-full">
              <div className="flex items-center w-full h-full gap-2 min-w-0">
                <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <SelectValue placeholder={loadingProvinces ? "Đang tải..." : "Tất cả địa điểm"} className="text-gray-700 !flex-1 text-left truncate" />
              </div>
            </SelectTrigger>
            <SelectContent 
              className="p-0 w-[var(--radix-select-trigger-width)]"
            >
              {/* Search input inside dropdown */}
              <div className="p-3 border-b sticky top-0 bg-white z-10 shadow-sm">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <Input
                    ref={(el) => {
                      locationSearchInputRef.current = el
                      // Focus immediately when input is mounted and dropdown is open
                      if (el && isLocationSelectOpen) {
                        requestAnimationFrame(() => {
                          requestAnimationFrame(() => {
                            if (el && isLocationSelectOpen) {
                              el.focus()
                              locationSearchFocusedRef.current = true
                            }
                          })
                        })
                      }
                    }}
                    placeholder="Tìm kiếm địa điểm..."
                    value={locationSearchQuery}
                    autoFocus
                    onChange={(e) => {
                      e.stopPropagation()
                      const newValue = e.target.value
                      setLocationSearchQuery(newValue)
                    }}
                    onCompositionStart={() => {
                      isComposingRef.current = true
                    }}
                    onCompositionEnd={() => {
                      isComposingRef.current = false
                    }}
                    onKeyDown={(e) => {
                      // Prevent closing dropdown when typing
                      e.stopPropagation()
                      // Close dropdown on Escape
                      if (e.key === 'Escape') {
                        setIsLocationSelectOpen(false)
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => {
                      e.stopPropagation()
                      locationSearchFocusedRef.current = true
                    }}
                    onBlur={(e) => {
                      // Only clear focus ref if blurring to something outside the dropdown
                      // Don't clear if it's just a temporary blur during re-render
                      const relatedTarget = e.relatedTarget as HTMLElement | null
                      if (!relatedTarget || !locationSearchInputRef.current?.closest('[role="listbox"]')?.contains(relatedTarget)) {
                        // Small delay to check if focus will be restored
                        setTimeout(() => {
                          if (document.activeElement !== locationSearchInputRef.current && isLocationSelectOpen) {
                            locationSearchFocusedRef.current = false
                          }
                        }, 100)
                      }
                      isComposingRef.current = false
                    }}
                    className="pl-10 h-9 text-sm focus-visible:ring-2 focus-visible:ring-blue-500"
                  />
                </div>
              </div>
              
              {/* Filtered provinces list */}
              <div className="max-h-60 overflow-y-auto">
                <SelectItem 
                  value="all" 
                  className="cursor-pointer hover:bg-gray-50 focus:bg-gray-50"
                >
                  Tất cả địa điểm
                </SelectItem>
                {provinces
                  .filter((province) => 
                    !locationSearchQuery || 
                    province.name.toLowerCase().includes(locationSearchQuery.toLowerCase())
                  )
                  .map((province) => (
                    <SelectItem 
                      key={province.code} 
                      value={province.name} 
                      className="cursor-pointer hover:bg-gray-50 focus:bg-gray-50"
                    >
                      {province.name}
                    </SelectItem>
                  ))}
                {provinces.filter((province) => 
                  !locationSearchQuery || 
                  province.name.toLowerCase().includes(locationSearchQuery.toLowerCase())
                ).length === 0 && locationSearchQuery && (
                  <div className="px-3 py-6 text-center text-sm text-gray-500">
                    Không tìm thấy địa điểm
                  </div>
                )}
              </div>
            </SelectContent>
          </Select>
        </div>
            
        {/* Keyword Search Input */}
        <div className="flex-1 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-6 bg-gray-300 z-10 pointer-events-none"></div>
          <div className="relative h-12">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Nhập từ khoá theo kỹ năng, chức vụ, công ty..."
              value={internalSearchQuery}
              onChange={(e) => {
                const newValue = e.target.value
                const selectionStart = e.target.selectionStart ?? newValue.length
                isInternalUpdateRef.current = true
                setInternalSearchQuery(newValue)
                lastPropValueRef.current = newValue
                selectionStartRef.current = selectionStart
                // Also call the callback if provided
                onSearchQueryChange?.(newValue)
                // Restore cursor position after state update
                setTimeout(() => {
                  if (inputRef.current && document.activeElement === inputRef.current) {
                    inputRef.current.setSelectionRange(selectionStart, selectionStart)
                  }
                }, 0)
              }}
              onFocus={(e) => {
                wasFocusedRef.current = true
                selectionStartRef.current = e.target.selectionStart
              }}
              onBlur={() => {
                wasFocusedRef.current = false
                selectionStartRef.current = null
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearchClick()
                }
              }}
              className="pl-10 h-12 text-base bg-white border-t border-b border-gray-200 !border-l-0 !border-r-0 rounded-none shadow-none !m-0"
            />
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-6 bg-gray-300 z-10 pointer-events-none"></div>
        </div>
        
        {/* Search Button */}
        <Button 
          size="lg" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 h-12 rounded-l-none rounded-r-2xl border-t border-b border-r border-gray-200 !border-l-0 shadow-none !m-0"
          onClick={handleSearchClick}
        >
          <Search className="w-5 h-5 mr-2" />
          Tìm Kiếm
        </Button>
      </div>
    </div>
  )
})

