import { LayoutDashboard, Briefcase, FileText, Users, Building2, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { AdminSection } from "../types"

interface SidebarProps {
  activeSection: AdminSection
  setActiveSection: (section: AdminSection) => void
  pendingRequestsCount: number
}

const menuItems = [
  { id: 'overview', icon: LayoutDashboard, label: 'Tổng quan' },
  { id: 'jobs', icon: Briefcase, label: 'Tin tuyển dụng' },
  { id: 'blogs', icon: FileText, label: 'Blogs' },
  { id: 'users', icon: Users, label: 'Người dùng' },
  { 
    id: 'partners', 
    icon: Building2, 
    label: 'Đối tác',
    badge: (count: number) => count > 0 ? count : null
  },
  { id: 'settings', icon: Settings, label: 'Cài đặt' },
]

export function Sidebar({ activeSection, setActiveSection, pendingRequestsCount }: SidebarProps) {
  return (
    <aside className="w-64 border-r bg-white">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold">Admin Dashboard</h2>
      </div>
      
      <nav className="p-2">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = activeSection === item.id
            const badgeCount = item.badge ? item.badge(pendingRequestsCount) : null
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveSection(item.id as AdminSection)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-gray-100 text-gray-900" 
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                  {badgeCount !== null && (
                    <span className="ml-auto bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {badgeCount}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
