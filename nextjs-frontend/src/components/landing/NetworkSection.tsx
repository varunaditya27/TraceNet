'use client'
import { motion } from 'framer-motion'

const NODES = [
  { id: 0, x: 60,  y: 100, role: 'eskape' },
  { id: 1, x: 60,  y: 175, role: 'eskape' },
  { id: 2, x: 60,  y: 250, role: 'eskape' },
  { id: 3, x: 145, y: 60,  role: 'eskape' },
  { id: 4, x: 145, y: 290, role: 'eskape' },
  { id: 5, x: 145, y: 175, role: 'eskape' },
  { id: 6, x: 255, y: 100, role: 'bridge' },
  { id: 7, x: 265, y: 175, role: 'bridge' },
  { id: 8, x: 255, y: 250, role: 'bridge' },
  { id: 9, x: 345, y: 70,  role: 'bridge' },
  { id: 10, x: 350, y: 175, role: 'bridge' },
  { id: 11, x: 345, y: 280, role: 'bridge' },
  { id: 12, x: 435, y: 110, role: 'bridge' },
  { id: 13, x: 440, y: 235, role: 'bridge' },
  { id: 14, x: 520, y: 250, role: 'environmental' },
  { id: 15, x: 520, y: 145, role: 'environmental' },
]

const SAMPLE_EDGES = [
  [0,1],[0,2],[0,5],[0,6],[0,7],[0,8],[0,9],[0,10],[0,11],[0,12],[0,13],
  [1,2],[1,5],[1,6],[1,7],[1,8],[3,4],[3,14],[3,15],[4,14],[4,15],[14,15],
  [6,7],[6,9],[7,10],[9,12],[10,11],[11,13],[12,14],[13,15],
]

const ROLE_COLORS: Record<string, string> = {
  eskape: '#f85149',
  bridge: '#8b949e',
  environmental: '#3fb950',
}

export function NetworkSection() {
  return (
    <section style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--surface-0)',
      padding: '80px clamp(24px, 6vw, 96px)',
      gap: '48px',
    }}>
      <motion.h2
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(32px, 5vw, 52px)',
          color: 'var(--text-1)',
          textAlign: 'center',
          letterSpacing: '-0.01em',
        }}
      >
        Sixteen Species. One Network.
      </motion.h2>

      {/* SVG Graph */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.3 }}
        style={{ width: '100%', maxWidth: '600px' }}
      >
        <svg viewBox="0 0 580 350" width="100%" style={{ overflow: 'visible' }}>
          {/* Edges */}
          {SAMPLE_EDGES.map(([s, t], i) => {
            const sn = NODES[s], tn = NODES[t]
            return (
              <line key={i} x1={sn.x} y1={sn.y} x2={tn.x} y2={tn.y}
                stroke="#8b949e" strokeWidth="0.5" opacity="0.2" />
            )
          })}
          {/* Nodes */}
          {NODES.map((n, i) => (
            <motion.circle
              key={n.id}
              cx={n.x} cy={n.y} r={5}
              fill={ROLE_COLORS[n.role]}
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.35, delay: 0.4 + i * 0.05, ease: [0.34, 1.56, 0.64, 1] }}
              style={{ transformOrigin: `${n.x}px ${n.y}px` }}
            />
          ))}
        </svg>
      </motion.div>

      {/* Role legend */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, delay: 1.2 }}
        style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', justifyContent: 'center' }}
      >
        {[
          { color: '#f85149', label: 'ESKAPE Targets' },
          { color: '#8b949e', label: 'Bridge Species' },
          { color: '#3fb950', label: 'Environmental Reservoirs' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--text-2)' }}>
              {label}
            </span>
          </div>
        ))}
      </motion.div>

      {/* Stats */}
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, delay: 1.5 }}
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '13px',
          color: 'var(--text-3)',
          letterSpacing: '0.04em',
          textAlign: 'center',
        }}
      >
        144 directed pathways &nbsp;·&nbsp; Jaccard threshold 0.10 &nbsp;·&nbsp; Two isolated communities
      </motion.p>
    </section>
  )
}
