"use client"

import { JobPostForm } from "@/components/job-post-form"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useRouter } from "next/navigation"

export default function PostJobPage() {
  return (
    <ProtectedRoute allowedRoles={["employer"]}>
      <PostJobPageContent />
    </ProtectedRoute>
  )
}

function PostJobPageContent() {
  const router = useRouter()

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Đăng Tin Tuyển Dụng</h1>
          <p className="text-muted-foreground">Điền thông tin để đăng tin tuyển dụng mới</p>
        </div>

        <JobPostForm onSuccess={() => router.push("/dashboard/employer")} />
      </div>
    </div>
  )
}
