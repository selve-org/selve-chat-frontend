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
    <footer className="border-t border-[#1f1e1c] bg-[#0f0f0e] px-4 py-4">
      <div className="mx-auto max-w-3xl space-y-3">
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
          <div className="flex items-end gap-2 rounded-2xl border border-[#24221f] bg-[#1a1917] p-2 focus-within:border-[#9d7bff] focus-within:ring-2 focus-within:ring-[#9d7bff]/25">
            {/* Attachment button */}
            <button
              type="button"
              className="shrink-0 rounded-lg p-2 text-zinc-500 transition-colors hover:bg-[#23211e] hover:text-zinc-200"
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
              className="max-h-[200px] min-h-[44px] flex-1 resize-none bg-transparent py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none disabled:text-zinc-400"
            />

            {/* Submit button */}
            <button
              type="submit"
              disabled={!value.trim() || isLoading}
              className="shrink-0 rounded-xl bg-gradient-to-br from-[#b88dff] via-[#9d7bff] to-[#7f5af0] p-2.5 text-white transition-all hover:brightness-110 disabled:from-[#3f2f66] disabled:via-[#3f2f66] disabled:to-[#3f2f66] disabled:text-zinc-500"
              aria-label="Send message"
            >
              <ArrowUp className="h-5 w-5" />
            </button>
          </div>
        </form>

        {/* Bottom actions */}
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span className="text-zinc-500">Press Enter to send, Shift+Enter for new line</span>
        </div>
      </div>
    </footer>
  )
}
