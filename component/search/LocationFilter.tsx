"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Search, X, ChevronDown } from "lucide-react"
import { JobsAPI } from "@/lib/api/jobs"

interface LocationFilterProps {
  onLocationSelect?: (location: string) => void
  selectedLocation?: string
  className?: string
}

interface LocationOption {
  province: string
  district?: string
  count: number
  fullName: string
}

export function LocationFilter({ 
  onLocationSelect, 
  selectedLocation,
  className = ""
}: LocationFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [locations, setLocations] = useState<LocationOption[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch locations from API
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true)
        const response = await JobsAPI.getJobStats()
        
        // Transform job stats to location options
        const locationOptions: LocationOption[] = response.data.jobsByLocation.map(item => ({
          province: item._id,
          count: item.count,
          fullName: item._id
        }))

        setLocations(locationOptions)
      } catch (error) {
        console.error('Error fetching locations:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLocations()
  }, [])

  // Filter locations based on search query
  const filteredLocations = locations.filter(location =>
    location.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleLocationClick = (location: LocationOption) => {
    onLocationSelect?.(location.fullName)
    setIsOpen(false)
    setSearchQuery("")
  }

  const clearLocation = () => {
    onLocationSelect?.("")
    setIsOpen(false)
    setSearchQuery("")
  }

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-start h-12 text-left bg-white"
      >
        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
        <span className="flex-1 truncate text-gray-700">
          {selectedLocation || "Đà Nẵng"}
        </span>
        <ChevronDown className="w-4 h-4 ml-2 text-gray-400" />
      </Button>

      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-80">
          <CardContent className="p-0">
            {/* Search input */}
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm địa điểm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Location list */}
            <div className="max-h-60 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">
                  Đang tải...
                </div>
              ) : filteredLocations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Không tìm thấy địa điểm
                </div>
              ) : (
                filteredLocations.map((location, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleLocationClick(location)}
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {location.fullName}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {location.count} việc làm
                    </Badge>
                  </div>
                ))
              )}
            </div>

            {/* Popular locations */}
            {!searchQuery && (
              <div className="border-t p-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Địa điểm phổ biến</p>
                <div className="flex flex-wrap gap-2">
                  {locations.slice(0, 5).map((location, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleLocationClick(location)}
                      className="text-xs"
                    >
                      {location.fullName}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Quick location selector component
interface QuickLocationSelectorProps {
  onLocationSelect?: (location: string) => void
  selectedLocation?: string
  className?: string
}

export function QuickLocationSelector({ 
  onLocationSelect, 
  selectedLocation,
  className = ""
}: QuickLocationSelectorProps) {
  const popularLocations = [
    "Hồ Chí Minh",
    "Hà Nội", 
    "Đà Nẵng",
    "Cần Thơ",
    "Hải Phòng",
    "Bình Dương",
    "Đồng Nai",
    "An Giang"
  ]

  return (
    <div className={className}>
      <p className="text-sm font-medium text-gray-700 mb-3">Địa điểm phổ biến</p>
      <div className="flex flex-wrap gap-2">
        {popularLocations.map((location) => (
          <Button
            key={location}
            variant={selectedLocation === location ? "default" : "outline"}
            size="sm"
            onClick={() => onLocationSelect?.(location)}
            className="text-xs"
          >
            {location}
          </Button>
        ))}
      </div>
    </div>
  )
}
