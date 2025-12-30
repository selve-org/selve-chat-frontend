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
  // Memoize typewriter options to prevent unnecessary re-renders
  const typewriterOptions = useMemo(() => ({
    baseSpeed: 50, // Slightly faster for better UX
    naturalVariation: true,
    streamComplete: !isLoading && streamingContent.length > 0,
  }), [isLoading, streamingContent.length])

  const { displayedContent, isTyping } = useStreamingTypewriter(
    streamingContent,
    typewriterOptions
  )

  // Determine what content to show
  const displayContent = enableTypewriter ? displayedContent : streamingContent
  
  // Show cursor when actively typing (typewriter is behind the stream)
  const showCursor = enableTypewriter ? isTyping : !!streamingContent

  // Find the last assistant message index for showing actions
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
            <UserMessage
              message={message}
              index={index}
              isEditing={editingMessageIndex === index}
              editingContent={editingContent}
              onEditingContentChange={onEditingContentChange}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
              onEditMessage={onEditMessage}
            />
          ) : (
            <AssistantMessage
              message={message}
              index={index}
              isLastAssistant={index === lastAssistantMessageIndex}
              onRegenerate={onRegenerate}
              onFeedback={onFeedback}
              regeneratingMessageId={regeneratingMessageId}
            />
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

      {/* Thinking indicator */}
      {isLoading && (
        <ThinkingIndicator 
          status={thinkingStatus} 
          isVisible={isLoading && !displayContent} 
        />
      )}

      {/* Fallback loading dots when no thinking status */}
      {isLoading && !displayContent && !thinkingStatus && (
        <LoadingDots />
      )}
    </div>
  )
}

// ============================================================================
// Sub-components for better organization and performance
// ============================================================================

interface UserMessageProps {
  message: Message
  index: number
  isEditing: boolean
  editingContent?: string
  onEditingContentChange?: (content: string) => void
  onSaveEdit?: () => void
  onCancelEdit?: () => void
  onEditMessage?: (index: number) => void
}

function UserMessage({
  message,
  index,
  isEditing,
  editingContent,
  onEditingContentChange,
  onSaveEdit,
  onCancelEdit,
  onEditMessage,
}: UserMessageProps) {
  if (isEditing) {
    return (
      <div className="flex justify-end">
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
      </div>
    )
  }

  return (
    <div className="flex justify-end">
      <div className="max-w-[70%] space-y-1">
        <div className="rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-sm bg-gradient-to-br from-[#b88dff] via-[#9d7bff] to-[#7f5af0] px-4 py-2.5 text-sm leading-relaxed text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        <div className="flex justify-end">
          <UserMessageActions
            content={message.content}
            onEdit={onEditMessage ? () => onEditMessage(index) : undefined}
          />
        </div>
      </div>
    </div>
  )
}

interface AssistantMessageProps {
  message: Message
  index: number
  isLastAssistant: boolean
  onRegenerate?: (messageId: string) => void
  onFeedback?: (messageId: string, type: 'helpful' | 'not_helpful') => void
  regeneratingMessageId?: string
}

function AssistantMessage({
  message,
  index,
  isLastAssistant,
  onRegenerate,
  onFeedback,
  regeneratingMessageId,
}: AssistantMessageProps) {
  const messageId = message.id || `temp-${index}`
  
  return (
    <div className="flex justify-start">
      <div className="w-full space-y-1">
        <div className="rounded-2xl px-4 py-3 text-sm leading-relaxed text-[#f4f0e6]">
          <MarkdownRenderer content={message.content} />
        </div>
        <MessageActions
          messageId={messageId}
          content={message.content}
          onRegenerate={onRegenerate ? () => onRegenerate(messageId) : undefined}
          onFeedback={onFeedback ? (type) => onFeedback(messageId, type) : undefined}
          isRegenerating={regeneratingMessageId === messageId}
          isVisible={isLastAssistant}
        />
      </div>
    </div>
  )
}

function LoadingDots() {
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] rounded-2xl bg-[#131210] px-4 py-3">
        <div className="flex space-x-2">
          <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]" />
          <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]" />
          <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" />
        </div>
      </div>
    </div>
  )
}