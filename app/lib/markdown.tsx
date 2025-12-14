import DOMPurify from 'dompurify'
import { marked } from 'marked'

// Configure marked for SELVE style
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: true, // Convert \n to <br>
})

export function sanitizeAndRenderMarkdown(markdown: string): string {
  // Convert markdown to HTML
  const rawHtml = marked(markdown) as string

  // Sanitize with DOMPurify
  const cleanHtml = DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'p',
      'br',
      'strong',
      'em',
      'code',
      'pre',
      'ul',
      'ol',
      'li',
      'blockquote',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'a',
      'hr',
      'span',
    ],
    ALLOWED_ATTR: ['href', 'class', 'id', 'target', 'rel'],
  })

  return cleanHtml
}

export function enhanceResponseFormatting(response: string): string {
  let enhanced = response

  // Add spacing after headers
  enhanced = enhanced.replace(/(^#{1,3}.+$)/gm, '$1\n')

  // Ensure double line breaks between sections
  enhanced = enhanced.replace(/\n{3,}/g, '\n\n')

  // Fix list formatting
  enhanced = enhanced.replace(/^([•·])/gm, '-')

  // Ensure space after list markers
  enhanced = enhanced.replace(/^(-|\d+\.)([^\s])/gm, '$1 $2')

  return enhanced.trim()
}

interface FormattingValidation {
  hasHeaders: boolean
  hasParagraphBreaks: boolean
  hasAppropriateLength: boolean
  hasStructure: boolean
  isReadable: boolean
}

export function validateResponseFormat(response: string): FormattingValidation {
  return {
    // Must have at least one header
    hasHeaders: /^#{1,3}\s+.+$/m.test(response),

    // Must have paragraph breaks (not wall of text)
    hasParagraphBreaks: response.split('\n\n').length > 1,

    // Not too short, not too long
    hasAppropriateLength: response.length > 50 && response.length < 4000,

    // Has lists or structure elements
    hasStructure:
      /^[-*+]\s/m.test(response) || /^\d+\.\s/m.test(response) || /\|.+\|/.test(response),

    // Readable (not just code or data)
    isReadable: !/^```[\s\S]+```$/.test(response.trim()),
  }
}

export function isResponseValid(response: string): boolean {
  const validation = validateResponseFormat(response)

  // Must pass at least 3/5 checks
  const passCount = Object.values(validation).filter(Boolean).length
  return passCount >= 3
}
