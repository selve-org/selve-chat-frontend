'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { ThinkingStatus } from '../components/ThinkingIndicator'
import { Citation } from '../components/SourceCitations'

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface Session {
  id: string
  title: string
  createdAt: string
  lastMessageAt: string
}

export interface SelveScores {
  LUMEN: number
  AETHER: number
  ORPHEUS: number
  ORIN: number
  LYRA: number
  VARA: number
  CHRONOS: number
  KAEL: number
}

export interface UserProfile {
  has_scores: boolean
  scores?: SelveScores
  archetype?: string
  profile_pattern?: string
  subscriptionPlan?: string
}

export interface UserAccount {
  user_id?: string
  clerk_user_id?: string
  user_name?: string
  email?: string
  has_assessment?: boolean
  subscription_plan?: string
}

export interface MessageCitations {
  [messageIndex: number]: Citation[]
}

interface UseChatOptions {
  userId?: string | null
  userName?: string | null
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'
const DEFAULT_TIMEOUT = 10000
const TITLE_POLL_ATTEMPTS = 5
const TITLE_POLL_DELAY = 600
const PLACEHOLDER_TITLES = new Set(['New Conversation', 'Generating title...', '...'])

// Type guard for session validation
function isValidSession(data: unknown): data is Session {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as Session).id === 'string' &&
    (data as Session).id.length > 0
  )
}

// Type guard for session with messages
function isValidSessionWithMessages(
  data: unknown
): data is Session & { messages?: Message[] } {
  return isValidSession(data)
}

export function useChat({ userId, userName }: UseChatOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoadingSession, setIsLoadingSession] = useState(true)
  const [sessions, setSessions] = useState<Session[]>([])
  const [error, setError] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [userAccount, setUserAccount] = useState<UserAccount | null>(null)
  const [messageCitations, setMessageCitations] = useState<MessageCitations>({})
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [isLoadingAccount, setIsLoadingAccount] = useState(false)
  const [thinkingStatus, setThinkingStatus] = useState<ThinkingStatus | null>(null)
  const [compressionNeeded, setCompressionNeeded] = useState(false)
  const [totalTokens, setTotalTokens] = useState<number | null>(null)

  // Refs for cleanup and stable references
  const abortControllerRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)
  const effectiveUserIdRef = useRef<string | null>(null)

  // Memoized effective user ID - computed once and cached
  const getEffectiveUserId = useCallback((): string | null => {
    if (userId) {
      effectiveUserIdRef.current = userId
      return userId
    }

    if (effectiveUserIdRef.current) {
      return effectiveUserIdRef.current
    }

    if (typeof window === 'undefined') return null

    const storageKey = 'selve_chat_anon_id'
    let stored = localStorage.getItem(storageKey)
    if (!stored) {
      const generated =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `anon_${Date.now()}_${Math.random().toString(36).slice(2)}`
      stored = `anon_${generated}`
      localStorage.setItem(storageKey, stored)
    }
    effectiveUserIdRef.current = stored
    return stored
  }, [userId])

  // Safe fetch wrapper with timeout and abort handling
  const safeFetch = useCallback(
    async <T>(
      url: string,
      options: RequestInit = {},
      timeout = DEFAULT_TIMEOUT
    ): Promise<{ data: T | null; error: string | null }> => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
          return { data: null, error: `HTTP ${response.status}: ${response.statusText}` }
        }

        const data = await response.json()
        return { data, error: null }
      } catch (err) {
        clearTimeout(timeoutId)
        if (err instanceof Error) {
          if (err.name === 'AbortError') {
            return { data: null, error: 'Request timed out' }
          }
          return { data: null, error: err.message }
        }
        return { data: null, error: 'Unknown error occurred' }
      }
    },
    []
  )

  const ensureSessionInList = useCallback((session: Session) => {
    setSessions((prev) => {
      const existingIndex = prev.findIndex((s) => s.id === session.id)
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = { ...updated[existingIndex], ...session }
        return updated
      }
      return [session, ...prev]
    })
  }, [])

  const updateSessionTitleLocally = useCallback((sessionIdToUpdate: string, title: string) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionIdToUpdate ? { ...session, title } : session
      )
    )
  }, [])

  const loadUserProfile = useCallback(async () => {
    const effectiveUserId = getEffectiveUserId()
    if (!effectiveUserId || !mountedRef.current) return

    setIsLoadingProfile(true)
    try {
      const { data } = await safeFetch<UserProfile>(
        `${API_URL}/api/users/${effectiveUserId}/scores`
      )
      if (mountedRef.current && data) {
        setUserProfile(data)
      }
    } finally {
      if (mountedRef.current) {
        setIsLoadingProfile(false)
      }
    }
  }, [getEffectiveUserId, safeFetch])

  const loadUserAccount = useCallback(async () => {
    const effectiveUserId = getEffectiveUserId()
    if (!effectiveUserId || !mountedRef.current) return

    setIsLoadingAccount(true)
    try {
      const { data } = await safeFetch<UserAccount>(
        `${API_URL}/api/users/${effectiveUserId}`
      )
      if (mountedRef.current && data) {
        setUserAccount(data)
      }
    } finally {
      if (mountedRef.current) {
        setIsLoadingAccount(false)
      }
    }
  }, [getEffectiveUserId, safeFetch])

  const loadUserSessions = useCallback(async (): Promise<Session[]> => {
    const effectiveUserId = getEffectiveUserId()
    if (!effectiveUserId) return []

    try {
      const { data, error: fetchError } = await safeFetch<
        Session[] | { sessions: Session[] }
      >(`${API_URL}/api/sessions/user/${effectiveUserId}`)

      if (fetchError || !data) {
        console.error('Error loading sessions:', fetchError)
        return []
      }

      const sessionsArray = Array.isArray(data)
        ? data
        : Array.isArray(data.sessions)
          ? data.sessions
          : []

      const validSessions = sessionsArray.filter(isValidSession)
      const sorted = validSessions.sort(
        (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      )

      if (mountedRef.current) {
        setSessions(sorted)
      }
      return sorted
    } catch (err) {
      console.error('Error loading sessions:', err)
      return []
    }
  }, [getEffectiveUserId, safeFetch])

  const restoreSession = useCallback(
    async (
      sessionIdToRestore: string
    ): Promise<(Session & { messages?: Message[] }) | null> => {
      const { data, error: fetchError } = await safeFetch<Session & { messages?: Message[] }>(
        `${API_URL}/api/sessions/${sessionIdToRestore}`
      )

      if (fetchError) {
        console.error('[useChat] Error restoring session:', fetchError)
        return null
      }

      return isValidSessionWithMessages(data) ? data : null
    },
    [safeFetch]
  )

  const pollSessionTitle = useCallback(
    async (sessionIdToPoll: string): Promise<string | null> => {
      for (let i = 0; i < TITLE_POLL_ATTEMPTS; i++) {
        if (!mountedRef.current) return null

        try {
          const session = await restoreSession(sessionIdToPoll)
          const currentTitle = session?.title
          if (currentTitle && !PLACEHOLDER_TITLES.has(currentTitle)) {
            updateSessionTitleLocally(sessionIdToPoll, currentTitle)
            return currentTitle
          }
        } catch (err) {
          console.warn('[useChat] pollSessionTitle error', err)
        }

        await new Promise((resolve) => setTimeout(resolve, TITLE_POLL_DELAY))
      }
      return null
    },
    [restoreSession, updateSessionTitleLocally]
  )

  const createNewSession = useCallback(async (): Promise<Session | null> => {
    const effectiveUserId = getEffectiveUserId()
    if (!effectiveUserId) return null

    const { data, error: fetchError } = await safeFetch<Session>(
      `${API_URL}/api/sessions/`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: effectiveUserId,
          clerkUserId: effectiveUserId,
          title: 'New Conversation',
        }),
      }
    )

    if (fetchError) {
      console.error('Error creating session:', fetchError)
      return null
    }

    if (isValidSession(data)) {
      const session: Session = {
        id: data.id,
        title: data.title || 'New Conversation',
        createdAt: data.createdAt || new Date().toISOString(),
        lastMessageAt: data.lastMessageAt || new Date().toISOString(),
      }
      ensureSessionInList(session)
      return session
    }

    return null
  }, [getEffectiveUserId, safeFetch, ensureSessionInList])

  const generateTitleForSession = useCallback(
    async (sessionIdToUpdate: string, userMessage: string, assistantMessage: string) => {
      try {
        const { data } = await safeFetch<{ title?: string; session?: { title?: string } }>(
          `${API_URL}/api/sessions/${sessionIdToUpdate}/generate-title`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: userMessage,
              assistant_response: assistantMessage,
            }),
          }
        )

        const newTitle = data?.title || data?.session?.title
        if (newTitle) {
          updateSessionTitleLocally(sessionIdToUpdate, newTitle)
        }
      } catch (err) {
        console.error('Failed to generate title:', err)
      }

      // Poll for background title update, then refresh sessions
      await pollSessionTitle(sessionIdToUpdate)
      if (mountedRef.current) {
        await loadUserSessions()
      }
    },
    [safeFetch, updateSessionTitleLocally, pollSessionTitle, loadUserSessions]
  )

  const initializeSession = useCallback(async () => {
    if (!mountedRef.current) return

    setIsLoadingSession(true)

    try {
      const existingSessions = await loadUserSessions()

      if (existingSessions.length > 0) {
        const mostRecent = existingSessions[0]
        const session = await restoreSession(mostRecent.id)
        if (session && mountedRef.current) {
          setSessionId(session.id)
          setMessages(session.messages || [])
          ensureSessionInList({
            id: session.id,
            title: session.title || 'New Conversation',
            createdAt: session.createdAt || new Date().toISOString(),
            lastMessageAt: session.lastMessageAt || new Date().toISOString(),
          })
          return
        }
      }

      // No sessions or restore failed - create new
      const newSession = await createNewSession()
      if (newSession && mountedRef.current) {
        setSessionId(newSession.id)
        setMessages([])
      }
    } catch (err) {
      console.error('[useChat] Error initializing session:', err)
    } finally {
      if (mountedRef.current) {
        setIsLoadingSession(false)
      }
    }
  }, [loadUserSessions, restoreSession, createNewSession, ensureSessionInList])

  const switchSession = useCallback(
    async (newSessionId: string) => {
      // Cancel any ongoing stream
      abortControllerRef.current?.abort()

      const session = await restoreSession(newSessionId)
      if (session && mountedRef.current) {
        setSessionId(session.id)
        setMessages(session.messages || [])
        setStreamingContent('')
        setThinkingStatus(null)
        setError(null)
      }
    },
    [restoreSession]
  )

  const createNewConversation = useCallback(async () => {
    // Cancel any ongoing stream
    abortControllerRef.current?.abort()

    const newSession = await createNewSession()
    if (newSession && mountedRef.current) {
      setSessionId(newSession.id)
      setMessages([])
      setStreamingContent('')
      setThinkingStatus(null)
      setError(null)
      await loadUserSessions()
    }
  }, [createNewSession, loadUserSessions])

  const deleteSession = useCallback(
    async (sessionIdToDelete: string) => {
      try {
        const response = await fetch(`${API_URL}/api/sessions/${sessionIdToDelete}`, {
          method: 'DELETE',
        })

        if (response.ok && mountedRef.current) {
          // If deleting current session, create a new one
          if (sessionIdToDelete === sessionId) {
            const newSession = await createNewSession()
            if (newSession) {
              setSessionId(newSession.id)
              setMessages([])
            }
          }
          await loadUserSessions()
        }
      } catch (err) {
        console.error('Error deleting session:', err)
      }
    },
    [sessionId, createNewSession, loadUserSessions]
  )

  const sendMessage = useCallback(
    async (userMessage: string) => {
      const trimmedMessage = userMessage.trim()
      if (!trimmedMessage || !sessionId) return

      // Cancel any existing stream
      abortControllerRef.current?.abort()
      abortControllerRef.current = new AbortController()

      const isFirstMessage = messages.length === 0
      const currentMessageIndex = messages.length // Capture for citations

      // Optimistically add user message
      setMessages((prev) => [...prev, { role: 'user', content: trimmedMessage }])
      setIsLoading(true)
      setStreamingContent('')
      setError(null)
      setThinkingStatus({
        status: 'retrieving_context',
        message: 'Processing your message...',
        details: {},
      })

      let fullContent = ''
      let streamFinalized = false

      const finalizeStream = async () => {
        if (streamFinalized || !mountedRef.current) return
        streamFinalized = true

        setMessages((prev) => [...prev, { role: 'assistant', content: fullContent }])
        setStreamingContent('')
        setThinkingStatus(null)
        setIsLoading(false)

        if (isFirstMessage && fullContent.trim()) {
          await generateTitleForSession(sessionId, trimmedMessage, fullContent)
        } else {
          await loadUserSessions()
        }
      }

      try {
        const response = await fetch(`${API_URL}/api/chat/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmedMessage,
            session_id: sessionId,
            clerk_user_id: userId || null,
            user_name: userName || null,
            stream: true,
          }),
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const body = response.body
        if (!body) {
          throw new Error('Response body is null')
        }

        const reader = body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        try {
          while (true) {
            const { done, value } = await reader.read()

            if (done) {
              // Process any remaining buffer
              if (buffer.trim()) {
                processSSELine(buffer)
              }
              if (fullContent && !streamFinalized) {
                await finalizeStream()
              }
              break
            }

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')

            // Keep the last potentially incomplete line in buffer
            buffer = lines.pop() || ''

            for (const line of lines) {
              processSSELine(line)
            }
          }
        } finally {
          reader.releaseLock()
        }

        function processSSELine(line: string) {
          const trimmedLine = line.trim()
          if (!trimmedLine.startsWith('data: ')) return

          const data = trimmedLine.slice(6)
          if (data === '[DONE]') {
            return
          }

          try {
            const parsed = JSON.parse(data)

            // Handle status updates
            if (parsed.type === 'status' && mountedRef.current) {
              setThinkingStatus({
                status: parsed.status || 'generating',
                message: parsed.message || 'Processing...',
                details: parsed.details || {},
              })
            }

            // Handle content chunks
            const content = parsed.content || parsed.chunk
            if (content) {
              fullContent += content
              if (mountedRef.current) {
                setStreamingContent(fullContent)
                setThinkingStatus(null)
              }
            }

            // Handle citations
            if (parsed.citations && mountedRef.current) {
              setMessageCitations((prev) => ({
                ...prev,
                [currentMessageIndex + 1]: parsed.citations,
              }))
            }

            // Handle compression warning
            if (parsed.compression_needed && mountedRef.current) {
              setCompressionNeeded(true)
              setTimeout(() => {
                if (mountedRef.current) {
                  setCompressionNeeded(false)
                }
              }, 8000)
            }

            // Handle token count
            if (parsed.total_tokens && mountedRef.current) {
              setTotalTokens(parsed.total_tokens)
            }
          } catch {
            // Ignore JSON parse errors for malformed chunks
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          // Request was cancelled - clean up silently
          if (mountedRef.current) {
            setIsLoading(false)
            setThinkingStatus(null)
          }
          return
        }

        console.error('Error:', err)

        if (mountedRef.current) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error'
          setError(`Failed to get response: ${errorMessage}`)
          setThinkingStatus({ status: 'error', message: 'Something went wrong', details: {} })
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
          ])
          setStreamingContent('')
          setIsLoading(false)

          setTimeout(() => {
            if (mountedRef.current) {
              setError(null)
              setThinkingStatus(null)
            }
          }, 5000)
        }
      }
    },
    [
      sessionId,
      userId,
      userName,
      messages.length,
      generateTitleForSession,
      loadUserSessions,
    ]
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const userMessage = input.trim()
      if (!userMessage) return
      setInput('')
      await sendMessage(userMessage)
    },
    [input, sendMessage]
  )

  const clearError = useCallback(() => setError(null), [])

  const cancelStream = useCallback(() => {
    abortControllerRef.current?.abort()
    setIsLoading(false)
    setThinkingStatus(null)
    setStreamingContent('')
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      abortControllerRef.current?.abort()
    }
  }, [])

  // Initialize session on mount
  useEffect(() => {
    initializeSession()
  }, [initializeSession])

  // Load user data when userId changes
  useEffect(() => {
    if (userId) {
      // Reset cached effective user ID when userId changes
      effectiveUserIdRef.current = null
      loadUserSessions()
      loadUserProfile()
      loadUserAccount()
    }
  }, [userId, loadUserSessions, loadUserProfile, loadUserAccount])

  return {
    // State
    messages,
    input,
    setInput,
    isLoading,
    streamingContent,
    sessionId,
    isLoadingSession,
    sessions,
    error,
    userProfile,
    userAccount,
    isLoadingProfile,
    isLoadingAccount,
    messageCitations,
    thinkingStatus,
    compressionNeeded,
    totalTokens,
    hasMessages: messages.length > 0 || !!streamingContent,

    // Actions
    handleSubmit,
    sendMessage,
    switchSession,
    createNewConversation,
    deleteSession,
    clearError,
    cancelStream,
  }
}