'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useMissionControl, ChatMessage } from '@/store'
import { MessageBubble } from './message-bubble'
import { Button } from '@/components/ui/button'

function formatDateGroup(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

function groupMessagesByDate(messages: ChatMessage[]): Array<{ date: string; messages: ChatMessage[] }> {
  const groups: Array<{ date: string; messages: ChatMessage[] }> = []
  let currentDate = ''

  for (const msg of messages) {
    const dateStr = formatDateGroup(msg.created_at)
    if (dateStr !== currentDate) {
      currentDate = dateStr
      groups.push({ date: dateStr, messages: [] })
    }
    groups[groups.length - 1].messages.push(msg)
  }

  return groups
}

// Check if message should be visually grouped with previous
function isGroupedWithPrevious(messages: ChatMessage[], index: number): boolean {
  if (index === 0) return false
  const prev = messages[index - 1]
  const curr = messages[index]
  // Same sender, within 2 minutes, not a system message
  return (
    prev.from_agent === curr.from_agent &&
    curr.created_at - prev.created_at < 120 &&
    prev.message_type !== 'system' &&
    curr.message_type !== 'system'
  )
}

export function MessageList() {
  const { chatMessages, activeConversation, isSendingMessage, updatePendingMessage, removePendingMessage, addChatMessage } = useMissionControl()
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [showNewMessages, setShowNewMessages] = useState(false)
  const prevMessageCountRef = useRef(0)

  const isNearBottom = useCallback(() => {
    const container = containerRef.current
    if (!container) return true
    return container.scrollHeight - container.scrollTop - container.clientHeight < 120
  }, [])

  // Auto-scroll to bottom on new messages (only if near bottom)
  useEffect(() => {
    const conversationMessages = chatMessages.filter(m => m.conversation_id === activeConversation)
    const newCount = conversationMessages.length

    if (newCount > prevMessageCountRef.current) {
      if (isNearBottom()) {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      } else {
        setShowNewMessages(true)
      }
    }
    prevMessageCountRef.current = newCount
  }, [chatMessages, activeConversation, isNearBottom])

  // Scroll to bottom on conversation change
  useEffect(() => {
    bottomRef.current?.scrollIntoView()
    setShowNewMessages(false)
    prevMessageCountRef.current = 0
  }, [activeConversation])

  // Track scroll position to hide "new messages" indicator
  const handleScroll = useCallback(() => {
    if (isNearBottom()) {
      setShowNewMessages(false)
    }
  }, [isNearBottom])

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    setShowNewMessages(false)
  }, [])

  // Retry a failed message
  const handleRetry = async (msg: ChatMessage) => {
    updatePendingMessage(msg.id, { pendingStatus: 'sending' })

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: msg.from_agent,
          to: msg.to_agent,
          content: msg.content,
          conversation_id: msg.conversation_id,
          message_type: msg.message_type,
          forward: true,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.message) {
          // Remove temp message and add real one
          removePendingMessage(msg.id)
          addChatMessage(data.message)
        }
      } else {
        updatePendingMessage(msg.id, { pendingStatus: 'failed' })
      }
    } catch {
      updatePendingMessage(msg.id, { pendingStatus: 'failed' })
    }
  }

  if (!activeConversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center px-6">
          <div className="w-14 h-14 rounded-2xl bg-[#EDE9FD] flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#6C5CE7]">
              <path d="M14 10c0 .37-.1.7-.28 1-.53.87-2.2 3-5.72 3-4.42 0-6-3-6-4V4a2 2 0 012-2h8a2 2 0 012 2v6z" />
              <path d="M6 7h.01M10 7h.01" />
            </svg>
          </div>
          <p className="text-[15px] font-semibold text-[#1A1A2E]">Select a conversation</p>
          <p className="text-[13px] text-[#888899] mt-1">or start a new one with an agent</p>
        </div>
      </div>
    )
  }

  const conversationMessages = chatMessages.filter(
    m => m.conversation_id === activeConversation
  )

  if (conversationMessages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center px-6">
          <div className="w-14 h-14 rounded-2xl bg-[#EDE9FD] flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#6C5CE7]">
              <path d="M12 3H4a1 1 0 00-1 1v6l3-2h6a1 1 0 001-1V4a1 1 0 00-1-1z" />
              <path d="M7 11v1a1 1 0 001 1h5l2 2v-6a1 1 0 00-1-1h-1" />
            </svg>
          </div>
          <p className="text-[15px] font-semibold text-[#1A1A2E]">No messages yet</p>
          <p className="text-[13px] text-[#888899] mt-1">Send a message to get started</p>
        </div>
      </div>
    )
  }

  const groups = groupMessagesByDate(conversationMessages)

  return (
    <div ref={containerRef} className="relative flex-1 overflow-y-auto px-[var(--space-5)] py-[var(--space-4)]" onScroll={handleScroll}>
      {groups.map((group) => (
        <div key={group.date}>
          {/* Date separator */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#E8E8EC]" />
            <span className="text-[11px] text-[#888899] font-medium uppercase tracking-wider px-2">{group.date}</span>
            <div className="flex-1 h-px bg-[#E8E8EC]" />
          </div>

          {group.messages.map((msg, idx) => (
            <div key={msg.id} className={msg.pendingStatus === 'sending' ? 'opacity-60' : ''}>
              {/* Failed message wrapper */}
              {msg.pendingStatus === 'failed' && (
                <div className="border border-status-error-border rounded-lg p-0.5 mb-1">
                  <MessageBubble
                    message={msg}
                    isHuman={msg.from_agent === 'human'}
                    isGrouped={isGroupedWithPrevious(group.messages, idx)}
                  />
                  <div className="flex items-center gap-2 px-3 pb-2">
                    <span className="text-[10px] text-status-error-fg">Failed to send</span>
                    <Button
                      onClick={() => handleRetry(msg)}
                      variant="link"
                      className="text-[10px] text-primary h-auto p-0"
                    >
                      Retry
                    </Button>
                    <Button
                      onClick={() => removePendingMessage(msg.id)}
                      variant="ghost"
                      className="text-[10px] text-muted-foreground h-auto p-0"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              )}

              {/* Normal or sending message */}
              {msg.pendingStatus !== 'failed' && (
                <MessageBubble
                  message={msg}
                  isHuman={msg.from_agent === 'human'}
                  isGrouped={isGroupedWithPrevious(group.messages, idx)}
                />
              )}
            </div>
          ))}
        </div>
      ))}

      {/* Typing indicator */}
      {isSendingMessage && (
        <div className="flex gap-2.5 mt-4">
          <div className="w-8 h-8 rounded-full bg-[#6C5CE7]/15 flex items-center justify-center flex-shrink-0">
            <div className="flex gap-0.5">
              <div className="w-1 h-1 rounded-full bg-[#6C5CE7]/50 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1 h-1 rounded-full bg-[#6C5CE7]/50 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1 h-1 rounded-full bg-[#6C5CE7]/50 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
          <div className="bg-white border border-[#E8E8EC] rounded-2xl rounded-tl-[4px] px-4 py-3 shadow-[0px_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#888899]/40 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-[#888899]/40 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-[#888899]/40 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />

      {/* New messages indicator */}
      {showNewMessages && (
        <button
          onClick={scrollToBottom}
          className="sticky bottom-[var(--space-3)] left-1/2 -translate-x-1/2 z-10 bg-primary text-primary-foreground px-[var(--space-4)] py-[var(--space-1-5)] rounded-full text-[length:var(--text-sm)] font-[var(--font-medium)] shadow-[var(--shadow-lg)] hover:bg-[hsl(var(--interactive-primary-hover))] transition-colors flex items-center gap-[var(--space-1-5)]"
        >
          New messages
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3v10M4 9l4 4 4-4" />
          </svg>
        </button>
      )}
    </div>
  )
}
