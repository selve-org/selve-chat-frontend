'use client'

import { useState } from 'react'
import { ChevronRight, Brain, Search, User, Sparkles, Shield, CheckCircle, AlertCircle, Youtube, Globe, Database } from 'lucide-react'

/**
 * Honest ThinkingIndicator for SELVE Chatbot
 *
 * Shows actual work being done:
 * 1. Security Check - Validates message safety
 * 2. Analyzing - Intent classification
 * 3. Planning - Decides which tools to use
 * 4. Tool Execution - RAG, Memory, YouTube, Web, etc.
 * 5. Generating - Creates personalized response
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
  }
}

interface ThinkingIndicatorProps {
  status: ThinkingStatus | null
  isVisible: boolean
}

// Status labels and icons for each phase
const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  security_check: {
    label: 'Checking security...',
    icon: Shield,
    color: 'text-amber-400',
  },
  analyzing: {
    label: 'Understanding your question...',
    icon: Brain,
    color: 'text-blue-400',
  },
  planning: {
    label: 'Planning approach...',
    icon: Sparkles,
    color: 'text-purple-400',
  },
  memory_searching: {
    label: 'Searching conversation history...',
    icon: Database,
    color: 'text-pink-400',
  },
  rag_searching: {
    label: 'Searching personality knowledge...',
    icon: Search,
    color: 'text-cyan-400',
  },
  youtube_searching: {
    label: 'Searching psychology videos...',
    icon: Youtube,
    color: 'text-red-400',
  },
  youtube_fetching: {
    label: 'Fetching video transcript...',
    icon: Youtube,
    color: 'text-red-500',
  },
  web_searching: {
    label: 'Researching online...',
    icon: Globe,
    color: 'text-green-400',
  },
  selve_web_searching: {
    label: 'Checking SELVE docs...',
    icon: Search,
    color: 'text-indigo-400',
  },
  generating: {
    label: 'Crafting response...',
    icon: Sparkles,
    color: 'text-emerald-400',
  },
  complete: {
    label: 'Done!',
    icon: CheckCircle,
    color: 'text-green-400',
  },
  error: {
    label: 'Error occurred',
    icon: AlertCircle,
    color: 'text-red-400',
  },
}

export default function ThinkingIndicator({ status, isVisible }: ThinkingIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!isVisible || !status) return null

  const config = STATUS_CONFIG[status.status] || {
    label: status.message || 'Processing...',
    icon: Brain,
    color: 'text-gray-400',
  }

  const Icon = config.icon

  return (
    <div className="mb-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm">
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Animated Icon */}
        <div className={`flex-shrink-0 ${config.color}`}>
          <Icon className="w-5 h-5 animate-pulse" />
        </div>

        {/* Status Message */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {status.message || config.label}
          </p>
          {status.details?.phase && status.details?.total_phases && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Step {status.details.phase} of {status.details.total_phases}
            </p>
          )}
        </div>

        {/* Expand Arrow */}
        <ChevronRight
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isExpanded ? 'rotate-90' : ''
          }`}
        />
      </div>

      {/* Expanded Details */}
      {isExpanded && status.details && (
        <div className="px-3 pb-3 pt-1 border-t border-gray-200 dark:border-gray-700 space-y-2">
          {status.details.intent && (
            <div className="text-xs">
              <span className="text-gray-500 dark:text-gray-400">Intent:</span>{' '}
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                {status.details.intent}
              </span>
            </div>
          )}

          {status.details.action && (
            <div className="text-xs">
              <span className="text-gray-500 dark:text-gray-400">Tool:</span>{' '}
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                {status.details.action.replace(/_/g, ' ')}
              </span>
            </div>
          )}

          {status.details.model && (
            <div className="text-xs">
              <span className="text-gray-500 dark:text-gray-400">Model:</span>{' '}
              <span className="text-gray-700 dark:text-gray-300 font-mono text-xs">
                {status.details.model}
              </span>
            </div>
          )}

          {status.details.tools_used && status.details.tools_used.length > 0 && (
            <div className="text-xs">
              <span className="text-gray-500 dark:text-gray-400">Tools used:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {status.details.tools_used.map((tool, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-full text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          )}

          {status.details.sources && status.details.sources.length > 0 && (
            <div className="text-xs">
              <span className="text-gray-500 dark:text-gray-400">Sources:</span>
              <ul className="mt-1 space-y-1">
                {status.details.sources.map((source, idx) => (
                  <li
                    key={idx}
                    className="text-gray-700 dark:text-gray-300 flex items-start gap-1"
                  >
                    <span className="text-gray-400 mt-0.5">•</span>
                    <span>{source.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {status.details.security_score !== undefined && (
            <div className="text-xs">
              <span className="text-gray-500 dark:text-gray-400">Security Score:</span>{' '}
              <span
                className={`font-medium ${
                  status.details.security_score > 0.8
                    ? 'text-green-600 dark:text-green-400'
                    : status.details.security_score > 0.5
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {(status.details.security_score * 100).toFixed(0)}%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
