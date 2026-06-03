'use client'
import { useDemoStore } from '@/store/demo-store'
import { DashboardHeader } from '@/components/demo/DashboardHeader'
import { AlgorithmSidebar } from '@/components/demo/AlgorithmSidebar'
import { NarrativePanel } from '@/components/demo/NarrativePanel'

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useDemoStore()

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
      background: 'var(--surface-0)',
    }}>
      <DashboardHeader />
      <div style={{
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
        minHeight: 0,
      }}>
        <AlgorithmSidebar />
        {/* Graph canvas slot — children fill this */}
        <div style={{
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
          minWidth: 0,
        }}>
          {children}
        </div>
        <NarrativePanel />
      </div>
    </div>
  )
}
