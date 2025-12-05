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
  const [sessions, setSessions] = useState<Session[]>([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
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

  // Load user sessions when user is loaded
  useEffect(() => {
    if (isUserLoaded && user) {
      loadUserSessions()
    }
  }, [isUserLoaded, user])

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

  const loadUserSessions = async () => {
    if (!user?.id) return

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'
      const response = await fetch(`${apiUrl}/api/sessions/user/${user.id}`)

      if (!response.ok) {
        console.error('Failed to load sessions')
        return
      }

      const userSessions = await response.json()
      setSessions(userSessions)
    } catch (error) {
      console.error('Error loading sessions:', error)
    }
  }

  const switchSession = async (newSessionId: string) => {
    try {
      const session = await restoreSession(newSessionId)
      if (session) {
        setSessionId(session.id)
        localStorage.setItem('selve_chat_session_id', session.id)

        // Load messages from session
        if (session.messages && session.messages.length > 0) {
          const sessionMessages = session.messages.map((msg: any) => ({
            role: msg.role,
            content: msg.content
          }))
          setMessages(sessionMessages)
        } else {
          setMessages([])
        }

        setIsSidebarOpen(false) // Close sidebar on mobile after selection
      }
    } catch (error) {
      console.error('Error switching session:', error)
    }
  }

  const createNewConversation = async () => {
    const newSession = await createNewSession()
    if (newSession) {
      setSessionId(newSession.id)
      localStorage.setItem('selve_chat_session_id', newSession.id)
      setMessages([])
      await loadUserSessions() // Refresh sessions list
      setIsSidebarOpen(false) // Close sidebar on mobile
    }
  }

  const deleteSession = async (sessionIdToDelete: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'
      const response = await fetch(`${apiUrl}/api/sessions/${sessionIdToDelete}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        console.error('Failed to delete session')
        return
      }

      // If deleted session is current, create new one
      if (sessionIdToDelete === sessionId) {
        await createNewConversation()
      } else {
        await loadUserSessions() // Just refresh list
      }
    } catch (error) {
      console.error('Error deleting session:', error)
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
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-zinc-200 bg-white transition-transform dark:border-zinc-800 dark:bg-zinc-950 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-full flex-col">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Conversations</h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden rounded p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* New Conversation Button */}
          <div className="p-3">
            <button
              onClick={createNewConversation}
              className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              + New conversation
            </button>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto px-3">
            {sessions.length === 0 ? (
              <p className="py-4 text-center text-sm text-zinc-500">No conversations yet</p>
            ) : (
              <div className="space-y-1">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`group relative flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                      session.id === sessionId
                        ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                        : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900'
                    }`}
                  >
                    <button
                      onClick={() => switchSession(session.id)}
                      className="flex-1 truncate text-left"
                    >
                      {session.title}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteSession(session.id)
                      }}
                      className="ml-2 opacity-0 rounded p-1 hover:bg-zinc-200 group-hover:opacity-100 dark:hover:bg-zinc-700"
                      title="Delete conversation"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mx-auto flex max-w-3xl items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden rounded p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
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
    </div>
  )
}
