'use client'

import { ArrowUp } from 'lucide-react'
import { FormEvent, KeyboardEvent, useRef, useEffect } from 'react'
import { usePlaceholderRotation } from '../hooks/usePlaceholderRotation'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (e: FormEvent) => void
  isLoading: boolean
  isBanned?: boolean
  banExpiresAt?: string | null
  placeholder?: string
  suggestions?: string[]
  onSuggestionClick?: (suggestion: string) => void
  hasMessages?: boolean
}

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  isBanned = false,
  banExpiresAt = null,
  placeholder = 'Ask me anything about SELVE...',
  suggestions = [],
  onSuggestionClick,
  hasMessages = false,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { currentPlaceholder, nextPlaceholder, isTransitioning } = usePlaceholderRotation(3000)
  
  // Static placeholder after first message
  const staticPlaceholder = "What's on your mind?"

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !isLoading && !isBanned) {
        onSubmit(e as unknown as FormEvent)
      }
    }
  }

  const handleInput = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }

  // Reset textarea height when value is cleared
  useEffect(() => {
    if (!value && textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [value])

  return (
    <footer className="border-t border-[#1f1e1c] bg-[#0f0f0e] px-4 py-4">
      <div className="mx-auto w-full max-w-5xl space-y-3 px-1 sm:px-4 lg:px-6">
        {/* Suggestion chips */}
        {suggestions.length > 0 && !value && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => onSuggestionClick?.(suggestion)}
                className="rounded-full border border-[#2c261f] bg-[#1a1917] px-4 py-2 text-sm text-zinc-200 transition-colors hover:border-[#3a3127] hover:bg-[#22201d]"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Input area */}
        <form onSubmit={onSubmit} className="relative">
          <div className="flex items-end gap-3 rounded-2xl border border-[#24221f] bg-[#1a1917] px-4 py-2 focus-within:border-[#9d7bff] focus-within:ring-2 focus-within:ring-[#9d7bff]/25">
            {/* Textarea */}
            <div className="relative flex-1">
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => {
                  onChange(e.target.value)
                  handleInput()
                }}
                onKeyDown={handleKeyDown}
                placeholder=" "
                disabled={isLoading || isBanned}
                rows={1}
                className="max-h-[200px] min-h-[44px] w-full resize-none bg-transparent py-3 text-sm leading-5 text-zinc-100 placeholder-transparent focus:outline-none disabled:text-zinc-400"
              />
              {/* Animated placeholder overlay (welcome screen only) */}
              {!value && !isBanned && !hasMessages && (
                <div className="pointer-events-none absolute inset-0 flex items-center overflow-hidden">
                  {/* Current text sliding down */}
                  <span
                    key={`current-${currentPlaceholder}`}
                    className={`absolute text-sm leading-5 text-zinc-500 ${isTransitioning ? 'animate-slide-down' : ''}`}
                  >
                    {currentPlaceholder}
                  </span>
                  {/* Next text sliding up */}
                  {isTransitioning && (
                    <span
                      key={`next-${nextPlaceholder}`}
                      className="absolute text-sm leading-5 text-zinc-500 animate-slide-up"
                    >
                      {nextPlaceholder}
                    </span>
                  )}
                </div>
              )}
              {/* Static placeholder (after first message) */}
              {!value && !isBanned && hasMessages && (
                <div className="pointer-events-none absolute inset-0 flex items-center">
                  <span className="text-sm leading-5 text-zinc-500">
                    {staticPlaceholder}
                  </span>
                </div>
              )}
              {!value && isBanned && (
                <div className="pointer-events-none absolute inset-0 flex items-center">
                  <span className="text-sm leading-5 text-zinc-500">SELVE is unavailable</span>
                </div>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={!value.trim() || isLoading || isBanned}
              className="shrink-0 rounded-xl bg-gradient-to-br from-[#b88dff] via-[#9d7bff] to-[#7f5af0] p-2.5 text-white transition-all hover:brightness-110 disabled:from-[#3f2f66] disabled:via-[#3f2f66] disabled:to-[#3f2f66] disabled:text-zinc-500"
              aria-label="Send message"
            >
              <ArrowUp className="h-5 w-5" />
            </button>
          </div>
        </form>

        {/* Bottom actions */}
        <div className="flex items-center justify-between text-xs text-zinc-500">
          {isBanned && banExpiresAt ? (
            <span className="text-red-400">
              Access restricted. Try again at {new Date(banExpiresAt).toLocaleString()}
            </span>
          ) : (
            <span className="text-zinc-500">Press Enter to send, Shift+Enter for new line</span>
          )}
        </div>
      </div>
    </footer>
  )
}
