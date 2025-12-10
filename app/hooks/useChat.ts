'use client'

import { useState, useCallback, useEffect } from 'react'
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

  const getEffectiveUserId = useCallback(() => {
    if (userId) return userId
    if (typeof window === 'undefined') return null

    const storageKey = 'selve_chat_anon_id'
    let stored = localStorage.getItem(storageKey)
    if (!stored) {
      const generated = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `anon_${Date.now()}`
      stored = `anon_${generated}`
      localStorage.setItem(storageKey, stored)
    }
    return stored
  }, [userId])

  const ensureSessionInList = useCallback((session: Session) => {
    setSessions((prev) => {
      const exists = prev.some((s) => s.id === session.id)
      if (exists) return prev.map((s) => (s.id === session.id ? { ...s, ...session } : s))
      return [session, ...prev]
    })
  }, [])

  const updateSessionTitleLocally = useCallback(
    (sessionIdToUpdate: string, title: string) => {
      setSessions((prev) =>
        prev.map((session) =>
          session.id === sessionIdToUpdate ? { ...session, title } : session
        )
      )
    },
    []
  )

  const loadUserProfile = useCallback(async () => {
    const effectiveUserId = getEffectiveUserId()
    if (!effectiveUserId) return
    try {
      setIsLoadingProfile(true)
      const response = await fetch(`${API_URL}/api/users/${effectiveUserId}/scores`)
      const profile = await response.json()
      setUserProfile(profile)
    } catch (err) {
      console.error('Error loading user profile:', err)
    } finally {
      setIsLoadingProfile(false)
    }
  }, [getEffectiveUserId])

  const loadUserAccount = useCallback(async () => {
    const effectiveUserId = getEffectiveUserId()
    if (!effectiveUserId) return
    try {
      setIsLoadingAccount(true)
      const response = await fetch(`${API_URL}/api/users/${effectiveUserId}`)
      if (!response.ok) return
      const account = await response.json()
      setUserAccount(account)
    } catch (err) {
      console.error('Error loading user account:', err)
    } finally {
      setIsLoadingAccount(false)
    }
  }, [getEffectiveUserId])

  const loadUserSessions = useCallback(async () => {
    const effectiveUserId = getEffectiveUserId()
    if (!effectiveUserId) return []
    try {
      const response = await fetch(`${API_URL}/api/sessions/user/${effectiveUserId}`)
      const userSessions = await response.json()
      const sessionsArray = Array.isArray(userSessions)
        ? userSessions
        : Array.isArray(userSessions?.sessions)
          ? userSessions.sessions
          : []

      const sorted = [...sessionsArray].sort(
        (a: Session, b: Session) =>
          new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      )

      setSessions(sorted)
      return sorted
    } catch (err) {
      console.error('Error loading sessions:', err)
      return []
    }
  }, [getEffectiveUserId])

  const generateTitleForSession = useCallback(
    async (sessionIdToUpdate: string, userMessage: string, assistantMessage: string) => {
      try {
        const res = await fetch(`${API_URL}/api/sessions/${sessionIdToUpdate}/generate-title`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMessage,
            assistant_response: assistantMessage,
          }),
        })

        const data = await res.json().catch(() => null)
        const newTitle = data?.title || data?.session?.title
        if (newTitle) {
          updateSessionTitleLocally(sessionIdToUpdate, newTitle)
        }
      } catch (err) {
        console.error('Failed to generate title:', err)
      } finally {
        await loadUserSessions()
      }
    },
    [loadUserSessions, updateSessionTitleLocally]
  )

  const createNewSession = useCallback(async () => {
    try {
      const effectiveUserId = getEffectiveUserId()
      if (!effectiveUserId) return null
      console.log('[useChat] createNewSession fetching...')
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      const response = await fetch(`${API_URL}/api/sessions/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: effectiveUserId,
          clerkUserId: effectiveUserId,
          title: 'New Conversation',
        }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      console.log('[useChat] createNewSession response status:', response.status)
      const created = await response.json()

      if (created?.id) {
        ensureSessionInList({
          id: created.id,
          title: created.title || 'New Conversation',
          createdAt: created.createdAt || new Date().toISOString(),
          lastMessageAt: created.lastMessageAt || new Date().toISOString(),
        })
      }

      return created
    } catch (err) {
      console.error('Error creating session:', err)
      return null
    }
  }, [getEffectiveUserId, ensureSessionInList])

  const restoreSession = useCallback(async (sessionIdToRestore: string) => {
    try {
      console.log('[useChat] restoreSession fetching...')
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      const response = await fetch(`${API_URL}/api/sessions/${sessionIdToRestore}`, {
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      console.log('[useChat] restoreSession response status:', response.status)
      return await response.json()
    } catch (err) {
      console.error('[useChat] Error restoring session:', err)
      return null
    }
  }, [])

  const initializeSession = useCallback(async () => {
    try {
      console.log('[useChat] initializeSession called')
      setIsLoadingSession(true)

      // Load existing sessions first
      const existingSessions = await loadUserSessions()

      if (existingSessions && existingSessions.length > 0) {
        const mostRecent = existingSessions[0]
        const session = await restoreSession(mostRecent.id)
        if (session) {
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

      // If no sessions or restore failed, create a new one
      const newSession = await createNewSession()
      console.log('[useChat] created session:', newSession)
      if (newSession) {
        setSessionId(newSession.id)
        setMessages([])
      }
    } catch (err) {
      console.error('[useChat] Error initializing session:', err)
    } finally {
      console.log('[useChat] initializeSession complete, setting isLoadingSession=false')
      setIsLoadingSession(false)
    }
  }, [createNewSession, loadUserSessions, restoreSession, ensureSessionInList])

  const switchSession = useCallback(
    async (newSessionId: string) => {
      const session = await restoreSession(newSessionId)
      if (session) {
        setSessionId(session.id)
        setMessages(session.messages || [])
        setStreamingContent('')
        setThinkingStatus(null)
      }
    },
    [restoreSession]
  )

  const createNewConversation = useCallback(async () => {
    const newSession = await createNewSession()
    if (newSession) {
      setSessionId(newSession.id)
      setMessages([])
      setStreamingContent('')
      setThinkingStatus(null)
      loadUserSessions()
    }
  }, [createNewSession, loadUserSessions])

  const deleteSession = useCallback(
    async (sessionIdToDelete: string) => {
      try {
        const response = await fetch(`${API_URL}/api/sessions/${sessionIdToDelete}`, {
          method: 'DELETE',
        })
        if (response.ok) {
          if (sessionIdToDelete === sessionId) {
            const newSession = await createNewSession()
            if (newSession) {
              setSessionId(newSession.id)
              setMessages([])
            }
          }
          loadUserSessions()
        }
      } catch (err) {
        console.error('Error deleting session:', err)
      }
    },
    [sessionId, createNewSession, loadUserSessions]
  )

  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (!userMessage.trim()) return

      const isFirstMessage = messages.length === 0

      setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
      setIsLoading(true)
      setStreamingContent('')
      setThinkingStatus({ status: 'retrieving_context', message: 'Processing your message...', details: {} })

      try {
        const response = await fetch(`${API_URL}/api/chat/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMessage,
            session_id: sessionId,
            clerk_user_id: userId || null,
            user_name: userName || null,
            stream: true,
          }),
        })

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let fullContent = ''
        let streamEnded = false

        const finalizeAssistantMessage = async () => {
          if (streamEnded) return
          streamEnded = true

          setMessages((prev) => [...prev, { role: 'assistant', content: fullContent }])
          setStreamingContent('')
          setThinkingStatus(null)

          if (isFirstMessage && sessionId && fullContent.trim()) {
            await generateTitleForSession(sessionId, userMessage, fullContent)
          } else {
            await loadUserSessions()
          }
        }

        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              // Stream ended - finalize if we have content
              if (fullContent && !streamEnded) {
                await finalizeAssistantMessage()
              }
              break
            }

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') {
                  if (!streamEnded) {
                    await finalizeAssistantMessage()
                  }
                  break
                }
                try {
                  const parsed = JSON.parse(data)
                  if (parsed.type === 'status') {
                    setThinkingStatus({
                      status: parsed.status || 'generating',
                      message: parsed.message || 'Processing...',
                      details: parsed.details || {},
                    })
                  }
                  const content = parsed.content || parsed.chunk
                  if (content) {
                    fullContent += content
                    setStreamingContent(fullContent)
                    setThinkingStatus(null)
                  }
                  if (parsed.citations) {
                    const currentIndex = messages.length
                    setMessageCitations((prev) => ({ ...prev, [currentIndex]: parsed.citations }))
                  }
                  if (parsed.compression_needed) {
                    setCompressionNeeded(true)
                    setTimeout(() => setCompressionNeeded(false), 8000)
                  }
                  if (parsed.total_tokens) {
                    setTotalTokens(parsed.total_tokens)
                  }
                } catch {
                  // Ignore parse errors for malformed chunks
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Error:', err)
        setError('Failed to get response. Please try again.')
        setThinkingStatus({ status: 'error', message: 'Something went wrong', details: {} })
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
        ])
        setStreamingContent('')
        setTimeout(() => {
          setError(null)
          setThinkingStatus(null)
        }, 5000)
      } finally {
        setIsLoading(false)
      }
    },
    [sessionId, userId, userName, messages.length, loadUserSessions, generateTitleForSession]
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const userMessage = input.trim()
      setInput('')
      await sendMessage(userMessage)
    },
    [input, sendMessage]
  )

  const clearError = useCallback(() => setError(null), [])

  // Initialize session on mount
  useEffect(() => {
    initializeSession()
  }, [initializeSession])

  // Load user data when available
  useEffect(() => {
    if (userId) {
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
  }
}
