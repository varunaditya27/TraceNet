'use client'
import { useEffect, useRef } from 'react'
import { useDemoStore } from '@/store/demo-store'

export function useGraphAnimation() {
  const { isPlaying, currentStep, totalSteps, speed, togglePlay } = useDemoStore()
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
    }, 2200 / speed)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isPlaying, currentStep, totalSteps, speed, togglePlay])
}
