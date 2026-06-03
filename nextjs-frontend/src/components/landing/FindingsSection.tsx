'use client'
import { motion } from 'framer-motion'

const FINDINGS = [
  {
    stat: '2',
    label: 'Isolated communities',
    detail: 'Gram boundary creates a complete network split at Jaccard threshold 0.10 — no edges cross between Gram-positive and Gram-negative clusters.',
  },
  {
    stat: '0.714',
    label: 'Highest edge weight',
    detail: 'E. faecium ↔ E. faecalis — same genus, maximum Jaccard similarity. The single strongest horizontal gene transfer pathway in the network.',
  },
  {
    stat: '141',
    label: 'Edges targeted by greedy',
    detail: 'Greedy containment identifies 141 critical edges to isolate all ESKAPE pathogens from environmental reservoirs.',
  },
  {
    stat: '4',
    label: 'Exact minimum cut (B&B)',
    detail: 'Branch & Bound finds the provably optimal solution on the hospital subgraph: just 4 edge removals suffice for complete containment.',
  },
]

export function FindingsSection() {
  return (
    <section style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--surface-0)',
      padding: '80px clamp(24px, 6vw, 96px)',
      gap: '56px',
    }}>
      <motion.h2
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6 }}
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(32px, 5vw, 52px)',
          color: 'var(--text-1)',
          textAlign: 'center',
          letterSpacing: '-0.01em',
        }}
      >
        What We Found
      </motion.h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        maxWidth: '960px',
        width: '100%',
      }}>
        {FINDINGS.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: i * 0.12 }}
            style={{
              background: 'var(--surface-1)',
              border: '1px solid var(--surface-3)',
              borderRadius: '8px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(40px, 5vw, 60px)',
              color: 'var(--amber-mid)',
              lineHeight: 1,
            }}>
              {f.stat}
            </div>
            <div style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-1)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}>
              {f.label}
            </div>
            <div style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '13px',
              color: 'var(--text-2)',
              lineHeight: 1.6,
            }}>
              {f.detail}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
