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
  if (!isUserLoaded || isLoadingSession || isLoadingAccount) {
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
        userPlan={userAccount?.subscription_plan || userProfile?.subscriptionPlan || 'Pro plan'}
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
