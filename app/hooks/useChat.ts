'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { ThinkingStatus } from '../components/ThinkingIndicator'
import { Citation } from '../components/SourceCitations'

export interface Message {
  role: 'user' | 'assistant'
  content: string
  id?: string
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

// Type guards
function isValidSession(data: unknown): data is Session {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as Session).id === 'string' &&
    (data as Session).id.length > 0
  )
}

function isValidSessionWithMessages(
  data: unknown
): data is Session & { messages?: Message[] } {
  return isValidSession(data)
}

export function useChat({ userId, userName }: UseChatOptions = {}) {
  // Core state
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoadingSession, setIsLoadingSession] = useState(true)
  const [sessions, setSessions] = useState<Session[]>([])
  const [error, setError] = useState<string | null>(null)
  
  // User state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [userAccount, setUserAccount] = useState<UserAccount | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [isLoadingAccount, setIsLoadingAccount] = useState(false)
  
  // UI state
  const [messageCitations, setMessageCitations] = useState<MessageCitations>({})
  const [thinkingStatus, setThinkingStatus] = useState<ThinkingStatus | null>(null)
  const [compressionNeeded, setCompressionNeeded] = useState(false)
  const [totalTokens, setTotalTokens] = useState<number | null>(null)
  
  // Security state
  const [isBanned, setIsBanned] = useState(false)
  const [banExpiresAt, setBanExpiresAt] = useState<string | null>(null)
  const [securityWarning, setSecurityWarning] = useState<string | null>(null)

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)
  const effectiveUserIdRef = useRef<string | null>(null)
  const profileLoadedRef = useRef<Promise<void> | null>(null)
  const isPendingNewSession = useRef(false)

  // Get effective user ID (real or anonymous)
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

  // Safe fetch with timeout
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

  // Session list management
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

  // Load user profile
  const loadUserProfile = useCallback(async () => {
    const effectiveUserId = getEffectiveUserId()
    if (!effectiveUserId || !mountedRef.current) return

    setIsLoadingProfile(true)
    const profilePromise = (async () => {
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
    })()
    
    profileLoadedRef.current = profilePromise
    await profilePromise
  }, [getEffectiveUserId, safeFetch])

  // Load user account
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

  // Load user sessions
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

  // Restore a session
  const restoreSession = useCallback(
    async (sessionIdToRestore: string): Promise<(Session & { messages?: Message[] }) | null> => {
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

  // Poll for session title
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

  // Create new session
  const createNewSession = useCallback(async (): Promise<Session | null> => {
    const effectiveUserId = getEffectiveUserId()
    if (!effectiveUserId) {
      console.error('[createNewSession] No user ID available')
      return null
    }

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
      console.error('[createNewSession] Error:', fetchError)
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
      isPendingNewSession.current = false
      return session
    }

    return null
  }, [getEffectiveUserId, safeFetch, ensureSessionInList])

  // Generate title for session
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

      await pollSessionTitle(sessionIdToUpdate)
      if (mountedRef.current) {
        await loadUserSessions()
      }
    },
    [safeFetch, updateSessionTitleLocally, pollSessionTitle, loadUserSessions]
  )

  // Initialize session on mount
  const initializeSession = useCallback(async () => {
    if (!mountedRef.current) return

    setIsLoadingSession(true)

    try {
      const persistedSessionId = sessionStorage.getItem('currentSessionId')
      if (persistedSessionId) {
        const session = await restoreSession(persistedSessionId)
        if (session && mountedRef.current) {
          setSessionId(session.id)
          setMessages(session.messages || [])
          isPendingNewSession.current = false
          ensureSessionInList({
            id: session.id,
            title: session.title || 'New Conversation',
            createdAt: session.createdAt || new Date().toISOString(),
            lastMessageAt: session.lastMessageAt || new Date().toISOString(),
          })
          return
        }
      }

      const existingSessions = await loadUserSessions()

      if (existingSessions.length > 0) {
        const mostRecent = existingSessions[0]
        const session = await restoreSession(mostRecent.id)
        if (session && mountedRef.current) {
          setSessionId(session.id)
          setMessages(session.messages || [])
          isPendingNewSession.current = false
          sessionStorage.setItem('currentSessionId', session.id)
          ensureSessionInList({
            id: session.id,
            title: session.title || 'New Conversation',
            createdAt: session.createdAt || new Date().toISOString(),
            lastMessageAt: session.lastMessageAt || new Date().toISOString(),
          })
          return
        }
      }

      // No sessions - wait for first message
      if (mountedRef.current) {
        setSessionId(null)
        setMessages([])
        isPendingNewSession.current = true
        sessionStorage.removeItem('currentSessionId')
      }
    } catch (err) {
      console.error('[useChat] Error initializing session:', err)
    } finally {
      if (mountedRef.current) {
        setIsLoadingSession(false)
      }
    }
  }, [loadUserSessions, restoreSession, ensureSessionInList])

  // Switch to a different session
  const switchSession = useCallback(
    async (newSessionId: string) => {
      abortControllerRef.current?.abort()

      const session = await restoreSession(newSessionId)
      if (session && mountedRef.current) {
        setSessionId(session.id)
        setMessages(session.messages || [])
        isPendingNewSession.current = false
        sessionStorage.setItem('currentSessionId', session.id)
        setStreamingContent('')
        setThinkingStatus(null)
        setError(null)
        setSecurityWarning(null)
      }
    },
    [restoreSession]
  )

  // Create new conversation
  const createNewConversation = useCallback(async () => {
    // Prevent creating duplicate empty sessions
    if (isPendingNewSession.current && messages.length === 0) {
      return
    }
    if (sessionId && messages.length === 0) {
      return
    }

    abortControllerRef.current?.abort()

    if (mountedRef.current) {
      setSessionId(null)
      setMessages([])
      isPendingNewSession.current = true
      sessionStorage.removeItem('currentSessionId')
      setStreamingContent('')
      setThinkingStatus(null)
      setError(null)
      setSecurityWarning(null)
      await loadUserSessions()
    }
  }, [loadUserSessions, messages.length, sessionId])

  // Delete session
  const deleteSession = useCallback(
    async (sessionIdToDelete: string) => {
      try {
        const response = await fetch(`${API_URL}/api/sessions/${sessionIdToDelete}`, {
          method: 'DELETE',
        })

        if (response.ok && mountedRef.current) {
          if (sessionIdToDelete === sessionId) {
            setSessionId(null)
            setMessages([])
            isPendingNewSession.current = true
            sessionStorage.removeItem('currentSessionId')
          }
          await loadUserSessions()
        }
      } catch (err) {
        console.error('Error deleting session:', err)
      }
    },
    [sessionId, loadUserSessions]
  )

  // Main send message function
  const sendMessage = useCallback(
    async (userMessage: string) => {
      const trimmedMessage = userMessage.trim()
      if (!trimmedMessage) return

      // Don't send if banned
      if (isBanned) {
        setError('You are currently restricted from sending messages.')
        return
      }

      // Load profile if needed
      if (userId) {
        if (profileLoadedRef.current) {
          try {
            await profileLoadedRef.current
          } catch (e) {
            console.warn('Profile load failed:', e)
          }
        } else if (!userProfile) {
          await loadUserProfile()
        }
      }

      const selveScores = userProfile?.scores || null
      const assessmentBase =
        process.env.NEXT_PUBLIC_ASSESSMENT_URL ||
        process.env.NEXT_PUBLIC_MAIN_APP_URL ||
        (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
      const assessmentUrl = `${assessmentBase.replace(/\/$/, '')}/assessment`

      // Create session if needed
      let effectiveSessionId = sessionId
      if (!effectiveSessionId || isPendingNewSession.current) {
        const newSession = await createNewSession()
        if (newSession) {
          effectiveSessionId = newSession.id
          setSessionId(newSession.id)
          sessionStorage.setItem('currentSessionId', newSession.id)
        } else {
          setError('Failed to create session - please check your connection')
          return
        }
      }

      // Setup request
      abortControllerRef.current?.abort()
      abortControllerRef.current = new AbortController()

      const isFirstMessage = messages.length === 0
      const currentMessageIndex = messages.length

      // Optimistically add user message
      setMessages((prev) => [...prev, { role: 'user', content: trimmedMessage }])
      setIsLoading(true)
      setStreamingContent('')
      setError(null)
      setSecurityWarning(null)
      setThinkingStatus({
        status: 'retrieving_context',
        message: 'Processing your message...',
        details: {},
      })

      let fullContent = ''
      let streamFinalized = false
      let receivedBan = false
      let receivedWarning = false

      const finalizeStream = async (content: string = fullContent) => {
        if (streamFinalized || !mountedRef.current) return
        streamFinalized = true

        // Only add assistant message if we have content
        if (content.trim()) {
          setMessages((prev) => [...prev, { role: 'assistant', content }])
        }
        
        setStreamingContent('')
        setThinkingStatus(null)
        setIsLoading(false)

        // Generate title for first message
        if (isFirstMessage && content.trim() && effectiveSessionId) {
          await generateTitleForSession(effectiveSessionId, trimmedMessage, content)
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
            session_id: effectiveSessionId,
            clerk_user_id: userId || null,
            user_name: userName || null,
            selve_scores: selveScores,
            assessment_url: assessmentUrl,
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

        const processSSELine = (line: string) => {
          const trimmedLine = line.trim()
          if (!trimmedLine.startsWith('data: ')) return

          const data = trimmedLine.slice(6)
          if (data === '[DONE]') return

          try {
            const parsed = JSON.parse(data)

            // Handle ban
            if (parsed.type === 'ban' && mountedRef.current) {
              receivedBan = true
              setIsBanned(true)
              setBanExpiresAt(parsed.expires_at || null)
              // Don't return early - let the stream continue to get the message
            }

            // Handle warning
            if (parsed.type === 'warning' && mountedRef.current) {
              receivedWarning = true
              setSecurityWarning(parsed.message || 'Suspicious patterns detected.')
              // Auto-clear warning after 10 seconds
              setTimeout(() => {
                if (mountedRef.current) {
                  setSecurityWarning(null)
                }
              }, 10000)
              // Don't return - continue processing the response
            }

            // Handle error
            if (parsed.type === 'error' && mountedRef.current) {
              console.error('Server error:', parsed.message)
            }

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
            if (content && mountedRef.current) {
              fullContent += content
              setStreamingContent(fullContent)
              // Clear thinking status when content starts flowing
              if (fullContent.length > 0) {
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

            // Handle done signal
            if (parsed.done && !streamFinalized) {
              finalizeStream()
            }
          } catch {
            // Ignore JSON parse errors
          }
        }

        try {
          while (true) {
            const { done, value } = await reader.read()

            if (done) {
              // Process remaining buffer
              if (buffer.trim()) {
                processSSELine(buffer)
              }
              // Finalize if not already done
              if (!streamFinalized) {
                await finalizeStream()
              }
              break
            }

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              processSSELine(line)
            }
          }
        } finally {
          reader.releaseLock()
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          if (mountedRef.current) {
            setIsLoading(false)
            setThinkingStatus(null)
          }
          return
        }

        console.error('Stream error:', err)

        if (mountedRef.current) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error'
          setError(`Failed to get response: ${errorMessage}`)
          setThinkingStatus({ status: 'error', message: 'Something went wrong', details: {} })
          
          // Add error message to chat
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
          ])
          setStreamingContent('')
          setIsLoading(false)
          
          // Still try to generate title
          if (isFirstMessage && effectiveSessionId) {
            await generateTitleForSession(effectiveSessionId, trimmedMessage, '')
          } else {
            await loadUserSessions()
          }

          // Clear error after 5 seconds
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
      userProfile,
      messages.length,
      isBanned,
      createNewSession,
      generateTitleForSession,
      loadUserSessions,
      loadUserProfile,
    ]
  )

  // Form submit handler
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

  // Utility functions
  const clearError = useCallback(() => setError(null), [])

  const cancelStream = useCallback(() => {
    abortControllerRef.current?.abort()
    setIsLoading(false)
    setThinkingStatus(null)
    setStreamingContent('')
  }, [])

  // Effects
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      abortControllerRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    initializeSession()
  }, [initializeSession])

  useEffect(() => {
    if (userId) {
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
    isBanned,
    banExpiresAt,
    securityWarning,
    hasMessages: messages.length > 0 || !!streamingContent,
    isPendingNewSession: isPendingNewSession.current,

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