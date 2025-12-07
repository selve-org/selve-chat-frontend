'use client'

import { useState, useCallback, useRef } from 'react'

export interface RetryState {
  isRetrying: boolean
  attempt: number
  maxAttempts: number
  nextRetryIn: number | null
  lastError: string | null
}

interface UseRetryOptions {
  maxAttempts?: number
  initialDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  onRetry?: (attempt: number, delay: number) => void
  onMaxRetriesReached?: (lastError: Error) => void
}

interface UseRetryResult {
  retryState: RetryState
  executeWithRetry: <T>(fn: () => Promise<T>) => Promise<T>
  reset: () => void
}

/**
 * useRetry Hook
 * 
 * Provides exponential backoff retry logic with visual feedback state.
 * 
 * @example
 * const { retryState, executeWithRetry } = useRetry({
 *   maxAttempts: 3,
 *   onRetry: (attempt, delay) => console.log(`Retry ${attempt} in ${delay}ms`)
 * })
 * 
 * const result = await executeWithRetry(() => fetch('/api/chat'))
 */
export function useRetry(options: UseRetryOptions = {}): UseRetryResult {
  const {
    maxAttempts = 3,
    initialDelay = 2000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    onRetry,
    onMaxRetriesReached
  } = options

  const [retryState, setRetryState] = useState<RetryState>({
    isRetrying: false,
    attempt: 0,
    maxAttempts,
    nextRetryIn: null,
    lastError: null
  })

  const countdownRef = useRef<NodeJS.Timeout | null>(null)
  const abortRef = useRef(false)

  const clearCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
  }, [])

  const reset = useCallback(() => {
    abortRef.current = true
    clearCountdown()
    setRetryState({
      isRetrying: false,
      attempt: 0,
      maxAttempts,
      nextRetryIn: null,
      lastError: null
    })
  }, [clearCountdown, maxAttempts])

  const sleep = useCallback((ms: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      let remaining = Math.ceil(ms / 1000)
      
      // Start countdown
      setRetryState(prev => ({ ...prev, nextRetryIn: remaining }))
      
      countdownRef.current = setInterval(() => {
        remaining -= 1
        if (remaining <= 0) {
          clearCountdown()
          setRetryState(prev => ({ ...prev, nextRetryIn: null }))
          resolve()
        } else {
          setRetryState(prev => ({ ...prev, nextRetryIn: remaining }))
        }
        
        // Check if aborted
        if (abortRef.current) {
          clearCountdown()
          reject(new Error('Retry aborted'))
        }
      }, 1000)
      
      // Safety timeout
      setTimeout(() => {
        clearCountdown()
        resolve()
      }, ms + 100)
    })
  }, [clearCountdown])

  const executeWithRetry = useCallback(async <T>(fn: () => Promise<T>): Promise<T> => {
    abortRef.current = false
    let lastError: Error | null = null
    let delay = initialDelay

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Update state
        setRetryState(prev => ({
          ...prev,
          isRetrying: attempt > 1,
          attempt,
          lastError: null
        }))

        return await fn()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        
        // Check if we should retry
        const isRetryable = isRetryableError(error)
        
        if (!isRetryable || attempt >= maxAttempts) {
          setRetryState(prev => ({
            ...prev,
            isRetrying: false,
            lastError: lastError?.message || 'Unknown error'
          }))
          
          if (attempt >= maxAttempts && onMaxRetriesReached) {
            onMaxRetriesReached(lastError)
          }
          
          throw lastError
        }

        // Prepare for retry
        setRetryState(prev => ({
          ...prev,
          isRetrying: true,
          lastError: lastError?.message || 'Request failed'
        }))

        if (onRetry) {
          onRetry(attempt, delay)
        }

        // Wait with countdown
        await sleep(delay)
        
        // Exponential backoff
        delay = Math.min(delay * backoffMultiplier, maxDelay)
      }
    }

    throw lastError || new Error('Max retries reached')
  }, [maxAttempts, initialDelay, maxDelay, backoffMultiplier, onRetry, onMaxRetriesReached, sleep])

  return {
    retryState,
    executeWithRetry,
    reset
  }
}

/**
 * Check if an error is retryable (network errors, rate limits, 5xx errors)
 */
function isRetryableError(error: unknown): boolean {
  if (!error) return false
  
  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true
  }
  
  // Check for response status codes
  if (typeof error === 'object' && error !== null) {
    const err = error as { status?: number; statusCode?: number; code?: string }
    
    // Rate limiting
    if (err.status === 429 || err.statusCode === 429) {
      return true
    }
    
    // Server errors (5xx)
    if ((err.status && err.status >= 500) || (err.statusCode && err.statusCode >= 500)) {
      return true
    }
    
    // Network error codes
    if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.code === 'ENOTFOUND') {
      return true
    }
  }
  
  // Check error message
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    if (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('rate limit') ||
      message.includes('too many requests') ||
      message.includes('service unavailable') ||
      message.includes('502') ||
      message.includes('503') ||
      message.includes('504')
    ) {
      return true
    }
  }
  
  return false
}

export default useRetry
