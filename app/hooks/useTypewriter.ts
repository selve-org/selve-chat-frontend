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
  const { baseSpeed = 60, naturalVariation = true } = options
  
  const [displayedContent, setDisplayedContent] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  
  // Use a ref for streamed content to avoid resetting the typing timer
  // when new chunks arrive
  const contentRef = useRef(streamedContent)
  
  useEffect(() => {
    contentRef.current = streamedContent
  }, [streamedContent])

  // Main typing loop - depends only on displayedContent to maintain rhythm
  useEffect(() => {
    const target = contentRef.current
    
    if (displayedContent.length >= target.length) {
      setIsTyping(false)
      return
    }

    setIsTyping(true)

    const variation = naturalVariation
      ? 0.5 + Math.random() * 1.0 
      : 1

    const interval = (1000 / baseSpeed) * variation

    const timeout = setTimeout(() => {
      const currentLen = displayedContent.length
      // Catch up faster if we're behind
      const catchUpSpeed = Math.min(
        5,
        Math.ceil((contentRef.current.length - currentLen) / 10)
      )
      const nextLen = Math.min(currentLen + catchUpSpeed, contentRef.current.length)
      setDisplayedContent(contentRef.current.slice(0, nextLen))
    }, interval)

    return () => clearTimeout(timeout)
  }, [displayedContent, baseSpeed, naturalVariation])

  // Kickstart the loop when new content arrives if we're not currently typing
  useEffect(() => {
    if (streamedContent.length > displayedContent.length && !isTyping) {
      // Trigger the first update immediately to start the loop
      setDisplayedContent(prev => contentRef.current.slice(0, prev.length + 1))
    }
  }, [streamedContent, displayedContent.length, isTyping])

  // Reset when stream clears
  useEffect(() => {
    if (streamedContent === '' && displayedContent !== '') {
      setDisplayedContent('')
      setIsTyping(false)
    }
  }, [streamedContent, displayedContent])

  return { displayedContent, isTyping }
}

export default useTypewriter
