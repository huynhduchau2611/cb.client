"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PublicBlogsAPI, Blog, formatDate, extractExcerpt, formatReadingTime } from "@/lib/api/blogs"
import { Loader2, Search, FileText, User, Calendar, Clock, PenSquare } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function BlogsPage() {
  const { user } = useAuth()
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTag, setSelectedTag] = useState<string>("")
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  })

  useEffect(() => {
    loadBlogs()
  }, [])

  const loadBlogs = async () => {
    setIsLoading(true)
    try {
      const filters: any = { page: 1, limit: 12 }
      if (searchTerm) {
        filters.search = searchTerm
      }
      if (selectedTag) {
        filters.tag = selectedTag
      }

      const response = await PublicBlogsAPI.getBlogs(filters)
      setBlogs(response.data.blogs)
      setPagination(response.data.pagination)
    } catch (error) {
      console.error("Error loading blogs:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadBlogs()
  }

  // Get all unique tags from blogs
  const allTags = Array.from(new Set(blogs.flatMap(blog => blog.tags)))

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600">Đang tải blogs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Blog CareerBridge
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
            Khám phá kiến thức, kinh nghiệm và câu chuyện nghề nghiệp từ cộng đồng
          </p>
          
          {/* Action Buttons */}
          <div className="flex justify-center gap-3">
            {user ? (
              <>
                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                  <Link href="/blogs/write">
                    <PenSquare className="w-4 h-4 mr-2" />
                    Viết Blog Mới
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/blogs/my-blogs">
                    <FileText className="w-4 h-4 mr-2" />
                    Blogs Của Tôi
                  </Link>
                </Button>
              </>
            ) : (
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <Link href="/auth/login">
                  <PenSquare className="w-4 h-4 mr-2" />
                  Đăng nhập để viết Blog
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Search */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="search"
                  placeholder="Tìm kiếm blog..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Tìm kiếm
              </Button>
            </form>

            {/* Tags Filter */}
            {allTags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-sm text-gray-600 py-2">Tags:</span>
                <Button
                  variant={selectedTag === "" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedTag("")
                    loadBlogs()
                  }}
                >
                  Tất cả
                </Button>
                {allTags.map((tag) => (
                  <Button
                    key={tag}
                    variant={selectedTag === tag ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedTag(tag)
                      loadBlogs()
                    }}
                  >
                    #{tag}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Blog Grid */}
        {blogs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Chưa có blog nào</h3>
              <p className="text-gray-600">
                {searchTerm
                  ? "Không tìm thấy blog phù hợp với tìm kiếm của bạn."
                  : "Hiện chưa có blog nào được đăng."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog) => (
              <Card key={blog._id} className="hover:shadow-lg transition-shadow overflow-hidden group">
                <Link href={`/blogs/${blog.slug}`}>
                  {/* Cover Image */}
                  {blog.coverImage ? (
                    <div className="relative h-48 w-full overflow-hidden bg-gray-200">
                      <Image
                        src={blog.coverImage}
                        alt={blog.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="h-48 w-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <FileText className="w-16 h-16 text-white opacity-50" />
                    </div>
                  )}

                  <CardHeader>
                    <CardTitle className="text-xl group-hover:text-blue-600 transition-colors line-clamp-2">
                      {blog.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-3">
                      {blog.excerpt || extractExcerpt(blog.content, 120)}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    {/* Meta Info */}
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{blog.author.fullName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(blog.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>{formatReadingTime(blog.content)}</span>
                      </div>
                      
                      {/* Tags */}
                      {blog.tags.length > 0 && (
                        <div className="flex gap-1">
                          {blog.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination Info */}
        {blogs.length > 0 && (
          <div className="mt-8 text-center text-gray-600">
            Hiển thị {blogs.length} / {pagination.totalItems} blogs
          </div>
        )}
      </div>
    </div>
  )
}

