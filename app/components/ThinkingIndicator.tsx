'use client'

import { useState } from 'react'

export interface ThinkingStatus {
  status: 'retrieving_context' | 'personalizing' | 'generating' | 'citing_sources' | 'complete' | 'error'
  message: string
  details?: {
    phase?: number
    total_phases?: number
    model?: string
    sources?: Array<{ title: string; source: string }>
  }
}

interface ThinkingIndicatorProps {
  status: ThinkingStatus | null
  isVisible: boolean
}

const STATUS_CONFIG = {
  retrieving_context: {
    icon: '🔍',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  personalizing: {
    icon: '✨',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-950',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
  generating: {
    icon: '🧠',
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-950',
    borderColor: 'border-green-200 dark:border-green-800',
  },
  citing_sources: {
    icon: '📚',
    color: 'text-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-950',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
  complete: {
    icon: '✅',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
  },
  error: {
    icon: '❌',
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-950',
    borderColor: 'border-red-200 dark:border-red-800',
  },
}

export default function ThinkingIndicator({ status, isVisible }: ThinkingIndicatorProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  if (!isVisible || !status) return null

  const config = STATUS_CONFIG[status.status] || STATUS_CONFIG.generating

  return (
    <div
      className={`
        mb-4 rounded-lg border px-4 py-3 transition-all duration-300
        ${config.bgColor} ${config.borderColor}
        ${isCollapsed ? 'cursor-pointer' : ''}
      `}
      onClick={() => isCollapsed && setIsCollapsed(false)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Animated icon */}
          <span className={`text-lg ${status.status === 'generating' ? 'animate-pulse' : ''}`}>
            {config.icon}
          </span>

          {/* Status message */}
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className={`text-sm font-medium ${config.color}`}>
                {status.message}
              </span>

              {/* Progress indicator */}
              {status.details?.phase && status.details?.total_phases && (
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Step {status.details.phase} of {status.details.total_phases}
                </span>
              )}

              {/* Model indicator */}
              {status.status === 'generating' && status.details?.model && (
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  Using {status.details.model}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Collapse/expand button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsCollapsed(!isCollapsed)
          }}
          className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
          aria-label={isCollapsed ? 'Expand' : 'Collapse'}
        >
          <svg
            className={`h-4 w-4 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      {!isCollapsed && status.details?.phase && status.details?.total_phases && (
        <div className="mt-2">
          <div className="h-1 w-full rounded-full bg-zinc-200 dark:bg-zinc-700">
            <div
              className={`h-1 rounded-full transition-all duration-500 ${config.color.replace('text-', 'bg-')}`}
              style={{ width: `${(status.details.phase / status.details.total_phases) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Sources list (when citing) */}
      {!isCollapsed && status.status === 'citing_sources' && status.details?.sources && (
        <div className="mt-2 space-y-1">
          {status.details.sources.map((source, idx) => (
            <div key={idx} className="text-xs text-zinc-500 dark:text-zinc-400">
              📄 {source.title}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
