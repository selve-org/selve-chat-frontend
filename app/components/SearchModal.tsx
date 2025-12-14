'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { useDebounce } from '../hooks/useDebounce'
import { useUser } from '@clerk/nextjs'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Session {
  id: string
  title: string
  createdAt: string
  lastMessageAt: string
  messages?: Message[]
  matchingContent?: string
}

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  sessions: Session[]
  onSessionSelect: (sessionId: string) => void
  currentSessionMessages?: Message[]
  currentSessionId?: string | null
}

export default function SearchModal({
  isOpen,
  onClose,
  sessions,
  onSessionSelect,
  currentSessionMessages = [],
  currentSessionId,
}: SearchModalProps) {
  const [searchQuery, setSearchQuery] = React.useState('')
  const debouncedQuery = useDebounce(searchQuery, 300)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [searchResults, setSearchResults] = React.useState<Session[]>([])
  const [isSearching, setIsSearching] = React.useState(false)
  const { user } = useUser()

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  // Set searching state immediately when query changes
  React.useEffect(() => {
    if (searchQuery.trim()) {
      setIsSearching(true)
    }
  }, [searchQuery])

  // Search through backend when debounced query changes
  React.useEffect(() => {
    const searchBackend = async () => {
      if (!debouncedQuery.trim() || !user) {
        setSearchResults([])
        setIsSearching(false)
        return
      }

      try {
        const response = await fetch(
          `${API_URL}/api/sessions/search/${user.id}?q=${encodeURIComponent(debouncedQuery)}&limit=20`
        )
        
        if (response.ok) {
          const results = await response.json()
          setSearchResults(results)
        } else {
          console.error('Search failed:', response.statusText)
          setSearchResults([])
        }
      } catch (error) {
        console.error('Search error:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }

    searchBackend()
  }, [debouncedQuery, user, API_URL])

  const displayResults = debouncedQuery.trim() ? searchResults : sessions

  // Focus input when modal opens
  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Reset search on close
  React.useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
    }
  }, [isOpen])

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const handleSessionClick = (sessionId: string) => {
    onSessionSelect(sessionId)
    onClose()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/80"
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-[10%] z-50 w-full max-w-2xl -translate-x-1/2"
          >
            <div className="mx-4 rounded-2xl border border-zinc-800 bg-[#0f0f0e] shadow-2xl">
              {/* Header with Search Input */}
              <div className="border-b border-zinc-800 p-4">
                <div className="flex items-center gap-3">
                  <Search className="h-5 w-5 shrink-0 text-zinc-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search chats..."
                    className="flex-1 bg-transparent text-base text-white placeholder-zinc-500 focus:outline-none"
                  />
                  <button
                    onClick={() => searchQuery ? setSearchQuery('') : onClose()}
                    className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                    aria-label={searchQuery ? "Clear search" : "Close search"}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Results */}
              <div className="max-h-[60vh] overflow-y-auto">
                {displayResults.length > 0 ? (
                  <div className="p-2">
                    <div className="sticky top-0 z-10 mb-2 bg-[#0f0f0e] px-3 py-2 text-xs font-medium text-zinc-500">
                      {displayResults.length} result{displayResults.length !== 1 ? 's' : ''} 
                      {searchQuery.trim() && ` for "${searchQuery}"`}
                      {isSearching && ' (searching...)'}
                    </div>
                    <div className="space-y-1">
                      {displayResults.map((session) => (
                        <button
                          key={session.id}
                          onClick={() => handleSessionClick(session.id)}
                          className="flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-zinc-800/50"
                        >
                          <div className="flex-1 space-y-1">
                            <div className="font-medium text-white">
                              {session.title}
                            </div>
                            {session.matchingContent && (
                              <div className="text-sm text-zinc-400 line-clamp-2">
                                {session.matchingContent}
                              </div>
                            )}
                            <div className="text-sm text-zinc-500">
                              {formatDate(session.lastMessageAt)}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Search className="mb-3 h-12 w-12 text-zinc-600" />
                    <p className="text-base font-medium text-zinc-400">
                      {searchQuery.trim() ? (isSearching ? 'Searching...' : 'No results found') : 'Start typing to search'}
                    </p>
                    <p className="mt-1 text-sm text-zinc-600">
                      {searchQuery.trim() 
                        ? 'Try different keywords' 
                        : 'Search through your chat history'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
