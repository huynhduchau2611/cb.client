"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { UserBlogsAPI, Blog, formatBlogStatus, formatDate, formatReadingTime } from "@/lib/api/blogs"
import { useNotification } from "@/lib/notification-context"
import { Loader2, ArrowLeft, Edit, Eye, User, Calendar, Clock, AlertCircle } from "lucide-react"

function MyBlogDetailContent() {
  const params = useParams()
  const router = useRouter()
  const { showError } = useNotification()
  const blogId = params.id as string
  
  const [blog, setBlog] = useState<Blog | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (blogId) {
      loadBlog()
    }
  }, [blogId])

  const loadBlog = async () => {
    setIsLoading(true)
    try {
      const response = await UserBlogsAPI.getMyBlogById(blogId)
      setBlog(response.data.blog)
    } catch (error: any) {
      showError("Lỗi", error.message || "Không thể tải blog")
      router.push("/blogs/my-blogs")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600">Đang tải blog...</p>
        </div>
      </div>
    )
  }

  if (!blog) {
    return null
  }

  const status = formatBlogStatus(blog.status)

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push("/blogs/my-blogs")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>

        {/* Status Alert */}
        {blog.status === "rejected" && blog.rejectionReason && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900 mb-1">Blog đã bị từ chối</h4>
                  <p className="text-sm text-red-800"><strong>Lý do:</strong> {blog.rejectionReason}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cover Image */}
        {blog.coverImage && (
          <div className="relative w-full h-96 mb-8 rounded-xl overflow-hidden">
            <Image
              src={blog.coverImage}
              alt={blog.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Blog Content */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4 mb-4">
              <CardTitle className="text-4xl">{blog.title}</CardTitle>
              <Badge className={status.color}>{status.text}</Badge>
            </div>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 pb-6 border-b">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="font-medium">{blog.author.fullName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(blog.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{formatReadingTime(blog.content)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span>{blog.viewCount} lượt xem</span>
              </div>
            </div>

            {/* Tags */}
            {blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-4">
                {blog.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardHeader>

          <CardContent>
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
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />

            {/* Actions */}
            <div className="flex gap-2 mt-8 pt-6 border-t">
              {blog.status !== "approved" && (
                <Button
                  onClick={() => router.push(`/blogs/edit/${blog._id}`)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Chỉnh Sửa
                </Button>
              )}
              {blog.status === "approved" && (
                <Button
                  asChild
                  variant="outline"
                >
                  <Link href={`/blogs/${blog.slug}`} target="_blank">
                    <Eye className="w-4 h-4 mr-2" />
                    Xem Bản Công Khai
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function MyBlogDetailPage() {
  return (
    <ProtectedRoute allowedRoles={["candidate", "employer", "admin"]}>
      <MyBlogDetailContent />
    </ProtectedRoute>
  )
}

