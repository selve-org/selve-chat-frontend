'use client'

import { Copy, RefreshCw, ThumbsUp, ThumbsDown, Pencil, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { useState } from 'react'

interface MessageActionsProps {
  messageId: string
  content: string
  onRegenerate?: () => void
  onFeedback?: (type: 'helpful' | 'not_helpful') => void
  isRegenerating?: boolean
  isVisible?: boolean
  regenerationIndex?: number
  totalRegenerations?: number
  onNavigateRegenerations?: (direction: 'prev' | 'next') => void
}

export default function MessageActions({
  messageId,
  content,
  onRegenerate,
  onFeedback,
  isRegenerating,
  isVisible = true,
  regenerationIndex,
  totalRegenerations,
  onNavigateRegenerations,
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false)
  const [feedbackGiven, setFeedbackGiven] = useState<'helpful' | 'not_helpful' | null>(null)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleFeedback = (type: 'helpful' | 'not_helpful') => {
    if (feedbackGiven) return // Prevent changing feedback
    setFeedbackGiven(type)
    onFeedback?.(type)
  }

  const showNavigation = totalRegenerations && totalRegenerations > 1

  return (
    <div className={`flex items-center gap-1 pl-4 transition-opacity ${isVisible ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} role="toolbar" aria-label="Message actions">
      {/* Navigation for multiple regenerations */}
      {showNavigation && onNavigateRegenerations && (
        <>
          <button
            onClick={() => onNavigateRegenerations('prev')}
            disabled={regenerationIndex === 1}
            title="Previous response"
            aria-label="Previous response"
            className="rounded-md p-1.5 text-zinc-500 dark:text-zinc-500 transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-30 cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5 md:h-4 md:w-4" />
          </button>
          <span className="px-1 text-xs text-zinc-500 dark:text-zinc-500" aria-live="polite">
            {regenerationIndex}/{totalRegenerations}
          </span>
          <button
            onClick={() => onNavigateRegenerations('next')}
            disabled={regenerationIndex === totalRegenerations}
            title="Next response"
            aria-label="Next response"
            className="rounded-md p-1.5 text-zinc-500 dark:text-zinc-500 transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-30 cursor-pointer"
          >
            <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
          </button>
          <div className="mx-1 h-3.5 w-px bg-zinc-300 dark:bg-zinc-700" />
        </>
      )}

      {/* Copy */}
      <button
        onClick={handleCopy}
        title={copied ? 'Copied!' : 'Copy message'}
        aria-label={copied ? 'Copied!' : 'Copy message'}
        className="rounded-md p-1.5 text-zinc-500 dark:text-zinc-500 transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-500 dark:text-green-400" aria-hidden="true" />
        ) : (
          <Copy className="h-3.5 w-3.5 md:h-4 md:w-4" aria-hidden="true" />
        )}
      </button>

      {/* Regenerate */}
      {onRegenerate && (
        <button
          onClick={onRegenerate}
          disabled={isRegenerating}
          title="Regenerate response"
          aria-label="Regenerate response"
          className="rounded-md p-1.5 text-zinc-500 dark:text-zinc-500 transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 md:h-4 md:w-4 ${isRegenerating ? 'animate-spin' : ''}`} aria-hidden="true" />
        </button>
      )}

      {/* Helpful */}
      {onFeedback && (
        <>
          <button
            onClick={() => handleFeedback('helpful')}
            disabled={feedbackGiven !== null}
            title="Helpful"
            aria-label="Mark as helpful"
            aria-pressed={feedbackGiven === 'helpful'}
            className={`rounded-md p-1.5 transition-colors ${
              feedbackGiven === 'helpful'
                ? 'text-green-600 dark:text-green-400'
                : 'text-zinc-500 dark:text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300'
            } disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer`}
          >
            <ThumbsUp className={`h-3.5 w-3.5 md:h-4 md:w-4 ${feedbackGiven === 'helpful' ? 'fill-current' : ''}`} aria-hidden="true" />
          </button>

          {/* Not Helpful */}
          <button
            onClick={() => handleFeedback('not_helpful')}
            disabled={feedbackGiven !== null}
            title="Not helpful"
            aria-label="Mark as not helpful"
            aria-pressed={feedbackGiven === 'not_helpful'}
            className={`rounded-md p-1.5 transition-colors ${
              feedbackGiven === 'not_helpful'
                ? 'text-red-600 dark:text-red-400'
                : 'text-zinc-500 dark:text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300'
            } disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer`}
          >
            <ThumbsDown className={`h-3.5 w-3.5 md:h-4 md:w-4 ${feedbackGiven === 'not_helpful' ? 'fill-current' : ''}`} aria-hidden="true" />
          </button>
        </>
      )}
    </div>
  )
}

interface UserMessageActionsProps {
  content: string
  onEdit?: () => void
}

export function UserMessageActions({ content, onEdit }: UserMessageActionsProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className={`flex items-center gap-1 mt-1 transition-opacity ${copied ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} role="toolbar" aria-label="Message actions">
      {/* Edit */}
      {onEdit && (
        <button
          onClick={onEdit}
          title="Edit message"
          aria-label="Edit message"
          className="rounded-md p-1.5 text-zinc-500 dark:text-zinc-500 transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer"
        >
          <Pencil className="h-3.5 w-3.5 md:h-4 md:w-4" aria-hidden="true" />
        </button>
      )}

      {/* Copy */}
      <button
        onClick={handleCopy}
        title={copied ? 'Copied!' : 'Copy message'}
        aria-label={copied ? 'Copied!' : 'Copy message'}
        className="rounded-md p-1.5 text-zinc-500 dark:text-zinc-500 transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-500 dark:text-green-400" aria-hidden="true" />
        ) : (
          <Copy className="h-3.5 w-3.5 md:h-4 md:w-4" aria-hidden="true" />
        )}
      </button>
    </div>
  )
}
