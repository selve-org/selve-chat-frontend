'use client'

/**
 * Simple Blinking Text ThinkingIndicator for SELVE Chatbot
 *
 * Minimal, non-intrusive loading indicator that shows actual work being done.
 */

export interface ThinkingStatus {
  status:
    | 'security_check'
    | 'analyzing'
    | 'planning'
    | 'memory_searching'
    | 'rag_searching'
    | 'youtube_searching'
    | 'youtube_fetching'
    | 'web_searching'
    | 'selve_web_searching'
    | 'generating'
    | 'complete'
    | 'error'
    | 'tool_iteration'
    | 'calling_tools'
    | 'executing_tool'
    | 'tool_executed'
    | 'tool_complete'
  message: string
  details?: {
    phase?: number
    total_phases?: number
    model?: string
    intent?: string
    sources?: Array<{ title: string; source: string }>
    security_score?: number
    tools_used?: string[]
    action?: string
    tool_name?: string
    tool_args?: Record<string, unknown>
  }
}

interface ThinkingIndicatorProps {
  status: ThinkingStatus | null
  isVisible: boolean
}

// Minimal color hints for different status types
const STATUS_CONFIG: Record<string, { cursor: string; text: string }> = {
  security_check: {
    cursor: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
  },
  analyzing: {
    cursor: 'bg-blue-500',
    text: 'text-blue-600 dark:text-blue-400',
  },
  planning: {
    cursor: 'bg-purple-500',
    text: 'text-purple-600 dark:text-purple-400',
  },
  memory_searching: {
    cursor: 'bg-pink-500',
    text: 'text-pink-600 dark:text-pink-400',
  },
  rag_searching: {
    cursor: 'bg-cyan-500',
    text: 'text-cyan-600 dark:text-cyan-400',
  },
  youtube_searching: {
    cursor: 'bg-red-500',
    text: 'text-red-600 dark:text-red-400',
  },
  youtube_fetching: {
    cursor: 'bg-red-600',
    text: 'text-red-700 dark:text-red-500',
  },
  web_searching: {
    cursor: 'bg-green-500',
    text: 'text-green-600 dark:text-green-400',
  },
  selve_web_searching: {
    cursor: 'bg-indigo-500',
    text: 'text-indigo-600 dark:text-indigo-400',
  },
  generating: {
    cursor: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  complete: {
    cursor: 'bg-green-600',
    text: 'text-green-700 dark:text-green-500',
  },
  error: {
    cursor: 'bg-red-600',
    text: 'text-red-700 dark:text-red-500',
  },
  tool_iteration: {
    cursor: 'bg-violet-500',
    text: 'text-violet-600 dark:text-violet-400',
  },
  calling_tools: {
    cursor: 'bg-fuchsia-500',
    text: 'text-fuchsia-600 dark:text-fuchsia-400',
  },
  executing_tool: {
    cursor: 'bg-orange-500',
    text: 'text-orange-600 dark:text-orange-400',
  },
  tool_executed: {
    cursor: 'bg-lime-500',
    text: 'text-lime-600 dark:text-lime-400',
  },
  tool_complete: {
    cursor: 'bg-teal-500',
    text: 'text-teal-600 dark:text-teal-400',
  },
}

export default function ThinkingIndicator({ status, isVisible }: ThinkingIndicatorProps) {
  if (!isVisible || !status) return null

  const config = STATUS_CONFIG[status.status] || {
    cursor: 'bg-blue-500',
    text: 'text-gray-600 dark:text-gray-400',
  }

  return (
    <div className="mb-3 flex items-center gap-2 text-sm">
      {/* Blinking cursor */}
      <span className={`inline-block w-1 h-4 ${config.cursor} animate-pulse`}></span>

      {/* Status message */}
      <span className={`${config.text} animate-pulse`}>
        {status.message || 'Processing...'}
      </span>

      {/* Optional step counter */}
      {status.details?.phase && status.details?.total_phases && (
        <span className="text-xs text-gray-400 dark:text-gray-500">
          ({status.details.phase}/{status.details.total_phases})
        </span>
      )}
    </div>
  )
}
