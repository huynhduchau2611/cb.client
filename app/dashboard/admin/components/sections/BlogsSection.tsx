"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  User,
  Calendar,
  TrendingUp,
  Clock,
} from "lucide-react"
import { AdminBlogsAPI, Blog, formatBlogStatus, formatDate, extractExcerpt, formatReadingTime } from "@/lib/api/blogs"
import { useNotification } from "@/lib/notification-context"
import { Skeleton } from "@/components/ui/skeleton"
import { Pagination } from "@/components/Pagination"

export function BlogsSection() {
  const { showSuccess, showError } = useNotification()
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("pending")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  })
  const [stats, setStats] = useState({
    totalBlogs: 0,
    pendingBlogs: 0,
    approvedBlogs: 0,
    rejectedBlogs: 0,
    totalViews: 0,
  })

  // Reject dialog
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [selectedBlogId, setSelectedBlogId] = useState<string>("")
  const [rejectionReason, setRejectionReason] = useState("")

  // Detail dialog
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null)

  useEffect(() => {
    setPage(1)
    loadStats()
    // loadBlogs will be called by the page effect
  }, [statusFilter])

  useEffect(() => {
    loadBlogs()
  }, [page, statusFilter])

  const loadStats = async () => {
    try {
      const response = await AdminBlogsAPI.getBlogStats()
      setStats(response.data)
    } catch (error: any) {
      console.error("Failed to load stats:", error)
    }
  }

  const loadBlogs = async () => {
    setIsLoading(true)
    try {
      const filters: any = { page, limit: 20 }
      
      if (searchTerm) {
        filters.search = searchTerm
      }
      if (statusFilter !== "all") {
        filters.status = statusFilter
      }

      const response = await AdminBlogsAPI.getAllBlogs(filters)
      setBlogs(response.data.blogs)
      setPagination(response.data.pagination)
    } catch (error: any) {
      showError("Lỗi", error.message || "Không thể tải blogs")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const openDetailDialog = (blog: Blog) => {
    setSelectedBlog(blog)
    setShowDetailDialog(true)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadBlogs()
  }

  const handleApprove = async (blogId: string, blogTitle: string) => {
    if (!confirm(`Bạn có chắc muốn duyệt blog "${blogTitle}"?`)) {
      return
    }

    setActionLoading(true)
    try {
      await AdminBlogsAPI.approveBlog(blogId)
      showSuccess("Duyệt thành công", `Blog "${blogTitle}" đã được duyệt`)
      setPage(1)
      loadBlogs()
    } catch (error: any) {
      showError("Lỗi", error.message || "Không thể duyệt blog")
    } finally {
      setActionLoading(false)
    }
  }

  const openRejectDialog = (blogId: string) => {
    setSelectedBlogId(blogId)
    setRejectionReason("")
    setShowRejectDialog(true)
  }

  const handleReject = async () => {
    if (!selectedBlogId) return

    setActionLoading(true)
    try {
      await AdminBlogsAPI.rejectBlog(selectedBlogId, rejectionReason)
      showSuccess("Từ chối thành công", "Blog đã bị từ chối")
      setShowRejectDialog(false)
      setPage(1)
      loadBlogs()
    } catch (error: any) {
      showError("Lỗi", error.message || "Không thể từ chối blog")
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản Lý Blogs</h1>
        <p className="text-gray-600">Duyệt và quản lý các bài viết blog</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng Blogs</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalBlogs}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Chờ Duyệt</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pendingBlogs}</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đã Duyệt</p>
                <p className="text-3xl font-bold text-green-600">{stats.approvedBlogs}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng Lượt Xem</p>
                <p className="text-3xl font-bold text-purple-600">{stats.totalViews}</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Search */}
            <div className="flex gap-2">
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
              <Button type="submit" disabled={isLoading}>
                Tìm kiếm
              </Button>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Lọc theo:</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="pending">Chờ duyệt</SelectItem>
                  <SelectItem value="approved">Đã duyệt</SelectItem>
                  <SelectItem value="rejected">Từ chối</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-500">
                ({pagination.totalItems} blogs)
              </span>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Blog List */}
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
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : blogs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Không có blog nào</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {blogs.map((blog) => {
            const status = formatBlogStatus(blog.status)
            return (
              <Card key={blog._id} className="hover:shadow-lg transition-shadow">
                {/* Cover Image */}
                {blog.coverImage && (
                  <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                    <Image
                      src={blog.coverImage}
                      alt={blog.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                
                <CardHeader>
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg line-clamp-2 flex-1">{blog.title}</CardTitle>
                      <Badge className={status.color}>{status.text}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {blog.excerpt || extractExcerpt(blog.content, 100)}
                    </p>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Author & Meta */}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{blog.author.fullName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(blog.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{blog.viewCount}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  {blog.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {blog.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDetailDialog(blog)}
                      className="h-9"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Xem Chi Tiết
                    </Button>

                    {blog.status === "pending" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50 h-9"
                          onClick={() => handleApprove(blog._id, blog.title)}
                          disabled={actionLoading}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Duyệt
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-9"
                          onClick={() => openRejectDialog(blog._id)}
                          disabled={actionLoading}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Từ chối
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {blogs.length > 0 && (
        <div className="mt-6">
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            totalItems={pagination.totalItems}
            itemsPerPage={20}
            showInfo={false}
            variant="full"
            disabled={isLoading}
          />
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối Blog</DialogTitle>
            <DialogDescription>
              Vui lòng nhập lý do từ chối blog này
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Lý do từ chối..."
            rows={4}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              disabled={actionLoading}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Từ chối"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent 
          className="max-w-4xl max-h-[90vh] flex flex-col"
          onWheel={(e) => {
            e.stopPropagation()
          }}
          onTouchMove={(e) => {
            e.stopPropagation()
          }}
        >
          {selectedBlog && (
            <>
              <DialogHeader className="flex-shrink-0">
                <div className="flex items-center justify-between gap-4">
                  <DialogTitle className="text-2xl">{selectedBlog.title}</DialogTitle>
                  <Badge className={formatBlogStatus(selectedBlog.status).color}>
                    {formatBlogStatus(selectedBlog.status).text}
                  </Badge>
                </div>
              </DialogHeader>

              <div 
                className="space-y-6 overflow-y-auto flex-1 min-h-0 overscroll-contain"
                onWheel={(e) => {
                  const target = e.currentTarget
                  const isAtTop = target.scrollTop === 0
                  const isAtBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 1
                  
                  if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
                    e.stopPropagation()
                  }
                }}
              >
                {/* Cover Image */}
                {selectedBlog.coverImage && (
                  <div className="relative w-full h-96 rounded-lg overflow-hidden">
                    <Image
                      src={selectedBlog.coverImage}
                      alt={selectedBlog.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                {/* Excerpt */}
                {selectedBlog.excerpt && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-700 italic">{selectedBlog.excerpt}</p>
                  </div>
                )}

                {/* Author & Meta Info */}
                <div className="flex flex-wrap items-center gap-4 py-4 border-y">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-gray-500" />
                    <span className="font-medium">{selectedBlog.author.fullName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <span>{formatDate(selectedBlog.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-gray-500" />
                    <span>{selectedBlog.viewCount} lượt xem</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-500" />
                    <span>{formatReadingTime(selectedBlog.content)}</span>
                  </div>
                </div>

                {/* Tags */}
                {selectedBlog.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedBlog.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Content */}
                <div
                  className="prose prose-lg max-w-none
                    prose-headings:font-bold prose-headings:text-gray-900
                    prose-p:text-gray-700 prose-p:leading-relaxed
                    prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                    prose-strong:text-gray-900 prose-strong:font-semibold
                    prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                    prose-pre:bg-gray-900 prose-pre:text-gray-100
                    prose-img:rounded-lg prose-img:shadow-md
                    prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:py-2 prose-blockquote:px-4
                    prose-ul:list-disc prose-ol:list-decimal
                    prose-li:text-gray-700"
                  dangerouslySetInnerHTML={{ __html: selectedBlog.content }}
                />

                {/* Actions */}
                {selectedBlog.status === "pending" && (
                  <div className="flex justify-end gap-2 pt-4 border-t flex-shrink-0">
                    <Button
                      variant="outline"
                      className="text-green-600 hover:text-green-700 hover:bg-green-50 h-10"
                      onClick={() => {
                        handleApprove(selectedBlog._id, selectedBlog.title)
                        setShowDetailDialog(false)
                      }}
                      disabled={actionLoading}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Duyệt Blog
                    </Button>
                    <Button
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-10"
                      onClick={() => {
                        setShowDetailDialog(false)
                        openRejectDialog(selectedBlog._id)
                      }}
                      disabled={actionLoading}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Từ chối
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

