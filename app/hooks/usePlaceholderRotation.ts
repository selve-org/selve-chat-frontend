'use client'

import { useState, useEffect } from 'react'

const PLACEHOLDER_QUESTIONS = [
  'What are my strongest SELVE dimensions?',
  'How can I grow in my weaker areas?',
  'Explain the LUMEN dimension to me',
  'What careers fit my personality type?',
  'How do my dimensions affect my relationships?',
  'What makes me unique according to SELVE?',
  'Why do people misunderstand me sometimes?',
  'What does my AETHER dimension reveal?',
  'What are the 8 SELVE dimensions?',
  'What social habits hurt me?',
  'What do my friends see differently about me than I do?',
  'Tell me about my personality pattern',
  'What strengths does my profile show?',
  'What is my dominant dimension?',
  'How do dimensions work together?',
  'What career paths match my VERVE?',
  'How can I strengthen my AETHER?',
  'Tell me about dimension interactions',
  'How do I interpret my SELVE results?',
  'What are my growth opportunities?',
  'How would you describe my personality in simple terms?',
  'What makes my personality combination unique?',
  'How can I leverage my strengths?',
  'How am I feeling lately, based on my answers?',
  'How do I work on my blind spots?',
  'Tell me about SELVE assessment accuracy',
  'What influences dimension development?',
  'How can friends help me grow?',
  'What does my friend assessment reveal?',
  'How do others perceive my personality?',
  'What patterns appear in my dimensions?',
  'How can I apply SELVE insights daily?',
  'What does balance look like in SELVE?',
  'How do my values align with dimensions?',
  'What motivates me according to SELVE?',
  'How can I improve self-awareness?',
  'Tell me about dimension complementarity',
  'What kind of person am I, really?',
  'How do I handle stress based on my profile?',
  'What communication style suits me?',
  'How can I build better relationships?',
  'What leadership style matches my dimensions?',
  'How do I make decisions based on SELVE?',
  'What creative outlets fit my profile?',
  'How can I find more meaning in life?',
  'Tell me something important I might be ignoring.',
  'What truth about myself am I avoiding?',
  "What's one pattern I should reflect on today?",
  'Ask me a question that would help me understand myself better.',
  "What's a healthy challenge for me right now?",
  'What would growth look like for me this month?',
  'How accurate is this analysis?',
  'What data is this based on?',
  'Does SELVE use my private messages?',
  'How often should I retake assessments?',
  'Can I disagree with this insight?',
  "What if my answers weren't fully honest?",
  'How does friend feedback affect my profile?',
  'What happens if my behavior changes?',
  'What personality type am I in SELVE?',
  'How confident is this profile?',
  'What traits influence me the most?',
  'How does SELVE determine my personality?',
  'Can my personality change over time?',
  'What parts of my profile are most stable?',
  'Which traits conflict with each other in me?',
  'How do I compare to the average person?',
  'What kind of work environment suits me best?',
  'What roles match my personality?',
  'How do I behave in teams?',
  'Am I more of a leader or a contributor?',
  'How do I handle feedback at work?',
  'What motivates me professionally?',
  'What drains me at work?',
  'How can I improve my work habits?',
  'What does success look like for someone like me?',
  'Why do I overthink things?',
  'Why do I procrastinate even when I care?',
  'How do I make decisions under pressure?',
  'Do I act more on instinct or planning?',
  'Why do I avoid certain decisions?',
  'What patterns influence my choices?',
  'How do I handle failure?',
  'Do I take risks or play it safe?',
  'What should I work on the most right now?',
  'What habits would help me grow?',
  "What's holding me back?",
  'What small changes would make the biggest difference?',
  'What does growth look like for my personality type?',
  'What should I stop doing?',
  'What should I lean into more?',
  'How do I become a better version of myself?',
  'What did my friends say about me overall?',
  "What's the biggest gap between how I see myself and how others see me?",
  'What surprised you most in the friend feedback?',
  'What do multiple people consistently notice about me?',
  "Is there something others see that I'm missing?",
  'Do my friends see me as reliable?',
  'How do people describe my communication style?',
  'What strengths do others appreciate in me?',
  'Why do I clash with certain personality types?',
  'How do I behave in close relationships?',
  'What kind of partner am I likely to be?',
  'Do I come across as confident or reserved?',
  'What social habits help me?',
  'Why do I react so strongly to certain situations?',
  'What emotions do I struggle with the most?',
  'What usually triggers my stress or anxiety?',
  'How do I typically handle pressure?',
  'Do I avoid emotions or confront them?',
  'What emotional patterns do you see in me?',
  'Why do I shut down sometimes?',
  'What helps me feel grounded?',
  'What are my strongest personality traits?',
  'What do people usually notice first about me?',
  'What makes me different from most people?',
  'What are my biggest strengths?',
  'What are my blind spots?',
  'What patterns keep showing up in my behavior?',
  'Am I more logical or emotional?',
  'What motivates me the most?',
]

export function usePlaceholderRotation(interval: number = 3000) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [nextIndex, setNextIndex] = useState(1)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setIsTransitioning(true)
      
      // After slide animations complete, update index
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % PLACEHOLDER_QUESTIONS.length)
        setNextIndex((prev) => (prev + 1) % PLACEHOLDER_QUESTIONS.length)
        setIsTransitioning(false)
      }, 500) // Match animation duration
    }, interval)

    return () => clearInterval(timer)
  }, [interval])

  return {
    currentPlaceholder: PLACEHOLDER_QUESTIONS[currentIndex],
    nextPlaceholder: PLACEHOLDER_QUESTIONS[nextIndex],
    isTransitioning,
  }
}
