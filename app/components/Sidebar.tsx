'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Search, Plus, MessageSquare, Trash2 } from 'lucide-react'
import { SelveLogo } from './SelveLogo'
import { AnimatedHamburgerIcon } from './AnimatedHamburgerIcon'
import UserMenu from './UserMenu'

interface Session {
  id: string
  title: string
  createdAt: string
  lastMessageAt: string
}

interface SidebarProps {
  sessions: Session[]
  activeSessionId: string | null
  onSessionSelect: (sessionId: string) => void
  onNewChat: () => void
  onDeleteSession?: (sessionId: string) => void
  isOpen: boolean
  onToggle: () => void
  userName?: string
  userPlan?: string
  isSignedIn?: boolean
  signInUrl?: string
}

export default function Sidebar({
  sessions,
  activeSessionId,
  onSessionSelect,
  onNewChat,
  onDeleteSession,
  isOpen,
  onToggle,
  userName,
  userPlan,
  isSignedIn = false,
  signInUrl,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = React.useState('')
  const homeUrl = process.env.NEXT_PUBLIC_CHATBOT_URL || '/'

  const sidebarVariants = {
    open: {
      x: 0,
      boxShadow: '8px 0 24px -20px rgba(0,0,0,0.75)',
      transition: { duration: 0.25, ease: 'easeOut' },
    },
    closed: {
      x: '-100%',
      boxShadow: '0 0 0 0 rgba(0,0,0,0)',
      transition: { duration: 0.25, ease: 'easeIn' },
    },
  }

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Group sessions by date
  const groupedSessions = React.useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const lastWeek = new Date(today)
    lastWeek.setDate(lastWeek.getDate() - 7)
    
    const groups: { label: string; sessions: Session[] }[] = [
      { label: 'Today', sessions: [] },
      { label: 'Yesterday', sessions: [] },
      { label: 'Previous 7 Days', sessions: [] },
      { label: 'Older', sessions: [] },
    ]

    filteredSessions.forEach(session => {
      const sessionDate = new Date(session.lastMessageAt)
      sessionDate.setHours(0, 0, 0, 0)

      if (sessionDate >= today) {
        groups[0].sessions.push(session)
      } else if (sessionDate >= yesterday) {
        groups[1].sessions.push(session)
      } else if (sessionDate >= lastWeek) {
        groups[2].sessions.push(session)
      } else {
        groups[3].sessions.push(session)
      }
    })

    return groups.filter(g => g.sessions.length > 0)
  }, [filteredSessions])

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={isOpen ? 'open' : 'closed'}
        variants={sidebarVariants}
        className="fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r border-[#1f1e1c] bg-[#111110]"
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-[#1f1e1c] px-4 py-3">
          <a
            href={homeUrl}
            className="rounded-lg p-1 transition-colors hover:bg-[#1a1917]"
            aria-label="SELVE-Chat homepage"
          >
            <SelveLogo />
          </a>
          <button
            onClick={onToggle}
            className="ml-auto flex items-center justify-center rounded-lg p-2 text-white transition-colors hover:bg-[#1a1917]"
            aria-label="Toggle sidebar"
          >
            <AnimatedHamburgerIcon isOpen={isOpen} />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={onNewChat}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#2c261f] bg-[#1a1917] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:border-[#3a3127] hover:bg-[#22201d]"
          >
            <Plus className="h-4 w-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full rounded-lg border border-[#1f1e1c] bg-[#1a1917] py-2 pl-9 pr-3 text-sm text-white placeholder-zinc-500 focus:border-[#de6b35] focus:outline-none"
            />
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {groupedSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MessageSquare className="mb-2 h-8 w-8 text-zinc-600" />
              <p className="text-sm text-zinc-500">No conversations yet</p>
              <p className="text-xs text-zinc-600">Start a new chat to begin</p>
            </div>
          ) : (
            groupedSessions.map((group) => (
              <div key={group.label} className="mb-4">
                <div className="mb-2 px-2 text-xs font-medium text-zinc-500">
                  {group.label}
                </div>
                <div className="space-y-1">
                  {group.sessions.map((session) => {
                    const isTitleLoading = ['Generating title...', '...'].includes(session.title)
                    const isActive = activeSessionId === session.id
                    return (
                      <div
                        key={session.id}
                        onClick={() => onSessionSelect(session.id)}
                        className={`
                          group flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors border
                          ${isActive
                            ? 'bg-[#1f1e1c] text-white ring-1 ring-[#de6b35]/50 border-[#de6b35]/40 shadow-[inset_2px_0_0_0_#de6b35]' 
                            : 'border-transparent text-zinc-400 hover:bg-[#1a1917] hover:text-white'}
                        `}
                      >
                        {isTitleLoading ? (
                          <span className="relative block h-4 w-28 overflow-hidden rounded bg-gradient-to-r from-[#25221f] via-[#302b26] to-[#25221f] text-transparent">
                            <span className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/12 to-transparent" />
                            <span className="absolute right-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-white/50 animate-ping" />
                          </span>
                        ) : (
                          <span className={`truncate ${isActive ? 'font-semibold' : ''}`} title={session.title}>{session.title}</span>
                        )}
                        {onDeleteSession && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onDeleteSession(session.id)
                            }}
                            className="opacity-0 rounded p-1 text-zinc-500 transition hover:bg-[#23201d] hover:text-red-400 group-hover:opacity-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#1f1e1c] p-4">
          <UserMenu
            userName={userName}
            userPlan={userPlan}
            isSignedIn={isSignedIn}
            signInUrl={signInUrl}
          />
        </div>
      </motion.aside>

      <motion.button
        key="sidebar-toggle"
        initial={false}
        animate={{ x: 0, opacity: isOpen ? 0 : 1, scale: isOpen ? 0.96 : 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onClick={onToggle}
        className="fixed left-3 top-4 z-[60] flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#141312] text-white shadow-lg shadow-black/40 backdrop-blur hover:border-[#de6b35] hover:bg-[#1a1917]"
        aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
        style={{ pointerEvents: isOpen ? 'none' : 'auto' }}
      >
        <AnimatedHamburgerIcon isOpen={isOpen} />
      </motion.button>
    </>
  )
}