import dynamic from 'next/dynamic'
import { AdminDashboardProps } from "../types"

// Dynamically import components with no SSR
const OverviewSection = dynamic(
  () => import('./sections/OverviewSection').then(mod => mod.OverviewSection),
  { ssr: false }
)

const JobsSection = dynamic(
  () => import('./sections/JobsSection').then(mod => mod.JobsSection),
  { ssr: false }
)

const UsersSection = dynamic(
  () => import('./sections/UsersSection').then(mod => mod.UsersSection),
  { ssr: false }
)

const PartnersSection = dynamic(
  () => import('./sections/PartnersSection').then(mod => mod.PartnersSection),
  { ssr: false }
)

const SettingsSection = dynamic(
  () => import('./sections/SettingsSection').then(mod => mod.SettingsSection),
  { ssr: false }
)

const BlogsSection = dynamic(
  () => import('./sections/BlogsSection').then(mod => mod.BlogsSection),
  { ssr: false }
)

export function AdminDashboardContent(props: AdminDashboardProps) {
  return (
    <main className="flex-1 p-8">
      <div className="max-w-6xl mx-auto">
        {props.activeSection === "overview" && <OverviewSection {...props} />}
        {props.activeSection === "jobs" && <JobsSection />}
        {props.activeSection === "blogs" && <BlogsSection />}
        {props.activeSection === "users" && <UsersSection />}
        {props.activeSection === "partners" && <PartnersSection {...props} />}
        {props.activeSection === "settings" && <SettingsSection />}
      </div>
    </main>
  )
}
