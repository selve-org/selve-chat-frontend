'use client'

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
  /** Enable typewriter effect for streaming content (default: true) */
  enableTypewriter?: boolean
  /** Callback when user regenerates a message */
  onRegenerate?: (messageId: string) => void
  /** Callback when user provides feedback */
  onFeedback?: (messageId: string, type: 'helpful' | 'not_helpful') => void
  /** Callback when user edits a message */
  onEditMessage?: (messageIndex: number) => void
  /** ID of message currently being regenerated */
  regeneratingMessageId?: string
  /** Index of message being edited */
  editingMessageIndex?: number | null
  /** Content being edited */
  editingContent?: string
  /** Callback when editing content changes */
  onEditingContentChange?: (content: string) => void
  /** Callback when save edit is clicked */
  onSaveEdit?: () => void
  /** Callback when cancel edit is clicked */
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
  const { displayedContent, isTyping } = useStreamingTypewriter(streamingContent, {
    baseSpeed: 12,
    naturalVariation: true,
  })

  const displayContent = enableTypewriter ? displayedContent : streamingContent
  const showCursor = enableTypewriter ? isTyping : !!streamingContent

  const lastAssistantMessageIndex = messages.map((m, i) => m.role === 'assistant' ? i : -1).filter(i => i !== -1).pop()

  return (
    <div className="space-y-6 py-6">
      {messages.map((message, index) => (
        <div key={message.id || index} className="group">
          {message.role === 'user' ? (
            <div className="flex justify-end">
              <div className={`${editingMessageIndex === index ? 'w-full' : 'max-w-[70%]'} space-y-1`}>
                {editingMessageIndex === index ? (
                  // Edit mode
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
                  // View mode
                  <>
                    <div className="rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-sm bg-gradient-to-br from-[#b88dff] via-[#9d7bff] to-[#7f5af0] px-4 py-2.5 text-sm leading-relaxed text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {/* User message actions - show on hover */}
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
                {/* Message bubble - no background */}
                <div className="rounded-2xl px-4 py-3 text-sm leading-relaxed text-[#f4f0e6]">
                  <MarkdownRenderer content={message.content} />
                </div>
                {/* Action toolbar - positioned BELOW message bubble */}
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

      {displayContent && (
        <div className="flex justify-start">
          <div className="w-full rounded-2xl px-4 py-3 text-[#f4f0e6]">
            <MarkdownRenderer content={displayContent} />
            {showCursor && (
              <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-zinc-50" />
            )}
          </div>
        </div>
      )}

      {isLoading && (
        <ThinkingIndicator status={thinkingStatus} isVisible={isLoading && !displayContent} />
      )}

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
