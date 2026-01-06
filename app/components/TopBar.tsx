'use client'

import { Menu } from 'lucide-react'
import Image from 'next/image'

interface TopBarProps {
  onMenuClick: () => void
  title?: string
  showMenuButton?: boolean
}

export default function TopBar({
  onMenuClick,
  title = 'SELVE Chat',
  showMenuButton = true,
}: TopBarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between bg-zinc-50 dark:bg-[#0f0f0e] px-4">
      {/* Left side */}
      <div className="flex items-center gap-4">
        {showMenuButton && (
          <button
            onClick={onMenuClick}
            className="rounded-lg p-2 text-zinc-500 dark:text-zinc-400 transition-colors hover:bg-zinc-200 dark:hover:bg-[#1a1917] hover:text-zinc-900 dark:hover:text-white lg:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div className="flex items-center lg:ml-14">
          <Image
            src="/logo/selve-chat-text-logo.png"
            alt="SELVE Chat"
            width={120}
            height={24}
            className="h-6 w-auto"
            priority
          />
        </div>
      </div>
    </header>
  )
}
