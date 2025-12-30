'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'

// ============================================================================
// BASIC TYPEWRITER HOOK - For static text that types out once
// ============================================================================

interface UseTypewriterOptions {
  speed?: number
  delay?: number
  skipAnimation?: boolean
  onComplete?: () => void
}

interface UseTypewriterReturn {
  displayedText: string
  isTyping: boolean
  skipToEnd: () => void
  restart: () => void
}

export function useTypewriter(
  text: string,
  options: UseTypewriterOptions = {}
): UseTypewriterReturn {
  const { speed = 30, delay = 0, skipAnimation = false, onComplete } = options

  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  
  const charIndexRef = useRef(0)
  const textRef = useRef(text)
  const onCompleteRef = useRef(onComplete)
  const mountedRef = useRef(true)
  
  useEffect(() => { textRef.current = text }, [text])
  useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])

  const interval = useMemo(() => 1000 / speed, [speed])

  useEffect(() => {
    if (skipAnimation) {
      setDisplayedText(text)
      setIsTyping(false)
      charIndexRef.current = text.length
      return
    }

    charIndexRef.current = 0
    setDisplayedText('')
    setIsTyping(true)

    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let cancelled = false

    const typeNextChar = () => {
      if (cancelled || !mountedRef.current) return

      const currentText = textRef.current
      const currentIndex = charIndexRef.current

      if (currentIndex >= currentText.length) {
        setIsTyping(false)
        onCompleteRef.current?.()
        return
      }

      charIndexRef.current = currentIndex + 1
      setDisplayedText(currentText.slice(0, currentIndex + 1))
      timeoutId = setTimeout(typeNextChar, interval)
    }

    timeoutId = setTimeout(typeNextChar, delay)

    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [text, skipAnimation, delay, interval])

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const skipToEnd = useCallback(() => {
    charIndexRef.current = textRef.current.length
    setDisplayedText(textRef.current)
    setIsTyping(false)
    onCompleteRef.current?.()
  }, [])

  const restart = useCallback(() => {
    charIndexRef.current = 0
    setDisplayedText('')
    setIsTyping(true)
  }, [])

  return { displayedText, isTyping, skipToEnd, restart }
}

// ============================================================================
// STREAMING TYPEWRITER HOOK - For LLM responses (accumulated content)
// ============================================================================

interface UseStreamingTypewriterOptions {
  /** Characters per second (default: 60) */
  charsPerSecond?: number
  /** Add natural timing variation (default: true) */
  naturalVariation?: boolean
  /** Speed up when buffer is large (default: true) */
  adaptiveSpeed?: boolean
  /** Buffer size threshold to trigger speed up (default: 50) */
  speedUpThreshold?: number
  /** Maximum speed multiplier when catching up (default: 3) */
  maxSpeedMultiplier?: number
}

interface UseStreamingTypewriterReturn {
  displayedContent: string
  isTyping: boolean
  skipToEnd: () => void
  reset: () => void
}

/**
 * Streaming typewriter hook designed for LLM responses.
 * 
 * Key insight: streamedContent is ACCUMULATED (grows over time).
 * We track how much we've displayed and only animate NEW characters.
 * 
 * This prevents the "reset" problem where changing streamedContent
 * would cause the animation to restart.
 */
export function useStreamingTypewriter(
  streamedContent: string,
  options: UseStreamingTypewriterOptions = {}
): UseStreamingTypewriterReturn {
  const {
    charsPerSecond = 60,
    naturalVariation = true,
    adaptiveSpeed = true,
    speedUpThreshold = 50,
    maxSpeedMultiplier = 3,
  } = options

  // State: only the displayed content (what user sees)
  const [displayedContent, setDisplayedContent] = useState('')
  
  // Refs for animation state (don't trigger re-renders)
  const displayedLengthRef = useRef(0)
  const rafIdRef = useRef<number | null>(null)
  const lastFrameTimeRef = useRef(0)
  const accumulatedTimeRef = useRef(0)
  const mountedRef = useRef(true)
  const skippedRef = useRef(false)
  
  // Keep track of current target content via ref (avoids stale closure)
  const targetContentRef = useRef(streamedContent)
  useEffect(() => {
    targetContentRef.current = streamedContent
  }, [streamedContent])

  // Calculate base interval (ms per character)
  const baseInterval = useMemo(() => 1000 / charsPerSecond, [charsPerSecond])

  // Animation loop using requestAnimationFrame
  useEffect(() => {
    // Handle reset when content is cleared
    if (streamedContent === '') {
      displayedLengthRef.current = 0
      accumulatedTimeRef.current = 0
      lastFrameTimeRef.current = 0
      skippedRef.current = false
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
      setDisplayedContent('')
      return
    }

    // If user skipped to end, just update to latest content
    if (skippedRef.current) {
      displayedLengthRef.current = streamedContent.length
      setDisplayedContent(streamedContent)
      return
    }

    // Don't start a new animation loop if one is already running
    if (rafIdRef.current !== null) {
      return
    }

    const animate = (timestamp: number) => {
      if (!mountedRef.current) return

      // Check if skipped during animation
      if (skippedRef.current) {
        const target = targetContentRef.current
        displayedLengthRef.current = target.length
        setDisplayedContent(target)
        rafIdRef.current = null
        return
      }

      // Calculate delta time since last frame
      const deltaTime = lastFrameTimeRef.current > 0 
        ? timestamp - lastFrameTimeRef.current 
        : 16 // Assume ~60fps for first frame
      lastFrameTimeRef.current = timestamp

      // Get current target from ref (always fresh)
      const target = targetContentRef.current
      const targetLength = target.length
      const currentDisplayed = displayedLengthRef.current

      // Already caught up - keep the loop running to catch new content
      if (currentDisplayed >= targetLength) {
        rafIdRef.current = requestAnimationFrame(animate)
        return
      }

      // Calculate how many chars to add this frame
      const bufferSize = targetLength - currentDisplayed
      
      // Adaptive speed: faster when buffer is large
      let speedMultiplier = 1
      if (adaptiveSpeed && bufferSize > speedUpThreshold) {
        speedMultiplier = Math.min(
          maxSpeedMultiplier,
          1 + (bufferSize - speedUpThreshold) / speedUpThreshold
        )
      }

      // Natural variation (±20%)
      const variation = naturalVariation ? 0.8 + Math.random() * 0.4 : 1
      
      // Effective interval for this frame
      const effectiveInterval = (baseInterval / speedMultiplier) * variation

      // Accumulate time and calculate chars to add
      accumulatedTimeRef.current += deltaTime
      const charsToAdd = Math.floor(accumulatedTimeRef.current / effectiveInterval)

      if (charsToAdd > 0) {
        // Consume the time for chars we're adding
        accumulatedTimeRef.current -= charsToAdd * effectiveInterval
        
        // Add characters (but don't exceed target)
        const newLength = Math.min(currentDisplayed + charsToAdd, targetLength)
        displayedLengthRef.current = newLength
        
        // Update state (triggers re-render)
        setDisplayedContent(target.slice(0, newLength))
      }

      // Continue animation loop
      rafIdRef.current = requestAnimationFrame(animate)
    }

    // Start animation loop
    lastFrameTimeRef.current = 0
    rafIdRef.current = requestAnimationFrame(animate)

    // Cleanup function - only runs on unmount or when streamedContent becomes empty
    return () => {
      // Don't cancel the animation when streamedContent changes (grows)
      // Only cancel when it resets to empty (handled above)
    }
  }, [streamedContent === '', baseInterval, naturalVariation, adaptiveSpeed, speedUpThreshold, maxSpeedMultiplier])

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
    }
  }, [])

  const skipToEnd = useCallback(() => {
    skippedRef.current = true
    const target = targetContentRef.current
    displayedLengthRef.current = target.length
    setDisplayedContent(target)
  }, [])

  const reset = useCallback(() => {
    skippedRef.current = false
    displayedLengthRef.current = 0
    accumulatedTimeRef.current = 0
    lastFrameTimeRef.current = 0
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
    setDisplayedContent('')
  }, [])

  const isTyping = displayedContent.length < streamedContent.length

  return { displayedContent, isTyping, skipToEnd, reset }
}

// ============================================================================
// SIMPLER ALTERNATIVE: setTimeout-based (fallback if RAF has issues)
// ============================================================================

export function useSimpleStreamingTypewriter(
  streamedContent: string,
  options: { charsPerSecond?: number; naturalVariation?: boolean } = {}
): { displayedContent: string; isTyping: boolean; skipToEnd: () => void } {
  const { charsPerSecond = 60, naturalVariation = true } = options

  const [displayedContent, setDisplayedContent] = useState('')
  
  // Use a single ref object to track all mutable state
  const stateRef = useRef({
    displayedLength: 0,
    timerId: null as ReturnType<typeof setTimeout> | null,
    isAnimating: false,
    skipped: false,
    target: streamedContent,
  })

  // Always keep target up to date
  useEffect(() => {
    stateRef.current.target = streamedContent
  }, [streamedContent])

  const baseInterval = 1000 / charsPerSecond

  useEffect(() => {
    const state = stateRef.current

    // Reset case
    if (streamedContent === '') {
      state.displayedLength = 0
      state.isAnimating = false
      state.skipped = false
      if (state.timerId) {
        clearTimeout(state.timerId)
        state.timerId = null
      }
      setDisplayedContent('')
      return
    }

    // Skipped case - show full content
    if (state.skipped) {
      state.displayedLength = streamedContent.length
      setDisplayedContent(streamedContent)
      return
    }

    // Already animating - let it continue
    if (state.isAnimating) {
      return
    }

    const typeNext = () => {
      const s = stateRef.current
      
      if (s.skipped) {
        s.displayedLength = s.target.length
        setDisplayedContent(s.target)
        s.isAnimating = false
        return
      }

      const targetLength = s.target.length
      const currentLength = s.displayedLength

      if (currentLength >= targetLength) {
        // Caught up - check again soon for new content
        s.timerId = setTimeout(typeNext, 50)
        return
      }

      // Type one character
      s.displayedLength = currentLength + 1
      setDisplayedContent(s.target.slice(0, currentLength + 1))

      // Schedule next character
      const variation = naturalVariation ? 0.7 + Math.random() * 0.6 : 1
      
      // Speed up if buffer is large
      const bufferSize = targetLength - (currentLength + 1)
      const speedUp = bufferSize > 30 ? Math.min(3, 1 + bufferSize / 50) : 1
      
      const delay = (baseInterval / speedUp) * variation
      s.timerId = setTimeout(typeNext, delay)
    }

    // Start typing
    state.isAnimating = true
    const variation = naturalVariation ? 0.7 + Math.random() * 0.6 : 1
    state.timerId = setTimeout(typeNext, baseInterval * variation)

    // No cleanup - let animation continue
  }, [streamedContent === '', baseInterval, naturalVariation])

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      if (stateRef.current.timerId) {
        clearTimeout(stateRef.current.timerId)
      }
    }
  }, [])

  const skipToEnd = useCallback(() => {
    const state = stateRef.current
    state.skipped = true
    state.displayedLength = state.target.length
    if (state.timerId) {
      clearTimeout(state.timerId)
      state.timerId = null
    }
    state.isAnimating = false
    setDisplayedContent(state.target)
  }, [])

  const isTyping = displayedContent.length < streamedContent.length

  return { displayedContent, isTyping, skipToEnd }
}

export default useTypewriter