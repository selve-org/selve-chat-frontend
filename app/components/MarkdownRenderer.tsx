'use client'

import React, { useMemo, useEffect, useState, useCallback, memo, useRef } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

// =============================================================================
// TYPES
// =============================================================================

interface MarkdownRendererProps {
  content: string
  className?: string
}

interface ParsedPart {
  type: 'text' | 'code'
  content: string
  language?: string
}

// DOMPurify type for the loaded module
type DOMPurifyInstance = {
  sanitize: (dirty: string, config?: Record<string, unknown>) => string
}

// =============================================================================
// CONSTANTS
// =============================================================================

// Supported languages for syntax highlighting (whitelist for security)
const SUPPORTED_LANGUAGES = new Set([
  'javascript', 'typescript', 'jsx', 'tsx', 'python', 'java', 'c', 'cpp',
  'csharp', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'scala',
  'html', 'css', 'scss', 'sass', 'less', 'json', 'yaml', 'xml', 'markdown',
  'sql', 'graphql', 'bash', 'shell', 'powershell', 'dockerfile', 'nginx',
  'plaintext', 'text', 'diff', 'git', 'http', 'ini', 'toml', 'lua', 'perl',
  'r', 'matlab', 'latex', 'makefile', 'cmake', 'asm', 'wasm', 'solidity',
  'vim', 'zig', 'elixir', 'erlang', 'haskell', 'ocaml', 'clojure', 'dart',
])

const DEFAULT_LANGUAGE = 'plaintext'

// DOMPurify configuration - whitelist approach for security
const DOMPURIFY_CONFIG: any = {
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins',
    'code', 'pre', 'kbd', 'samp', 'var',
    'ul', 'ol', 'li',
    'blockquote', 'q', 'cite',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
    'a',
    'span', 'div', 'section', 'article',
    'dl', 'dt', 'dd',
    'abbr', 'address', 'time',
    'sub', 'sup', 'mark',
  ],
  ALLOWED_ATTR: [
    'href', 'title', 'target', 'rel', 'class', 'id',
    'datetime', 'cite', 'colspan', 'rowspan', 'scope', 'headers',
    'lang', 'dir', 'aria-label', 'aria-hidden', 'role',
  ],
  ALLOW_DATA_ATTR: false,
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  ADD_ATTR: ['target', 'rel'],
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Validates and sanitizes the language identifier for syntax highlighting
 */
function validateLanguage(lang: string | undefined): string {
  if (!lang) return DEFAULT_LANGUAGE
  
  const normalized = lang.toLowerCase().trim()
  
  // Handle common aliases
  const aliases: Record<string, string> = {
    'js': 'javascript',
    'ts': 'typescript',
    'py': 'python',
    'rb': 'ruby',
    'sh': 'bash',
    'zsh': 'bash',
    'yml': 'yaml',
    'md': 'markdown',
    'c++': 'cpp',
    'c#': 'csharp',
    'objective-c': 'objectivec',
    'objc': 'objectivec',
  }
  
  const resolvedLang = aliases[normalized] || normalized
  
  return SUPPORTED_LANGUAGES.has(resolvedLang) ? resolvedLang : DEFAULT_LANGUAGE
}

/**
 * Escapes HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
  }
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char])
}

/**
 * Validates URL for safe linking
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url, 'https://example.com')
    // Only allow http, https, mailto, and tel protocols
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol)
  } catch {
    // Allow relative URLs
    return !url.includes(':') || url.startsWith('/')
  }
}

/**
 * Parses markdown content into code blocks and text segments
 */
function parseCodeBlocks(text: string): ParsedPart[] {
  // Regex to match fenced code blocks: ```language\ncode```
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g
  const parts: ParsedPart[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      const textContent = text.substring(lastIndex, match.index)
      if (textContent.trim()) {
        parts.push({ type: 'text', content: textContent })
      }
    }

    // Add code block with validated language
    parts.push({
      type: 'code',
      content: match[2].trim(),
      language: validateLanguage(match[1]),
    })

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex)
    if (remainingText.trim()) {
      parts.push({ type: 'text', content: remainingText })
    }
  }

  // Handle edge case: no code blocks found
  if (parts.length === 0 && text.trim()) {
    parts.push({ type: 'text', content: text })
  }

  return parts
}

/**
 * Processes inline markdown elements (bold, italic, code, links)
 * This is applied AFTER HTML escaping to safely add HTML markup
 */
function processInlineMarkdown(text: string): string {
  let processed = text

  // Bold: **text** or __text__ (process double markers first)
  processed = processed.replace(
    /\*\*([^*]+)\*\*/g,
    '<strong class="font-semibold text-zinc-900 dark:text-white">$1</strong>'
  )
  processed = processed.replace(
    /__([^_]+)__/g,
    '<strong class="font-semibold text-zinc-900 dark:text-white">$1</strong>'
  )

  // Italic: *text* or _text_ (single markers, being careful not to match inside words)
  processed = processed.replace(
    /(?<![*\\])\*([^*\n]+)\*(?!\*)/g,
    '<em class="italic text-zinc-700 dark:text-zinc-300">$1</em>'
  )
  processed = processed.replace(
    /(?<![_\\])_([^_\n]+)_(?!_)/g,
    '<em class="italic text-zinc-700 dark:text-zinc-300">$1</em>'
  )

  // Inline code: `code` (escape the content for safety)
  processed = processed.replace(
    /`([^`\n]+)`/g,
    '<code class="bg-zinc-200 dark:bg-zinc-800 text-pink-600 dark:text-pink-400 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>'
  )

  // Links: [text](url) with URL validation
  processed = processed.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_, linkText, url) => {
      if (isValidUrl(url)) {
        return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="text-purple-400 hover:text-purple-300 underline">${linkText}</a>`
      }
      // If URL is invalid, just show the text without linking
      return linkText
    }
  )

  // Strikethrough: ~~text~~
  processed = processed.replace(
    /~~([^~]+)~~/g,
    '<del class="line-through text-zinc-500 dark:text-zinc-400">$1</del>'
  )

  return processed
}

/**
 * Processes block-level markdown elements
 */
function processBlockMarkdown(text: string): string {
  let processed = text
  const lines = processed.split('\n')
  const resultLines: string[] = []
  let inList = false
  let listType: 'ul' | 'ol' | null = null
  let inTable = false
  let tableLines: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmedLine = line.trim()

    // Empty line handling
    if (!trimmedLine) {
      if (inList) {
        resultLines.push(listType === 'ul' ? '</ul>' : '</ol>')
        inList = false
        listType = null
      }
      if (inTable && tableLines.length > 0) {
        resultLines.push(processTable(tableLines))
        tableLines = []
        inTable = false
      }
      resultLines.push('')
      continue
    }

    // Table detection
    if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
      if (inList) {
        resultLines.push(listType === 'ul' ? '</ul>' : '</ol>')
        inList = false
        listType = null
      }
      inTable = true
      tableLines.push(trimmedLine)
      continue
    }

    // Close table if not a table line
    if (inTable && tableLines.length > 0) {
      resultLines.push(processTable(tableLines))
      tableLines = []
      inTable = false
    }

    // Headers (must be at start of line)
    const headerMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/)
    if (headerMatch) {
      if (inList) {
        resultLines.push(listType === 'ul' ? '</ul>' : '</ol>')
        inList = false
        listType = null
      }
      const level = headerMatch[1].length
      const headerContent = processInlineMarkdown(escapeHtml(headerMatch[2]))
      const headerClasses: Record<number, string> = {
        1: 'text-2xl font-bold mt-6 mb-4 text-zinc-900 dark:text-white',
        2: 'text-xl font-semibold mt-5 mb-3 text-zinc-900 dark:text-white',
        3: 'text-lg font-semibold mt-4 mb-2 text-zinc-900 dark:text-white',
        4: 'text-base font-semibold mt-3 mb-2 text-zinc-900 dark:text-white',
        5: 'text-sm font-semibold mt-3 mb-1 text-zinc-900 dark:text-white',
        6: 'text-sm font-medium mt-2 mb-1 text-zinc-900 dark:text-white',
      }
      resultLines.push(`<h${level} class="${headerClasses[level]}">${headerContent}</h${level}>`)
      continue
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmedLine)) {
      if (inList) {
        resultLines.push(listType === 'ul' ? '</ul>' : '</ol>')
        inList = false
        listType = null
      }
      resultLines.push('<hr class="my-6 border-zinc-300 dark:border-zinc-700" />')
      continue
    }

    // Blockquotes
    const blockquoteMatch = trimmedLine.match(/^>\s*(.*)$/)
    if (blockquoteMatch) {
      if (inList) {
        resultLines.push(listType === 'ul' ? '</ul>' : '</ol>')
        inList = false
        listType = null
      }
      const quoteContent = processInlineMarkdown(escapeHtml(blockquoteMatch[1]))
      resultLines.push(`<blockquote class="border-l-4 border-purple-500 pl-4 py-2 my-4 italic text-zinc-700 dark:text-zinc-300 bg-zinc-200/50 dark:bg-zinc-800/30 rounded-r">${quoteContent}</blockquote>`)
      continue
    }

    // Unordered list items
    const ulMatch = trimmedLine.match(/^[-*+]\s+(.+)$/)
    if (ulMatch) {
      if (!inList || listType !== 'ul') {
        if (inList) {
          resultLines.push(listType === 'ul' ? '</ul>' : '</ol>')
        }
        resultLines.push('<ul class="list-disc pl-6 my-3 space-y-1">')
        inList = true
        listType = 'ul'
      }
      const itemContent = processInlineMarkdown(escapeHtml(ulMatch[1]))
      resultLines.push(`<li class="text-zinc-700 dark:text-zinc-300">${itemContent}</li>`)
      continue
    }

    // Ordered list items
    const olMatch = trimmedLine.match(/^\d+\.\s+(.+)$/)
    if (olMatch) {
      if (!inList || listType !== 'ol') {
        if (inList) {
          resultLines.push(listType === 'ul' ? '</ul>' : '</ol>')
        }
        resultLines.push('<ol class="list-decimal pl-6 my-3 space-y-1">')
        inList = true
        listType = 'ol'
      }
      const itemContent = processInlineMarkdown(escapeHtml(olMatch[1]))
      resultLines.push(`<li class="text-zinc-700 dark:text-zinc-300">${itemContent}</li>`)
      continue
    }

    // Close list if not a list item
    if (inList) {
      resultLines.push(listType === 'ul' ? '</ul>' : '</ol>')
      inList = false
      listType = null
    }

    // Regular paragraph
    const paragraphContent = processInlineMarkdown(escapeHtml(trimmedLine))
    resultLines.push(`<p class="my-3 leading-relaxed text-zinc-700 dark:text-zinc-300">${paragraphContent}</p>`)
  }

  // Close any remaining open lists
  if (inList) {
    resultLines.push(listType === 'ul' ? '</ul>' : '</ol>')
  }

  // Process any remaining table
  if (inTable && tableLines.length > 0) {
    resultLines.push(processTable(tableLines))
  }

  return resultLines.join('\n')
}

/**
 * Processes markdown table into HTML
 */
function processTable(lines: string[]): string {
  if (lines.length < 2) return ''

  // Parse header
  const headerCells = lines[0]
    .split('|')
    .slice(1, -1)
    .map(cell => escapeHtml(cell.trim()))

  // Check for separator line (|---|---|)
  const separatorLine = lines[1]
  if (!/^\|[\s:-]+\|$/.test(separatorLine)) {
    // Not a valid table
    return lines.map(l => `<p>${escapeHtml(l)}</p>`).join('\n')
  }

  // Parse alignment from separator
  const alignments = separatorLine
    .split('|')
    .slice(1, -1)
    .map(cell => {
      const trimmed = cell.trim()
      if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center'
      if (trimmed.endsWith(':')) return 'right'
      return 'left'
    })

  // Parse body rows
  const bodyRows = lines.slice(2).map(line =>
    line
      .split('|')
      .slice(1, -1)
      .map(cell => escapeHtml(cell.trim()))
  )

  // Build HTML
  const headerHtml = headerCells
    .map((cell, i) => {
      const align = alignments[i] || 'left'
      return `<th class="px-4 py-2 text-${align} font-semibold border-b border-zinc-300 dark:border-zinc-700">${processInlineMarkdown(cell)}</th>`
    })
    .join('')

  const bodyHtml = bodyRows
    .map(row => {
      const cells = row
        .map((cell, i) => {
          const align = alignments[i] || 'left'
          return `<td class="px-4 py-2 text-${align} border-b border-zinc-200 dark:border-zinc-800">${processInlineMarkdown(cell)}</td>`
        })
        .join('')
      return `<tr class="hover:bg-zinc-100 dark:hover:bg-zinc-800/50">${cells}</tr>`
    })
    .join('')

  return `<div class="overflow-x-auto my-4"><table class="w-full border-collapse bg-zinc-100/50 dark:bg-zinc-900/50 rounded-lg overflow-hidden"><thead><tr class="bg-zinc-200 dark:bg-zinc-800">${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></div>`
}

// =============================================================================
// CODE BLOCK COMPONENT
// =============================================================================

interface CodeBlockProps {
  content: string
  language: string
}

const CodeBlock = memo(function CodeBlock({ content, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }, [content])

  return (
    <div className="relative group my-4">
      <div className="absolute right-2 top-2 z-10">
        <button
          onClick={handleCopy}
          className="px-2 py-1 text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label={copied ? 'Copied!' : 'Copy code'}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="absolute left-4 top-2 text-xs text-zinc-500 font-mono">
        {language !== 'plaintext' && language}
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          borderRadius: '8px',
          padding: '16px',
          paddingTop: language !== 'plaintext' ? '32px' : '16px',
          fontSize: '14px',
          margin: 0,
        }}
        codeTagProps={{
          style: {
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
          },
        }}
      >
        {content}
      </SyntaxHighlighter>
    </div>
  )
})

// =============================================================================
// TEXT BLOCK COMPONENT
// =============================================================================

interface TextBlockProps {
  content: string
  sanitize: (html: string) => string
  isSanitizationReady: boolean
}

/**
 * Renders processed markdown HTML safely.
 * Only renders processed HTML when sanitizer is ready.
 * Falls back to plain text rendering if sanitization unavailable.
 */
const TextBlock = memo(function TextBlock({ content, sanitize, isSanitizationReady }: TextBlockProps) {
  const processedHtml = useMemo(() => {
    if (!isSanitizationReady) {
      // Return null - component will show plain text fallback
      return null
    }
    const html = processBlockMarkdown(content)
    return sanitize(html)
  }, [content, sanitize, isSanitizationReady])

  // If sanitization not ready, render as plain text (safe fallback)
  if (!isSanitizationReady || processedHtml === null) {
    return (
      <div className="selve-markdown-text">
        <p className="my-3 leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
          {content}
        </p>
      </div>
    )
  }

  return (
    <div
      className="selve-markdown-text"
      dangerouslySetInnerHTML={{ __html: processedHtml }}
    />
  )
})

// =============================================================================
// DOMPURIFY SINGLETON LOADER
// =============================================================================

// Module-level cache for DOMPurify instance (singleton pattern)
let cachedDOMPurify: DOMPurifyInstance | null = null
let loadingPromise: Promise<DOMPurifyInstance | null> | null = null
let loadAttempted = false

/**
 * Loads DOMPurify as a singleton with caching.
 * Ensures only one instance exists across all component instances.
 */
async function loadDOMPurifySingleton(): Promise<DOMPurifyInstance | null> {
  // Server-side: return null immediately
  if (typeof window === 'undefined') {
    return null
  }

  // Return cached instance if available
  if (cachedDOMPurify) {
    return cachedDOMPurify
  }

  // Return existing promise if loading is in progress
  if (loadingPromise) {
    return loadingPromise
  }

  // Start loading
  loadAttempted = true
  loadingPromise = import('dompurify')
    .then((module) => {
      const purify = module.default
      if (purify && typeof purify.sanitize === 'function') {
        cachedDOMPurify = purify as DOMPurifyInstance
        return cachedDOMPurify
      }
      console.error('[MarkdownRenderer] DOMPurify loaded but sanitize method not found')
      return null
    })
    .catch((err) => {
      console.error('[MarkdownRenderer] Failed to load DOMPurify:', err)
      loadingPromise = null
      return null
    })

  return loadingPromise
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * MarkdownRenderer - Production-grade markdown rendering component
 * 
 * Features:
 * - XSS protection via DOMPurify
 * - Syntax highlighting for code blocks
 * - Graceful fallback when sanitization unavailable
 * - Memoized for performance
 * - SSR compatible
 */
function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const [purifyInstance, setPurifyInstance] = useState<DOMPurifyInstance | null>(cachedDOMPurify)
  const [loadingState, setLoadingState] = useState<'loading' | 'ready' | 'failed'>(
    cachedDOMPurify ? 'ready' : 'loading'
  )
  const mountedRef = useRef(true)

  // Load DOMPurify on client side
  useEffect(() => {
    mountedRef.current = true

    // Skip if already loaded
    if (cachedDOMPurify) {
      setPurifyInstance(cachedDOMPurify)
      setLoadingState('ready')
      return
    }

    // Skip on server
    if (typeof window === 'undefined') {
      setLoadingState('ready')
      return
    }

    loadDOMPurifySingleton()
      .then((instance) => {
        if (mountedRef.current) {
          setPurifyInstance(instance)
          setLoadingState(instance ? 'ready' : 'failed')
        }
      })
      .catch(() => {
        if (mountedRef.current) {
          setLoadingState('failed')
        }
      })

    return () => {
      mountedRef.current = false
    }
  }, [])

  // Memoized sanitizer function - only sanitizes if DOMPurify is available
  const sanitize = useCallback(
    (html: string): string => {
      if (!purifyInstance || typeof window === 'undefined') {
        // This shouldn't be called when purifyInstance is null
        // because isSanitizationReady will be false
        console.warn('[MarkdownRenderer] sanitize called without DOMPurify')
        return ''
      }
      
      try {
        return purifyInstance.sanitize(html, DOMPURIFY_CONFIG)
      } catch (err) {
        console.error('[MarkdownRenderer] DOMPurify sanitization failed:', err)
        // Return empty string - let the component show fallback
        return ''
      }
    },
    [purifyInstance]
  )

  // Determine if sanitization is ready
  const isSanitizationReady = loadingState === 'ready' && purifyInstance !== null

  // Parse content into parts
  const parts = useMemo(() => parseCodeBlocks(content), [content])

  // Render loading state while DOMPurify loads (client-side only)
  if (loadingState === 'loading' && typeof window !== 'undefined') {
    return (
      <div className={`selve-markdown prose dark:prose-invert max-w-none ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4 mb-2" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2 mb-2" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-5/6" />
        </div>
      </div>
    )
  }

  return (
    <div className={`selve-markdown prose dark:prose-invert max-w-none ${className}`}>
      {parts.map((part, idx) => {
        if (part.type === 'code') {
          return (
            <CodeBlock
              key={`code-${idx}`}
              content={part.content}
              language={part.language || DEFAULT_LANGUAGE}
            />
          )
        }

        return (
          <TextBlock
            key={`text-${idx}`}
            content={part.content}
            sanitize={sanitize}
            isSanitizationReady={isSanitizationReady}
          />
        )
      })}
    </div>
  )
}

// Export memoized component for better performance
export default memo(MarkdownRenderer)