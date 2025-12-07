'use client'

import { useState, useEffect, useCallback } from 'react'

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
 * 
 * @example
 * ```tsx
 * const { displayedText, isTyping, skipToEnd } = useTypewriter(
 *   "Hello, world!",
 *   { speed: 50, onComplete: () => console.log("Done!") }
 * )
 * 
 * return (
 *   <div>
 *     {displayedText}
 *     {isTyping && <span className="cursor">|</span>}
 *     <button onClick={skipToEnd}>Skip</button>
 *   </div>
 * )
 * ```
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
  const [charIndex, setCharIndex] = useState(0)

  // Calculate interval in ms from characters per second
  const interval = 1000 / speed

  // Reset when text changes
  useEffect(() => {
    if (skipAnimation) {
      setDisplayedText(text)
      setIsTyping(false)
      setCharIndex(text.length)
      return
    }

    setDisplayedText('')
    setCharIndex(0)
    setIsTyping(true)
  }, [text, skipAnimation])

  // Handle the typing animation
  useEffect(() => {
    if (skipAnimation || charIndex >= text.length) {
      if (charIndex >= text.length && isTyping) {
        setIsTyping(false)
        onComplete?.()
      }
      return
    }

    const timeout = setTimeout(
      () => {
        setDisplayedText(text.slice(0, charIndex + 1))
        setCharIndex(charIndex + 1)
      },
      charIndex === 0 ? delay : interval
    )

    return () => clearTimeout(timeout)
  }, [charIndex, text, interval, delay, skipAnimation, isTyping, onComplete])

  const skipToEnd = useCallback(() => {
    setDisplayedText(text)
    setCharIndex(text.length)
    setIsTyping(false)
    onComplete?.()
  }, [text, onComplete])

  const restart = useCallback(() => {
    setDisplayedText('')
    setCharIndex(0)
    setIsTyping(true)
  }, [])

  return {
    displayedText,
    isTyping,
    skipToEnd,
    restart,
  }
}

/**
 * A simpler approach for streaming content that adds characters
 * to existing content gradually with a natural feel.
 */
interface UseStreamingTypewriterOptions {
  /** Base speed in chars per second (varies naturally) */
  baseSpeed?: number
  /** Whether to add natural variation to timing */
  naturalVariation?: boolean
}

/**
 * Hook for making streamed content appear with a typewriter effect.
 * Useful for LLM responses where content arrives in chunks.
 */
export function useStreamingTypewriter(
  streamedContent: string,
  options: UseStreamingTypewriterOptions = {}
): { displayedContent: string; isTyping: boolean } {
  const { baseSpeed = 60, naturalVariation = true } = options
  
  const [displayedContent, setDisplayedContent] = useState('')
  const [targetIndex, setTargetIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(false)

  // Update target when new content arrives
  useEffect(() => {
    if (streamedContent.length > targetIndex) {
      setTargetIndex(streamedContent.length)
      setIsTyping(true)
    }
  }, [streamedContent, targetIndex])

  // Animate to target
  useEffect(() => {
    if (displayedContent.length >= targetIndex) {
      setIsTyping(false)
      return
    }

    const variation = naturalVariation
      ? 0.5 + Math.random() * 1.0 // 0.5x to 1.5x speed variation
      : 1

    const interval = (1000 / baseSpeed) * variation

    const timeout = setTimeout(() => {
      const currentLen = displayedContent.length
      // Catch up faster if we're behind
      const catchUpSpeed = Math.min(
        3,
        Math.ceil((streamedContent.length - currentLen) / 10)
      )
      const nextLen = Math.min(currentLen + catchUpSpeed, targetIndex)
      setDisplayedContent(streamedContent.slice(0, nextLen))
    }, interval)

    return () => clearTimeout(timeout)
  }, [displayedContent, targetIndex, streamedContent, baseSpeed, naturalVariation])

  // Reset when stream clears
  useEffect(() => {
    if (streamedContent === '' && displayedContent !== '') {
      setDisplayedContent('')
      setTargetIndex(0)
      setIsTyping(false)
    }
  }, [streamedContent, displayedContent])

  return { displayedContent, isTyping }
}

export default useTypewriter
