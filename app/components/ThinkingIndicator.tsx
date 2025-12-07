'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'

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

const STATUS_LABELS: Record<string, string> = {
  retrieving_context: 'Searching knowledge...',
  personalizing: 'Personalizing response...',
  generating: 'Thinking',
  citing_sources: 'Adding sources...',
  complete: 'Done',
  error: 'Something went wrong',
}

export default function ThinkingIndicator({ status, isVisible }: ThinkingIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!isVisible || !status) return null

  const label = STATUS_LABELS[status.status] || 'Thinking'

  return (
    <div className="flex justify-start px-4 py-2">
      <div className="flex flex-col gap-2">
        {/* Main thinking indicator - simple clickable line */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="group flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-300"
        >
          <span className="animate-pulse-fade">{label}</span>
          <ChevronRight 
            className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} 
          />
        </button>

        {/* Expanded details */}
        {isExpanded && (
          <div className="ml-0.5 border-l-2 border-zinc-700 pl-3 text-xs text-zinc-500 animate-fade-in">
            <p>{status.message}</p>
            {status.details?.phase && status.details?.total_phases && (
              <p className="mt-1">
                Step {status.details.phase} of {status.details.total_phases}
              </p>
            )}
            {status.details?.model && (
              <p className="mt-1 text-zinc-600">Using {status.details.model}</p>
            )}
            {status.details?.sources && status.details.sources.length > 0 && (
              <div className="mt-2 space-y-1">
                {status.details.sources.map((source, idx) => (
                  <p key={idx} className="text-zinc-600">📄 {source.title}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
