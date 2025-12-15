"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, MapPin, Briefcase, X } from "lucide-react"
import { JobsAPI, Job, SearchSuggestion } from "@/lib/api/jobs"
import Link from "next/link"

interface SearchBarProps {
  placeholder?: string
  onSearch?: (query: string) => void
  onChange?: (query: string) => void
  onLocationSelect?: (location: string) => void
  showSuggestions?: boolean
  className?: string
  value?: string // Allow controlled component
}


export function SearchBar({ 
  placeholder = "Tìm kiếm công việc, kỹ năng...", 
  onSearch,
  onChange,
  onLocationSelect,
  showSuggestions = true,
  className = "",
  value
}: SearchBarProps) {
  // Use controlled value if provided, otherwise use internal state
  const [internalQuery, setInternalQuery] = useState("")
  const query = value !== undefined ? value : internalQuery
  
  // Sync internal state when controlled value changes
  useEffect(() => {
    if (value !== undefined && value !== internalQuery) {
      setInternalQuery(value)
    }
  }, [value])
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestionsList, setShowSuggestionsList] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Debounced search for suggestions
  useEffect(() => {
    if (!query.trim() || !showSuggestions) {
      setSuggestions([])
      setShowSuggestionsList(false)
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true)
      try {
        // Get search suggestions from API - chỉ lấy job và skill
        const response = await JobsAPI.getSearchSuggestions(query, 10)
        // Lọc chỉ lấy job và skill suggestions (không lấy location và company)
        const filteredSuggestions = response.data.suggestions.filter(
          suggestion => suggestion.type === 'job' || suggestion.type === 'skill'
        )
        setSuggestions(filteredSuggestions)
        setShowSuggestionsList(true)
      } catch (error) {
        console.error('Error fetching suggestions:', error)
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query, showSuggestions])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestionsList || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex])
        } else {
          handleSearch()
        }
        break
      case 'Escape':
        setShowSuggestionsList(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const handleSearch = () => {
    if (query.trim()) {
      onSearch?.(query.trim())
      setShowSuggestionsList(false)
    }
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (value === undefined) {
      // Only update internal state if not controlled
      setInternalQuery(suggestion.title)
    }
    onChange?.(suggestion.title)
    setShowSuggestionsList(false)
    setSelectedIndex(-1)
    
    // Chỉ xử lý job và skill, không xử lý location
    onSearch?.(suggestion.title)
  }

  const clearSearch = () => {
    if (value === undefined) {
      // Only update internal state if not controlled
      setInternalQuery("")
    }
    onChange?.("")
    setSuggestions([])
    setShowSuggestionsList(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'job':
        return <Briefcase className="w-4 h-4" />
      case 'company':
        return <Briefcase className="w-4 h-4" />
      case 'location':
        return <MapPin className="w-4 h-4" />
      case 'skill':
        return <Search className="w-4 h-4" />
      default:
        return <Search className="w-4 h-4" />
    }
  }

  const getSuggestionBadgeColor = (type: string) => {
    switch (type) {
      case 'job':
        return 'bg-blue-100 text-blue-700'
      case 'company':
        return 'bg-green-100 text-green-700'
      case 'location':
        return 'bg-purple-100 text-purple-700'
      case 'skill':
        return 'bg-orange-100 text-orange-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            const newValue = e.target.value
            if (value === undefined) {
              // Only update internal state if not controlled
              setInternalQuery(newValue)
            }
            onChange?.(newValue)
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0 && showSuggestions) {
              setShowSuggestionsList(true)
            }
          }}
          className={`pl-10 h-12 text-base bg-white ${showSuggestions ? 'pr-20' : 'pr-4'}`}
        />
        {query && showSuggestions && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-12 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
        {showSuggestions && (
          <Button
            onClick={handleSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-4"
          >
            Tìm kiếm
          </Button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestionsList && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-80 overflow-y-auto">
          <CardContent className="p-0">
            {suggestions.map((suggestion, index) => (
              <div
                key={`${suggestion.type}-${index}`}
                className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                  index === selectedIndex ? 'bg-blue-50' : ''
                } ${index === suggestions.length - 1 ? '' : 'border-b'}`}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className={`p-1.5 rounded-full ${getSuggestionBadgeColor(suggestion.type)}`}>
                  {getSuggestionIcon(suggestion.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {suggestion.title}
                  </p>
                  {suggestion.subtitle && (
                    <p className="text-sm text-gray-500 truncate">
                      {suggestion.subtitle}
                    </p>
                  )}
                </div>
                <Badge variant="secondary" className="text-xs">
                  {suggestion.type === 'job' ? 'Việc làm' :
                   suggestion.type === 'company' ? 'Công ty' :
                   suggestion.type === 'location' ? 'Địa điểm' : 'Kỹ năng'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg p-3 text-center text-gray-500">
          Đang tìm kiếm...
        </div>
      )}
    </div>
  )
}
