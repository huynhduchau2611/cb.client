"use client"

import type React from "react"

import { use, useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { JobsAPI } from "@/lib/api/jobs"
import { applicationsApi } from "@/lib/api/applications"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { notFound } from "next/navigation"
import { Upload, FileText, FormInput } from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { useNotification } from "@/lib/notification-context"

export default function ApplyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useAuth()
  const router = useRouter()
  const [job, setJob] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [applicationType, setApplicationType] = useState<"cv" | "form">("cv")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // CV Upload Form
  const [cvFile, setCvFile] = useState<File | null>(null)

  // Manual Form
  const [formData, setFormData] = useState({
    phone: "",
    skills: "",
    experience: "",
    availability: "",
    additionalInfo: "",
  })

  useEffect(() => {
    loadJob()
  }, [id])

  const loadJob = async () => {
    setIsLoading(true)
    try {
      const response = await JobsAPI.getJobById(id)
      setJob(response.data.post)
    } catch (error) {
      console.error('Error loading job:', error)
      notFound()
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (applicationType === "form") {
      setCvFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }, [applicationType])

  const { showSuccess, showError } = useNotification()

  if (isLoading) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="container mx-auto max-w-3xl">
          <Skeleton className="h-10 w-24 mb-6" />
          
          {/* Job Info Skeleton */}
          <Card className="mb-6">
            <CardHeader>
              <Skeleton className="h-7 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
          </Card>

          {/* Application Type Skeleton */}
          <Card className="mb-6">
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </CardContent>
          </Card>

          {/* Form Skeleton */}
          <Card className="mb-6">
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-24 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-24 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>

          {/* Submit Skeleton */}
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-16 w-full mb-4" />
              <div className="flex gap-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-20" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!job) {
    notFound()
  }

  if (!user || user.role !== "candidate") {
    router.push("/auth/login")
    return null
  }

  const handleCvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (!allowedTypes.includes(file.type)) {
        showError("Lỗi", "Chỉ chấp nhận file PDF, DOC, DOCX")
        e.target.value = ""
        return
      }
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        showError("Lỗi", "Kích thước file không được vượt quá 5MB")
        e.target.value = ""
        return
      }
      setCvFile(file)
      showSuccess("Đã chọn CV", file.name)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate form data
      if (applicationType === "cv" && !cvFile) {
        showError("Lỗi", "Vui lòng chọn file CV")
        setIsSubmitting(false)
        return
      }

      if (applicationType === "form") {
        if (!formData.phone || !formData.skills || !formData.experience || !formData.availability) {
          showError("Lỗi", "Vui lòng điền đầy đủ thông tin")
          setIsSubmitting(false)
          return
        }
      }

      // Create application via API
      await applicationsApi.createApplication(
        id,
        applicationType,
        cvFile || undefined,
        applicationType === "form" ? formData : undefined
      )

      showSuccess("Thành công", "Đơn ứng tuyển đã được gửi thành công!")
      router.push("/applications?success=true")
    } catch (error: any) {
      showError("Lỗi", error.message || "Không thể gửi đơn ứng tuyển. Vui lòng thử lại.")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-3xl">
        {/* Back Button */}
        <Button asChild variant="ghost" className="mb-6">
          <Link href={`/jobs?job_selected=${id}`}>← Quay lại</Link>
        </Button>

        {/* Job Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Ứng Tuyển: {job.title}</CardTitle>
            <CardDescription>{job.company?.name}</CardDescription>
          </CardHeader>
        </Card>

        {/* Application Type Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Chọn Cách Ứng Tuyển</CardTitle>
            <CardDescription>Bạn có thể nộp CV hoặc điền form thông tin</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={applicationType} onValueChange={(value) => setApplicationType(value as "cv" | "form")}>
              <div className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="cv" id="cv" />
                <div className="flex-1">
                  <Label htmlFor="cv" className="cursor-pointer flex items-center gap-2 font-semibold">
                    <Upload className="w-5 h-5" />
                    Nộp CV
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tải lên CV của bạn (PDF, DOC, DOCX) - Phù hợp nếu bạn đã có CV sẵn
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="form" id="form" />
                <div className="flex-1">
                  <Label htmlFor="form" className="cursor-pointer flex items-center gap-2 font-semibold">
                    <FormInput className="w-5 h-5" />
                    Điền Form Thông Tin
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Điền thông tin trực tiếp - Phù hợp nếu bạn chưa có CV hoặc muốn điền nhanh
                  </p>
                </div>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Application Form */}
        <form onSubmit={handleSubmit}>
          {applicationType === "cv" ? (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Tải Lên CV</CardTitle>
                <CardDescription>Chọn file CV của bạn (PDF, DOC, DOCX - Tối đa 5MB)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                    <Input
                      id="cv-upload"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleCvUpload}
                      className="hidden"
                      ref={fileInputRef}
                    />
                    <Label htmlFor="cv-upload" className="flex flex-col items-center gap-2 cursor-pointer">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <FileText className="w-6 h-6 text-primary" />
                        </div>
                        {cvFile ? (
                          <>
                            <p className="font-medium">{cvFile.name}</p>
                            <p className="text-sm text-muted-foreground">{(cvFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                              >
                                Chọn file khác
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setCvFile(null)
                                  if (fileInputRef.current) {
                                    fileInputRef.current.value = ""
                                  }
                                }}
                              >
                                Xóa
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="font-medium">Nhấn để chọn file CV</p>
                            <p className="text-sm text-muted-foreground">hoặc kéo thả file vào đây</p>
                          </>
                        )}
                      </div>
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Thông Tin Ứng Tuyển</CardTitle>
                <CardDescription>Điền thông tin của bạn để nhà tuyển dụng có thể liên hệ</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Số điện thoại <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0912345678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Nhà tuyển dụng sẽ gọi điện cho bạn qua số này</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skills">
                    Kỹ năng <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="skills"
                    placeholder="Ví dụ: Giao tiếp tốt, sử dụng máy tính cơ bản, làm việc nhóm..."
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">
                    Kinh nghiệm làm việc <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="experience"
                    placeholder="Mô tả ngắn gọn kinh nghiệm làm việc của bạn (nếu chưa có kinh nghiệm, hãy ghi 'Chưa có kinh nghiệm')"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="availability">
                    Thời gian có thể làm việc <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="availability"
                    placeholder="Ví dụ: Có thể bắt đầu ngay, hoặc sau 2 tuần..."
                    value={formData.availability}
                    onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalInfo">Thông tin bổ sung (không bắt buộc)</Label>
                  <Textarea
                    id="additionalInfo"
                    placeholder="Thêm bất kỳ thông tin nào bạn muốn nhà tuyển dụng biết..."
                    value={formData.additionalInfo}
                    onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Bằng cách ứng tuyển, bạn đồng ý cho phép nhà tuyển dụng xem thông tin của bạn và liên hệ qua email
                    hoặc điện thoại.
                  </p>
                </div>
                <div className="flex gap-4">
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? "Đang gửi..." : "Gửi Đơn Ứng Tuyển"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => router.back()}>
                    Hủy
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}
