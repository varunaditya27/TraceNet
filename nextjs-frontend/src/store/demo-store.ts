import { create } from 'zustand'
import type { GraphData, AlgorithmId } from '@/lib/graph-data'
import type { ExecutionMode } from '@/lib/execution/types'

interface DemoState {
  selectedAlgo: AlgorithmId
  currentStep: number
  totalSteps: number
  isPlaying: boolean
  speed: number
  executionMode: ExecutionMode
  activeTab: 'overview' | 'execution' | 'data-structures' | 'pseudocode' | 'result'
  graphData: GraphData | null
  sidebarCollapsed: boolean
  phaseStarts: number[]
  setAlgo: (algo: AlgorithmId) => void
  setStep: (step: number) => void
  setTotalSteps: (n: number) => void
  nextStep: () => void
  prevStep: () => void
  togglePlay: () => void
  restart: () => void
  setSpeed: (speed: number) => void
  setExecutionMode: (mode: ExecutionMode) => void
  setPhaseStarts: (starts: number[]) => void
  jumpToPhase: (direction: -1 | 1) => void
  setActiveTab: (tab: DemoState['activeTab']) => void
  setGraphData: (data: GraphData) => void
  toggleSidebar: () => void
}

export const useDemoStore = create<DemoState>((set, get) => ({
  selectedAlgo: 'bfs',
  currentStep: 0,
  totalSteps: 0,
  isPlaying: false,
  speed: 1,
  executionMode: 'guided',
  activeTab: 'execution',
  graphData: null,
  sidebarCollapsed: false,
  phaseStarts: [],
  setAlgo: (algo) => set({ selectedAlgo: algo, currentStep: 0, totalSteps: 0, isPlaying: false, executionMode: 'guided', phaseStarts: [], activeTab: 'overview' }),
  setStep: (step) => set(({ totalSteps }) => ({ currentStep: Math.max(0, Math.min(step, Math.max(0, totalSteps - 1))), isPlaying: false })),
  setTotalSteps: (n) => set({ totalSteps: n }),
  nextStep: () => {
    const { currentStep, totalSteps } = get()
    if (currentStep < totalSteps - 1) set({ currentStep: currentStep + 1 })
  },
  prevStep: () => {
    const { currentStep } = get()
    if (currentStep > 0) set({ currentStep: currentStep - 1 })
  },
  togglePlay: () => set(s => ({ isPlaying: !s.isPlaying })),
  restart: () => set({ currentStep: 0, isPlaying: false }),
  setSpeed: (speed) => set({ speed }),
  setExecutionMode: (executionMode) => set({ executionMode, currentStep: 0, isPlaying: false }),
  setPhaseStarts: (phaseStarts) => set({ phaseStarts }),
  jumpToPhase: (direction) => {
    const { currentStep, phaseStarts } = get()
    if (!phaseStarts.length) return
    if (direction < 0) {
      const previous = [...phaseStarts].reverse().find(start => start < currentStep)
      set({ currentStep: previous ?? 0, isPlaying: false })
      return
    }
    const next = phaseStarts.find(start => start > currentStep)
    if (next !== undefined) set({ currentStep: next, isPlaying: false })
  },
  setActiveTab: (activeTab) => set({ activeTab }),
  setGraphData: (data) => set({ graphData: data }),
  toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}))
