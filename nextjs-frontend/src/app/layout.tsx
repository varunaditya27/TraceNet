import type { Metadata } from 'next'
import { DM_Serif_Display, Space_Grotesk, Lora, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-dm-serif',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const lora = Lora({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-lora',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'TraceNet — Antibiotic Resistance Graph Analysis',
  description: 'Graph algorithm visualization for antibiotic resistance gene spread through bacterial transmission networks. B.E. ISE Semester IV · RVCE Bengaluru · DAA Course Project.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${dmSerif.variable} ${spaceGrotesk.variable} ${lora.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        {children}
      </body>
    </html>
  )
}
