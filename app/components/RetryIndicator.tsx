'use client'

import { RetryState } from '../hooks/useRetry'

interface RetryIndicatorProps {
  retryState: RetryState
  className?: string
}

/**
 * RetryIndicator Component
 * 
 * Displays retry status with countdown timer and attempt information.
 * Shows visual feedback during automatic retry with exponential backoff.
 */
export default function RetryIndicator({ retryState, className = '' }: RetryIndicatorProps) {
  const { isRetrying, attempt, maxAttempts, nextRetryIn, lastError } = retryState

  if (!isRetrying) {
    return null
  }

  return (
    <div className={`flex justify-start ${className}`}>
      <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 shadow-sm">
        <div className="flex items-center gap-3">
          {/* Spinner */}
          <div className="flex-shrink-0">
            <svg
              className="w-5 h-5 text-amber-600 dark:text-amber-400 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Connection issue
              </span>
              <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-800/50 px-2 py-0.5 rounded-full">
                Attempt {attempt}/{maxAttempts}
              </span>
            </div>

            {/* Error message */}
            {lastError && (
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 line-clamp-1">
                {lastError}
              </p>
            )}

            {/* Countdown */}
            {nextRetryIn !== null && nextRetryIn > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1 bg-amber-200 dark:bg-amber-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 dark:bg-amber-400 transition-all duration-1000 ease-linear"
                    style={{ width: `${(1 - nextRetryIn / 10) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-amber-600 dark:text-amber-400">
                  {nextRetryIn}s
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
