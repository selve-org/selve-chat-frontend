'use client'

import { useState } from 'react'
import { ChevronRight, Brain, Search, User, Sparkles, Shield, CheckCircle, AlertCircle } from 'lucide-react'

/**
 * Enhanced ThinkingIndicator for SELVE Agentic Chatbot
 * 
 * Displays the multi-phase reasoning process:
 * 1. Security Check (analyzing for injection)
 * 2. Analyzing (understanding intent)
 * 3. Planning (deciding what tools to use)
 * 4. Retrieving (RAG, memories, user data)
 * 5. Personalizing (loading user profile)
 * 6. Generating (crafting response)
 * 7. Validating (checking response quality)
 * 8. Complete
 */

export interface ThinkingStatus {
  status: 
    | 'security_check'
    | 'loading_user'
    | 'analyzing'
    | 'planning'
    | 'retrieving_context'
    | 'researching'
    | 'personalizing'
    | 'generating'
    | 'validating'
    | 'citing_sources'
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
  loading_user: {
    label: 'Loading your profile...',
    icon: User,
    color: 'text-pink-400',
  },
  planning: {
    label: 'Planning approach...',
    icon: Sparkles,
    color: 'text-purple-400',
  },
  retrieving_context: {
    label: 'Searching knowledge...',
    icon: Search,
    color: 'text-cyan-400',
  },
  researching: {
    label: 'Researching...',
    icon: Search,
    color: 'text-cyan-400',
  },
  personalizing: {
    label: 'Loading your profile...',
    icon: User,
    color: 'text-pink-400',
  },
  generating: {
    label: 'Thinking...',
    icon: Brain,
    color: 'text-emerald-400',
  },
  validating: {
    label: 'Checking response...',
    icon: Shield,
    color: 'text-amber-400',
  },
  citing_sources: {
    label: 'Adding sources...',
    icon: Search,
    color: 'text-cyan-400',
  },
  complete: {
    label: 'Done',
    icon: CheckCircle,
    color: 'text-green-400',
  },
  error: {
    label: 'Something went wrong',
    icon: AlertCircle,
    color: 'text-red-400',
  },
}

export default function ThinkingIndicator({ status, isVisible }: ThinkingIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!isVisible || !status) return null

  const config = STATUS_CONFIG[status.status] || STATUS_CONFIG.generating
  const Icon = config.icon

  return (
    <div className="flex justify-start px-4 py-2">
      <div className="flex flex-col gap-2 max-w-md">
        {/* Main thinking indicator - clickable line */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="group flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-zinc-300"
        >
          {/* Animated icon */}
          <Icon className={`h-4 w-4 ${config.color} ${status.status !== 'complete' && status.status !== 'error' ? 'animate-pulse' : ''}`} />
          
          {/* Status label */}
          <span className={status.status !== 'complete' && status.status !== 'error' ? 'animate-pulse-fade' : ''}>
            {config.label}
          </span>
          
          {/* Phase indicator */}
          {status.details?.phase && status.details?.total_phases && (
            <span className="text-xs text-zinc-500">
              ({status.details.phase}/{status.details.total_phases})
            </span>
          )}
          
          {/* Expand chevron */}
          <ChevronRight 
            className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} 
          />
        </button>

        {/* Expanded details */}
        {isExpanded && (
          <div className="ml-6 border-l-2 border-zinc-700 pl-3 text-xs text-zinc-500 animate-fade-in space-y-1">
            {/* Custom message */}
            {status.message && (
              <p>{status.message}</p>
            )}
            
            {/* Intent detected */}
            {status.details?.intent && (
              <p className="text-zinc-600">
                Intent: <span className="text-zinc-400">{status.details.intent}</span>
              </p>
            )}
            
            {/* Security score (only show if concerning) */}
            {status.details?.security_score !== undefined && status.details.security_score > 0.3 && (
              <p className="text-amber-500">
                ⚠️ Security check: {Math.round(status.details.security_score * 100)}%
              </p>
            )}
            
            {/* Tools being used */}
            {status.details?.tools_used && status.details.tools_used.length > 0 && (
              <p className="text-zinc-600">
                Using: {status.details.tools_used.join(', ')}
              </p>
            )}
            
            {/* Model info */}
            {status.details?.model && (
              <p className="text-zinc-600">Model: {status.details.model}</p>
            )}
            
            {/* Sources */}
            {status.details?.sources && status.details.sources.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-zinc-500">Sources:</p>
                {status.details.sources.map((source, idx) => (
                  <p key={idx} className="text-zinc-600 pl-2">
                    📄 {source.title}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Progress bar for multi-phase */}
        {status.details?.phase && status.details?.total_phases && status.status !== 'complete' && (
          <div className="ml-6 w-32 h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
              style={{ width: `${(status.details.phase / status.details.total_phases) * 100}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Mini thinking indicator for inline use
 */
export function MiniThinkingIndicator({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.generating
  const Icon = config.icon
  
  return (
    <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
      <Icon className={`h-3 w-3 ${config.color} animate-pulse`} />
      <span className="animate-pulse-fade">{config.label}</span>
    </span>
  )
}

/**
 * Thinking steps display for detailed view
 */
export function ThinkingSteps({ steps }: { steps: Array<{ phase: string; duration_ms: number; completed: boolean }> }) {
  return (
    <div className="space-y-1 text-xs">
      {steps.map((step, idx) => {
        const config = STATUS_CONFIG[step.phase] || STATUS_CONFIG.generating
        const Icon = config.icon
        
        return (
          <div key={idx} className="flex items-center gap-2 text-zinc-500">
            <Icon className={`h-3 w-3 ${step.completed ? 'text-green-400' : config.color}`} />
            <span className={step.completed ? 'text-zinc-400' : 'text-zinc-600'}>
              {config.label}
            </span>
            {step.completed && step.duration_ms > 0 && (
              <span className="text-zinc-600">({step.duration_ms.toFixed(0)}ms)</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
