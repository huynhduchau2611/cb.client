"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { useNotification } from "@/lib/notification-context"
import { partnerApi, PartnerRequestData } from "@/lib/api/partner"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Building2, Loader2, Upload, X } from "lucide-react"
import ProvincesAPI, { Province, District, Ward } from "@/lib/api/provinces"
import Image from "next/image"

function PartnerApplyPageContent() {
  const router = useRouter()
  const { user } = useAuth()
  const { showSuccess, showError } = useNotification()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<PartnerRequestData>({
    name: "",
    avatarUrl: "",
    phone: "",
    taxCode: "",
    workingTime: "monday-to-friday",
    size: "1-50",
    typeCompany: "technology",
    provinceCode: "",
    province: "",
    districtCode: "",
    district: "",
    wardCode: "",
    ward: "",
    description: "",
    website: "",
  })

  // Location data states
  const [provinces, setProvinces] = useState<Province[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [wards, setWards] = useState<Ward[]>([])
  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [loadingDistricts, setLoadingDistricts] = useState(false)
  const [loadingWards, setLoadingWards] = useState(false)

  // Logo upload states
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>("")

  // Load provinces on mount
  useEffect(() => {
    loadProvinces()
  }, [])

  const loadProvinces = async () => {
    setLoadingProvinces(true)
    try {
      const data = await ProvincesAPI.getProvinces()
      setProvinces(data)
    } catch (error) {
      showError("Lỗi", "Không thể tải danh sách tỉnh thành")
    } finally {
      setLoadingProvinces(false)
    }
  }

  const loadDistricts = async (provinceCode: number) => {
    setLoadingDistricts(true)
    try {
      const data = await ProvincesAPI.getDistrictsByProvince(provinceCode)
      setDistricts(data)
      setWards([]) // Reset wards when province changes
    } catch (error) {
      showError("Lỗi", "Không thể tải danh sách quận/huyện")
    } finally {
      setLoadingDistricts(false)
    }
  }

  const loadWards = async (districtCode: number) => {
    setLoadingWards(true)
    try {
      const data = await ProvincesAPI.getWardsByDistrict(districtCode)
      setWards(data)
    } catch (error) {
      showError("Lỗi", "Không thể tải danh sách phường/xã")
    } finally {
      setLoadingWards(false)
    }
  }

  const handleProvinceChange = (value: string) => {
    const provinceCode = parseInt(value)
    const selectedProvince = provinces.find(p => p.code === provinceCode)
    
    if (selectedProvince) {
      setFormData(prev => ({
        ...prev,
        provinceCode: selectedProvince.code.toString(),
        province: selectedProvince.name,
        districtCode: "",
        district: "",
        wardCode: "",
        ward: "",
      }))
      setDistricts([])
      setWards([])
      loadDistricts(provinceCode)
    }
  }

  const handleDistrictChange = (value: string) => {
    const districtCode = parseInt(value)
    const selectedDistrict = districts.find(d => d.code === districtCode)
    
    if (selectedDistrict) {
      setFormData(prev => ({
        ...prev,
        districtCode: selectedDistrict.code.toString(),
        district: selectedDistrict.name,
        wardCode: "",
        ward: "",
      }))
      setWards([])
      loadWards(districtCode)
    }
  }

  const handleWardChange = (value: string) => {
    const wardCode = parseInt(value)
    const selectedWard = wards.find(w => w.code === wardCode)
    
    if (selectedWard) {
      setFormData(prev => ({
        ...prev,
        wardCode: selectedWard.code.toString(),
        ward: selectedWard.name,
      }))
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError("Lỗi", "Vui lòng chọn file hình ảnh")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError("Lỗi", "Kích thước file không được vượt quá 5MB")
      return
    }

    setLogoFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeLogo = () => {
    setLogoFile(null)
    setLogoPreview("")
  }

  const handleChange = (field: keyof PartnerRequestData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      showError("Lỗi", "Vui lòng đăng nhập để tiếp tục")
      return
    }

    // Validate logo upload
    if (!logoFile && !logoPreview) {
      showError("Lỗi", "Vui lòng tải lên logo công ty")
      return
    }

    // Validate address selection
    if (!formData.provinceCode || !formData.districtCode || !formData.wardCode) {
      showError("Lỗi", "Vui lòng chọn đầy đủ địa chỉ (Tỉnh/Quận/Phường)")
      return
    }

    // Convert logo file to base64 if exists
    let avatarUrl = formData.avatarUrl
    if (logoFile && logoPreview) {
      avatarUrl = logoPreview // Use base64 data URL
    }

    setIsSubmitting(true)
    try {
      await partnerApi.submitRequest({
        ...formData,
        avatarUrl,
      })
      showSuccess(
        "Đăng ký thành công!",
        "Yêu cầu của bạn đã được gửi. Vui lòng chờ admin phê duyệt."
      )
      router.push("/dashboard/partner/status")
    } catch (error: any) {
      showError("Đăng ký thất bại", error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Trở Thành Đối Tác</h1>
          <p className="text-gray-600">
            Đăng ký để bắt đầu đăng tin tuyển dụng và tìm kiếm ứng viên
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Thông Tin Công Ty</CardTitle>
            <CardDescription>
              Vui lòng điền đầy đủ thông tin công ty của bạn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Section 1: Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Thông Tin Cơ Bản</h3>
                
                {/* Company Name - Full Width */}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Tên Công Ty <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="VD: Công ty TNHH ABC"
                  />
                </div>

                {/* Logo Upload */}
                <div className="space-y-2">
                  <Label htmlFor="logo">
                    Logo Công Ty <span className="text-red-500">*</span>
                  </Label>
                  {logoPreview ? (
                    <div className="relative w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
                      <Image
                        src={logoPreview}
                        alt="Logo preview"
                        fill
                        className="object-contain p-2"
                      />
                      <button
                        type="button"
                        onClick={removeLogo}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer bg-gray-50">
                      <input
                        id="logo"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="logo"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <Upload className="w-12 h-12 text-gray-400" />
                        <p className="text-sm font-medium text-gray-700">
                          Click để chọn logo
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF (Tối đa 5MB)
                        </p>
                      </label>
                    </div>
                  )}
                </div>

                {/* Phone & Tax Code - 2 columns */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      Số Điện Thoại <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder="0123456789"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxCode">
                      Mã Số Thuế <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="taxCode"
                      required
                      value={formData.taxCode}
                      onChange={(e) => handleChange("taxCode", e.target.value)}
                      placeholder="10-13 số"
                      pattern="^\d{10,13}$"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Company Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Chi Tiết Công Ty</h3>
                
                {/* Type, Size, Working Time - 3 columns */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="typeCompany">
                      Lĩnh Vực <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.typeCompany}
                      onValueChange={(value) => handleChange("typeCompany", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technology">Công Nghệ</SelectItem>
                        <SelectItem value="finance">Tài Chính</SelectItem>
                        <SelectItem value="healthcare">Y Tế</SelectItem>
                        <SelectItem value="education">Giáo Dục</SelectItem>
                        <SelectItem value="retail">Bán Lẻ</SelectItem>
                        <SelectItem value="manufacturing">Sản Xuất</SelectItem>
                        <SelectItem value="consulting">Tư Vấn</SelectItem>
                        <SelectItem value="media">Truyền Thông</SelectItem>
                        <SelectItem value="real-estate">Bất Động Sản</SelectItem>
                        <SelectItem value="startup">Startup</SelectItem>
                        <SelectItem value="other">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="size">
                      Quy Mô <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.size}
                      onValueChange={(value: any) => handleChange("size", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-50">1-50 nhân viên</SelectItem>
                        <SelectItem value="51-200">51-200 nhân viên</SelectItem>
                        <SelectItem value="201-500">201-500 nhân viên</SelectItem>
                        <SelectItem value="501-1000">501-1000 nhân viên</SelectItem>
                        <SelectItem value="1000+">1000+ nhân viên</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="workingTime">
                      Thời Gian Làm Việc <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.workingTime}
                      onValueChange={(value: any) => handleChange("workingTime", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monday-to-friday">Thứ 2 - Thứ 6</SelectItem>
                        <SelectItem value="monday-to-saturday">Thứ 2 - Thứ 7</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Section 3: Address */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Địa Chỉ Công Ty</h3>
                
                {/* Province, District, Ward - 3 columns on desktop, stack on mobile */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="province">
                      Tỉnh/Thành Phố <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.provinceCode}
                      onValueChange={handleProvinceChange}
                      disabled={loadingProvinces}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingProvinces ? "Đang tải..." : "Chọn tỉnh/thành phố"} />
                      </SelectTrigger>
                      <SelectContent>
                        {provinces.map((province) => (
                          <SelectItem key={province.code} value={province.code.toString()}>
                            {province.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="district">
                      Quận/Huyện <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.districtCode}
                      onValueChange={handleDistrictChange}
                      disabled={!formData.provinceCode || loadingDistricts}
                    >
                      <SelectTrigger>
                        <SelectValue 
                          placeholder={
                            !formData.provinceCode 
                              ? "Chọn tỉnh trước" 
                              : loadingDistricts 
                              ? "Đang tải..." 
                              : "Chọn quận/huyện"
                          } 
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {districts.map((district) => (
                          <SelectItem key={district.code} value={district.code.toString()}>
                            {district.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ward">
                      Phường/Xã <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.wardCode}
                      onValueChange={handleWardChange}
                      disabled={!formData.districtCode || loadingWards}
                    >
                      <SelectTrigger>
                        <SelectValue 
                          placeholder={
                            !formData.districtCode 
                              ? "Chọn quận trước" 
                              : loadingWards 
                              ? "Đang tải..." 
                              : "Chọn phường/xã"
                          } 
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {wards.map((ward) => (
                          <SelectItem key={ward.code} value={ward.code.toString()}>
                            {ward.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Section 4: Additional Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Thông Tin Bổ Sung</h3>
                
                {/* Website */}
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleChange("website", e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Giới Thiệu Công Ty</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    placeholder="Giới thiệu ngắn gọn về công ty, văn hóa làm việc, môi trường..."
                    rows={6}
                    maxLength={2000}
                    className="resize-none"
                  />
                  <p className="text-sm text-gray-500">
                    {formData.description?.length || 0}/2000 ký tự
                  </p>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                  className="flex-1 md:flex-initial md:min-w-[150px]"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 md:flex-initial md:min-w-[200px] bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang gửi yêu cầu...
                    </>
                  ) : (
                    <>
                      <Building2 className="w-4 h-4 mr-2" />
                      Gửi Đăng Ký
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function PartnerApplyPage() {
  return (
    <ProtectedRoute allowedRoles={["candidate", "employer", "admin"]}>
      <PartnerApplyPageContent />
    </ProtectedRoute>
  )
}

