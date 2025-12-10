import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { PartnerTabsProps } from "./types"

export function PartnerTabs({ 
  activeTab, 
  onTabChange, 
  onSearch, 
  searchQuery 
}: PartnerTabsProps) {
  return (
    <Tabs 
      value={activeTab} 
      onValueChange={(value) => {
        if (['pending', 'approved', 'rejected'].includes(value)) {
          onTabChange(value as 'pending' | 'approved' | 'rejected')
        }
      }}
      className="w-full"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <TabsList className="grid w-full sm:w-auto grid-cols-3">
          <TabsTrigger value="pending">Chờ duyệt</TabsTrigger>
          <TabsTrigger value="approved">Đã duyệt</TabsTrigger>
          <TabsTrigger value="rejected">Từ chối</TabsTrigger>
        </TabsList>
        
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Tìm kiếm đối tác..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      </div>
      
      <TabsContent value={activeTab} className="mt-0">
        {/* Content will be rendered by parent */}
      </TabsContent>
    </Tabs>
  )
}
