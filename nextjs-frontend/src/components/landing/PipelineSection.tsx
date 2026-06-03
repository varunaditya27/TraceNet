'use client'
import { motion } from 'framer-motion'

const STEPS = [
  { num: '01', label: 'CARD-R Database', desc: '20,041 rows · CARD v4.0.2' },
  { num: '02', label: 'Species Filter', desc: 'NCBI Plasmid > 1% · protein homolog model' },
  { num: '03', label: 'Jaccard Matrix', desc: 'Pairwise ARG set similarity' },
  { num: '04', label: 'Taxonomic τ', desc: 'Same genus=1.0 · cross-Gram=0.5' },
  { num: '05', label: 'HGT Graph G', desc: '16 nodes · 144 edges' },
]

export function PipelineSection() {
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
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6 }}
        style={{ textAlign: 'center' }}
      >
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(28px, 4vw, 44px)',
          color: 'var(--text-1)',
          letterSpacing: '-0.01em',
          marginBottom: '12px',
        }}>
          How the Graph is Built
        </h2>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--text-3)' }}>
          Five preprocessing steps transform raw CARD-R data into a weighted directed graph.
        </p>
      </motion.div>

      {/* Steps */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0',
        alignItems: 'stretch',
        justifyContent: 'center',
        maxWidth: '1000px',
        width: '100%',
      }}>
        {STEPS.map((step, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--surface-3)',
                borderRadius: '8px',
                padding: '20px 16px',
                width: '160px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--amber-dim)' }}>
                {step.num}
              </span>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }}>
                {step.label}
              </span>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--text-3)' }}>
                {step.desc}
              </span>
            </motion.div>
            {i < STEPS.length - 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 + 0.3 }}
                style={{ color: 'var(--amber-dim)', fontSize: '18px', padding: '0 8px', flexShrink: 0 }}
              >
                →
              </motion.div>
            )}
          </div>
        ))}
      </div>

      {/* Code snippet */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5, delay: 0.6 }}
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--surface-3)',
          borderRadius: '8px',
          padding: '20px 24px',
          maxWidth: '480px',
          width: '100%',
        }}
      >
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', color: 'var(--text-3)', marginBottom: '10px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Filter predicate — Step 02
        </p>
        <pre style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          color: 'var(--amber-mid)',
          lineHeight: 1.7,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
{`df[(df["NCBI Plasmid"] > 1) &
   (df["Model Type"] ==
    "protein homolog model")]`}
        </pre>
      </motion.div>
    </section>
  )
}
