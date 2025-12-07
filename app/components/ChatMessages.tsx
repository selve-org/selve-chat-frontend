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
  const { displayedContent, isTyping } = useStreamingTypewriter(streamingContent, {
    baseSpeed: 80,
    naturalVariation: true,
  })

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
            className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-[0_10px_30px_rgba(0,0,0,0.35)] ${
              message.role === 'user'
                ? 'bg-gradient-to-br from-[#b88dff] via-[#9d7bff] to-[#7f5af0] text-white'
                : 'bg-[#131210] text-[#f4f0e6]'
            }`}
          >
            {message.role === 'assistant' ? (
              <div className="prose prose-sm prose-invert max-w-none text-[#f4f0e6] prose-a:text-[#cbb2ff]">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="whitespace-pre-wrap">
                {message.content}
              </p>
            )}
          </div>
        </div>
      ))}

      {displayContent && (
        <div className="flex justify-start">
          <div className="max-w-[80%] rounded-2xl bg-[#131210] px-4 py-3 text-[#f4f0e6] shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
            <div className="prose prose-sm prose-invert max-w-none text-[#f4f0e6] prose-a:text-[#cbb2ff]">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {displayContent}
              </ReactMarkdown>
              {showCursor && (
                <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-zinc-50" />
              )}
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <ThinkingIndicator status={thinkingStatus} isVisible={isLoading && !displayContent} />
      )}

      {isLoading && !displayContent && !thinkingStatus && (
        <div className="flex justify-start">
          <div className="max-w-[80%] rounded-2xl bg-[#131210] px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
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
