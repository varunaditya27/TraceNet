'use client'
import { useEffect } from 'react'
import { loadGraphData } from '@/lib/graph-data'
import { useDemoStore } from '@/store/demo-store'
import { GraphCanvas } from '@/components/demo/GraphCanvas'
import { useGraphAnimation } from '@/hooks/useGraphAnimation'

export default function DemoPage() {
  const { graphData, setGraphData } = useDemoStore()
  useGraphAnimation()

  useEffect(() => {
    loadGraphData().then(setGraphData).catch(console.error)
  }, [setGraphData])

  if (!graphData) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '12px',
      }}>
        <div style={{
          width: '24px',
          height: '24px',
          border: '2px solid var(--surface-3)',
          borderTopColor: 'var(--amber-mid)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--text-2)' }}>
          Loading graph data…
        </span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return <GraphCanvas data={graphData} />
}
