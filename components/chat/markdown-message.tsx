"use client"
import type React from "react"

interface MarkdownMessageProps {
  content: string
}

export function MarkdownMessage({ content }: MarkdownMessageProps) {
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
                {item}
              </li>
            ))}
          </ul>,
        )
        listItems = []
        inList = false
      }
    }

    lines.forEach((line, idx) => {
      // Bold text **text**
      line = line.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>')

      // Italic text *text*
      line = line.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')

      // Headers
      if (line.startsWith("### ")) {
        flushList()
        elements.push(
          <h3
            key={idx}
            className="text-base font-bold mt-3 mb-2"
            dangerouslySetInnerHTML={{ __html: line.slice(4) }}
          />,
        )
      } else if (line.startsWith("## ")) {
        flushList()
        elements.push(
          <h2 key={idx} className="text-lg font-bold mt-4 mb-2" dangerouslySetInnerHTML={{ __html: line.slice(3) }} />,
        )
      } else if (line.startsWith("# ")) {
        flushList()
        elements.push(
          <h1 key={idx} className="text-xl font-bold mt-4 mb-2" dangerouslySetInnerHTML={{ __html: line.slice(2) }} />,
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
            <span dangerouslySetInnerHTML={{ __html: content }} />
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
        elements.push(<p key={idx} className="text-sm my-1" dangerouslySetInnerHTML={{ __html: line }} />)
      }
    })

    flushList()
    return elements
  }

  return <div className="markdown-content">{renderMarkdown(content)}</div>
}
