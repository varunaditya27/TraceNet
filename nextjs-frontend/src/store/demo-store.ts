import { create } from 'zustand'
import type { GraphData, AlgorithmId } from '@/lib/graph-data'

interface DemoState {
  selectedAlgo: AlgorithmId
  currentStep: number
  totalSteps: number
  isPlaying: boolean
  graphData: GraphData | null
  sidebarCollapsed: boolean
  setAlgo: (algo: AlgorithmId) => void
  setStep: (step: number) => void
  setTotalSteps: (n: number) => void
  nextStep: () => void
  prevStep: () => void
  togglePlay: () => void
  setGraphData: (data: GraphData) => void
  toggleSidebar: () => void
}

export const useDemoStore = create<DemoState>((set, get) => ({
  selectedAlgo: 'bfs',
  currentStep: 0,
  totalSteps: 0,
  isPlaying: false,
  graphData: null,
  sidebarCollapsed: false,
  setAlgo: (algo) => set({ selectedAlgo: algo, currentStep: 0, isPlaying: false }),
  setStep: (step) => set({ currentStep: step }),
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
  setGraphData: (data) => set({ graphData: data }),
  toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}))
