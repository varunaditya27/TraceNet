import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          0: '#0d1117',
          1: '#161b22',
          2: '#21262d',
          3: '#30363d',
        },
        amber: {
          dim: '#92610a',
          mid: '#d4a017',
          bright: '#f0b429',
        },
        text: {
          1: '#e6edf3',
          2: '#8b949e',
          3: '#484f58',
        },
        risk: {
          high: '#f85149',
          low: '#3fb950',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
