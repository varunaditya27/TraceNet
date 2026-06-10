'use client'
import { useDemoStore } from '@/store/demo-store'
import { ALGORITHM_META } from '@/lib/constants'
import type { AlgorithmId } from '@/lib/graph-data'

const GROUPS: { unit: string; ids: AlgorithmId[] }[] = [
  { unit: 'UNIT II', ids: ['bfs', 'scc', 'topo_sort'] },
  { unit: 'UNIT III', ids: ['boyer_moore'] },
  { unit: 'UNIT IV', ids: ['dijkstra', 'floyd_warshall', 'greedy_contain'] },
  { unit: 'UNIT V', ids: ['bnb_contain'] },
]

export function AlgorithmSidebar() {
  const { selectedAlgo, setAlgo, sidebarCollapsed, toggleSidebar } = useDemoStore()

  return (
    <aside className={`algorithm-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      {/* Toggle button */}
      <button
        onClick={toggleSidebar}
        title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          position: 'absolute',
          top: '12px',
          right: '8px',
          width: '24px', height: '24px',
          background: 'none',
          border: '1px solid var(--surface-3)',
          borderRadius: '4px',
          cursor: 'pointer',
          color: 'var(--text-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '11px',
          zIndex: 2,
          flexShrink: 0,
          transition: 'color 150ms',
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-1)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}
      >
        {sidebarCollapsed ? '›' : '‹'}
      </button>

      {/* Logo mark */}
      {!sidebarCollapsed && (
        <div style={{
          padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: '8px',
          borderBottom: '1px solid var(--surface-3)',
          flexShrink: 0,
        }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--amber-mid)' }} />
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }}>
            Algorithm Lab
          </span>
        </div>
      )}

      {/* Algorithm list */}
      <nav>
        {GROUPS.map(group => (
          <div className="algorithm-group" key={group.unit}>
            {!sidebarCollapsed && (
              <div style={{
                padding: '12px 16px 4px',
                fontFamily: 'var(--font-sans)',
                fontSize: '9px',
                fontWeight: 600,
                color: 'var(--text-3)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}>
                {group.unit}
              </div>
            )}
            {group.ids.map(id => {
              const meta = ALGORITHM_META[id]
              const isActive = selectedAlgo === id
              return (
                <button
                  key={id}
                  onClick={() => setAlgo(id)}
                  title={sidebarCollapsed ? meta.name : undefined}
                  className={`algorithm-nav-button ${isActive ? 'active' : ''}`}
                >
                  <span style={{ fontSize: '14px', flexShrink: 0, color: isActive ? 'var(--amber-bright)' : 'var(--text-2)' }}>
                    {meta.icon}
                  </span>
                  {!sidebarCollapsed && (
                    <div className="algorithm-nav-copy">
                      <div>{meta.name}</div>
                      <small>{meta.timeComplexity}</small>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </nav>
    </aside>
  )
}
