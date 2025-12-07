'use client'

import { ArrowUp, Sparkles, Paperclip } from 'lucide-react'
import { FormEvent, KeyboardEvent, useRef } from 'react'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (e: FormEvent) => void
  isLoading: boolean
  placeholder?: string
  suggestions?: string[]
  onSuggestionClick?: (suggestion: string) => void
}

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  placeholder = 'Ask me anything about SELVE...',
  suggestions = [],
  onSuggestionClick,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !isLoading) {
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

  return (
    <footer className="border-t border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-3xl space-y-3">
        {/* Suggestion chips */}
        {suggestions.length > 0 && !value && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => onSuggestionClick?.(suggestion)}
                className="rounded-full border border-zinc-300 bg-zinc-50 px-4 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Input area */}
        <form onSubmit={onSubmit} className="relative">
          <div className="flex items-end gap-2 rounded-2xl border border-zinc-300 bg-zinc-50 p-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900">
            {/* Attachment button */}
            <button
              type="button"
              className="shrink-0 rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
              aria-label="Attach file"
            >
              <Paperclip className="h-5 w-5" />
            </button>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => {
                onChange(e.target.value)
                handleInput()
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isLoading}
              rows={1}
              className="max-h-[200px] min-h-[44px] flex-1 resize-none bg-transparent py-3 text-sm text-zinc-900 placeholder-zinc-500 focus:outline-none disabled:text-zinc-400 dark:text-white dark:placeholder-zinc-400"
            />

            {/* Submit button */}
            <button
              type="submit"
              disabled={!value.trim() || isLoading}
              className="shrink-0 rounded-xl bg-zinc-900 p-2.5 text-white transition-colors hover:bg-zinc-800 disabled:bg-zinc-300 disabled:text-zinc-500 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-500"
              aria-label="Send message"
            >
              <ArrowUp className="h-5 w-5" />
            </button>
          </div>
        </form>

        {/* Bottom actions */}
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Powered by GPT-5</span>
          </div>
          <span>Press Enter to send, Shift+Enter for new line</span>
        </div>
      </div>
    </footer>
  )
}
