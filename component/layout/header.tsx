"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Menu, X, User, LogOut, Settings, MessageCircle, Briefcase, BookOpen, DollarSign, Handshake } from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { getRoleName } from "@/lib/utils"
import { normalizeAvatarUrl } from "@/lib/utils/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-gray-200">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="CareerBridge"
            width={40}
            height={40}
            className="w-10 h-10 object-cover rounded-full"
            priority
          />
          <span className="font-bold text-xl text-gray-900">
            CareerBridge
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/jobs" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-1.5">
            <Briefcase className="w-4 h-4" />
            Tìm Việc
          </Link>
          <Link href="/blogs" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" />
            Blogs
          </Link>
          {user && (
            <Link href="/chat" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4" />
              Chat
            </Link>
          )}
          <Link href="/pricing" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-1.5">
            <DollarSign className="w-4 h-4" />
            Bảng Giá
          </Link>
          {user?.role === "candidate" && (
            <Link href="/dashboard/partner/apply" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-1.5">
              <Handshake className="w-4 h-4" />
              Trở Thành Đối Tác
            </Link>
          )}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2 text-gray-700 hover:bg-gray-100 rounded-full px-3 py-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={normalizeAvatarUrl(user.avatar)} alt={user.fullName} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-medium">
                      {user.fullName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block">{user.fullName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex items-center gap-2">
                  <Link href={user.id ? `/users/${user.id}` : '/profile'} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={normalizeAvatarUrl(user.avatar)} alt={user.fullName} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-medium">
                        {user.fullName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.fullName}</p>
                      <p className="text-xs text-gray-500">{getRoleName(user.role)}</p>
                    </div>
                  </Link>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Chỉnh sửa hồ sơ
                  </Link>
                </DropdownMenuItem>
                {user.role === 'employer' && (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/employer" className="cursor-pointer flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                {user.role === 'admin' && (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/admin" className="cursor-pointer flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Admin Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer flex items-center gap-2 text-red-600">
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="text-gray-700">
                <Link href="/auth/login">Đăng Nhập</Link>
              </Button>
              <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Link href="/auth/register">Đăng Ký</Link>
              </Button>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-gray-700"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white border-gray-200">
          <nav className="container mx-auto flex flex-col gap-4 p-4">
            <Link
              href="/jobs"
              className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-1.5"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Briefcase className="w-4 h-4" />
              Tìm Việc
            </Link>
            <Link
              href="/blogs"
              className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-1.5"
              onClick={() => setMobileMenuOpen(false)}
            >
              <BookOpen className="w-4 h-4" />
              Blogs
            </Link>
            {user && (
              <Link
                href="/chat"
                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-1.5"
                onClick={() => setMobileMenuOpen(false)}
              >
                <MessageCircle className="w-4 h-4" />
                Chat
              </Link>
            )}
            <Link
              href="/pricing"
              className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-1.5"
              onClick={() => setMobileMenuOpen(false)}
            >
              <DollarSign className="w-4 h-4" />
              Bảng Giá
            </Link>
            {user?.role === "candidate" && (
              <Link
                href="/dashboard/partner/apply"
                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-1.5"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Handshake className="w-4 h-4" />
                Trở Thành Đối Tác
              </Link>
            )}
            {user ? (
              <>
                <div className="border-t pt-4 space-y-2">
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={normalizeAvatarUrl(user.avatar)} alt={user.fullName} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium">
                        {user.fullName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">{user.fullName}</p>
                      <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                    </div>
                  </div>
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 p-2 rounded-lg hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    Chỉnh sửa hồ sơ
                  </Link>
                  {user.role === 'employer' && (
                    <Link
                      href="/dashboard/employer"
                      className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 p-2 rounded-lg hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      Dashboard
                    </Link>
                  )}
                  {user.role === 'admin' && (
                    <Link
                      href="/dashboard/admin"
                      className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 p-2 rounded-lg hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      Admin Dashboard
                    </Link>
                  )}
                </div>
                <Button
                  onClick={() => {
                    logout()
                    setMobileMenuOpen(false)
                  }}
                  variant="ghost"
                  size="sm"
                  className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="justify-start text-gray-700">
                  <Link href="/auth/login">Đăng Nhập</Link>
                </Button>
                <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Link href="/auth/register">Đăng Ký</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
