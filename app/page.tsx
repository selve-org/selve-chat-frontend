'use client'

import { useState, useRef, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Session {
  id: string
  title: string
  createdAt: string
  lastMessageAt: string
}

export default function Chat() {
  const { user, isLoaded: isUserLoaded } = useUser()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoadingSession, setIsLoadingSession] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingContent])

  // Initialize or restore session on mount
  useEffect(() => {
    initializeSession()
  }, [])

  const initializeSession = async () => {
    try {
      setIsLoadingSession(true)

      // Check if we have a session ID in localStorage
      const storedSessionId = localStorage.getItem('selve_chat_session_id')

      if (storedSessionId) {
        // Try to restore existing session
        const session = await restoreSession(storedSessionId)
        if (session) {
          setSessionId(session.id)
          // Load messages from session
          if (session.messages && session.messages.length > 0) {
            const sessionMessages = session.messages.map((msg: any) => ({
              role: msg.role,
              content: msg.content
            }))
            setMessages(sessionMessages)
          }
          console.log('✅ Session restored:', session.id)
          return
        }
      }

      // No existing session, create new one
      const newSession = await createNewSession()
      if (newSession) {
        setSessionId(newSession.id)
        localStorage.setItem('selve_chat_session_id', newSession.id)
        console.log('✅ New session created:', newSession.id)
      }
    } catch (error) {
      console.error('❌ Session initialization failed:', error)
      // Continue without session - messages will be stateless
    } finally {
      setIsLoadingSession(false)
    }
  }

  const createNewSession = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'

      // Use real user IDs from Clerk if available
      const userId = user?.id || 'anonymous_' + Date.now()
      const clerkUserId = user?.id || 'anonymous_' + Date.now()

      const response = await fetch(`${apiUrl}/api/sessions/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          clerkUserId,
          title: 'New Conversation'
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.statusText}`)
      }

      const session = await response.json()
      return session
    } catch (error) {
      console.error('Error creating session:', error)
      return null
    }
  }

  const restoreSession = async (sessionId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'

      const response = await fetch(`${apiUrl}/api/sessions/${sessionId}`)

      if (!response.ok) {
        // Session not found or error, clear localStorage
        localStorage.removeItem('selve_chat_session_id')
        return null
      }

      const session = await response.json()
      return session
    } catch (error) {
      console.error('Error restoring session:', error)
      localStorage.removeItem('selve_chat_session_id')
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: input }
    const currentInput = input

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setStreamingContent('')

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'

      // Use streaming endpoint
      const response = await fetch(`${apiUrl}/api/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentInput,
          conversation_history: messages,
          use_rag: true,
          session_id: sessionId,
          clerk_user_id: user?.id || null
        })
      })

      if (!response.ok) throw new Error('Failed to get response')

      // Read streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let accumulatedContent = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()

          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))

                if (data.chunk) {
                  accumulatedContent += data.chunk
                  setStreamingContent(accumulatedContent)
                }

                if (data.done) {
                  // Streaming complete, add final message
                  const assistantMessage: Message = {
                    role: 'assistant',
                    content: accumulatedContent
                  }
                  setMessages(prev => [...prev, assistantMessage])
                  setStreamingContent('')
                }
              } catch (e) {
                // Skip invalid JSON lines
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }])
      setStreamingContent('')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isUserLoaded || isLoadingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="text-center">
          <div className="mb-4 text-6xl">💬</div>
          <h2 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {!isUserLoaded ? 'Loading your profile...' : 'Loading your conversation...'}
          </h2>
          <div className="flex justify-center space-x-2">
            <div className="h-2 w-2 animate-bounce rounded-full bg-blue-600 [animation-delay:-0.3s]"></div>
            <div className="h-2 w-2 animate-bounce rounded-full bg-blue-600 [animation-delay:-0.15s]"></div>
            <div className="h-2 w-2 animate-bounce rounded-full bg-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-900">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              SELVE Chatbot
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Your personality framework assistant
              {sessionId && (
                <span className="ml-2 text-xs text-zinc-400">
                  • Session active
                </span>
              )}
            </p>
          </div>

          {/* User Profile */}
          {user && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {user.firstName || user.username || 'User'}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {user.primaryEmailAddress?.emailAddress}
                </div>
              </div>
              {user.imageUrl && (
                <img
                  src={user.imageUrl}
                  alt="Profile"
                  className="h-10 w-10 rounded-full ring-2 ring-zinc-200 dark:ring-zinc-700"
                />
              )}
            </div>
          )}
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-6 py-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.length === 0 && !streamingContent ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 text-6xl">💬</div>
              <h2 className="mb-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                Welcome to SELVE Chatbot
              </h2>
              <p className="max-w-md text-zinc-600 dark:text-zinc-400">
                Ask me anything about the SELVE personality framework, your dimensions, or how they shape who you are.
              </p>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-50 dark:ring-zinc-700'
                    }`}
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

              {/* Streaming message */}
              {streamingContent && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700">
                    <div className="prose prose-sm prose-zinc dark:prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {streamingContent}
                      </ReactMarkdown>
                      <span className="inline-block h-4 w-0.5 animate-pulse bg-zinc-900 dark:bg-zinc-50 ml-0.5"></span>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading indicator (only when not streaming) */}
              {isLoading && !streamingContent && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700">
                    <div className="flex space-x-2">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]"></div>
                      <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]"></div>
                      <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400"></div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      <footer className="border-t border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about SELVE dimensions..."
              disabled={isLoading}
              className="flex-1 rounded-full border border-zinc-300 bg-white px-5 py-3 text-sm text-zinc-900 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-zinc-100 disabled:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-400 dark:focus:border-blue-400 dark:disabled:bg-zinc-800"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="rounded-full bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-zinc-300 disabled:text-zinc-500 dark:focus:ring-offset-zinc-950 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-500"
            >
              Send
            </button>
          </div>
        </form>
      </footer>
    </div>
  )
}
