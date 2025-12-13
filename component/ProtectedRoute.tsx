"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth, UserRole } from "@/lib/auth-context"
import { useNotification } from "@/lib/notification-context"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
  requireAuth?: boolean
}

export function ProtectedRoute({ 
  children, 
  allowedRoles, 
  requireAuth = true 
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const { showError } = useNotification()

  useEffect(() => {
    if (!isLoading) {
      // Check if authentication is required and user is not logged in
      if (requireAuth && !user) {
        showError("Yêu cầu đăng nhập", "Vui lòng đăng nhập để truy cập trang này")
        router.push("/auth/login")
        return
      }

      // Check if user has required role
      if (user && !allowedRoles.includes(user.role)) {
        showError("Không có quyền truy cập", "Bạn không có quyền truy cập trang này")
        
        // Redirect based on user role
        switch (user.role) {
          case "admin":
            router.push("/dashboard/admin")
            break
          case "employer":
            router.push("/dashboard/employer")
            break
          case "candidate":
            router.push("/")
            break
          default:
            router.push("/")
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoading, requireAuth, router])

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  // If not authenticated and auth is required, don't render children
  if (requireAuth && !user) {
    return null
  }

  // If user doesn't have required role, don't render children
  if (user && !allowedRoles.includes(user.role)) {
    return null
  }

  // User is authenticated and has required role
  return <>{children}</>
}

