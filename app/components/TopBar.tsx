'use client'

import { Menu } from 'lucide-react'

interface TopBarProps {
  onMenuClick: () => void
  title?: string
}

export default function TopBar({
  onMenuClick,
  title = 'SELVE Chat',
}: TopBarProps) {
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
        <h1 className="ml-14 text-lg font-semibold text-white">
          {title}
        </h1>
      </div>
    </header>
  )
}
