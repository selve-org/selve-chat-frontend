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
  LoadingScreen,
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [showSignInPrompt, setShowSignInPrompt] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const SIGNIN_DISMISSED_KEY = 'selve_signin_prompt_dismissed'

  const mainAppBase =
    process.env.NEXT_PUBLIC_MAIN_APP_URL ||
    process.env.MAIN_APP_URL ||
    process.env.MAIN_APP_URL_DEV ||
    process.env.MAIN_APP_URL_PROD ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')

  const signInUrl = `${mainAppBase.replace(/\/$/, '')}/sign-in`

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
    userAccount,
    messageCitations,
    thinkingStatus,
    hasMessages,
    handleSubmit,
    switchSession,
    createNewConversation,
    deleteSession,
    clearError,
    isLoadingAccount,
  } = useChat({
    userId: user?.id,
    userName: user?.firstName || user?.username,
  })

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  useEffect(() => {
    if (!isUserLoaded) return
    const dismissed = typeof window !== 'undefined' ? localStorage.getItem(SIGNIN_DISMISSED_KEY) : null
    if (!user && !dismissed) {
      setShowSignInPrompt(true)
    }
  }, [user, isUserLoaded])

  const dismissSignInPrompt = () => {
    setShowSignInPrompt(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem(SIGNIN_DISMISSED_KEY, '1')
    }
  }

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
  if (isLoadingSession || isLoadingAccount) {
    return <LoadingScreen />
  }

  return (
    <div
      className={`flex h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(222,107,53,0.12),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.04),transparent_30%),#0f0f0e] text-white transition-all duration-300 ease-out ${isSidebarOpen ? 'lg:pl-64' : 'lg:pl-0'}`}
    >
      {/* Error toast */}
      {error && (
        <ErrorToast message={error} onDismiss={clearError} />
      )}

      {/* Sign-in prompt for guests */}
      {showSignInPrompt && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-[#2c261f] bg-[#141312] p-6 shadow-2xl shadow-black/40">
            <div className="mb-4 text-lg font-semibold">Sign in for personalized SELVE chat</div>
            <p className="mb-6 text-sm text-zinc-300">
              Sign in to sync your assessment scores, save conversations, and get tailored insights. You can continue as a guest if you prefer.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={dismissSignInPrompt}
                className="rounded-lg border border-[#2c261f] px-4 py-2 text-sm font-medium text-white transition hover:border-[#3a3127] hover:bg-[#1a1917]"
              >
                Continue as guest
              </button>
              <a
                href={signInUrl}
                className="rounded-lg border border-transparent bg-[#de6b35] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#f07c45]"
              >
                Sign in
              </a>
            </div>
          </div>
        </div>
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
        userName={userAccount?.user_name || user?.fullName || user?.firstName || user?.username || undefined}
        userPlan={userAccount?.subscription_plan || userProfile?.subscriptionPlan}
        isSignedIn={!!user}
        signInUrl={signInUrl}
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
              <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-10">
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
