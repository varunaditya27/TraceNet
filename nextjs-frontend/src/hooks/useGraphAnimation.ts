'use client'
import { useEffect, useRef } from 'react'
import { useDemoStore } from '@/store/demo-store'

export function useGraphAnimation() {
  const { isPlaying, currentStep, totalSteps, togglePlay } = useDemoStore()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (!isPlaying) return

    if (currentStep >= totalSteps - 1) {
      togglePlay()
      return
    }

    intervalRef.current = setInterval(() => {
      const state = useDemoStore.getState()
      if (state.currentStep >= state.totalSteps - 1) {
        clearInterval(intervalRef.current!)
        intervalRef.current = null
        useDemoStore.getState().togglePlay()
      } else {
        useDemoStore.getState().nextStep()
      }
    }, 2000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isPlaying, currentStep, totalSteps, togglePlay])
}
