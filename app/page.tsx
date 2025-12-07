'use client'

import { useRef, useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import {
  Sidebar,
  TopBar,
  ChatInput,
  ChatMessages,
  WelcomeScreen,
  SourceCitations,
} from './components'
import { useChat } from './hooks/useChat'

/**
 * Main Chat Page Component
 * 
 * This page orchestrates the chat experience by composing
 * modular UI components with the useChat hook for state management.
 */
export default function ChatPage() {
  const { user, isLoaded: isUserLoaded } = useUser()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
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
    messageCitations,
    thinkingStatus,
    hasMessages,
    handleSubmit,
    switchSession,
    createNewConversation,
    deleteSession,
    clearError,
  } = useChat({
    userId: user?.id,
    userName: user?.firstName || user?.username,
  })

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export clicked')
  }

  const handleShare = () => {
    // TODO: Implement share functionality
    console.log('Share clicked')
  }

  // Loading state
  if (!isUserLoaded || isLoadingSession) {
    return <LoadingScreen />
  }

  return (
    <div className="flex h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(222,107,53,0.12),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.04),transparent_30%),#0f0f0e] text-white">
      {/* Error toast */}
      {error && (
        <ErrorToast message={error} onDismiss={clearError} />
      )}

      {/* Sidebar */}
      <Sidebar
        sessions={sessions}
        activeSessionId={sessionId}
        onSessionSelect={switchSession}
        onNewChat={createNewConversation}
        onDeleteSession={deleteSession}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main content area */}
      <main className="flex flex-1 flex-col">
        <TopBar
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
          onExport={handleExport}
          onShare={handleShare}
          title="SELVE Chat"
        />

        <div className="flex flex-1 flex-col overflow-hidden">
          {hasMessages ? (
            <div className="flex-1 overflow-y-auto">
              <div className="mx-auto max-w-3xl">
                <ChatMessages
                  messages={messages}
                  streamingContent={streamingContent}
                  isLoading={isLoading}
                  thinkingStatus={thinkingStatus}
                />
                {/* Source citations for the last message */}
                {messages.length > 0 && messageCitations[messages.length - 1] && (
                  <div className="px-4 pb-4">
                    <SourceCitations sources={messageCitations[messages.length - 1]} />
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          ) : (
            <WelcomeScreen
              onSuggestionClick={handleSuggestionClick}
              userName={user?.firstName || user?.username || undefined}
            />
          )}

          {/* Chat input */}
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            placeholder="Ask me anything about SELVE..."
          />
        </div>
      </main>
    </div>
  )
}

/**
 * Loading screen component shown while initializing
 */
function LoadingScreen() {
  return (
    <div className="relative flex h-screen items-center justify-center overflow-hidden bg-[#0c0c0b] text-white">
      {/* Atmospheric glows */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -left-24 -top-32 h-80 w-80 rounded-full bg-gradient-to-br from-amber-500/25 via-red-500/15 to-transparent blur-3xl" />
        <div className="absolute -right-16 top-10 h-72 w-72 rounded-full bg-gradient-to-bl from-emerald-400/20 via-cyan-400/10 to-transparent blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-gradient-to-tl from-white/8 via-white/0 to-transparent blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center rounded-2xl border border-white/5 bg-white/5 px-10 py-9 shadow-2xl backdrop-blur-md">
        <div className="mb-6 flex items-center gap-3 text-sm uppercase tracking-[0.35em] text-white/70">
          <span className="h-px w-10 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
          Selve
          <span className="h-px w-10 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        </div>

        <div className="relative mb-6 h-16 w-16">
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-amber-400/80 border-l-red-400/60" />
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/10 via-white/5 to-white/0" />
          <div className="absolute inset-4 rounded-full bg-[#0c0c0b]" />
        </div>

        <div className="text-center">
          <p className="text-lg font-semibold text-white">Warming up your space</p>
          <p className="mt-2 text-sm text-white/70">Fetching your conversations and getting ready to chat.</p>
        </div>
      </div>
    </div>
  )
}

/**
 * Error toast component for displaying errors
 */
function ErrorToast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="fixed right-4 top-4 z-50 max-w-md rounded-lg bg-red-600 px-4 py-3 text-white shadow-lg">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={onDismiss}
          className="ml-auto rounded p-1 hover:bg-red-700"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
