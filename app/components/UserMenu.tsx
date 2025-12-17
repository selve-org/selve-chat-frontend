'use client'

import { useState, useRef, useEffect } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor, Settings, LogOut, ExternalLink, BarChart3, DollarSign } from 'lucide-react'

interface UserMenuProps {
  userName?: string
  userPlan?: string
  isSignedIn?: boolean
  signInUrl?: string
}

export default function UserMenu({ userName, userPlan, isSignedIn, signInUrl }: UserMenuProps) {
  const { user } = useUser()
  const { signOut } = useClerk()
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [assessmentSessionId, setAssessmentSessionId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const mainAppUrl = process.env.NEXT_PUBLIC_MAIN_APP_URL || 'http://localhost:3000'

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch user's assessment session ID
  useEffect(() => {
    async function fetchAssessmentSession() {
      if (!user?.id) return
      
      try {
        // Use main app backend URL to fetch user profile
        const mainAppBackendUrl = process.env.NEXT_PUBLIC_MAIN_APP_API_URL || 'http://localhost:8000'
        const response = await fetch(`${mainAppBackendUrl}/api/users/profile`, {
          headers: {
            'X-User-ID': user.id,
          },
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.currentSessionId) {
            setAssessmentSessionId(data.currentSessionId)
          }
        }
      } catch (error) {
        // Silently fail and default to profile link
        // This can happen due to CORS or network issues
      }
    }
    
    fetchAssessmentSession()
  }, [user?.id])

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSignOut = async () => {
    setIsOpen(false)
    await signOut()
  }

  // Theme options
  const themeOptions = [
    {
      id: 'light',
      label: 'Light',
      icon: Sun,
    },
    {
      id: 'system',
      label: 'System',
      icon: Monitor,
    },
    {
      id: 'dark',
      label: 'Dark',
      icon: Moon,
    },
  ]

  if (!isSignedIn) {
    return null
  }

  const userInitials = userName
    ? userName.slice(0, 2).toUpperCase()
    : user?.fullName
      ? user.fullName.slice(0, 2).toUpperCase()
      : 'SE'

  return (
    <div className="relative" ref={menuRef}>
      {/* User Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 rounded-lg bg-[#151412] px-3 py-3 transition-all hover:bg-[#1a1917] w-full"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#b88dff] via-[#7f5af0] to-[#5f3bd8] text-sm font-semibold text-white">
          {userInitials}
        </div>
        <div className="min-w-0 flex-1 text-left">
          <div className="truncate text-sm font-semibold text-white">{userName || user?.fullName || 'SELVE User'}</div>
          <div className="truncate text-xs text-zinc-500">{userPlan || 'Pro plan'}</div>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute bottom-full left-0 right-0 mb-2 w-full min-w-[260px] rounded-xl border border-[#2c261f] bg-[#1a1917] shadow-2xl shadow-black/40 z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Theme Settings */}
            <div className="border-b border-[#2c261f] p-3">
              <p className="mb-2 px-2 text-xs font-medium text-zinc-400">Appearance</p>
              <div className="flex gap-1 rounded-lg bg-[#151412] p-1">
                {themeOptions.map((option) => {
                  const Icon = option.icon
                  const isActive = mounted && theme === option.id
                  return (
                    <button
                      key={option.id}
                      onClick={() => setTheme(option.id)}
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-1.5 py-1.5 text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-[#de6b35] text-white shadow-sm'
                          : 'text-zinc-400 hover:bg-[#1a1917] hover:text-white'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="hidden min-[280px]:inline truncate">{option.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              {/* My Assessment Results */}
              <a
                href={assessmentSessionId 
                  ? `${mainAppUrl}/results/${assessmentSessionId}`
                  : `${mainAppUrl}/profile`
                }
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-[#22201d] group"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#151412] transition-colors group-hover:bg-[#2c261f]">
                  <BarChart3 className="h-4 w-4 text-zinc-400 group-hover:text-[#de6b35]" />
                </div>
                <div className="flex flex-1 items-center justify-between">
                  <span className="font-medium">My Assessment Results</span>
                  <ExternalLink className="h-3.5 w-3.5 text-zinc-500" />
                </div>
              </a>

              {/* Pricing */}
              <a
                href={`${mainAppUrl}/pricing`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-[#22201d] group"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#151412] transition-colors group-hover:bg-[#2c261f]">
                  <DollarSign className="h-4 w-4 text-zinc-400 group-hover:text-[#de6b35]" />
                </div>
                <div className="flex flex-1 items-center justify-between">
                  <span className="font-medium">Pricing & Plans</span>
                  <ExternalLink className="h-3.5 w-3.5 text-zinc-500" />
                </div>
              </a>

              {/* Settings */}
              <a
                href={`${mainAppUrl}/profile`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-[#22201d] group"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#151412] transition-colors group-hover:bg-[#2c261f]">
                  <Settings className="h-4 w-4 text-zinc-400 group-hover:text-[#de6b35]" />
                </div>
                <div className="flex flex-1 items-center justify-between">
                  <span className="font-medium">Settings</span>
                  <ExternalLink className="h-3.5 w-3.5 text-zinc-500" />
                </div>
              </a>
            </div>

            {/* Divider */}
            <div className="border-t border-[#2c261f]" />

            {/* Sign Out */}
            <div className="p-2">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-950/20 group"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-950/20 transition-colors group-hover:bg-red-900/30">
                  <LogOut className="h-4 w-4" />
                </div>
                <span className="font-medium">Sign out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
