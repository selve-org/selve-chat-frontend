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
    <div className={`flex items-center gap-1 transition-opacity ${isVisible ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
      {/* Navigation for multiple regenerations */}
      {showNavigation && onNavigateRegenerations && (
        <>
          <button
            onClick={() => onNavigateRegenerations('prev')}
            disabled={regenerationIndex === 1}
            title="Previous response"
            className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="px-1 text-xs text-zinc-500">
            {regenerationIndex}/{totalRegenerations}
          </span>
          <button
            onClick={() => onNavigateRegenerations('next')}
            disabled={regenerationIndex === totalRegenerations}
            title="Next response"
            className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <div className="mx-1 h-3.5 w-px bg-zinc-700" />
        </>
      )}

      {/* Copy */}
      <button
        onClick={handleCopy}
        title={copied ? 'Copied!' : 'Copy message'}
        className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-400" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>

      {/* Regenerate */}
      {onRegenerate && (
        <button
          onClick={onRegenerate}
          disabled={isRegenerating}
          title="Regenerate response"
          className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
        </button>
      )}

      {/* Helpful */}
      {onFeedback && (
        <>
          <button
            onClick={() => handleFeedback('helpful')}
            disabled={feedbackGiven !== null}
            title="Helpful"
            className={`rounded-md p-1.5 transition-colors ${
              feedbackGiven === 'helpful'
                ? 'bg-green-900/30 text-green-400'
                : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <ThumbsUp className="h-3.5 w-3.5" />
          </button>

          {/* Not Helpful */}
          <button
            onClick={() => handleFeedback('not_helpful')}
            disabled={feedbackGiven !== null}
            title="Not helpful"
            className={`rounded-md p-1.5 transition-colors ${
              feedbackGiven === 'not_helpful'
                ? 'bg-red-900/30 text-red-400'
                : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <ThumbsDown className="h-3.5 w-3.5" />
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
    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
      {/* Copy */}
      <button
        onClick={handleCopy}
        title={copied ? 'Copied!' : 'Copy message'}
        className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-400" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>

      {/* Edit */}
      {onEdit && (
        <button
          onClick={onEdit}
          title="Edit message"
          className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
