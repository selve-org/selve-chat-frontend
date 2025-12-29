'use client'

import { useState } from 'react'

export interface Citation {
  title: string
  source: string
  type?: string // 'selve_web', 'youtube', 'rag', 'web'
  url?: string
  category?: string // For web pages: 'product', 'blog', 'privacy', etc.
  channel?: string // For YouTube videos
  video_id?: string // For YouTube videos
  relevance?: number // 0-100 relevance score
  section?: string
  score?: number // Legacy compatibility
}

interface SourceCitationsProps {
  sources: Citation[]
  className?: string
}

/**
 * SourceCitations Component
 *
 * Displays source citations used in generating a response.
 * Shows where the chatbot got information from: SELVE content, YouTube, knowledge base, or web.
 * Clean, professional design with expandable details.
 */
export default function SourceCitations({ sources, className = '' }: SourceCitationsProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!sources || sources.length === 0) {
    return null
  }

  // Determine source type (support both legacy and new format)
  const getSourceType = (source: Citation): string => {
    if (source.type) return source.type
    // Legacy mapping
    if (source.source === 'dimension' || source.source === 'knowledge_base') return 'rag'
    if (source.source === 'blog' || source.source === 'faq') return 'selve_web'
    return source.source
  }

  // Source type icon mapping (professional, minimal)
  const getSourceIcon = (source: Citation): React.ReactElement => {
    const type = getSourceType(source)

    switch (type) {
      case 'selve_web':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        )
      case 'youtube':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        )
      case 'rag':
      case 'knowledge_base':
      case 'dimension':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        )
      case 'web':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
    }
  }

  // Format source type for display
  const formatSourceType = (source: Citation): string => {
    const type = getSourceType(source)

    switch (type) {
      case 'selve_web':
        return 'SELVE Website'
      case 'youtube':
        return 'YouTube'
      case 'rag':
      case 'knowledge_base':
        return 'Knowledge Base'
      case 'dimension':
        return 'Personality Dimension'
      case 'web':
        return 'Web Search'
      default:
        return 'Source'
    }
  }

  // Get color scheme for source type
  const getSourceColor = (source: Citation): { bg: string; text: string; border: string } => {
    const type = getSourceType(source)

    switch (type) {
      case 'selve_web':
        return {
          bg: 'bg-blue-500/10',
          text: 'text-blue-400',
          border: 'border-blue-500/20',
        }
      case 'youtube':
        return {
          bg: 'bg-red-500/10',
          text: 'text-red-400',
          border: 'border-red-500/20',
        }
      case 'rag':
      case 'knowledge_base':
      case 'dimension':
        return {
          bg: 'bg-purple-500/10',
          text: 'text-purple-400',
          border: 'border-purple-500/20',
        }
      case 'web':
        return {
          bg: 'bg-green-500/10',
          text: 'text-green-400',
          border: 'border-green-500/20',
        }
      default:
        return {
          bg: 'bg-zinc-500/10',
          text: 'text-zinc-400',
          border: 'border-zinc-500/20',
        }
    }
  }

  // Get relevance score
  const getRelevance = (source: Citation): number | null => {
    if (source.relevance !== undefined) return source.relevance
    if (source.score !== undefined) return Math.round(source.score * 100)
    return null
  }

  return (
    <div className={`mt-4 ${className}`}>
      {/* Collapsed view - clickable header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="group flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-300 transition-colors"
        aria-expanded={isExpanded}
        aria-label={isExpanded ? 'Collapse sources' : 'Expand sources'}
      >
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
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
        <div className="mt-3 space-y-2 pl-1 animate-in slide-in-from-top-2 duration-200">
          {sources.map((source, index) => {
            const colors = getSourceColor(source)
            const relevance = getRelevance(source)
            const type = getSourceType(source)

            return (
              <div
                key={index}
                className={`group relative flex items-start gap-3 p-3 rounded-lg border ${colors.border} ${colors.bg} hover:bg-opacity-80 transition-all duration-200`}
              >
                {/* Icon */}
                <div className={`flex-shrink-0 ${colors.text} mt-0.5`}>
                  {getSourceIcon(source)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  {/* Title */}
                  {source.url ? (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm font-medium text-zinc-200 hover:text-white transition-colors group/link"
                    >
                      <span className="line-clamp-2">{source.title || 'SELVE Knowledge'}</span>
                      <svg
                        className="inline-block w-3 h-3 ml-1 opacity-0 group-hover/link:opacity-100 transition-opacity"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ) : (
                    <div className="text-sm font-medium text-zinc-200 line-clamp-2">
                      {source.title || 'SELVE Knowledge'}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Source type badge */}
                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${colors.text} bg-black/20 px-2 py-0.5 rounded-full`}>
                      {formatSourceType(source)}
                    </span>

                    {/* Category or Channel */}
                    {source.category && (
                      <span className="text-[10px] text-zinc-500 capitalize">
                        {source.category.replace(/_/g, ' ')}
                      </span>
                    )}
                    {source.channel && (
                      <span className="text-[10px] text-zinc-500">
                        {source.channel}
                      </span>
                    )}

                    {/* Relevance score */}
                    {relevance !== null && relevance > 0 && (
                      <span className="text-[10px] text-zinc-500 ml-auto">
                        {relevance}% relevant
                      </span>
                    )}
                  </div>

                  {/* Section (if available) */}
                  {source.section && (
                    <div className="text-[10px] text-zinc-500 italic line-clamp-1">
                      "{source.section}"
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
