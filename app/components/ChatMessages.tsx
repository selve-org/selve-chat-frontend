'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import ThinkingIndicator, { ThinkingStatus } from './ThinkingIndicator'
import { useStreamingTypewriter } from '../hooks/useTypewriter'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatMessagesProps {
  messages: Message[]
  streamingContent: string
  isLoading: boolean
  thinkingStatus: ThinkingStatus | null
  /** Enable typewriter effect for streaming content (default: true) */
  enableTypewriter?: boolean
}

export default function ChatMessages({
  messages,
  streamingContent,
  isLoading,
  thinkingStatus,
  enableTypewriter = true,
}: ChatMessagesProps) {
  // Use typewriter effect for streaming content
  const { displayedContent, isTyping } = useStreamingTypewriter(
    streamingContent,
    { baseSpeed: 80, naturalVariation: true }
  )
  
  // Use typewriter content or raw streaming content based on setting
  const displayContent = enableTypewriter ? displayedContent : streamingContent
  const showCursor = enableTypewriter ? isTyping : !!streamingContent

  return (
    <div className="space-y-4 px-4 py-6">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`
              max-w-[80%] rounded-2xl px-4 py-3
              ${message.role === 'user'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                : 'bg-white shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700'}
            `}
          >
            {message.role === 'assistant' ? (
              <div className="prose prose-sm prose-zinc dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {message.content}
              </p>
            )}
          </div>
        </div>
      ))}

      {/* Streaming message with typewriter effect */}
      {displayContent && (
        <div className="flex justify-start">
          <div className="max-w-[80%] rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700">
            <div className="prose prose-sm prose-zinc dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {displayContent}
              </ReactMarkdown>
              {showCursor && (
                <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-zinc-900 dark:bg-zinc-50" />
              )}
            </div>
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

      {/* Loading dots (fallback when no thinking status) */}
      {isLoading && !displayContent && !thinkingStatus && (
        <div className="flex justify-start">
          <div className="max-w-[80%] rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700">
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
