'use client'
import { useEffect, useRef } from 'react'
import { useDemoStore } from '@/store/demo-store'

export function useGraphAnimation() {
  const { isPlaying, currentStep, totalSteps, speed, togglePlay } = useDemoStore()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Auto-advance tab from Overview to Execution on Play
  useEffect(() => {
    if (isPlaying) {
      const state = useDemoStore.getState()
      if (state.activeTab === 'overview') {
        state.setActiveTab('execution')
      }
    }
  }, [isPlaying])

  // Playback timer interval
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

  // Keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return
      }

      const store = useDemoStore.getState()

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          store.togglePlay()
          break
        case 'ArrowLeft':
          e.preventDefault()
          store.prevStep()
          break
        case 'ArrowRight':
          e.preventDefault()
          store.nextStep()
          break
        case 'KeyR':
          e.preventDefault()
          store.restart()
          break
        case 'Digit1':
        case 'Digit2':
        case 'Digit3':
        case 'Digit4':
          e.preventDefault()
          const phaseIdx = parseInt(e.key) - 1
          if (store.phaseStarts.length > phaseIdx) {
            store.setStep(store.phaseStarts[phaseIdx])
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])
}
