"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth-context"
import { useNotification } from "@/lib/notification-context"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { Save, Upload } from "lucide-react"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Skeleton } from "@/components/ui/skeleton"
import { userApi, UserProfile } from "@/lib/api/user"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { normalizeAvatarUrl } from "@/lib/utils/avatar"
import { CommentForm, CommentList } from "@/components/comments/CommentList"

export default function ProfilePage() {
  return (
    <ProtectedRoute allowedRoles={["candidate", "employer", "admin"]}>
      <ProfilePageContent />
    </ProtectedRoute>
  )
}

function ProfilePageContent() {
  const { user, updateUser } = useAuth()
  const router = useRouter()
  const { showSuccess, showError } = useNotification()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const hasFetchedRef = useRef(false)

  useEffect(() => {
    // Prevent multiple fetches
    if (hasFetchedRef.current) return
    if (!user?.id) {
      router.push("/login")
      return
    }

    const fetchData = async () => {
      hasFetchedRef.current = true
      setIsLoading(true)
      try {
        const userProfile = await userApi.getProfile()
        setProfile(userProfile)
        // Clear any preview when profile is loaded
        setAvatarPreview(null)
      } catch (error: any) {
        console.error('Failed to fetch profile:', error)
        // Set default profile from user data
        setProfile({
          _id: user.id,
          fullName: user.fullName || '',
          email: user.email,
          role: user.role as 'candidate' | 'employer' | 'admin',
          title: '',
          description: '',
          avatar: user.avatar,
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user?.id, router])

  if (!user) {
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="container mx-auto max-w-2xl">
          <div className="mb-8">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const handleSave = async () => {
    if (!profile) return

    setIsSaving(true)
    try {
      const updatedProfile = await userApi.updateProfile({
        fullName: profile.fullName,
        title: profile.title,
        description: profile.description,
      })
      setProfile(updatedProfile)
      // Update user in auth context
      updateUser({
        fullName: updatedProfile.fullName,
        avatar: updatedProfile.avatar,
      })
      showSuccess("Thành công", "Đã cập nhật thông tin thành công")
    } catch (error: any) {
      console.error('Failed to save profile:', error)
      showError("Lỗi", error.message || "Có lỗi xảy ra khi lưu thông tin")
    } finally {
      setIsSaving(false)
    }
  }

  const userInitials = profile?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-4xl space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Trang Cá Nhân</h1>
          <p className="text-muted-foreground">Cập nhật thông tin cá nhân của bạn</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Thông Tin Cá Nhân</CardTitle>
            <CardDescription>Cập nhật avatar, tên, tiêu đề và mô tả của bạn</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="size-32 border-4 border-gray-200 shadow-lg">
                  <AvatarImage 
                    src={avatarPreview || normalizeAvatarUrl(profile?.avatar)} 
                    alt={profile?.fullName}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                {isUploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return

                    // Validate file size (2MB)
                    if (file.size > 2 * 1024 * 1024) {
                      showError("Lỗi", "Kích thước file không được vượt quá 2MB")
                      return
                    }

                    // Validate file type
                    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
                    if (!validTypes.includes(file.type)) {
                      showError("Lỗi", "Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)")
                      return
                    }

                    // Show preview
                    const reader = new FileReader()
                    reader.onloadend = () => {
                      setAvatarPreview(reader.result as string)
                    }
                    reader.readAsDataURL(file)

                    // Upload avatar
                    setIsUploadingAvatar(true)
                    try {
                      const result = await userApi.uploadAvatar(file)
                      
                      // Reload profile to get the latest data including avatar
                      const updatedProfile = await userApi.getProfile()
                      setProfile(updatedProfile)
                      
                      // Update user in auth context to reflect avatar change immediately
                      if (updatedProfile.avatar) {
                        updateUser({ avatar: updatedProfile.avatar })
                      }
                      setAvatarPreview(null) // Clear preview after successful upload
                      showSuccess("Thành công", "Đã cập nhật ảnh đại diện thành công")
                    } catch (error: any) {
                      console.error('Failed to upload avatar:', error)
                      setAvatarPreview(null) // Clear preview on error
                      showError("Lỗi", error.message || "Có lỗi xảy ra khi tải ảnh lên")
                    } finally {
                      setIsUploadingAvatar(false)
                      // Reset file input
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                      }
                    }
                  }}
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                >
                  <Upload className="w-4 h-4" />
                  {isUploadingAvatar ? "Đang tải lên..." : "Thay đổi ảnh đại diện"}
                </Button>
                <p className="text-xs text-muted-foreground text-center max-w-xs">
                  Chấp nhận: JPEG, PNG, GIF, WebP (tối đa 2MB)
                </p>
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Họ và Tên *</Label>
              <Input
                id="fullName"
                value={profile?.fullName || ''}
                onChange={(e) => profile && setProfile({ ...profile, fullName: e.target.value })}
                placeholder="Nhập họ và tên"
              />
            </div>

            {/* Email (readonly) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={profile?.email || ''} 
                disabled 
                className="bg-muted"
              />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Tiêu đề / Chức danh</Label>
              <Input
                id="title"
                value={profile?.title || ''}
                onChange={(e) => profile && setProfile({ ...profile, title: e.target.value })}
                placeholder="VD: Senior Frontend Developer, Marketing Manager..."
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                {(profile?.title || '').length}/200
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={profile?.description || ''}
                onChange={(e) => profile && setProfile({ ...profile, description: e.target.value })}
                placeholder="Viết mô tả về bản thân, kinh nghiệm, kỹ năng..."
                rows={6}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground">
                {(profile?.description || '').length}/1000
              </p>
            </div>

            {/* Save Button */}
            <Button 
              onClick={handleSave} 
              disabled={isSaving || !profile?.fullName} 
              size="lg" 
              className="w-full gap-2"
            >
              <Save className="w-5 h-5" />
              {isSaving ? "Đang lưu..." : "Lưu thông tin"}
            </Button>
          </CardContent>
        </Card>

        {/* Comments Section */}
        {profile?._id && (
          <Card>
            <CardHeader>
              <CardTitle>Bình luận</CardTitle>
              <CardDescription>Xem các đánh giá về bạn</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Don't show CommentForm for own profile - user can't comment on themselves */}
              <CommentList targetType="user" targetId={profile._id} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
