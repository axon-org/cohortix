'use client'

import Image from 'next/image'
import { useState } from 'react'
import { ChatMessage } from '@/store'
import { detectTextDirection } from '@/lib/chat-utils'

const AGENT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  coordinator: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' },
  aegis: { bg: 'bg-status-error-bg', text: 'text-status-error-fg', border: 'border-status-error-border' },
  research: { bg: 'bg-status-success-bg', text: 'text-status-success-fg', border: 'border-status-success-border' },
  design: { bg: 'bg-status-info-bg', text: 'text-status-info-fg', border: 'border-status-info-border' },
  quant: { bg: 'bg-status-warning-bg', text: 'text-status-warning-fg', border: 'border-status-warning-border' },
  ops: { bg: 'bg-status-warning-bg', text: 'text-status-warning-fg', border: 'border-status-warning-border' },
  reviewer: { bg: 'bg-status-info-bg', text: 'text-status-info-fg', border: 'border-status-info-border' },
  content: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' },
  seo: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' },
  security: { bg: 'bg-status-error-bg', text: 'text-status-error-fg', border: 'border-status-error-border' },
  ai: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' },
  'frontend-dev': { bg: 'bg-status-info-bg', text: 'text-status-info-fg', border: 'border-status-info-border' },
  'backend-dev': { bg: 'bg-status-success-bg', text: 'text-status-success-fg', border: 'border-status-success-border' },
  'solana-dev': { bg: 'bg-status-warning-bg', text: 'text-status-warning-fg', border: 'border-status-warning-border' },
  system: { bg: 'bg-muted/50', text: 'text-muted-foreground', border: 'border-border' },
  human: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' },
}

function getAgentTheme(name: string) {
  return AGENT_COLORS[name.toLowerCase()] || { bg: 'bg-muted/50', text: 'text-muted-foreground', border: 'border-border' }
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

// Simple markdown-lite: bold, italic, code, links
function renderContent(text: string) {
  // Split by code blocks first
  const parts = text.split(/(```[\s\S]*?```|`[^`]+`)/g)

  return parts.map((part, i) => {
    // Multi-line code block
    if (part.startsWith('```') && part.endsWith('```')) {
      const code = part.slice(3, -3).replace(/^\w+\n/, '') // strip language hint
      return (
        <pre key={i} className="bg-background/30 rounded-md px-3 py-2 my-1 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
          {code}
        </pre>
      )
    }
    // Inline code
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="bg-background/20 rounded px-1 py-0.5 text-xs font-mono">
          {part.slice(1, -1)}
        </code>
      )
    }
    // Regular text with bold/italic
    return (
      <span key={i}>
        {part.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((segment, j) => {
          if (segment.startsWith('**') && segment.endsWith('**')) {
            return <strong key={j} className="font-semibold">{segment.slice(2, -2)}</strong>
          }
          if (segment.startsWith('*') && segment.endsWith('*')) {
            return <em key={j}>{segment.slice(1, -1)}</em>
          }
          return segment
        })}
      </span>
    )
  })
}

interface MessageBubbleProps {
  message: ChatMessage
  isHuman: boolean
  isGrouped: boolean
}

function ToolCallBubble({ message }: { message: ChatMessage }) {
  const [expanded, setExpanded] = useState(false)
  const meta = asRecord(message.metadata)
  const toolName = typeof meta.toolName === 'string' ? meta.toolName : 'unknown_tool'
  const toolArgs = meta.toolArgs
  const toolOutput = meta.toolOutput
  const toolStatus = meta.toolStatus === 'running' || meta.toolStatus === 'success' || meta.toolStatus === 'error'
    ? meta.toolStatus
    : undefined
  const durationMs = typeof meta.durationMs === 'number' ? meta.durationMs : undefined
  const theme = getAgentTheme(message.from_agent)

  const statusIcon = toolStatus === 'running' ? '...' : toolStatus === 'error' ? 'x' : '>'
  const statusColor = toolStatus === 'running'
    ? 'text-status-warning-fg'
    : toolStatus === 'error'
    ? 'text-status-error-fg'
    : 'text-status-success-fg'

  return (
    <div className="flex gap-2 mt-2">
      <div className="w-7 flex-shrink-0" />
      <div className="max-w-[85%] min-w-0">
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-2 w-full text-left group"
        >
          <span className={`font-mono text-xs font-bold ${statusColor}`}>{statusIcon}</span>
          <span className="font-mono text-xs text-muted-foreground">
            <span className={`font-medium ${theme.text}`}>{message.from_agent}</span>
            {' called '}
            <span className="text-foreground font-semibold">{toolName}</span>
          </span>
          {toolStatus === 'running' && (
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-status-warning-solid animate-pulse" />
          )}
          {durationMs != null && toolStatus !== 'running' && (
            <span className="text-[10px] text-muted-foreground/50">{durationMs}ms</span>
          )}
          <svg
            className={`w-3 h-3 text-muted-foreground/40 transition-transform ${expanded ? 'rotate-90' : ''}`}
            viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          >
            <path d="M5 3l6 5-6 5" />
          </svg>
        </button>

        {expanded && (
          <div className="mt-1 ml-5 space-y-1">
            {toolArgs != null && (
              <div>
                <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-0.5">Args</div>
                <pre className="bg-background/20 rounded-md px-2 py-1.5 text-[11px] font-mono text-muted-foreground overflow-x-auto max-h-32 whitespace-pre-wrap">
                  {typeof toolArgs === 'string' ? toolArgs : JSON.stringify(toolArgs, null, 2)}
                </pre>
              </div>
            )}
            {toolOutput != null && (
              <div>
                <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-0.5">Output</div>
                <pre className={`rounded-md px-2 py-1.5 text-[11px] font-mono overflow-x-auto max-h-48 whitespace-pre-wrap ${
                  toolStatus === 'error' ? 'bg-status-error-bg text-status-error-fg' : 'bg-background/20 text-muted-foreground'
                }`}>
                  {typeof toolOutput === 'string' ? toolOutput : JSON.stringify(toolOutput, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function MessageBubble({ message, isHuman, isGrouped }: MessageBubbleProps) {
  const isSystem = message.message_type === 'system'
  const isHandoff = message.message_type === 'handoff'
  const isCommand = message.message_type === 'command'
  const isToolCall = message.message_type === 'tool_call'
  const theme = getAgentTheme(message.from_agent)

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <div className="text-[11px] text-muted-foreground/70 bg-surface-1 px-3 py-1 rounded-full border border-border/30">
          {message.content}
        </div>
      </div>
    )
  }

  if (isHandoff) {
    return (
      <div className="flex justify-center my-3">
        <div className="flex items-center gap-2 text-[11px] text-status-warning-fg/80 bg-status-warning-bg px-3 py-1.5 rounded-full border border-status-warning-border">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M5 3l6 5-6 5" />
          </svg>
          <span>{message.from_agent} handed off to {message.to_agent}</span>
        </div>
      </div>
    )
  }

  if (isToolCall) {
    return <ToolCallBubble message={message} />
  }

  return (
    <div className={`flex gap-2 ${isHuman ? 'flex-row-reverse' : 'flex-row'} ${isGrouped ? 'mt-0.5' : 'mt-3'}`}>
      {/* Avatar */}
      {!isGrouped ? (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold ${theme.bg} ${theme.text} border ${theme.border}`}>
          {message.from_agent.charAt(0).toUpperCase()}
        </div>
      ) : (
        <div className="w-8 flex-shrink-0" />
      )}

      {/* Content */}
      <div className={`max-w-[80%] min-w-0 ${isHuman ? 'items-end' : 'items-start'}`}>
        {/* Name + recipient */}
        {!isGrouped && (
          <div className={`flex items-center gap-1.5 mb-0.5 ${isHuman ? 'flex-row-reverse' : 'flex-row'}`}>
            <span className={`text-[11px] font-medium ${theme.text}`}>
              {message.from_agent}
            </span>
            {message.to_agent && (
              <span className="text-[10px] text-muted-foreground/50 flex items-center gap-0.5">
                <svg width="8" height="8" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M5 3l6 5-6 5" />
                </svg>
                {message.to_agent}
              </span>
            )}
            <span className="text-[10px] text-muted-foreground/40">
              {formatTime(message.created_at)}
            </span>
          </div>
        )}

        {/* Bubble */}
        <div className={`rounded-[var(--radius-xl)] px-[var(--space-4)] py-[var(--space-3)] text-[length:var(--text-base)] leading-relaxed ${
          isHuman
            ? 'bg-[hsl(var(--color-indigo-50))] text-[hsl(var(--text-primary))] rounded-tr-[var(--radius-xs)]'
            : isCommand
            ? `${theme.bg} border ${theme.border} font-mono text-xs rounded-tl-[var(--radius-xs)]`
            : `bg-[hsl(var(--bg-surface-raised))] text-[hsl(var(--text-primary))] border border-[hsl(var(--border-default))] shadow-[var(--shadow-sm)] ${isGrouped ? 'rounded-tl-[var(--radius-xs)]' : 'rounded-tl-[var(--radius-xs)]'}`
        }`}>
          {/* Attachment thumbnails */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {message.attachments.map((att, idx) => (
                att.type.startsWith('image/') ? (
                  <Image
                    key={idx}
                    src={att.dataUrl}
                    alt={att.name}
                    width={200}
                    height={160}
                    unoptimized
                    className="max-w-[200px] max-h-[160px] rounded-md object-cover border border-border/30"
                  />
                ) : (
                  <div key={idx} className="flex items-center gap-1.5 bg-background/20 rounded-md px-2 py-1 text-xs text-muted-foreground">
                    <span className="font-medium">{att.name}</span>
                    <span className="text-[10px] text-muted-foreground/50">{att.size < 1024 ? `${att.size} B` : att.size < 1024 * 1024 ? `${(att.size / 1024).toFixed(1)} KB` : `${(att.size / (1024 * 1024)).toFixed(1)} MB`}</span>
                  </div>
                )
              ))}
            </div>
          )}
          {isCommand ? (
            <pre className="whitespace-pre-wrap">{message.content}</pre>
          ) : (
            <div className="whitespace-pre-wrap break-words" dir={detectTextDirection(message.content)}>{renderContent(message.content)}</div>
          )}
        </div>
      </div>
    </div>
  )
}
