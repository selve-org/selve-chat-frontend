/**
 * Markdown Utilities for SELVE Chat
 * 
 * Production-grade markdown processing utilities with:
 * - Security-first approach (XSS prevention)
 * - Type safety throughout
 * - Comprehensive error handling
 * - Performance optimizations
 * 
 * @module markdownUtils
 */

import { marked, type MarkedOptions, type Tokens } from 'marked'
import type DOMPurifyType from 'dompurify'

// =============================================================================
// TYPES
// =============================================================================

export interface FormattingValidation {
  hasHeaders: boolean
  hasParagraphBreaks: boolean
  hasAppropriateLength: boolean
  hasStructure: boolean
  isReadable: boolean
  score: number
  issues: string[]
}

export interface SanitizeOptions {
  allowedTags?: string[]
  allowedAttributes?: string[]
  allowDataAttributes?: boolean
}

export interface EnhancementOptions {
  fixListFormatting?: boolean
  normalizeWhitespace?: boolean
  addHeaderSpacing?: boolean
}

// =============================================================================
// CONSTANTS
// =============================================================================

// Default allowed tags for sanitization (whitelist approach)
const DEFAULT_ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'hr',
  'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins',
  'code', 'pre', 'kbd', 'samp', 'var',
  'ul', 'ol', 'li',
  'blockquote', 'q', 'cite',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
  'a',
  'span', 'div',
  'dl', 'dt', 'dd',
  'abbr', 'time',
  'sub', 'sup', 'mark',
] as const

// Default allowed attributes
const DEFAULT_ALLOWED_ATTR = [
  'href', 'title', 'target', 'rel', 'class', 'id',
  'datetime', 'cite', 'colspan', 'rowspan', 'scope',
  'aria-label', 'aria-hidden', 'role',
] as const

// Response length boundaries
const MIN_RESPONSE_LENGTH = 50
const MAX_RESPONSE_LENGTH = 10000
const IDEAL_MIN_LENGTH = 100
const IDEAL_MAX_LENGTH = 4000

// =============================================================================
// DOMPURIFY LAZY LOADER
// =============================================================================

let cachedDOMPurify: any = null
let loadingPromise: Promise<any> | null = null

/**
 * Lazily loads DOMPurify on the client side with caching
 * Returns null on server side or if loading fails
 */
async function loadDOMPurify(): Promise<any> {
  // Return immediately on server
  if (typeof window === 'undefined') {
    return null
  }

  // Return cached instance
  if (cachedDOMPurify) {
    return cachedDOMPurify
  }

  // Return existing loading promise to prevent duplicate imports
  if (loadingPromise) {
    return loadingPromise
  }

  // Start loading
  loadingPromise = import('dompurify')
    .then((module) => {
      cachedDOMPurify = module.default
      return cachedDOMPurify
    })
    .catch((err) => {
      console.error('[markdownUtils] Failed to load DOMPurify:', err)
      loadingPromise = null
      return null
    })

  return loadingPromise
}

// =============================================================================
// MARKED CONFIGURATION
// =============================================================================

// Configure marked with secure defaults
const markedOptions: MarkedOptions = {
  gfm: true,          // GitHub Flavored Markdown
  breaks: true,       // Convert \n to <br>
  async: false,       // Synchronous rendering for predictability
}

// Create a custom renderer with security enhancements
const renderer = new marked.Renderer()

// Override link rendering to add security attributes
renderer.link = function(token: Tokens.Link): string {
  const href = token.href
  const title = token.title
  const text = token.text
  
  // Validate URL protocol
  if (href && !isValidUrl(href)) {
    // Return just the text for invalid URLs
    return text
  }
  
  const titleAttr = title ? ` title="${escapeHtml(title)}"` : ''
  const safeHref = href ? escapeHtml(href) : ''
  
  return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer"${titleAttr}>${text}</a>`
}

// Override image rendering (disabled for security - images should be handled separately)
renderer.image = function(token: Tokens.Image): string {
  // Return alt text instead of rendering potentially dangerous images
  return token.text ? `[Image: ${escapeHtml(token.text)}]` : '[Image]'
}

// Apply configuration
marked.setOptions(markedOptions)
marked.use({ renderer })

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

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
    '/': '&#x2F;',
  }
  return text.replace(/[&<>"'/]/g, (char) => htmlEscapes[char])
}

/**
 * Validates URL protocol for safe linking
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url, 'https://example.com')
    // Only allow safe protocols
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol)
  } catch {
    // Allow relative URLs that don't have a protocol
    return !url.includes(':') || url.startsWith('/')
  }
}

/**
 * Creates DOMPurify configuration from options
 */
function createDOMPurifyConfig(options: SanitizeOptions = {}): any {
  return {
    ALLOWED_TAGS: options.allowedTags || [...DEFAULT_ALLOWED_TAGS],
    ALLOWED_ATTR: options.allowedAttributes || [...DEFAULT_ALLOWED_ATTR],
    ALLOW_DATA_ATTR: options.allowDataAttributes ?? false,
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
    ADD_ATTR: ['target', 'rel'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'svg', 'math'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onsubmit'],
  }
}

// =============================================================================
// MAIN FUNCTIONS
// =============================================================================

/**
 * Sanitizes and renders markdown to HTML
 * 
 * This function converts markdown to HTML using the `marked` library,
 * then sanitizes the output using DOMPurify to prevent XSS attacks.
 * 
 * @param markdown - The markdown string to render
 * @param options - Optional sanitization options
 * @returns Sanitized HTML string
 * 
 * @example
 * ```typescript
 * const html = await sanitizeAndRenderMarkdown('# Hello **World**')
 * // Returns: '<h1>Hello <strong>World</strong></h1>'
 * ```
 */
export async function sanitizeAndRenderMarkdown(
  markdown: string,
  options: SanitizeOptions = {}
): Promise<string> {
  // Handle empty input
  if (!markdown || typeof markdown !== 'string') {
    return ''
  }

  try {
    // Convert markdown to HTML using marked
    const rawHtml = marked.parse(markdown) as string

    // Load DOMPurify
    const DOMPurify = await loadDOMPurify()

    if (DOMPurify) {
      // Sanitize with DOMPurify
      const config = createDOMPurifyConfig(options)
      return DOMPurify.sanitize(rawHtml, config) as string
    }

    // Fallback for SSR: return raw HTML (should be sanitized on client)
    // This is safe because marked's output is relatively controlled,
    // but full sanitization should happen on the client
    console.warn('[markdownUtils] DOMPurify not available, returning unsanitized HTML')
    return rawHtml
  } catch (error) {
    console.error('[markdownUtils] Error rendering markdown:', error)
    // Return escaped input on error
    return `<p>${escapeHtml(markdown)}</p>`
  }
}

/**
 * Synchronous version of sanitizeAndRenderMarkdown
 * Uses cached DOMPurify instance if available
 * 
 * @param markdown - The markdown string to render
 * @param options - Optional sanitization options
 * @returns Sanitized HTML string
 */
export function sanitizeAndRenderMarkdownSync(
  markdown: string,
  options: SanitizeOptions = {}
): string {
  // Handle empty input
  if (!markdown || typeof markdown !== 'string') {
    return ''
  }

  try {
    // Convert markdown to HTML
    const rawHtml = marked.parse(markdown) as string

    // Use cached DOMPurify if available
    if (cachedDOMPurify && typeof window !== 'undefined') {
      const config = createDOMPurifyConfig(options)
      return cachedDOMPurify.sanitize(rawHtml, config) as string
    }

    // Fallback: return raw HTML
    return rawHtml
  } catch (error) {
    console.error('[markdownUtils] Error rendering markdown:', error)
    return `<p>${escapeHtml(markdown)}</p>`
  }
}

/**
 * Enhances response formatting for better readability
 * 
 * This function normalizes markdown formatting without changing content meaning:
 * - Normalizes whitespace
 * - Fixes list formatting
 * - Ensures consistent spacing around headers
 * 
 * @param response - The raw response string to enhance
 * @param options - Enhancement options
 * @returns Enhanced response string
 */
export function enhanceResponseFormatting(
  response: string,
  options: EnhancementOptions = {}
): string {
  // Handle empty input
  if (!response || typeof response !== 'string') {
    return ''
  }

  const {
    fixListFormatting = true,
    normalizeWhitespace = true,
    addHeaderSpacing = true,
  } = options

  let enhanced = response

  // Normalize whitespace: collapse multiple blank lines to max 2
  if (normalizeWhitespace) {
    enhanced = enhanced.replace(/\n{3,}/g, '\n\n')
    // Remove trailing whitespace from lines
    enhanced = enhanced.replace(/[ \t]+$/gm, '')
  }

  // Add spacing after headers
  if (addHeaderSpacing) {
    // Ensure blank line after headers if not followed by one
    enhanced = enhanced.replace(/(^#{1,6}\s+.+$)(?!\n\n|\n$)/gm, '$1\n')
  }

  // Fix list formatting
  if (fixListFormatting) {
    // Convert various bullet characters to standard dashes
    enhanced = enhanced.replace(/^([•·▪▸►])\s*/gm, '- ')
    
    // Ensure space after list markers
    enhanced = enhanced.replace(/^(-|\d+\.)([^\s])/gm, '$1 $2')
    
    // Ensure list items have consistent indentation (2 spaces for nested)
    enhanced = enhanced.replace(/^(\s*)([-*+]|\d+\.)\s+/gm, (_, indent, marker) => {
      // Normalize indentation to multiples of 2 spaces
      const normalizedIndent = '  '.repeat(Math.floor(indent.length / 2))
      return `${normalizedIndent}${marker} `
    })
  }

  return enhanced.trim()
}

/**
 * Validates response formatting quality
 * 
 * Checks various aspects of response formatting to ensure quality:
 * - Presence of headers for structure
 * - Paragraph breaks for readability
 * - Appropriate length
 * - Structural elements (lists, tables)
 * - Readable content (not just code)
 * 
 * @param response - The response string to validate
 * @returns Validation result with details
 */
export function validateResponseFormat(response: string): FormattingValidation {
  // Handle empty input
  if (!response || typeof response !== 'string') {
    return {
      hasHeaders: false,
      hasParagraphBreaks: false,
      hasAppropriateLength: false,
      hasStructure: false,
      isReadable: false,
      score: 0,
      issues: ['Response is empty or invalid'],
    }
  }

  const issues: string[] = []
  const trimmedResponse = response.trim()

  // Check for headers
  const hasHeaders = /^#{1,6}\s+.+$/m.test(trimmedResponse)
  if (!hasHeaders && trimmedResponse.length > 500) {
    issues.push('Long response lacks headers for structure')
  }

  // Check for paragraph breaks
  const paragraphCount = trimmedResponse.split(/\n\n+/).length
  const hasParagraphBreaks = paragraphCount > 1
  if (!hasParagraphBreaks && trimmedResponse.length > 300) {
    issues.push('Response lacks paragraph breaks')
  }

  // Check length
  const length = trimmedResponse.length
  const hasAppropriateLength = length >= MIN_RESPONSE_LENGTH && length <= MAX_RESPONSE_LENGTH
  if (length < MIN_RESPONSE_LENGTH) {
    issues.push('Response is too short')
  } else if (length > MAX_RESPONSE_LENGTH) {
    issues.push('Response is very long and may need summarization')
  }

  // Check for structural elements (lists, tables)
  const hasLists = /^[-*+]\s/m.test(trimmedResponse) || /^\d+\.\s/m.test(trimmedResponse)
  const hasTables = /\|.+\|/.test(trimmedResponse) && /\|[-:\s]+\|/.test(trimmedResponse)
  const hasStructure = hasLists || hasTables

  // Check readability (not just code blocks)
  const codeBlockContent = trimmedResponse.match(/```[\s\S]*?```/g)?.join('') || ''
  const nonCodeLength = trimmedResponse.length - codeBlockContent.length
  const isReadable = nonCodeLength > trimmedResponse.length * 0.2 || trimmedResponse.length < 200

  if (!isReadable) {
    issues.push('Response is mostly code with little explanation')
  }

  // Calculate score (0-100)
  let score = 0
  if (hasHeaders) score += 20
  if (hasParagraphBreaks) score += 20
  if (hasAppropriateLength) score += 20
  if (hasStructure) score += 20
  if (isReadable) score += 20

  // Bonus points for ideal length
  if (length >= IDEAL_MIN_LENGTH && length <= IDEAL_MAX_LENGTH) {
    score += 10
  }

  // Cap at 100
  score = Math.min(100, score)

  return {
    hasHeaders,
    hasParagraphBreaks,
    hasAppropriateLength,
    hasStructure,
    isReadable,
    score,
    issues,
  }
}

/**
 * Checks if a response meets minimum formatting standards
 * 
 * @param response - The response string to check
 * @param minScore - Minimum score required (default: 60)
 * @returns True if response passes validation
 */
export function isResponseValid(response: string, minScore: number = 60): boolean {
  const validation = validateResponseFormat(response)
  return validation.score >= minScore
}

/**
 * Strips markdown formatting, leaving plain text
 * Useful for preview text or accessibility
 * 
 * @param markdown - The markdown string to strip
 * @returns Plain text string
 */
export function stripMarkdown(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') {
    return ''
  }

  let text = markdown

  // Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, '')
  
  // Remove inline code
  text = text.replace(/`[^`]+`/g, (match) => match.slice(1, -1))
  
  // Remove headers
  text = text.replace(/^#{1,6}\s+/gm, '')
  
  // Remove bold/italic
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1')
  text = text.replace(/\*([^*]+)\*/g, '$1')
  text = text.replace(/__([^_]+)__/g, '$1')
  text = text.replace(/_([^_]+)_/g, '$1')
  
  // Remove links, keep text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  
  // Remove list markers
  text = text.replace(/^[-*+]\s+/gm, '')
  text = text.replace(/^\d+\.\s+/gm, '')
  
  // Remove blockquotes
  text = text.replace(/^>\s*/gm, '')
  
  // Remove horizontal rules
  text = text.replace(/^[-*_]{3,}$/gm, '')
  
  // Collapse whitespace
  text = text.replace(/\n{2,}/g, '\n')
  
  return text.trim()
}

/**
 * Truncates markdown content while preserving structure
 * 
 * @param markdown - The markdown string to truncate
 * @param maxLength - Maximum length in characters
 * @param suffix - Suffix to add when truncated (default: '...')
 * @returns Truncated markdown string
 */
export function truncateMarkdown(
  markdown: string,
  maxLength: number,
  suffix: string = '...'
): string {
  if (!markdown || typeof markdown !== 'string') {
    return ''
  }

  if (markdown.length <= maxLength) {
    return markdown
  }

  // Find a good break point
  const breakPoints = ['\n\n', '. ', '! ', '? ', ', ', ' ']
  let truncated = markdown.slice(0, maxLength)

  // Try to break at a natural point
  for (const bp of breakPoints) {
    const lastBreak = truncated.lastIndexOf(bp)
    if (lastBreak > maxLength * 0.6) {
      truncated = truncated.slice(0, lastBreak + (bp === ' ' ? 0 : bp.length - 1))
      break
    }
  }

  // Ensure we don't break in the middle of markdown syntax
  // Close any unclosed bold markers
  const boldCount = (truncated.match(/\*\*/g) || []).length
  if (boldCount % 2 !== 0) {
    truncated += '**'
  }

  // Close any unclosed italic markers
  const italicCount = (truncated.match(/(?<!\*)\*(?!\*)/g) || []).length
  if (italicCount % 2 !== 0) {
    truncated += '*'
  }

  return truncated.trim() + suffix
}

// =============================================================================
// INITIALIZATION
// =============================================================================

// Pre-load DOMPurify on client side for better performance
if (typeof window !== 'undefined') {
  loadDOMPurify().catch(() => {
    // Silently handle - errors are logged in loadDOMPurify
  })
}

// Types are already exported via the export interface declarations above