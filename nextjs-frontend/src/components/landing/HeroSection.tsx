'use client'
import { motion } from 'framer-motion'

function NodeField({ slow = false }: { slow?: boolean }) {
  const nodes = [
    { cx: '8%', cy: '15%', r: 2, cls: 'drift-a', dur: slow ? 18 : 9 },
    { cx: '23%', cy: '72%', r: 3, cls: 'drift-b', dur: slow ? 22 : 11 },
    { cx: '41%', cy: '31%', r: 2, cls: 'drift-c', dur: slow ? 14 : 7 },
    { cx: '57%', cy: '85%', r: 2, cls: 'drift-a', dur: slow ? 20 : 10 },
    { cx: '68%', cy: '18%', r: 3, cls: 'drift-b', dur: slow ? 16 : 8 },
    { cx: '79%', cy: '56%', r: 2, cls: 'drift-c', dur: slow ? 24 : 12 },
    { cx: '88%', cy: '38%', r: 3, cls: 'drift-a', dur: slow ? 13 : 6.5 },
    { cx: '15%', cy: '48%', r: 2, cls: 'drift-b', dur: slow ? 19 : 9.5 },
    { cx: '33%', cy: '91%', r: 2, cls: 'drift-c', dur: slow ? 21 : 10.5 },
    { cx: '92%', cy: '77%', r: 3, cls: 'drift-a', dur: slow ? 17 : 8.5 },
    { cx: '48%', cy: '12%', r: 2, cls: 'drift-b', dur: slow ? 15 : 7.5 },
    { cx: '72%', cy: '65%', r: 2, cls: 'drift-c', dur: slow ? 23 : 11.5 },
    { cx: '5%', cy: '82%', r: 3, cls: 'drift-a', dur: slow ? 20 : 10 },
    { cx: '62%', cy: '44%', r: 2, cls: 'drift-b', dur: slow ? 16 : 8 },
    { cx: '85%', cy: '90%', r: 2, cls: 'drift-c', dur: slow ? 25 : 12.5 },
  ]
  const lines = [
    { x1: '8%', y1: '15%', x2: '23%', y2: '72%' },
    { x1: '23%', y1: '72%', x2: '33%', y2: '91%' },
    { x1: '41%', y1: '31%', x2: '57%', y2: '85%' },
    { x1: '57%', y1: '85%', x2: '72%', y2: '65%' },
    { x1: '68%', y1: '18%', x2: '79%', y2: '56%' },
    { x1: '79%', y1: '56%', x2: '88%', y2: '38%' },
    { x1: '15%', y1: '48%', x2: '41%', y2: '31%' },
    { x1: '48%', y1: '12%', x2: '68%', y2: '18%' },
    { x1: '5%', y1: '82%', x2: '15%', y2: '48%' },
    { x1: '62%', y1: '44%', x2: '79%', y2: '56%' },
    { x1: '85%', y1: '90%', x2: '72%', y2: '65%' },
    { x1: '92%', y1: '77%', x2: '85%', y2: '90%' },
  ]

  return (
    <div className="node-field">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        {lines.map((l, i) => (
          <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke="#8b949e" strokeWidth="0.5" opacity="0.06" />
        ))}
        {nodes.map((n, i) => (
          <circle key={i} cx={n.cx} cy={n.cy} r={n.r}
            fill="#d4a017" opacity="0.15"
            className={n.cls}
            style={{ '--drift-dur': `${n.dur}s` } as React.CSSProperties} />
        ))}
      </svg>
    </div>
  )
}

export function HeroSection() {
  return (
    <section style={{
      position: 'relative',
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--surface-0)',
      overflow: 'hidden',
    }}>
      <NodeField />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
        style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 24px' }}
      >
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(52px, 8vw, 88px)',
          fontWeight: 400,
          color: 'var(--text-1)',
          letterSpacing: '-0.02em',
          lineHeight: 1.05,
        }}>
          TraceNet
        </h1>

        <div style={{
          width: '80px',
          height: '1px',
          background: 'var(--amber-mid)',
          margin: '24px auto',
        }} />

        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 'clamp(12px, 1.5vw, 15px)',
          color: 'var(--text-2)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          marginBottom: '40px',
        }}>
          Mapping Antibiotic Resistance Through Graph Theory
        </p>

        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '11px',
          color: 'var(--text-3)',
          letterSpacing: '0.08em',
        }}>
          B.E. ISE Semester IV &nbsp;·&nbsp; RVCE Bengaluru &nbsp;·&nbsp; DAA Course Project
        </p>
      </motion.div>

      <div style={{
        position: 'absolute',
        bottom: '32px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        color: 'var(--amber-mid)',
      }}>
        <svg className="scroll-cue" width="16" height="24" viewBox="0 0 16 24" fill="none">
          <path d="M8 4L8 20M8 20L3 15M8 20L13 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </section>
  )
}
