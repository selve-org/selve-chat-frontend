'use client'

import { useState } from 'react'

export interface Citation {
  title: string
  source: string
  section?: string
  score?: number
}

interface SourceCitationsProps {
  sources: Citation[]
  className?: string
}

/**
 * SourceCitations Component
 * 
 * Displays source citations used in generating a response.
 * Collapsible design with expand/collapse functionality.
 */
export default function SourceCitations({ sources, className = '' }: SourceCitationsProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!sources || sources.length === 0) {
    return null
  }

  // Source type icon mapping
  const getSourceIcon = (source: string): string => {
    switch (source) {
      case 'dimension':
        return '📊'
      case 'knowledge_base':
        return '📚'
      case 'blog':
        return '📝'
      case 'faq':
        return '❓'
      default:
        return '📄'
    }
  }

  // Format source type for display
  const formatSourceType = (source: string): string => {
    switch (source) {
      case 'dimension':
        return 'SELVE Dimension'
      case 'knowledge_base':
        return 'Knowledge Base'
      case 'blog':
        return 'Blog Article'
      case 'faq':
        return 'FAQ'
      default:
        return 'Source'
    }
  }

  return (
    <div className={`mt-3 ${className}`}>
      {/* Collapsed view - clickable header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
        aria-expanded={isExpanded}
        aria-label={isExpanded ? 'Collapse sources' : 'Expand sources'}
      >
        <svg
          className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="font-medium">
          {sources.length} source{sources.length !== 1 ? 's' : ''} referenced
        </span>
      </button>

      {/* Expanded view - source details */}
      {isExpanded && (
        <div className="mt-2 space-y-2 pl-5 animate-in slide-in-from-top-2 duration-200">
          {sources.map((source, index) => (
            <div
              key={index}
              className="flex items-start gap-2 p-2 rounded-md bg-zinc-100/50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700"
            >
              <span className="text-base" role="img" aria-label={formatSourceType(source.source)}>
                {getSourceIcon(source.source)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">
                  {source.title || 'SELVE Knowledge'}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded">
                    {formatSourceType(source.source)}
                  </span>
                  {source.score && (
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                      {Math.round(source.score * 100)}% match
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
