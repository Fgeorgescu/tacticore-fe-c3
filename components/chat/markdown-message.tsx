"use client"
import type React from "react"

interface MarkdownMessageProps {
  content: string
}

export function MarkdownMessage({ content }: MarkdownMessageProps) {
  const processInlineMarkdown = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = []
    let currentText = text
    let key = 0

    while (currentText.length > 0) {
      // Bold **text**
      const boldMatch = currentText.match(/\*\*(.+?)\*\*/)
      if (boldMatch && boldMatch.index !== undefined) {
        if (boldMatch.index > 0) {
          parts.push(currentText.slice(0, boldMatch.index))
        }
        parts.push(
          <strong key={`bold-${key++}`} className="font-bold">
            {boldMatch[1]}
          </strong>,
        )
        currentText = currentText.slice(boldMatch.index + boldMatch[0].length)
        continue
      }

      // Italic *text*
      const italicMatch = currentText.match(/\*(.+?)\*/)
      if (italicMatch && italicMatch.index !== undefined) {
        if (italicMatch.index > 0) {
          parts.push(currentText.slice(0, italicMatch.index))
        }
        parts.push(
          <em key={`italic-${key++}`} className="italic">
            {italicMatch[1]}
          </em>,
        )
        currentText = currentText.slice(italicMatch.index + italicMatch[0].length)
        continue
      }

      // No more markdown found
      parts.push(currentText)
      break
    }

    return parts
  }

  const renderMarkdown = (text: string) => {
    const lines = text.split("\n")
    const elements: React.ReactNode[] = []
    let listItems: string[] = []
    let inList = false

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 my-2 ml-2">
            {listItems.map((item, idx) => (
              <li key={idx} className="text-sm">
                {processInlineMarkdown(item)}
              </li>
            ))}
          </ul>,
        )
        listItems = []
        inList = false
      }
    }

    lines.forEach((line, idx) => {
      // Headers
      if (line.startsWith("### ")) {
        flushList()
        elements.push(
          <h3 key={idx} className="text-base font-bold mt-3 mb-2">
            {processInlineMarkdown(line.slice(4))}
          </h3>,
        )
      } else if (line.startsWith("## ")) {
        flushList()
        elements.push(
          <h2 key={idx} className="text-lg font-bold mt-4 mb-2">
            {processInlineMarkdown(line.slice(3))}
          </h2>,
        )
      } else if (line.startsWith("# ")) {
        flushList()
        elements.push(
          <h1 key={idx} className="text-xl font-bold mt-4 mb-2">
            {processInlineMarkdown(line.slice(2))}
          </h1>,
        )
      }
      // List items
      else if (line.match(/^[-*]\s/)) {
        inList = true
        listItems.push(line.slice(2))
      }
      // Numbered lists
      else if (line.match(/^\d+\.\s/)) {
        flushList()
        const content = line.replace(/^\d+\.\s/, "")
        elements.push(
          <div key={idx} className="flex gap-2 my-1">
            <span className="font-semibold">{line.match(/^\d+/)?.[0]}.</span>
            <span>{processInlineMarkdown(content)}</span>
          </div>,
        )
      }
      // Empty lines
      else if (line.trim() === "") {
        flushList()
        elements.push(<div key={idx} className="h-2" />)
      }
      // Regular paragraphs
      else {
        flushList()
        elements.push(
          <p key={idx} className="text-sm my-1">
            {processInlineMarkdown(line)}
          </p>,
        )
      }
    })

    flushList()
    return elements
  }

  return <div className="markdown-content">{renderMarkdown(content)}</div>
}
