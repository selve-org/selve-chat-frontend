'use client'

import { Sparkles, MessageSquare, Brain, Palette } from 'lucide-react'

interface FeatureCardProps {
  title: string
  description: string
  icon: React.ReactNode
  gradient: string
}

function FeatureCard({ title, description, icon, gradient }: FeatureCardProps) {
  return (
    <div
      className={`
        group relative overflow-hidden rounded-xl border border-zinc-800 p-5
        bg-gradient-to-br ${gradient}
        transition-all duration-300 hover:scale-[1.02] hover:border-zinc-700
      `}
    >
      {/* Subtle glow effect */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/5 blur-2xl transition-all duration-500 group-hover:bg-white/10" />

      <div className="relative">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white">
          {icon}
        </div>
        <h3 className="mb-1 font-semibold text-white">{title}</h3>
        <p className="text-sm text-zinc-400">{description}</p>
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
    icon: <Brain className="h-5 w-5" />,
    gradient: 'from-[#1a2845] via-[#182038] to-[#0f1520]',
  },
  {
    title: 'Growth Guidance',
    description: 'Discover actionable steps for personal development.',
    icon: <Sparkles className="h-5 w-5" />,
    gradient: 'from-[#3d2820] via-[#2d1f18] to-[#1a1210]',
  },
  {
    title: 'Dimension Explorer',
    description: 'Deep dive into the 8 SELVE dimensions and what they mean.',
    icon: <Palette className="h-5 w-5" />,
    gradient: 'from-[#2d1a45] via-[#221433] to-[#150d20]',
  },
  {
    title: 'Relationship Insights',
    description: 'Understand how your personality affects your relationships.',
    icon: <MessageSquare className="h-5 w-5" />,
    gradient: 'from-[#1a3d3d] via-[#14292e] to-[#0d1a1d]',
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
    <div className="flex h-full flex-col items-center justify-center overflow-y-auto p-8">
      <div className="w-full max-w-4xl space-y-8">
        {/* Welcome Header */}
        <div className="text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600">
            <span className="text-3xl font-bold text-white">S</span>
          </div>
          <h1 className="mb-2 text-3xl font-semibold text-zinc-900 dark:text-white">
            {userName ? `Welcome back, ${userName}` : 'Welcome to SELVE Chat'}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Your AI-powered personality guide. Ask me anything about your SELVE assessment.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURE_CARDS.map((card) => (
            <FeatureCard key={card.title} {...card} />
          ))}
        </div>

        {/* Suggestion Chips */}
        <div className="flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => onSuggestionClick(suggestion)}
              className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-700 transition-colors hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
