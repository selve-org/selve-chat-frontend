'use client'

import React, {
  useMemo,
  useEffect,
  useState,
  useCallback,
  memo,
  useRef,
} from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import createDOMPurify from 'dompurify'

/* =============================================================================
   TYPES
============================================================================= */

interface MarkdownRendererProps {
  content: string
  className?: string
}

interface ParsedPart {
  type: 'text' | 'code'
  content: string
  language?: string
}

type DOMPurifyInstance = ReturnType<typeof createDOMPurify>

/* =============================================================================
   CONSTANTS
============================================================================= */

const DEFAULT_LANGUAGE = 'plaintext'

/* =============================================================================
   SAFE UTILITIES
============================================================================= */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url, 'https://example.com')
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(u.protocol)
  } catch {
    return false
  }
}

/* =============================================================================
   MARKDOWN PROCESSING (NO LOOKBEHIND — SAFE EVERYWHERE)
============================================================================= */

function processInlineMarkdown(text: string): string {
  let out = text

  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/__([^_]+)__/g, '<strong>$1</strong>')
  out = out.replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
  out = out.replace(/_([^_\n]+)_/g, '<em>$1</em>')
  out = out.replace(/`([^`\n]+)`/g, '<code>$1</code>')

  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, u) =>
    isValidUrl(u)
      ? `<a href="${escapeHtml(u)}" target="_blank" rel="noopener noreferrer">${t}</a>`
      : t
  )

  return out
}

function processBlockMarkdown(text: string): string {
  return text
    .split('\n')
    .map((line) => {
      const safe = processInlineMarkdown(escapeHtml(line))
      return `<p>${safe}</p>`
    })
    .join('')
}

/* =============================================================================
   COMPONENTS
============================================================================= */

const TextBlock = memo(function TextBlock({
  content,
  sanitize,
}: {
  content: string
  sanitize: (html: string) => string
}) {
  const html = useMemo(() => {
    const raw = processBlockMarkdown(content)
    return sanitize(raw)
  }, [content, sanitize])

  return (
    <div
      className="selve-markdown-text not-prose text-zinc-300"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
})

/* =============================================================================
   MAIN
============================================================================= */

function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const purifyRef = useRef<DOMPurifyInstance | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && !purifyRef.current) {
      purifyRef.current = createDOMPurify(window)
    }
  }, [])

  const sanitize = useCallback((html: string) => {
    if (!purifyRef.current) return ''
    return purifyRef.current.sanitize(html)
  }, [])

  return (
    <div className={`selve-markdown ${className}`}>
      <TextBlock content={content} sanitize={sanitize} />
    </div>
  )
}

export default memo(MarkdownRenderer)
