'use client'
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useScrollReveal } from '@/hooks/useScrollReveal'

function useCounter(target: number, isVisible: boolean, duration = 1500) {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isVisible) return
    const start = performance.now()
    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // ease-out expo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      setValue(Math.round(eased * target))
      if (progress < 1) rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [isVisible, target, duration])

  return value
}

function formatStat(value: number, target: number): string {
  if (target >= 1000000) return `${(value / 1000000).toFixed(2)}M`
  if (target >= 1000) return `${Math.round(value / 1000)}K`
  return String(value)
}

export function ThreatSection() {
  const { ref, isVisible } = useScrollReveal(0.3)
  const count1 = useCounter(4950000, isVisible)
  const count2 = useCounter(700000, isVisible)

  return (
    <section ref={ref as React.RefObject<HTMLDivElement>} style={{
      height: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--surface-0)',
      padding: '0 clamp(24px, 6vw, 96px)',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'clamp(40px, 8vw, 120px)',
        maxWidth: '1100px',
        width: '100%',
        alignItems: 'center',
      }}>
        {/* Stats column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
          {[
            { value: count1, target: 4950000, label: 'deaths linked to antibiotic resistance in 2019' },
            { value: count2, target: 700000, label: 'die annually from drug-resistant infections worldwide' },
          ].map(({ value, target, label }, i) => (
            <div key={i}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(52px, 7vw, 80px)',
                color: 'var(--amber-mid)',
                lineHeight: 1,
                marginBottom: '8px',
              }}>
                {formatStat(value, target)}
              </div>
              <div style={{
                fontFamily: 'var(--font-body)',
                fontSize: '16px',
                color: 'var(--text-2)',
                lineHeight: 1.5,
              }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Quote column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
          >
            <p style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: 'clamp(22px, 3vw, 30px)',
              color: 'var(--text-1)',
              lineHeight: 1.3,
            }}>
              Bacteria don&apos;t just inherit resistance.
            </p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.6 }}
            style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: 'clamp(22px, 3vw, 30px)',
              color: 'var(--amber-bright)',
              lineHeight: 1.3,
            }}
          >
            They trade it.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={isVisible ? { opacity: 1 } : {}}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 1.0 }}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '16px',
              color: 'var(--text-2)',
              lineHeight: 1.75,
              marginTop: '8px',
            }}
          >
            Horizontal Gene Transfer (HGT) allows plasmid-borne resistance genes to spread
            laterally across species boundaries. A single resistant strain can arm an entire
            hospital ecosystem within weeks.
          </motion.p>
        </div>
      </div>
    </section>
  )
}
