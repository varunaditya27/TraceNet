import { HeroSection } from '@/components/landing/HeroSection'
import { ThreatSection } from '@/components/landing/ThreatSection'
import { NetworkSection } from '@/components/landing/NetworkSection'
import { PipelineSection } from '@/components/landing/PipelineSection'
import { AlgorithmsSection } from '@/components/landing/AlgorithmsSection'
import { FindingsSection } from '@/components/landing/FindingsSection'
import { CtaSection } from '@/components/landing/CtaSection'

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <ThreatSection />
      <NetworkSection />
      <PipelineSection />
      <AlgorithmsSection />
      <FindingsSection />
      <CtaSection />
    </main>
  )
}
