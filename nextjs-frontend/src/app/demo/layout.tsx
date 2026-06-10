import { DashboardHeader } from '@/components/demo/DashboardHeader'
import { AlgorithmSidebar } from '@/components/demo/AlgorithmSidebar'
import { NarrativePanel } from '@/components/demo/NarrativePanel'

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="demo-shell">
      <DashboardHeader />
      <div className="demo-workspace">
        <AlgorithmSidebar />
        <main className="demo-visual">{children}</main>
        <NarrativePanel />
      </div>
    </div>
  )
}
