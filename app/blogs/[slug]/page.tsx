"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PublicBlogsAPI, Blog, formatDate, formatReadingTime } from "@/lib/api/blogs"
import { Loader2, ArrowLeft, User, Calendar, Clock, Eye, Share2 } from "lucide-react"

export default function BlogDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const [blog, setBlog] = useState<Blog | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (slug) {
      loadBlog()
    }
  }, [slug])

  const loadBlog = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await PublicBlogsAPI.getBlogBySlug(slug)
      setBlog(response.data.blog)
    } catch (error: any) {
      setError(error.message || "Không thể tải blog")
    } finally {
      setIsLoading(false)
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: blog?.title,
        text: blog?.excerpt,
        url: window.location.href,
      })
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert("Đã sao chép link!")
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

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-semibold mb-2">Không tìm thấy blog</h3>
            <p className="text-gray-600 mb-4">{error || "Blog này không tồn tại hoặc đã bị xóa."}</p>
            <Button
              onClick={() => router.push("/blogs")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại danh sách
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>

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
          <CardContent className="pt-8">
            {/* Title */}
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {blog.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6 pb-6 border-b">
              <div className="flex items-center gap-2">
                {blog.author.avatar ? (
                  <Image
                    src={blog.author.avatar}
                    alt={blog.author.fullName}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                )}
                <span className="font-medium text-gray-900">{blog.author.fullName}</span>
              </div>

              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(blog.createdAt)}</span>
              </div>

              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatReadingTime(blog.content)}</span>
              </div>

              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{blog.viewCount} lượt xem</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="ml-auto"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Chia sẻ
              </Button>
            </div>

            {/* Tags */}
            {blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {blog.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="bg-blue-100 text-blue-800">
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
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />
          </CardContent>
        </Card>

        {/* Author Card */}
        <Card className="mt-8">
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              {blog.author.avatar ? (
                <Image
                  src={blog.author.avatar}
                  alt={blog.author.fullName}
                  width={64}
                  height={64}
                  className="rounded-full"
                />
              ) : (
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-lg">{blog.author.fullName}</h3>
                <p className="text-gray-600">Tác giả</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back to List */}
        <div className="mt-8 text-center">
          <Button
            onClick={() => router.push("/blogs")}
            variant="outline"
            className="w-full md:w-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Xem thêm blog khác
          </Button>
        </div>
      </div>
    </div>
  )
}

