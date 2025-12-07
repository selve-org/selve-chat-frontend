'use client'

import * as React from 'react'
import { Search, ChevronDown, Plus, MessageSquare, Trash2 } from 'lucide-react'
import { SelveLogo } from './SelveLogo'

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
}

export default function Sidebar({
  sessions,
  activeSessionId,
  onSessionSelect,
  onNewChat,
  onDeleteSession,
  isOpen,
  onToggle,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = React.useState('')

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
      <aside
        className={`
          fixed left-0 top-0 z-50 h-full w-64 transform bg-[#111110] transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          border-r border-[#1f1e1c] flex flex-col shadow-[8px_0_24px_-20px_rgba(0,0,0,0.75)]
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1f1e1c] p-4">
          <div className="flex items-center gap-3">
            <SelveLogo />
          </div>
          <button
            onClick={onToggle}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white lg:hidden"
          >
            <ChevronDown className="h-4 w-4 rotate-90" />
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
                  {group.sessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => onSessionSelect(session.id)}
                      className={`
                        group flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors
                        ${activeSessionId === session.id
                          ? 'bg-[#1f1e1c] text-white ring-1 ring-[#2c2a28]'
                          : 'text-zinc-400 hover:bg-[#1a1917] hover:text-white'}
                      `}
                    >
                      <span className="truncate">{session.title}</span>
                      {onDeleteSession && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteSession(session.id)
                          }}
                          className="hidden rounded p-1 text-zinc-500 hover:bg-[#23201d] hover:text-red-400 group-hover:block"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#1f1e1c] p-4">
          <div className="text-center text-xs text-zinc-600">
            Powered by SELVE AI
          </div>
        </div>
      </aside>
    </>
  )
}