'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useMissionControl } from '@/store'
import { useNavigateToPanel } from '@/lib/navigation'
import { createClientLogger } from '@/lib/client-logger'
import { Button } from '@/components/ui/button'

const log = createClientLogger('Sidebar')

type SystemStats = {
  memory?: {
    used: number
    total: number
  }
  disk?: {
    usage?: string
  }
  processes?: unknown[]
}

function readSystemStats(value: unknown): SystemStats | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const memory = record.memory && typeof record.memory === 'object' ? record.memory as Record<string, unknown> : null
  const disk = record.disk && typeof record.disk === 'object' ? record.disk as Record<string, unknown> : null

  return {
    memory: memory && typeof memory.used === 'number' && typeof memory.total === 'number'
      ? { used: memory.used, total: memory.total }
      : undefined,
    disk: disk
      ? { usage: typeof disk.usage === 'string' ? disk.usage : undefined }
      : undefined,
    processes: Array.isArray(record.processes) ? record.processes : undefined,
  }
}

interface MenuItem {
  id: string
  label: string
  icon: string
  description?: string
}

const menuItems: MenuItem[] = [
  { id: 'overview', label: 'Overview', icon: '📊', description: 'System dashboard' },
  { id: 'chat', label: 'Chat', icon: '💬', description: 'Agent chat sessions' },
  { id: 'tasks', label: 'Task Board', icon: '📋', description: 'Kanban task management' },
  { id: 'agents', label: 'Agent Squad', icon: '🤖', description: 'Agent management & status' },
  { id: 'activity', label: 'Activity Feed', icon: '📣', description: 'Real-time activity stream' },
  { id: 'notifications', label: 'Notifications', icon: '🔔', description: 'Mentions & alerts' },
  { id: 'standup', label: 'Daily Standup', icon: '📈', description: 'Generate standup reports' },
  { id: 'spawn', label: 'Spawn Agent', icon: '🚀', description: 'Launch new sub-agents' },
  { id: 'logs', label: 'Logs', icon: '📝', description: 'Real-time log viewer' },
  { id: 'cron', label: 'Cron Jobs', icon: '⏰', description: 'Automated tasks' },
  { id: 'memory', label: 'Memory', icon: '🧠', description: 'Knowledge browser' },
  { id: 'tokens', label: 'Tokens', icon: '💰', description: 'Usage & cost tracking' },
  { id: 'channels', label: 'Channels', icon: '📡', description: 'Messaging platform status' },
  { id: 'nodes', label: 'Nodes', icon: '🖥', description: 'Connected instances' },
  { id: 'exec-approvals', label: 'Approvals', icon: '✅', description: 'Exec approval queue' },
  { id: 'debug', label: 'Debug', icon: '🐛', description: 'System diagnostics' },
]

export function Sidebar() {
  const { activeTab, connection, sessions } = useMissionControl()
  const navigateToPanel = useNavigateToPanel()
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/status?action=overview')
      .then(res => res.json())
      .then(data => { if (!cancelled) setSystemStats(readSystemStats(data)) })
      .catch(err => log.error('Failed to fetch system status:', err))
    return () => { cancelled = true }
  }, [])

  const activeSessions = sessions.filter(s => s.active).length
  const totalSessions = sessions.length

  return (
    <aside className="w-[210px] flex flex-col h-full bg-[hsl(var(--bg-inverse))]">
      {/* Logo/Brand */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-[var(--card-radius)] overflow-hidden bg-[hsl(var(--interactive-primary))]/20 flex items-center justify-center">
            <Image
              src="/brand/mc-logo-128.png"
              alt="Cohortix logo"
              width={32}
              height={32}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h2 className="font-bold text-white text-[15px]">Cohortix</h2>
            <p className="text-[11px] text-[hsl(var(--text-muted))]">ClawdBot Orchestration</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-0.5">
          {menuItems.map((item) => (
            <li key={item.id}>
              <Button
                variant="ghost"
                onClick={() => navigateToPanel(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 h-auto rounded-[var(--radius-md)] text-left justify-start group transition-colors ${
                  activeTab === item.id
                    ? 'bg-[hsl(var(--interactive-primary))] text-white shadow-sm'
                    : 'text-[hsl(var(--text-muted))] hover:text-white hover:bg-white/5'
                }`}
                title={item.description}
              >
                <span className="text-base">{item.icon}</span>
                <span className="font-medium text-sm">{item.label}</span>
              </Button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Status Footer */}
      <div className="p-3 border-t border-white/10 space-y-2">
        {/* Connection Status */}
        <div className="bg-white/5 rounded-[var(--radius-md)] p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white/80">Gateway</span>
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${
                connection.isConnected
                  ? 'bg-[hsl(var(--status-success-solid))] animate-pulse'
                  : 'bg-[hsl(var(--status-error-solid))]'
              }`}></div>
              <span className="text-[11px] text-[hsl(var(--text-muted))]">
                {connection.isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <div className="text-[11px] text-[hsl(var(--text-muted)/0.7)] truncate">
              {connection.url || 'ws://<gateway-host>:<gateway-port>'}
            </div>
            {connection.latency && (
              <div className="text-[11px] text-[hsl(var(--text-muted)/0.7)]">
                Latency: {connection.latency}ms
              </div>
            )}
          </div>
        </div>

        {/* Session Stats */}
        <div className="bg-white/5 rounded-[var(--radius-md)] p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white/80">Sessions</span>
            <span className="text-[11px] text-[hsl(var(--text-muted))]">
              {activeSessions}/{totalSessions}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-[hsl(var(--text-muted)/0.7)]">
            {activeSessions} active • {totalSessions - activeSessions} idle
          </div>
        </div>

        {/* System Stats */}
        {systemStats && (
          <div className="bg-white/5 rounded-[var(--radius-md)] p-3">
            <div className="text-sm font-medium text-white/80 mb-2">System</div>
            <div className="space-y-1 text-[11px] text-[hsl(var(--text-muted))]">
              <div className="flex justify-between">
                <span>Memory:</span>
                <span>{systemStats.memory ? Math.round((systemStats.memory.used / systemStats.memory.total) * 100) : 0}%</span>
              </div>
              <div className="flex justify-between">
                <span>Disk:</span>
                <span>{systemStats.disk?.usage || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Processes:</span>
                <span>{systemStats.processes?.length || 0}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
