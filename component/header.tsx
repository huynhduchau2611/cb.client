"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState } from "react"
import { useAuth } from "@/hooks/useAuth" // Assuming useAuth is a custom hook
import { X, Menu } from "lucide-react" // Assuming X and Menu are icons from lucide-react

export function Header() {
  const { user, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl md:text-2xl font-bold text-primary">
          ViecLam.vn
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/search" className="hover:text-primary transition-colors">
            Tìm Việc
          </Link>
          <Link href="/browse" className="hover:text-primary transition-colors">
            Khám Phá
          </Link>
          <Link href="/blogs" className="hover:text-primary transition-colors">
            Blogs
          </Link>
          <Link href="/pricing" className="hover:text-primary transition-colors">
            Bảng Giá
          </Link>
          {user ? (
            <>
              {user.role === "user" && (
                <Link href="/profile" className="hover:text-primary transition-colors">
                  Hồ Sơ
                </Link>
              )}
              <Link
                href={
                  user.role === "admin"
                    ? "/dashboard/admin"
                    : user.role === "employer"
                      ? "/dashboard/employer"
                      : "/profile"
                }
                className="hover:text-primary transition-colors"
              >
                Dashboard
              </Link>
              <Button variant="outline" onClick={logout}>
                Đăng Xuất
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" asChild>
                <Link href="/login">Đăng Nhập</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Đăng Ký</Link>
              </Button>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
            <Link href="/search" className="hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>
              Tìm Việc
            </Link>
            <Link href="/browse" className="hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>
              Khám Phá
            </Link>
            <Link href="/blogs" className="hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>
              Blogs
            </Link>
            <Link href="/pricing" className="hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>
              Bảng Giá
            </Link>
            {user ? (
              <>
                {user.role === "user" && (
                  <Link
                    href="/profile"
                    className="hover:text-primary transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Hồ Sơ
                  </Link>
                )}
                <Link
                  href={
                    user.role === "admin"
                      ? "/dashboard/admin"
                      : user.role === "employer"
                        ? "/dashboard/employer"
                        : "/profile"
                  }
                  className="hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Button
                  variant="outline"
                  onClick={() => {
                    logout()
                    setIsMenuOpen(false)
                  }}
                >
                  Đăng Xuất
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                    Đăng Nhập
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                    Đăng Ký
                  </Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
