'use client'

import { Menu, Bell, Share2, Download, Sun, Moon } from 'lucide-react'
import { useEffect, useState } from 'react'

interface TopBarProps {
  onMenuClick: () => void
  onExport?: () => void
  onShare?: () => void
  title?: string
}

export default function TopBar({
  onMenuClick,
  onExport,
  onShare,
  title = 'SELVE Chat',
}: TopBarProps) {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    // Check initial theme
    const isDarkMode = document.documentElement.classList.contains('dark')
    setIsDark(isDarkMode)
  }, [])

  const toggleTheme = () => {
    const newIsDark = !isDark
    setIsDark(newIsDark)
    document.documentElement.classList.toggle('dark', newIsDark)
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-900/70 bg-[radial-gradient(circle_at_20%_0%,rgba(222,107,53,0.08),transparent_35%),#0f0f0e] px-4">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-[#1a1917] hover:text-white lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="ml-1 text-lg font-semibold text-white">
          {title}
        </h1>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-[#1a1917] hover:text-white"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Notifications */}
        <button
          className="relative rounded-lg p-2 text-zinc-400 transition-colors hover:bg-[#1a1917] hover:text-white"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* Export */}
        {onExport && (
          <button
            onClick={onExport}
            className="flex items-center gap-2 rounded-lg border border-zinc-800/80 bg-[#1a1917] px-3 py-1.5 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-700"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        )}

        {/* Share */}
        {onShare && (
          <button
            onClick={onShare}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#b88dff] via-[#9d7bff] to-[#7f5af0] px-4 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Share</span>
          </button>
        )}
      </div>
    </header>
  )
}
