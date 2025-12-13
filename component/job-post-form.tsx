"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useNotification } from "@/lib/notification-context"
import { EmployerJobsAPI } from "@/lib/api/jobs"
import { Loader2, AlertCircle, X } from "lucide-react"
import { checkJobPostingForFraud } from "@/lib/utils/fraud-detection"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface JobPostFormProps {
  onSuccess?: () => void
}

const workTypes = [
  { value: 'full-time', label: 'Toàn thời gian' },
  { value: 'part-time', label: 'Bán thời gian' },
  { value: 'contract', label: 'Hợp đồng' },
  { value: 'internship', label: 'Thực tập' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
]

export function JobPostForm({ onSuccess }: JobPostFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { showSuccess, showError } = useNotification()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [techInput, setTechInput] = useState("")
  const [fraudWarning, setFraudWarning] = useState<{
    isFraud: boolean;
    matchedFields: Record<string, string[]>;
    allMatchedKeywords: string[];
  } | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    salary: "",
    techStack: [] as string[],
    typeWork: "full-time",
    candidateCount: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Validate
      if (!formData.title || !formData.description || !formData.salary || formData.techStack.length === 0 || !formData.candidateCount) {
        throw new Error("Vui lòng điền đầy đủ thông tin")
      }

      // Check for fraud content before submitting
      const fraudCheck = checkJobPostingForFraud({
        title: formData.title,
        description: formData.description,
        techStack: formData.techStack,
      })

      if (fraudCheck.isFraud) {
        const matchedFieldsList = Object.entries(fraudCheck.matchedFields)
          .map(([field, keywords]) => {
            const fieldName = field === 'title' ? 'Tiêu đề' : field === 'description' ? 'Mô tả' : 'Kỹ năng'
            return `${fieldName}: ${keywords.join(', ')}`
          })
          .join('\n')
        
        showError(
          "Cảnh báo: Nội dung có dấu hiệu lừa đảo",
          `Chúng tôi phát hiện các từ khóa đáng ngờ trong nội dung của bạn:\n${matchedFieldsList}\n\nVui lòng kiểm tra và chỉnh sửa nội dung trước khi đăng tin.`
        )
        setIsSubmitting(false)
        return // Chặn submit
      }

      const salaryNumber = parseInt(formData.salary.replace(/[^\d]/g, ''))
      if (isNaN(salaryNumber) || salaryNumber < 1000000) {
        throw new Error("Mức lương phải lớn hơn 1,000,000 VNĐ")
      }

      const candidateCountNumber = parseInt(formData.candidateCount)
      if (isNaN(candidateCountNumber) || candidateCountNumber < 1 || candidateCountNumber > 100) {
        throw new Error("Số lượng ứng viên phải từ 1-100")
      }

      // Call API
      const response = await EmployerJobsAPI.createJob({
        title: formData.title,
        description: formData.description,
        salary: salaryNumber,
        techStack: formData.techStack,
        typeWork: formData.typeWork as any,
        candidateCount: candidateCountNumber,
      })

      showSuccess(
        "Đăng tin thành công!",
        response.data.message || "Tin tuyển dụng của bạn đang chờ admin phê duyệt."
      )
      
      if (response.data.remainingPosts !== undefined) {
        showSuccess(
          "Thông tin gói",
          `Bạn còn ${response.data.remainingPosts} tin có thể đăng.`
        )
      }

      onSuccess?.()
      router.push("/dashboard/employer")
    } catch (error: any) {
      console.error("Error creating job:", error)
      setError(error.message || "Có lỗi xảy ra khi đăng tin")
      
      // Check if it's a plan limit error
      if (error.message && error.message.includes('limit reached')) {
        showError(
          "Đã đạt giới hạn",
          "Bạn đã đạt giới hạn số lượng tin đăng. Vui lòng nâng cấp gói để đăng thêm tin."
        )
      } else {
        showError("Đăng tin thất bại", error.message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value }
      
      // Check for fraud content in real-time
      const fraudCheck = checkJobPostingForFraud({
        title: field === 'title' ? value : newData.title,
        description: field === 'description' ? value : newData.description,
        techStack: newData.techStack,
      })
      
      if (fraudCheck.isFraud) {
        setFraudWarning(fraudCheck)
      } else {
        setFraudWarning(null)
      }
      
      return newData
    })
  }

  const handleAddTech = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && techInput.trim()) {
      e.preventDefault()
      if (!formData.techStack.includes(techInput.trim())) {
        const newTechStack = [...formData.techStack, techInput.trim()]
        setFormData(prev => ({
          ...prev,
          techStack: newTechStack
        }))
        
        // Check for fraud content
        const fraudCheck = checkJobPostingForFraud({
          title: formData.title,
          description: formData.description,
          techStack: newTechStack,
        })
        
        if (fraudCheck.isFraud) {
          setFraudWarning(fraudCheck)
        } else {
          setFraudWarning(null)
        }
      }
      setTechInput("")
    }
  }

  const handleRemoveTech = (tech: string) => {
    setFormData(prev => {
      const newTechStack = prev.techStack.filter(t => t !== tech)
      
      // Check for fraud content
      const fraudCheck = checkJobPostingForFraud({
        title: prev.title,
        description: prev.description,
        techStack: newTechStack,
      })
      
      if (fraudCheck.isFraud) {
        setFraudWarning(fraudCheck)
      } else {
        setFraudWarning(null)
      }
      
      return {
        ...prev,
        techStack: newTechStack
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <p className="font-medium">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {fraudWarning && fraudWarning.isFraud && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Cảnh báo: Nội dung có dấu hiệu lừa đảo</AlertTitle>
          <AlertDescription>
            <p className="mb-2">Chúng tôi phát hiện các từ khóa đáng ngờ trong nội dung của bạn:</p>
            <ul className="list-disc list-inside mb-2">
              {Object.entries(fraudWarning.matchedFields).map(([field, keywords]) => (
                <li key={field}>
                  <strong>{field === 'title' ? 'Tiêu đề' : field === 'description' ? 'Mô tả' : 'Kỹ năng'}:</strong>{' '}
                  {keywords.join(', ')}
                </li>
              ))}
            </ul>
            <p className="text-sm font-medium">
              Vui lòng kiểm tra và chỉnh sửa nội dung. Tin tuyển dụng có nội dung lừa đảo sẽ không được phê duyệt.
            </p>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Thông Tin Cơ Bản</CardTitle>
          <CardDescription>Điền thông tin chung về vị trí tuyển dụng</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Tiêu đề công việc <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Ví dụ: Senior Full Stack Developer"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              maxLength={100}
              required
            />
            <p className="text-xs text-muted-foreground">Tối đa 100 ký tự</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salary">
                Mức lương (VNĐ) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="salary"
                type="number"
                placeholder="Ví dụ: 25000000"
                value={formData.salary}
                onChange={(e) => handleChange("salary", e.target.value)}
                min="1000000"
                required
              />
              <p className="text-xs text-muted-foreground">Tối thiểu 1,000,000 VNĐ</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="candidateCount">
                Số lượng tuyển <span className="text-destructive">*</span>
              </Label>
              <Input
                id="candidateCount"
                type="number"
                placeholder="Ví dụ: 5"
                value={formData.candidateCount}
                onChange={(e) => handleChange("candidateCount", e.target.value)}
                min="1"
                max="100"
                required
              />
              <p className="text-xs text-muted-foreground">Từ 1 đến 100 người</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="typeWork">
              Loại hình công việc <span className="text-destructive">*</span>
            </Label>
            <Select value={formData.typeWork} onValueChange={(value) => handleChange("typeWork", value)} required>
              <SelectTrigger id="typeWork">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {workTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="techStack">
              Công nghệ / Kỹ năng <span className="text-destructive">*</span>
            </Label>
            <Input
              id="techStack"
              placeholder="Nhập kỹ năng và nhấn Enter (Ví dụ: React, Node.js)"
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              onKeyDown={handleAddTech}
            />
            <p className="text-xs text-muted-foreground">Nhấn Enter để thêm kỹ năng</p>
            {formData.techStack.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.techStack.map((tech) => (
                  <Badge key={tech} variant="secondary" className="gap-1">
                    {tech}
                    <button
                      type="button"
                      onClick={() => handleRemoveTech(tech)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mô Tả Công Việc</CardTitle>
          <CardDescription>Mô tả chi tiết về công việc và yêu cầu</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">
              Mô tả công việc <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Mô tả chi tiết về công việc, trách nhiệm, yêu cầu..."
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={10}
              minLength={50}
              required
            />
            <p className="text-xs text-muted-foreground">
              Tối thiểu 50 ký tự. Hiện tại: {formData.description.length} ký tự
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting} className="flex-1 bg-blue-600 hover:bg-blue-700">
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Đang đăng...
            </>
          ) : (
            "Đăng Tin Tuyển Dụng"
          )}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
          Hủy
        </Button>
      </div>
    </form>
  )
}
