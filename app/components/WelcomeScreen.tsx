'use client'

import { Sparkles, MessageSquare, Brain, Palette } from 'lucide-react'
import Image from 'next/image'

interface FeatureCardProps {
  title: string
  description: string
  icon: React.ReactNode
  lightGradient: string
  darkGradient: string
}

function FeatureCard({ title, description, icon, lightGradient, darkGradient }: FeatureCardProps) {
  return (
    <div
      className={`
        group relative overflow-hidden rounded-xl p-2 sm:p-3 md:p-4
        border border-zinc-200 dark:border-zinc-800
        ${lightGradient}
        transition-all duration-300 hover:scale-[1.02]
        hover:border-zinc-300 dark:hover:border-zinc-700
        hover:shadow-lg dark:hover:shadow-none
        min-w-0
      `}
    >
      {/* Subtle glow effect */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-zinc-500/5 dark:bg-white/5 blur-2xl transition-all duration-500 group-hover:bg-zinc-500/10 dark:group-hover:bg-white/10" />

      <div className="relative">
        <div className="mb-2 flex h-7 w-7 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center rounded-lg bg-zinc-800/10 dark:bg-white/10 text-zinc-700 dark:text-white">
          {icon}
        </div>
        <h3 className="mb-1 text-[10px] sm:text-xs md:text-sm font-semibold text-zinc-800 dark:text-white leading-tight">{title}</h3>
        <p className="text-[9px] sm:text-[10px] md:text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-snug">{description}</p>
      </div>
    </div>
  )
}

interface WelcomeScreenProps {
  onSuggestionClick: (suggestion: string) => void
  userName?: string
}

const FEATURE_CARDS = [
  {
    title: 'Personality Insights',
    description: 'Get personalized insights based on your SELVE assessment results.',
    icon: <Brain className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />,
    lightGradient: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100 dark:from-[#1a2845] dark:via-[#182038] dark:to-[#0f1520]',
    darkGradient: 'from-[#1a2845] via-[#182038] to-[#0f1520]',
  },
  {
    title: 'Growth Guidance',
    description: 'Discover actionable steps for personal development.',
    icon: <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />,
    lightGradient: 'bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-[#3d2820] dark:via-[#2d1f18] dark:to-[#1a1210]',
    darkGradient: 'from-[#3d2820] via-[#2d1f18] to-[#1a1210]',
  },
  {
    title: 'Dimension Explorer',
    description: 'Deep dive into the 8 SELVE dimensions and what they mean.',
    icon: <Palette className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />,
    lightGradient: 'bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-50 dark:from-[#2d1a45] dark:via-[#221433] dark:to-[#150d20]',
    darkGradient: 'from-[#2d1a45] via-[#221433] to-[#150d20]',
  },
  {
    title: 'Relationship Insights',
    description: 'Understand how your personality affects your relationships.',
    icon: <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />,
    lightGradient: 'bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50 dark:from-[#1a3d3d] dark:via-[#14292e] dark:to-[#0d1a1d]',
    darkGradient: 'from-[#1a3d3d] via-[#14292e] to-[#0d1a1d]',
  },
]

const SUGGESTIONS = [
  'What are my strongest dimensions?',
  'How can I grow in my weaker areas?',
  'Explain the LUMEN dimension',
  'What careers fit my personality?',
]

export default function WelcomeScreen({ onSuggestionClick, userName }: WelcomeScreenProps) {
  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center overflow-hidden p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl space-y-5 sm:space-y-6">
        {/* Welcome Header */}
        <div className="text-center">
          <div className="mb-4 inline-flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center animate-spin-slow">
            <Image
              src="/logo/selve-chat-logo.png"
              alt="SELVE Logo"
              width={80}
              height={80}
              priority
              className="pointer-events-none h-16 w-16 sm:h-20 sm:w-20"
            />
          </div>
          <h1 className="mb-2 text-2xl sm:text-3xl font-semibold text-zinc-900 dark:text-white">
            {userName ? `Welcome back, ${userName}` : 'Welcome to SELVE Chat'}
          </h1>
          <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 px-4">
            Your AI-powered personality guide. Ask me anything about your SELVE assessment.
          </p>
        </div>

        {/* Feature Cards - Always in one row */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
          {FEATURE_CARDS.map((card) => (
            <FeatureCard key={card.title} {...card} />
          ))}
        </div>
      </div>
    </div>
  )
}
