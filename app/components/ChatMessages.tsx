'use client'

import { useMemo } from 'react'
import ThinkingIndicator, { ThinkingStatus } from './ThinkingIndicator'
import { useStreamingTypewriter } from '../hooks/useTypewriter'
import MarkdownRenderer from './MarkdownRenderer'
import MessageActions, { UserMessageActions } from './MessageActions'

interface Message {
  role: 'user' | 'assistant'
  content: string
  id?: string
}

interface ChatMessagesProps {
  messages: Message[]
  streamingContent: string
  isLoading: boolean
  thinkingStatus: ThinkingStatus | null
  enableTypewriter?: boolean
  onRegenerate?: (messageId: string) => void
  onFeedback?: (messageId: string, type: 'helpful' | 'not_helpful') => void
  onEditMessage?: (messageIndex: number) => void
  regeneratingMessageId?: string
  editingMessageIndex?: number | null
  editingContent?: string
  onEditingContentChange?: (content: string) => void
  onSaveEdit?: () => void
  onCancelEdit?: () => void
}

export default function ChatMessages({
  messages,
  streamingContent,
  isLoading,
  thinkingStatus,
  enableTypewriter = true,
  onRegenerate,
  onFeedback,
  onEditMessage,
  regeneratingMessageId,
  editingMessageIndex,
  editingContent,
  onEditingContentChange,
  onSaveEdit,
  onCancelEdit,
}: ChatMessagesProps) {
  // Memoize options to prevent re-creating on every render
  const typewriterOptions = useMemo(() => ({
    charsPerSecond: 80,        // Fast but visible typing
    naturalVariation: true,    // Feels more natural
    adaptiveSpeed: true,       // Speed up when buffer builds
    speedUpThreshold: 30,      // Start speeding up at 30 char buffer
    maxSpeedMultiplier: 4,     // Can go up to 4x speed when catching up
  }), [])

  const { displayedContent, isTyping } = useStreamingTypewriter(
    streamingContent,
    typewriterOptions
  )

  // Choose what to display based on enableTypewriter flag
  const displayContent = enableTypewriter ? displayedContent : streamingContent
  const showCursor = enableTypewriter ? isTyping : !!streamingContent

  // Find last assistant message for showing action toolbar
  const lastAssistantMessageIndex = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') return i
    }
    return -1
  }, [messages])

  return (
    <div className="space-y-6 py-6">
      {messages.map((message, index) => (
        <div key={message.id || index} className="group">
          {message.role === 'user' ? (
            <div className="flex justify-end">
              <div className={`${editingMessageIndex === index ? 'w-full' : 'max-w-[70%]'} space-y-1`}>
                {editingMessageIndex === index ? (
                  <div className="w-full space-y-2">
                    <textarea
                      value={editingContent}
                      onChange={(e) => onEditingContentChange?.(e.target.value)}
                      className="w-full min-h-[100px] rounded-2xl bg-[#1a1a1a] border border-zinc-700 px-4 py-3 text-sm text-white focus:border-purple-500 focus:outline-none resize-y"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={onCancelEdit}
                        className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={onSaveEdit}
                        className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-sm bg-gradient-to-br from-[#b88dff] via-[#9d7bff] to-[#7f5af0] px-4 py-2.5 text-sm leading-relaxed text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <div className="flex justify-end">
                      <UserMessageActions
                        content={message.content}
                        onEdit={onEditMessage ? () => onEditMessage(index) : undefined}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex justify-start">
              <div className="w-full space-y-1">
                <div className="rounded-2xl px-4 py-3 text-sm leading-relaxed text-[#f4f0e6]">
                  <MarkdownRenderer content={message.content} />
                </div>
                <MessageActions
                  messageId={message.id || `temp-${index}`}
                  content={message.content}
                  onRegenerate={onRegenerate ? () => onRegenerate(message.id || `temp-${index}`) : undefined}
                  onFeedback={onFeedback ? (type) => onFeedback(message.id || `temp-${index}`, type) : undefined}
                  isRegenerating={regeneratingMessageId === (message.id || `temp-${index}`)}
                  isVisible={index === lastAssistantMessageIndex}
                />
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Streaming content with typewriter effect */}
      {displayContent && (
        <div className="flex justify-start">
          <div className="w-full rounded-2xl px-4 py-3 text-[#f4f0e6]">
            <MarkdownRenderer content={displayContent} />
            {showCursor && (
              <span 
                className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-zinc-50"
                aria-hidden="true"
              />
            )}
          </div>
        </div>
      )}

      {/* Thinking indicator - show when loading and no content yet */}
      {isLoading && (
        <ThinkingIndicator 
          status={thinkingStatus} 
          isVisible={isLoading && !displayContent} 
        />
      )}

      {/* Fallback loading dots */}
      {isLoading && !displayContent && !thinkingStatus && (
        <div className="flex justify-start">
          <div className="max-w-[80%] rounded-2xl bg-[#131210] px-4 py-3">
            <div className="flex space-x-2">
              <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]" />
              <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]" />
              <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}