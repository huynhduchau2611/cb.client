import dynamic from 'next/dynamic'
import { AdminDashboardProps } from "../types"

// Dynamically import components with no SSR
const Sidebar = dynamic(
  () => import('./Sidebar').then(mod => mod.Sidebar),
  { ssr: false }
)

const AdminDashboardContent = dynamic(
  () => import('./AdminDashboardContent').then(mod => mod.AdminDashboardContent),
  { ssr: false }
)

export function AdminLayout(props: AdminDashboardProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar 
        activeSection={props.activeSection}
        setActiveSection={props.setActiveSection}
        pendingRequestsCount={props.pagination.totalItems}
      />
      
      <AdminDashboardContent {...props} />
    </div>
  )
}
