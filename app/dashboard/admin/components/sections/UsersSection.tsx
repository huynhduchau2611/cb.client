"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, User, Mail, Phone, UserPlus, Loader2, Calendar, Shield } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { AdminJobsAPI } from "@/lib/api/admin"
import { useNotification } from "@/lib/notification-context"
import { Pagination } from "@/components/Pagination"
import { getRoleName } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { config } from "@/lib/config"

interface UserData {
  _id: string
  fullName: string
  email: string
  role: string
  phone?: string
  avatar?: string
  isActive?: boolean
  createdAt: string
  updatedAt?: string
}

interface UserDetail extends UserData {
  updatedAt: string
}

export function UsersSection() {
  const { showError, showSuccess } = useNotification()
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  // User detail dialog
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [page, searchTerm])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const response = await AdminJobsAPI.getAllUsers({
        page,
        limit: 10,
        search: searchTerm || undefined,
        includeInactive: true, // Include locked users
      })
      setUsers(response.data.users)
      setTotalPages(response.data.pagination.pages)
      setTotal(response.data.pagination.total)
    } catch (error: any) {
      showError('Lỗi', error.message || 'Không thể tải danh sách người dùng')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    loadUsers()
  }

  const openDetailDialog = async (userId: string) => {
    setLoadingDetail(true)
    setShowDetailDialog(true)
    try {
      const response = await AdminJobsAPI.getUserById(userId)
      setSelectedUser(response.data.user as UserDetail)
    } catch (error: any) {
      showError('Lỗi', error.message || 'Không thể tải thông tin người dùng')
      setShowDetailDialog(false)
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    setActionLoading(userId)
    try {
      const response = await AdminJobsAPI.toggleUserStatus(userId)
      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user._id === userId
            ? { ...user, isActive: response.data.user.isActive }
            : user
        )
      )
      // Update selected user if dialog is open
      if (selectedUser && selectedUser._id === userId) {
        setSelectedUser({ ...selectedUser, isActive: response.data.user.isActive })
      }
      showSuccess(
        'Thành công',
        response.data.user.isActive ? 'Đã mở khóa tài khoản người dùng' : 'Đã khóa tài khoản người dùng'
      )
    } catch (error: any) {
      showError('Lỗi', error.message || 'Không thể thay đổi trạng thái tài khoản')
    } finally {
      setActionLoading(null)
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="default">Quản trị viên</Badge>
      case 'employer':
        return <Badge variant="secondary">Nhà tuyển dụng</Badge>
      case 'candidate':
        return <Badge variant="outline">Ứng viên</Badge>
      default:
        return <Badge variant="outline">Khách</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý người dùng</h1>
          <p className="text-gray-600">Xem và quản lý tất cả người dùng trong hệ thống</p>
        </div>
        <Button>
          <UserPlus className="w-4 h-4 mr-2" />
          Thêm người dùng
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Danh sách người dùng</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Tìm kiếm người dùng..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Không tìm thấy người dùng nào</p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
              <div key={user._id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12 border-2 border-gray-200">
                      <AvatarImage 
                        src={
                          user.avatar
                            ? (user.avatar.startsWith('http://') || user.avatar.startsWith('https://')
                                ? user.avatar
                                : user.avatar.startsWith('/uploads')
                                ? `${config.api.baseUrl.replace('/api', '')}${user.avatar}`
                                : `${config.api.baseUrl}${user.avatar}`)
                            : undefined
                        }
                        alt={user.fullName}
                      />
                      <AvatarFallback className="bg-gray-100 text-gray-600">
                        {user.fullName?.charAt(0).toUpperCase() || <User className="h-6 w-6" />}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{user.fullName}</h3>
                        {getRoleBadge(user.role)}
                        {user.isActive === false && (
                          <Badge variant="destructive">Đã khóa</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <Mail className="h-4 w-4" />
                        <span>{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Tham gia ngày: {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openDetailDialog(user._id)}
                    >
                      Chi tiết
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className={user.isActive === false ? "text-green-600" : "text-destructive"}
                      onClick={() => handleToggleUserStatus(user._id, user.isActive !== false)}
                      disabled={actionLoading === user._id}
                    >
                      {actionLoading === user._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : user.isActive === false ? (
                        'Mở khóa'
                      ) : (
                        'Khóa'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              ))}
            </div>
          )}
          {!loading && users.length > 0 && (
            <div className="mt-6">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                disabled={loading}
                variant="simple"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết người dùng</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về người dùng
            </DialogDescription>
          </DialogHeader>
          
          {loadingDetail ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : selectedUser ? (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20 border-2 border-gray-200">
                  <AvatarImage 
                    src={
                      selectedUser.avatar
                        ? (selectedUser.avatar.startsWith('http://') || selectedUser.avatar.startsWith('https://')
                            ? selectedUser.avatar
                            : selectedUser.avatar.startsWith('/uploads')
                            ? `${config.api.baseUrl.replace('/api', '')}${selectedUser.avatar}`
                            : `${config.api.baseUrl}${selectedUser.avatar}`)
                        : undefined
                    }
                    alt={selectedUser.fullName} 
                  />
                  <AvatarFallback className="text-2xl bg-gray-100 text-gray-600">
                    {selectedUser.fullName?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold">{selectedUser.fullName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {getRoleBadge(selectedUser.role)}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{selectedUser.email}</p>
                  </div>
                </div>
                
                {selectedUser.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Số điện thoại</p>
                      <p className="font-medium">{selectedUser.phone}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Ngày tham gia</p>
                    <p className="font-medium">
                      {new Date(selectedUser.createdAt).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {selectedUser.updatedAt && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Cập nhật lần cuối</p>
                      <p className="font-medium">
                        {new Date(selectedUser.updatedAt).toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Vai trò</p>
                    <p className="font-medium">{getRoleName(selectedUser.role)}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
