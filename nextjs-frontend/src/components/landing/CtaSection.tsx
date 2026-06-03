'use client'
import { motion } from 'framer-motion'
import { AmberButton } from '@/components/ui/AmberButton'

function NodeFieldDim() {
  const nodes = [
    { cx: '12%', cy: '20%', r: 2, cls: 'drift-a', dur: 22 },
    { cx: '28%', cy: '68%', r: 3, cls: 'drift-b', dur: 28 },
    { cx: '45%', cy: '35%', r: 2, cls: 'drift-c', dur: 18 },
    { cx: '60%', cy: '80%', r: 2, cls: 'drift-a', dur: 24 },
    { cx: '72%', cy: '22%', r: 3, cls: 'drift-b', dur: 20 },
    { cx: '82%', cy: '58%', r: 2, cls: 'drift-c', dur: 30 },
    { cx: '90%', cy: '40%', r: 3, cls: 'drift-a', dur: 16 },
    { cx: '18%', cy: '50%', r: 2, cls: 'drift-b', dur: 26 },
    { cx: '38%', cy: '88%', r: 2, cls: 'drift-c', dur: 22 },
    { cx: '95%', cy: '75%', r: 3, cls: 'drift-a', dur: 21 },
  ]
  const lines = [
    { x1: '12%', y1: '20%', x2: '28%', y2: '68%' },
    { x1: '45%', y1: '35%', x2: '60%', y2: '80%' },
    { x1: '72%', y1: '22%', x2: '82%', y2: '58%' },
    { x1: '18%', y1: '50%', x2: '45%', y2: '35%' },
    { x1: '82%', y1: '58%', x2: '90%', y2: '40%' },
    { x1: '60%', y1: '80%', x2: '82%', y2: '58%' },
  ]
  return (
    <div className="node-field" style={{ opacity: 0.4 }}>
      <svg width="100%" height="100%">
        {lines.map((l, i) => (
          <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke="#8b949e" strokeWidth="0.5" opacity="0.05" />
        ))}
        {nodes.map((n, i) => (
          <circle key={i} cx={n.cx} cy={n.cy} r={n.r}
            fill="#d4a017" opacity="0.1"
            className={n.cls}
            style={{ '--drift-dur': `${n.dur}s` } as React.CSSProperties} />
        ))}
      </svg>
    </div>
  )
}

export function CtaSection() {
  return (
    <section style={{
      position: 'relative',
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#080d12',
      overflow: 'hidden',
      gap: '40px',
      padding: '0 24px',
    }}>
      <NodeFieldDim />

      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        style={{
          position: 'relative',
          zIndex: 1,
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontSize: 'clamp(28px, 5vw, 56px)',
          color: 'var(--text-1)',
          textAlign: 'center',
          letterSpacing: '-0.01em',
        }}
      >
        Ready to trace the network?
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6, delay: 0.3 }}
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <AmberButton href="/demo" variant="primary">
          Open Algorithm Demo →
        </AmberButton>
        <AmberButton href="/network" variant="ghost">
          Explore the Network →
        </AmberButton>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.6 }}
        style={{
          position: 'relative',
          zIndex: 1,
          fontFamily: 'var(--font-sans)',
          fontSize: '11px',
          color: 'var(--text-3)',
          textAlign: 'center',
          letterSpacing: '0.06em',
          marginTop: '20px',
        }}
      >
        RVCE Bengaluru &nbsp;·&nbsp; B.E. ISE Semester IV &nbsp;·&nbsp; Design & Analysis of Algorithms &nbsp;·&nbsp; 2026
      </motion.p>
    </section>
  )
}
