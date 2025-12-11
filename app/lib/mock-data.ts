export interface Job {
  id: string
  title: string
  company: string
  companyLogo: string
  location: string
  salary: string
  type: "full-time" | "part-time" | "contract" | "internship"
  level: "entry" | "mid" | "senior" | "manager"
  category: string
  workLocationType: "onsite" | "hybrid" | "remote"
  techStack: string[]
  description: string
  requirements: string[]
  benefits: string[]
  postedDate: string
  applicationCount: number
  employerId: string
  status: "pending" | "approved" | "rejected"
  featured: boolean
}

export interface Application {
  id: string
  jobId: string
  userId: string
  userName: string
  userEmail: string
  cvUrl?: string
  formData?: {
    phone: string
    skills: string
    experience: string
    availability: string
    additionalInfo?: string
  }
  status: "pending" | "reviewed" | "accepted" | "rejected"
  appliedDate: string
}

export interface UserProfile {
  id: string
  name: string
  email: string
  phone?: string
  location?: string
  skills: string[]
  experience: string
  education: string
  bio?: string
  cvUrl?: string
}

export interface User {
  id: string
  name: string
  email: string
  role: "user" | "employer" | "admin"
}

// Mock data has been removed - Data is now fetched from MongoDB via API
// To seed sample data, run: npm run seed:data in careerbridge.server

// Keep only constants/enums that are used for UI

export const categories = [
  "Tất cả",
  "Công nghệ thông tin",
  "Bán hàng",
  "Marketing",
  "Nhà hàng - Khách sạn",
  "Giáo dục",
  "Y tế",
  "Xây dựng",
  "Tài chính",
  "Khác",
]

export const locations = ["Tất cả", "Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ", "Khác"]

export const levels = [
  { value: "all", label: "Tất cả" },
  { value: "entry", label: "Mới bắt đầu" },
  { value: "mid", label: "Trung cấp" },
  { value: "senior", label: "Cao cấp" },
  { value: "manager", label: "Quản lý" },
]

export const jobTypes = [
  { value: "all", label: "Tất cả" },
  { value: "full-time", label: "Toàn thời gian" },
  { value: "part-time", label: "Bán thời gian" },
  { value: "contract", label: "Hợp đồng" },
  { value: "internship", label: "Thực tập" },
]

export const subscriptionPlans = [
  {
    id: "free",
    name: "Miễn Phí",
    price: 0,
    jobPostsPerMonth: 1,
    displayDays: 7,
    maxApplications: -1, // unlimited
    features: ["Đăng 1 tin tuyển dụng", "Hiển thị trong 7 ngày", "Nhận đơn ứng tuyển không giới hạn"],
  },
  {
    id: "basic",
    name: "Cơ Bản",
    price: 299000,
    jobPostsPerMonth: 5,
    displayDays: 14,
    maxApplications: -1, // unlimited
    features: [
      "Đăng 5 tin tuyển dụng",
      "Hiển thị trong 14 ngày mỗi tin",
      "Nhận đơn ứng tuyển không giới hạn",
      "Badge 'Đang tuyển' nổi bật",
    ],
  },
]
