'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'

// ============================================================================
// BASIC TYPEWRITER HOOK - For static text that types out once
// ============================================================================

interface UseTypewriterOptions {
  /** Characters per second (default: 30) */
  speed?: number
  /** Delay before starting in ms (default: 0) */
  delay?: number
  /** Whether to skip the typewriter effect and show all text immediately */
  skipAnimation?: boolean
  /** Callback when typing is complete */
  onComplete?: () => void
}

interface UseTypewriterReturn {
  /** The currently displayed text */
  displayedText: string
  /** Whether the typewriter is currently typing */
  isTyping: boolean
  /** Skip to the end and show all text */
  skipToEnd: () => void
  /** Reset and start typing from the beginning */
  restart: () => void
}

/**
 * React hook for typewriter text animation effect.
 * Displays text character by character at a configurable speed.
 * 
 * @param text - The full text to display with typewriter effect
 * @param options - Configuration options for the typewriter
 * @returns Object with displayedText, isTyping state, and control functions
 */
export function useTypewriter(
  text: string,
  options: UseTypewriterOptions = {}
): UseTypewriterReturn {
  const {
    speed = 30,
    delay = 0,
    skipAnimation = false,
    onComplete,
  } = options

  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  
  // Use refs for mutable values to avoid stale closures
  const charIndexRef = useRef(0)
  const textRef = useRef(text)
  const onCompleteRef = useRef(onComplete)
  const mountedRef = useRef(true)
  
  // Update refs when props change
  useEffect(() => {
    textRef.current = text
  }, [text])
  
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  // Calculate interval in ms from characters per second
  const interval = useMemo(() => 1000 / speed, [speed])

  // Reset and start typing when text changes
  useEffect(() => {
    if (skipAnimation) {
      setDisplayedText(text)
      setIsTyping(false)
      charIndexRef.current = text.length
      return
    }

    // Reset state for new text
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

      // Schedule next character
      timeoutId = setTimeout(typeNextChar, interval)
    }

    // Start with initial delay
    timeoutId = setTimeout(typeNextChar, delay)

    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [text, skipAnimation, delay, interval])

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
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

  return {
    displayedText,
    isTyping,
    skipToEnd,
    restart,
  }
}

// ============================================================================
// STREAMING TYPEWRITER HOOK - For LLM responses that arrive in chunks
// ============================================================================

interface UseStreamingTypewriterOptions {
  /** Base speed in chars per second (default: 40) */
  baseSpeed?: number
  /** Whether to add natural variation to timing (default: true) */
  naturalVariation?: boolean
  /** Minimum speed multiplier for variation (default: 0.7) */
  minSpeedMultiplier?: number
  /** Maximum speed multiplier for variation (default: 1.3) */
  maxSpeedMultiplier?: number
  /** Whether the stream is complete - when true, types remaining content faster */
  streamComplete?: boolean
  /** Speed multiplier when catching up after stream completes (default: 2) */
  catchUpSpeedMultiplier?: number
}

interface UseStreamingTypewriterReturn {
  /** The currently displayed content */
  displayedContent: string
  /** Whether the typewriter is currently typing */
  isTyping: boolean
  /** Skip to end and show all content immediately */
  skipToEnd: () => void
  /** Reset to empty state */
  reset: () => void
}

/**
 * Hook for making streamed content appear with a typewriter effect.
 * Designed for LLM responses where content arrives in chunks.
 * 
 * Key features:
 * - Handles race conditions properly
 * - Catches up naturally when stream is faster than typing
 * - Optional natural timing variation for realistic feel
 * - Proper cleanup to prevent memory leaks
 */
export function useStreamingTypewriter(
  streamedContent: string,
  options: UseStreamingTypewriterOptions = {}
): UseStreamingTypewriterReturn {
  const {
    baseSpeed = 40,
    naturalVariation = true,
    minSpeedMultiplier = 0.7,
    maxSpeedMultiplier = 1.3,
    streamComplete = false,
    catchUpSpeedMultiplier = 2,
  } = options

  const [displayedContent, setDisplayedContent] = useState('')
  
  // Refs for managing typing state without re-renders
  const targetContentRef = useRef(streamedContent)
  const displayedLengthRef = useRef(0)
  const animationFrameRef = useRef<number | null>(null)
  const lastTypeTimeRef = useRef(0)
  const isActiveRef = useRef(false)
  const mountedRef = useRef(true)
  const skipToEndRef = useRef(false)

  // Calculate base interval
  const baseInterval = useMemo(() => 1000 / baseSpeed, [baseSpeed])

  // Get randomized interval with natural variation
  const getTypingInterval = useCallback((isCatchingUp: boolean) => {
    const effectiveSpeed = isCatchingUp ? catchUpSpeedMultiplier : 1
    const baseDelay = baseInterval / effectiveSpeed
    
    if (!naturalVariation) return baseDelay
    
    const multiplier = minSpeedMultiplier + 
      Math.random() * (maxSpeedMultiplier - minSpeedMultiplier)
    return baseDelay * multiplier
  }, [baseInterval, naturalVariation, minSpeedMultiplier, maxSpeedMultiplier, catchUpSpeedMultiplier])

  // Update target content ref when prop changes
  useEffect(() => {
    targetContentRef.current = streamedContent
  }, [streamedContent])

  // Main typing animation using requestAnimationFrame for smooth performance
  useEffect(() => {
    // Handle empty content reset
    if (streamedContent === '') {
      displayedLengthRef.current = 0
      setDisplayedContent('')
      isActiveRef.current = false
      skipToEndRef.current = false
      return
    }

    // Skip to end was requested
    if (skipToEndRef.current) {
      return
    }

    let nextTypeTime = lastTypeTimeRef.current
    let cancelled = false

    const animate = (timestamp: number) => {
      if (cancelled || !mountedRef.current || skipToEndRef.current) return

      const target = targetContentRef.current
      const currentLength = displayedLengthRef.current

      // Check if we've caught up
      if (currentLength >= target.length) {
        isActiveRef.current = false
        return
      }

      // Check if enough time has passed to type next character
      if (timestamp >= nextTypeTime) {
        // Determine if we need to catch up (buffer is building)
        const bufferSize = target.length - currentLength
        const isCatchingUp = bufferSize > 10 || streamComplete

        // Type the next character
        displayedLengthRef.current = currentLength + 1
        setDisplayedContent(target.slice(0, currentLength + 1))

        // Schedule next character
        const interval = getTypingInterval(isCatchingUp)
        nextTypeTime = timestamp + interval
        lastTypeTimeRef.current = nextTypeTime
      }

      // Continue animation loop
      isActiveRef.current = true
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    // Start animation if not already running
    if (!isActiveRef.current && displayedLengthRef.current < streamedContent.length) {
      isActiveRef.current = true
      // Initialize timing if this is a fresh start
      if (displayedLengthRef.current === 0) {
        nextTypeTime = performance.now()
        lastTypeTimeRef.current = nextTypeTime
      }
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    return () => {
      cancelled = true
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [streamedContent, streamComplete, getTypingInterval])

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  const skipToEnd = useCallback(() => {
    skipToEndRef.current = true
    isActiveRef.current = false
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    displayedLengthRef.current = targetContentRef.current.length
    setDisplayedContent(targetContentRef.current)
  }, [])

  const reset = useCallback(() => {
    skipToEndRef.current = false
    isActiveRef.current = false
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    displayedLengthRef.current = 0
    lastTypeTimeRef.current = 0
    setDisplayedContent('')
  }, [])

  const isTyping = displayedContent.length < streamedContent.length

  return {
    displayedContent,
    isTyping,
    skipToEnd,
    reset,
  }
}

// ============================================================================
// ALTERNATIVE: SIMPLER STREAMING TYPEWRITER (setTimeout-based)
// Use this if you encounter issues with requestAnimationFrame
// ============================================================================

interface UseSimpleStreamingTypewriterOptions {
  /** Characters per second (default: 40) */
  speed?: number
  /** Add natural variation to timing (default: true) */
  naturalVariation?: boolean
}

/**
 * Simpler streaming typewriter using setTimeout.
 * More compatible but slightly less smooth than RAF version.
 */
export function useSimpleStreamingTypewriter(
  streamedContent: string,
  options: UseSimpleStreamingTypewriterOptions = {}
): { displayedContent: string; isTyping: boolean } {
  const { speed = 40, naturalVariation = true } = options

  const [displayedContent, setDisplayedContent] = useState('')
  
  // Use a single ref object to avoid multiple ref updates
  const stateRef = useRef({
    target: streamedContent,
    displayedLength: 0,
    timerId: null as ReturnType<typeof setTimeout> | null,
    isRunning: false,
  })

  const baseInterval = 1000 / speed

  // Update target when content changes
  useEffect(() => {
    stateRef.current.target = streamedContent
  }, [streamedContent])

  // Main effect - manages the typing loop
  useEffect(() => {
    // Reset on empty content
    if (streamedContent === '') {
      stateRef.current.displayedLength = 0
      stateRef.current.isRunning = false
      if (stateRef.current.timerId) {
        clearTimeout(stateRef.current.timerId)
        stateRef.current.timerId = null
      }
      setDisplayedContent('')
      return
    }

    const typeNextChar = () => {
      const state = stateRef.current
      const currentLength = state.displayedLength
      const target = state.target

      // Stop if caught up
      if (currentLength >= target.length) {
        state.isRunning = false
        return
      }

      // Type next character
      state.displayedLength = currentLength + 1
      setDisplayedContent(target.slice(0, currentLength + 1))

      // Schedule next
      const variation = naturalVariation ? 0.7 + Math.random() * 0.6 : 1
      const delay = baseInterval * variation
      
      state.timerId = setTimeout(typeNextChar, delay)
    }

    // Start if not already running and there's content to type
    if (!stateRef.current.isRunning && stateRef.current.displayedLength < streamedContent.length) {
      stateRef.current.isRunning = true
      const variation = naturalVariation ? 0.7 + Math.random() * 0.6 : 1
      stateRef.current.timerId = setTimeout(typeNextChar, baseInterval * variation)
    }

    // Cleanup only stops the timer, doesn't reset state
    return () => {
      // Don't clear timer or reset state on re-render
      // This is intentional to maintain continuous typing
    }
  }, [streamedContent, baseInterval, naturalVariation])

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      if (stateRef.current.timerId) {
        clearTimeout(stateRef.current.timerId)
      }
    }
  }, [])

  const isTyping = displayedContent.length < streamedContent.length

  return { displayedContent, isTyping }
}

export default useTypewriter