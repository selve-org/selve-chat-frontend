'use client'
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useCallback, useRef } from 'react'

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
  const { baseSpeed = 40, naturalVariation = true } = options

  const [displayedContent, setDisplayedContent] = useState('')
  const targetRef = useRef(streamedContent)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const isTypingRef = useRef(false)

  // Always keep target up to date
  useEffect(() => {
    targetRef.current = streamedContent
  }, [streamedContent])

  // Single effect that manages the typing loop
  useEffect(() => {
    const typeNextChar = () => {
      setDisplayedContent(prev => {
        const target = targetRef.current

        // Already caught up
        if (prev.length >= target.length) {
          // Clear timer when caught up
          timerRef.current = null
          isTypingRef.current = false
          return prev
        }

        // Add exactly one character
        const next = target.slice(0, prev.length + 1)

        // Schedule next character if there's more to type
        if (next.length < targetRef.current.length) {
          const variation = naturalVariation ? 0.7 + Math.random() * 0.6 : 1
          const delay = (1000 / baseSpeed) * variation
          timerRef.current = setTimeout(typeNextChar, delay)
          isTypingRef.current = true
        } else {
          timerRef.current = null
          isTypingRef.current = false
        }

        return next
      })
    }

    // Only start typing if not already typing and there's new content
    if (streamedContent.length > 0 && !isTypingRef.current) {
      const variation = naturalVariation ? 0.7 + Math.random() * 0.6 : 1
      const delay = (1000 / baseSpeed) * variation
      isTypingRef.current = true
      timerRef.current = setTimeout(typeNextChar, delay)
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      isTypingRef.current = false
    }
  }, [streamedContent, baseSpeed, naturalVariation])

  // Reset when stream clears
  useEffect(() => {
    if (streamedContent === '') {
      setDisplayedContent('')
    }
  }, [streamedContent])

  const isTyping = displayedContent.length < streamedContent.length

  return { displayedContent, isTyping }
}

export default useTypewriter
