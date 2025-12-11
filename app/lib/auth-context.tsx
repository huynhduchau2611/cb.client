"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { config } from "./config"
import { useNotification } from "./notification-context"

export type UserRole = "candidate" | "employer" | "admin"

export interface User {
  id: string
  fullName: string
  email: string
  role: UserRole
  phone?: string
  avatar?: string
  isActive: boolean
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  register: (fullName: string, email: string, password: string, role?: UserRole) => Promise<void>
  refreshUserToken: () => Promise<void>
  updateUser: (userData: Partial<User>) => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_BASE_URL = "http://localhost:4000/"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { showSuccess, showError } = useNotification()

  useEffect(() => {
    // Check for stored user and token on mount
    const storedUser = localStorage.getItem("user")
    const storedToken = localStorage.getItem("token")
    
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('Error parsing stored user:', error)
        localStorage.removeItem("user")
        localStorage.removeItem("token")
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Login failed')
      }

      const { user: userData, token } = data.data
      
      setUser(userData)
      localStorage.setItem("user", JSON.stringify(userData))
      localStorage.setItem("token", token)

      // Redirect based on user role after login
      showSuccess("Đăng nhập thành công!", "Chào mừng bạn quay trở lại")
      
      switch (userData.role) {
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
    } catch (error) {
      console.error('Login error:', error)
      showError("Đăng nhập thất bại", error instanceof Error ? error.message : "Có lỗi xảy ra")
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    showSuccess("Đăng xuất thành công", "Hẹn gặp lại bạn!")
    router.push("/")
  }

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData }
      setUser(updatedUser)
      localStorage.setItem("user", JSON.stringify(updatedUser))
    }
  }

  const refreshUserToken = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No token found")
      }

      const response = await fetch(`${API_BASE_URL}api/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to refresh token')
      }

      const { user: userData, token: newToken } = data.data
      
      // Update user and token in state and localStorage
      setUser(userData)
      localStorage.setItem("user", JSON.stringify(userData))
      localStorage.setItem("token", newToken)
    } catch (error) {
      console.error('Refresh token error:', error)
      // If refresh fails, logout the user
      logout()
      throw error
    }
  }

  const register = async (fullName: string, email: string, password: string, role: UserRole = 'candidate') => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fullName, email, password, role }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed')
      }

      const { user: userData, token } = data.data
      
      setUser(userData)
      localStorage.setItem("user", JSON.stringify(userData))
      localStorage.setItem("token", token)

      // Redirect to login page after registration
      showSuccess("Đăng ký thành công!", "Vui lòng đăng nhập để tiếp tục")
      router.push("/auth/login")
    } catch (error) {
      console.error('Registration error:', error)
      showError("Đăng ký thất bại", error instanceof Error ? error.message : "Có lỗi xảy ra")
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return <AuthContext.Provider value={{ user, login, logout, register, refreshUserToken, updateUser, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
