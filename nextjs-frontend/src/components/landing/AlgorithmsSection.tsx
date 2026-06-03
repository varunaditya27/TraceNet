'use client'
import { motion } from 'framer-motion'
import { ALGORITHM_META, ALGO_IDS } from '@/lib/constants'

export function AlgorithmsSection() {
  return (
    <section style={{
      minHeight: '150dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--surface-0)',
      padding: '100px clamp(24px, 6vw, 96px)',
      gap: '56px',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '700px' }}>
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(32px, 5vw, 56px)',
            color: 'var(--text-1)',
            letterSpacing: '-0.01em',
            marginBottom: '16px',
          }}
        >
          Eight Algorithms. Four Units.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{
            fontFamily: 'var(--font-body)',
            fontStyle: 'italic',
            fontSize: '18px',
            color: 'var(--text-2)',
          }}
        >
          One question: how do we map, trace, and stop the spread?
        </motion.p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        maxWidth: '1000px',
        width: '100%',
      }}>
        {ALGO_IDS.map((id, i) => {
          const meta = ALGORITHM_META[id]
          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: i * 0.1 }}
              whileHover={{ boxShadow: '0 0 0 1px var(--amber-dim)', transition: { duration: 0.15 } }}
              style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--surface-3)',
                borderRadius: '8px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                cursor: 'default',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px', color: 'var(--amber-mid)' }}>{meta.icon}</span>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  color: 'var(--amber-mid)',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  background: 'var(--amber-glow)',
                  border: '1px solid var(--amber-dim)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}>
                  {meta.unit}
                </span>
              </div>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 600, color: 'var(--text-1)' }}>
                {meta.name}
              </span>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.5, flexGrow: 1 }}>
                {meta.description.split('.')[0]}.
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--amber-mid)' }}>
                {meta.timeComplexity}
              </span>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
