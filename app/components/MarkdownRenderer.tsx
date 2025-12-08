'use client'

import React from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const renderMarkdown = (text: string) => {
    // Parse code blocks first
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
    let match

    const parts: Array<{ type: 'text' | 'code'; content: string; language?: string }> = []
    let lastIndex = 0

    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.substring(lastIndex, match.index) })
      }
      parts.push({
        type: 'code',
        content: match[2],
        language: match[1] || 'typescript',
      })
      lastIndex = match.index + match[0].length
    }

    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.substring(lastIndex) })
    }

    return parts.map((part, idx) => {
      if (part.type === 'code') {
        return (
          <SyntaxHighlighter
            key={idx}
            language={part.language}
            style={oneDark}
            customStyle={{
              borderRadius: '8px',
              padding: '16px',
              fontSize: '14px',
              margin: '16px 0',
            }}
          >
            {part.content}
          </SyntaxHighlighter>
        )
      }

      // Process text content
      return (
        <div key={idx} dangerouslySetInnerHTML={{ __html: processTextMarkdown(part.content) }} />
      )
    })
  }

  const processTextMarkdown = (text: string): string => {
    let processed = text

    // Headers
    processed = processed.replace(
      /^### (.+)$/gm,
      '<h3 class="text-lg font-semibold mt-4 mb-2 text-white">$1</h3>'
    )
    processed = processed.replace(
      /^## (.+)$/gm,
      '<h2 class="text-xl font-semibold mt-5 mb-3 text-white">$1</h2>'
    )
    processed = processed.replace(
      /^# (.+)$/gm,
      '<h1 class="text-2xl font-bold mt-6 mb-4 text-white">$1</h1>'
    )

    // Blockquotes
    processed = processed.replace(
      /^> (.+)$/gm,
      '<blockquote class="border-l-4 border-purple-500 pl-4 py-2 my-4 italic text-zinc-300 bg-zinc-800/30 rounded-r">$1</blockquote>'
    )

    // Tables
    const tableRegex = /\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)+)/g
    processed = processed.replace(tableRegex, (match, header, rows) => {
      const headers = header
        .split('|')
        .filter((h: string) => h.trim())
        .map((h: string) => `<th class="px-4 py-2 text-left font-semibold border-b border-zinc-700">${h.trim()}</th>`)
        .join('')

      const rowsHtml = rows
        .trim()
        .split('\n')
        .map((row: string) => {
          const cells = row
            .split('|')
            .filter((c: string) => c.trim())
            .map((c: string) => `<td class="px-4 py-2 border-b border-zinc-800">${c.trim()}</td>`)
            .join('')
          return `<tr>${cells}</tr>`
        })
        .join('')

      return `<table class="w-full my-4 border-collapse bg-zinc-900/50 rounded-lg overflow-hidden"><thead><tr class="bg-zinc-800">${headers}</tr></thead><tbody>${rowsHtml}</tbody></table>`
    })

    // Unordered lists
    processed = processed.replace(/^- (.+)$/gm, '<li class="ml-4 my-1">$1</li>')
    processed = processed.replace(/(<li class="ml-4 my-1">.+<\/li>\n?)+/g, '<ul class="list-disc pl-4 my-3">$&</ul>')

    // Ordered lists
    processed = processed.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 my-1">$1</li>')
    processed = processed.replace(
      /(<li class="ml-4 my-1">.+<\/li>\n?)+/g,
      (match) => {
        if (!match.includes('list-disc')) {
          return `<ol class="list-decimal pl-4 my-3">${match}</ol>`
        }
        return match
      }
    )

    // Bold
    processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')

    // Italic
    processed = processed.replace(/\*(.+?)\*/g, '<em class="italic text-zinc-300">$1</em>')

    // Inline code
    processed = processed.replace(
      /`([^`]+)`/g,
      '<code class="bg-zinc-800 text-pink-400 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>'
    )

    // Links
    processed = processed.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-purple-400 hover:text-purple-300 underline">$1</a>'
    )

    // Horizontal rules
    processed = processed.replace(/^---$/gm, '<hr class="my-6 border-zinc-700" />')

    // Paragraphs
    processed = processed.replace(/^(?!<[hul>tb]|<\/[hul>tb])(.+)$/gm, '<p class="my-3 leading-relaxed">$1</p>')

    return processed
  }

  return (
    <div className={`selve-markdown prose prose-invert max-w-none ${className}`}>
      {renderMarkdown(content)}
    </div>
  )
}
