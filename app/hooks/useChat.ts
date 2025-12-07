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
  const [messageCitations, setMessageCitations] = useState<MessageCitations>({})
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [thinkingStatus, setThinkingStatus] = useState<ThinkingStatus | null>(null)
  const [compressionNeeded, setCompressionNeeded] = useState(false)
  const [totalTokens, setTotalTokens] = useState<number | null>(null)

  const loadUserProfile = useCallback(async () => {
    if (!userId) return
    try {
      setIsLoadingProfile(true)
      const response = await fetch(`${API_URL}/api/users/${userId}/scores`)
      const profile = await response.json()
      setUserProfile(profile)
    } catch (err) {
      console.error('Error loading user profile:', err)
    } finally {
      setIsLoadingProfile(false)
    }
  }, [userId])

  const loadUserSessions = useCallback(async () => {
    if (!userId) return
    try {
      const response = await fetch(`${API_URL}/api/sessions/user/${userId}`)
      const userSessions = await response.json()
      const sessionsArray = Array.isArray(userSessions)
        ? userSessions
        : Array.isArray(userSessions?.sessions)
          ? userSessions.sessions
          : []

      setSessions(
        [...sessionsArray].sort(
          (a: Session, b: Session) =>
            new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
        )
      )
    } catch (err) {
      console.error('Error loading sessions:', err)
    }
  }, [userId])

  const createNewSession = useCallback(async () => {
    try {
      const effectiveUserId = userId || `anonymous_${Date.now()}`
      const response = await fetch(`${API_URL}/api/sessions/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: effectiveUserId,
          clerkUserId: effectiveUserId,
          title: 'New Conversation',
        }),
      })
      return await response.json()
    } catch (err) {
      console.error('Error creating session:', err)
      return null
    }
  }, [userId])

  const restoreSession = useCallback(async (storedSessionId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/sessions/${storedSessionId}`)
      return await response.json()
    } catch (err) {
      console.error('Error restoring session:', err)
      localStorage.removeItem('selve_chat_session_id')
      return null
    }
  }, [])

  const initializeSession = useCallback(async () => {
    setIsLoadingSession(true)
    const storedSessionId = localStorage.getItem('selve_chat_session_id')

    if (storedSessionId) {
      const session = await restoreSession(storedSessionId)
      if (session) {
        setSessionId(session.id)
        if (session.messages) setMessages(session.messages)
      } else {
        const newSession = await createNewSession()
        if (newSession) {
          setSessionId(newSession.id)
          localStorage.setItem('selve_chat_session_id', newSession.id)
        }
      }
    } else {
      const newSession = await createNewSession()
      if (newSession) {
        setSessionId(newSession.id)
        localStorage.setItem('selve_chat_session_id', newSession.id)
      }
    }
    setIsLoadingSession(false)
  }, [createNewSession, restoreSession])

  const switchSession = useCallback(
    async (newSessionId: string) => {
      const session = await restoreSession(newSessionId)
      if (session) {
        setSessionId(session.id)
        setMessages(session.messages || [])
        localStorage.setItem('selve_chat_session_id', session.id)
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
      localStorage.setItem('selve_chat_session_id', newSession.id)
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
            localStorage.removeItem('selve_chat_session_id')
            const newSession = await createNewSession()
            if (newSession) {
              setSessionId(newSession.id)
              setMessages([])
              localStorage.setItem('selve_chat_session_id', newSession.id)
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

        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              // Stream ended - finalize if we have content
              if (fullContent && !streamEnded) {
                streamEnded = true
                setMessages((prev) => [...prev, { role: 'assistant', content: fullContent }])
                setStreamingContent('')
                setThinkingStatus(null)
                loadUserSessions()
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
                    streamEnded = true
                    setMessages((prev) => [...prev, { role: 'assistant', content: fullContent }])
                    setStreamingContent('')
                    setThinkingStatus(null)
                    loadUserSessions()
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
    [sessionId, userId, userName, messages.length, loadUserSessions]
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
    }
  }, [userId, loadUserSessions, loadUserProfile])

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
    isLoadingProfile,
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
