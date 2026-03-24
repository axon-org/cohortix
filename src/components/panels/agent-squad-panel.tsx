'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/ui/loader'
import { AgentAvatar } from '@/components/ui/agent-avatar'
import { createClientLogger } from '@/lib/client-logger'

const log = createClientLogger('AgentSquadPanel')

interface Agent {
  id: number
  name: string
  role: string
  session_key?: string
  soul_content?: string
  status: 'offline' | 'idle' | 'busy' | 'error'
  last_seen?: number
  last_activity?: string
  created_at: number
  updated_at: number
  config?: any
  taskStats?: {
    total: number
    assigned: number
    in_progress: number
    completed: number
  }
}

const statusDotClasses: Record<string, string> = {
  offline: 'bg-muted-foreground/40',
  idle: 'bg-status-success-solid',
  busy: 'bg-status-warning-solid',
  error: 'bg-status-error-solid',
}

const statusBadgeClasses: Record<string, string> = {
  offline: 'bg-muted text-muted-foreground border-border',
  idle: 'bg-status-success-bg text-status-success-fg border-status-success-border',
  busy: 'bg-status-warning-bg text-status-warning-fg border-status-warning-border',
  error: 'bg-status-error-bg text-status-error-fg border-status-error-border',
}

export function AgentSquadPanel() {
  const t = useTranslations('agentSquad')
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Fetch agents
  const fetchAgents = useCallback(async () => {
    try {
      setError(null)
      if (agents.length === 0) setLoading(true)

      const response = await fetch('/api/agents')
      if (!response.ok) throw new Error(t('failedToFetch'))

      const data = await response.json()
      setAgents(data.agents || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorOccurred'))
    } finally {
      setLoading(false)
    }
  }, [agents.length])

  // Initial load
  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchAgents, 10000) // Every 10 seconds
    return () => clearInterval(interval)
  }, [autoRefresh, fetchAgents])

  // Update agent status
  const updateAgentStatus = async (agentName: string, status: Agent['status'], activity?: string) => {
    try {
      const response = await fetch('/api/agents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: agentName,
          status,
          last_activity: activity || `Status changed to ${status}`
        })
      })

      if (!response.ok) throw new Error(t('failedToUpdateStatus'))

      // Update local state
      setAgents(prev => prev.map(agent =>
        agent.name === agentName
          ? {
              ...agent,
              status,
              last_activity: activity || `Status changed to ${status}`,
              last_seen: Math.floor(Date.now() / 1000),
              updated_at: Math.floor(Date.now() / 1000)
            }
          : agent
      ))
    } catch (error) {
      log.error('Failed to update agent status:', error)
      setError(t('failedToUpdateStatus'))
    }
  }

  // Format last seen time
  const formatLastSeen = (timestamp?: number) => {
    if (!timestamp) return t('never')

    const now = Date.now()
    const diffMs = now - (timestamp * 1000)
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMinutes < 1) return t('justNow')
    if (diffMinutes < 60) return t('minutesAgo', { count: diffMinutes })
    if (diffHours < 24) return t('hoursAgo', { count: diffHours })
    if (diffDays < 7) return t('daysAgo', { count: diffDays })

    return new Date(timestamp * 1000).toLocaleDateString()
  }

  // Get model name from config
  const getModelName = (config: any): string | null => {
    const raw = config?.model?.primary
    const primary = typeof raw === 'string' ? raw : raw?.primary
    if (!primary || typeof primary !== 'string') return null
    const parts = primary.split('/')
    return parts[parts.length - 1]
  }

  // Get status distribution for summary
  const statusCounts = agents.reduce((acc, agent) => {
    acc[agent.status] = (acc[agent.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  if (loading && agents.length === 0) {
    return <Loader variant="panel" label={t('loadingAgents')} />
  }

  return (
    <div className="h-full flex flex-col bg-[hsl(var(--bg-canvas))]">
      {/* Header */}
      <div className="flex justify-between items-center p-[var(--space-5)] border-b border-[hsl(var(--border-default))]">
        <div className="flex items-center gap-[var(--space-4)]">
          <h2 className="text-[var(--text-2xl)] font-bold text-[hsl(var(--text-primary))]">{t('title')}</h2>

          {/* Status Summary */}
          <div className="flex gap-[var(--space-2)] text-[var(--text-sm)]">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center gap-[var(--space-1)]">
                <div className={`w-2 h-2 rounded-full ${statusDotClasses[status]}`}></div>
                <span className="text-muted-foreground">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-[var(--space-2)]">
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? 'success' : 'secondary'}
            size="sm"
          >
            {autoRefresh ? t('live') : t('manual')}
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
          >
            {t('addAgent')}
          </Button>
          <Button
            onClick={fetchAgents}
            variant="secondary"
          >
            {t('refresh')}
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-status-error-bg border border-status-error-border text-status-error-fg p-[var(--space-3)] m-[var(--space-4)] rounded-[var(--radius-lg)]">
          {error}
          <Button
            onClick={() => setError(null)}
            variant="ghost"
            size="icon-sm"
            className="float-right text-status-error-fg hover:text-status-error-fg"
          >
            ×
          </Button>
        </div>
      )}

      {/* Agent Grid */}
      <div className="flex-1 p-[var(--space-5)] overflow-y-auto">
        {agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-[var(--space-12)] text-muted-foreground">
            <div className="w-12 h-12 rounded-full bg-[hsl(var(--bg-subtle))] flex items-center justify-center mb-[var(--space-3)]">
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="8" cy="5" r="3" />
                <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" />
              </svg>
            </div>
            <p className="text-[var(--text-base)] font-medium">{t('noAgents')}</p>
            <p className="text-[var(--text-sm)] text-muted-foreground/70 mt-[var(--space-1)]">{t('addFirstAgent')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[var(--space-4)]">
            {agents.map(agent => {
              const modelName = getModelName(agent.config)

              return (
                <div
                  key={agent.id}
                  className="group relative overflow-hidden rounded-[var(--card-radius)] border border-[hsl(var(--card-border))] bg-[hsl(var(--card-bg))] p-[var(--space-5)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--card-shadow-hover)] cursor-pointer"
                  style={{ boxShadow: 'var(--card-shadow)' }}
                  onClick={() => setSelectedAgent(agent)}
                >
                  {/* Accent left edge */}
                  <div className={`absolute inset-y-0 left-0 w-1 ${statusDotClasses[agent.status]}`} />

                  {/* Header: avatar + name + status */}
                  <div className="flex items-start gap-[var(--space-3)] mb-[var(--space-3)]">
                    <AgentAvatar name={agent.name} size="lg" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[var(--text-md)] text-[hsl(var(--text-primary))] truncate">{agent.name}</h3>
                      <p className="text-[var(--text-sm)] text-[hsl(var(--text-muted))] truncate">
                        {agent.role}
                        {modelName && <> · <span className="font-mono text-[var(--text-xs)]">{modelName}</span></>}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[var(--text-xs)] capitalize shrink-0 ${statusBadgeClasses[agent.status]}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${statusDotClasses[agent.status]}`} />
                      {agent.status}
                    </span>
                  </div>

                  {/* Session Info */}
                  {agent.session_key && (
                    <div className="text-[var(--text-xs)] text-[hsl(var(--text-muted))] mb-[var(--space-2)]">
                      <span className="font-medium">{t('session')}:</span> {agent.session_key}
                    </div>
                  )}

                  {/* Task Stats */}
                  {agent.taskStats && (
                    <div className="flex gap-[var(--space-4)] mb-[var(--space-3)] py-[var(--space-2)] px-[var(--space-3)] bg-[hsl(var(--bg-subtle))] rounded-[var(--radius-md)]">
                      <div className="text-center">
                        <div className="text-[var(--text-md)] font-semibold text-[hsl(var(--text-primary))]">{agent.taskStats.total}</div>
                        <div className="text-[10px] text-[hsl(var(--text-muted))] uppercase tracking-wide">{t('totalTasks')}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[var(--text-md)] font-semibold text-status-warning-fg">{agent.taskStats.in_progress}</div>
                        <div className="text-[10px] text-[hsl(var(--text-muted))] uppercase tracking-wide">{t('inProgress')}</div>
                      </div>
                    </div>
                  )}

                  {/* Last Activity + Actions */}
                  <div className="flex items-center justify-between pt-[var(--space-2)] border-t border-[hsl(var(--border-subtle))]">
                    <div className="text-[var(--text-xs)] text-[hsl(var(--text-muted))]">
                      {formatLastSeen(agent.last_seen)}
                    </div>
                    <div className="flex gap-[var(--space-1)]">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          updateAgentStatus(agent.name, 'idle', 'Manually activated')
                        }}
                        disabled={agent.status === 'idle'}
                        variant="ghost"
                        size="xs"
                        className="h-6 px-2 text-[var(--text-xs)]"
                      >
                        {t('wake')}
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          updateAgentStatus(agent.name, 'busy', 'Manually set to busy')
                        }}
                        disabled={agent.status === 'busy'}
                        size="xs"
                        variant="ghost"
                        className="h-6 px-2 text-[var(--text-xs)]"
                      >
                        {t('busy')}
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          updateAgentStatus(agent.name, 'offline', 'Manually set offline')
                        }}
                        disabled={agent.status === 'offline'}
                        variant="ghost"
                        size="xs"
                        className="h-6 px-2 text-[var(--text-xs)]"
                      >
                        {t('sleep')}
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <AgentDetailModal
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
          onUpdate={fetchAgents}
          onStatusUpdate={updateAgentStatus}
        />
      )}

      {/* Create Agent Modal */}
      {showCreateModal && (
        <CreateAgentModal
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchAgents}
        />
      )}
    </div>
  )
}

// Agent Detail Modal
function AgentDetailModal({
  agent,
  onClose,
  onUpdate,
  onStatusUpdate
}: {
  agent: Agent
  onClose: () => void
  onUpdate: () => void
  onStatusUpdate: (name: string, status: Agent['status'], activity?: string) => Promise<void>
}) {
  const t = useTranslations('agentSquad')
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    role: agent.role,
    session_key: agent.session_key || '',
    soul_content: agent.soul_content || '',
  })

  const handleSave = async () => {
    try {
      const response = await fetch('/api/agents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: agent.name,
          ...formData
        })
      })

      if (!response.ok) throw new Error(t('failedToUpdate'))

      setEditing(false)
      onUpdate()
    } catch (error) {
      log.error('Failed to update agent:', error)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-[var(--space-4)]"
      onClick={onClose}
    >
      <div
        className="bg-[hsl(var(--card-bg))] border border-[hsl(var(--border-default))] rounded-[var(--card-radius)] shadow-[var(--shadow-xl)] max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-[var(--space-6)]">
          {/* Header */}
          <div className="flex justify-between items-start mb-[var(--space-5)]">
            <div className="flex items-center gap-[var(--space-3)]">
              <AgentAvatar name={agent.name} size="lg" />
              <div>
                <h3 className="text-[var(--text-xl)] font-bold text-[hsl(var(--text-primary))]">{agent.name}</h3>
                <p className="text-[var(--text-sm)] text-[hsl(var(--text-muted))]">{agent.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-[var(--space-3)]">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[var(--text-xs)] capitalize ${
                statusBadgeClasses[agent.status]
              }`}>
                <span className={`h-2 w-2 rounded-full ${statusDotClasses[agent.status]}`} />
                {agent.status}
              </span>
              <Button onClick={onClose} variant="ghost" size="icon-sm">
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </Button>
            </div>
          </div>

          {/* Status Controls */}
          <div className="mb-[var(--space-5)] p-[var(--space-4)] bg-[hsl(var(--bg-subtle))] rounded-[var(--radius-lg)]">
            <h4 className="text-[var(--text-sm)] font-medium text-[hsl(var(--text-primary))] mb-[var(--space-2)]">{t('statusControl')}</h4>
            <div className="flex gap-[var(--space-2)]">
              {(['idle', 'busy', 'offline'] as const).map(status => (
                <Button
                  key={status}
                  onClick={() => onStatusUpdate(agent.name, status)}
                  variant={agent.status === status ? 'default' : 'secondary'}
                  size="sm"
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>

          {/* Agent Details */}
          <div className="space-y-[var(--space-4)]">
            <div>
              <label className="block text-[var(--text-sm)] font-medium text-[hsl(var(--text-muted))] mb-[var(--space-1)]">{t('role')}</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full bg-[hsl(var(--input-bg))] text-[hsl(var(--input-text))] border border-[hsl(var(--input-border))] rounded-[var(--input-radius)] px-[var(--space-3)] py-[var(--space-2)] text-[var(--input-font-size)] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--border-focus))]"
                />
              ) : (
                <p className="text-[hsl(var(--text-primary))]">{agent.role}</p>
              )}
            </div>

            <div>
              <label className="block text-[var(--text-sm)] font-medium text-[hsl(var(--text-muted))] mb-[var(--space-1)]">{t('sessionKey')}</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.session_key}
                  onChange={(e) => setFormData(prev => ({ ...prev, session_key: e.target.value }))}
                  className="w-full bg-[hsl(var(--input-bg))] text-[hsl(var(--input-text))] border border-[hsl(var(--input-border))] rounded-[var(--input-radius)] px-[var(--space-3)] py-[var(--space-2)] text-[var(--input-font-size)] font-mono focus:outline-none focus:ring-2 focus:ring-[hsl(var(--border-focus))]"
                />
              ) : (
                <p className="text-[hsl(var(--text-primary))] font-mono text-[var(--text-sm)]">{agent.session_key || t('notSet')}</p>
              )}
            </div>

            <div>
              <label className="block text-[var(--text-sm)] font-medium text-[hsl(var(--text-muted))] mb-[var(--space-1)]">{t('soulContent')}</label>
              {editing ? (
                <textarea
                  value={formData.soul_content}
                  onChange={(e) => setFormData(prev => ({ ...prev, soul_content: e.target.value }))}
                  rows={4}
                  className="w-full bg-[hsl(var(--input-bg))] text-[hsl(var(--input-text))] border border-[hsl(var(--input-border))] rounded-[var(--input-radius)] px-[var(--space-3)] py-[var(--space-2)] text-[var(--input-font-size)] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--border-focus))]"
                  placeholder={t('soulPlaceholder')}
                />
              ) : (
                <p className="text-[hsl(var(--text-primary))] whitespace-pre-wrap">{agent.soul_content || t('notSet')}</p>
              )}
            </div>

            {/* Task Statistics */}
            {agent.taskStats && (
              <div>
                <label className="block text-[var(--text-sm)] font-medium text-[hsl(var(--text-muted))] mb-[var(--space-2)]">{t('taskStatistics')}</label>
                <div className="grid grid-cols-4 gap-[var(--space-2)]">
                  <div className="bg-[hsl(var(--bg-subtle))] rounded-[var(--radius-md)] p-[var(--space-3)] text-center">
                    <div className="text-[var(--text-lg)] font-semibold text-[hsl(var(--text-primary))]">{agent.taskStats.total}</div>
                    <div className="text-[var(--text-xs)] text-[hsl(var(--text-muted))]">{t('total')}</div>
                  </div>
                  <div className="bg-[hsl(var(--bg-subtle))] rounded-[var(--radius-md)] p-[var(--space-3)] text-center">
                    <div className="text-[var(--text-lg)] font-semibold text-status-info-fg">{agent.taskStats.assigned}</div>
                    <div className="text-[var(--text-xs)] text-[hsl(var(--text-muted))]">{t('assigned')}</div>
                  </div>
                  <div className="bg-[hsl(var(--bg-subtle))] rounded-[var(--radius-md)] p-[var(--space-3)] text-center">
                    <div className="text-[var(--text-lg)] font-semibold text-status-warning-fg">{agent.taskStats.in_progress}</div>
                    <div className="text-[var(--text-xs)] text-[hsl(var(--text-muted))]">{t('inProgress')}</div>
                  </div>
                  <div className="bg-[hsl(var(--bg-subtle))] rounded-[var(--radius-md)] p-[var(--space-3)] text-center">
                    <div className="text-[var(--text-lg)] font-semibold text-status-success-fg">{agent.taskStats.completed}</div>
                    <div className="text-[var(--text-xs)] text-[hsl(var(--text-muted))]">{t('done')}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="grid grid-cols-2 gap-[var(--space-4)] text-[var(--text-sm)]">
              <div>
                <span className="text-[hsl(var(--text-muted))]">{t('created')}:</span>
                <span className="text-[hsl(var(--text-primary))] ml-[var(--space-2)]">{new Date(agent.created_at * 1000).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-[hsl(var(--text-muted))]">{t('lastUpdated')}:</span>
                <span className="text-[hsl(var(--text-primary))] ml-[var(--space-2)]">{new Date(agent.updated_at * 1000).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-[var(--space-3)] mt-[var(--space-6)]">
            {editing ? (
              <>
                <Button
                  onClick={handleSave}
                  className="flex-1"
                >
                  {t('saveChanges')}
                </Button>
                <Button
                  onClick={() => setEditing(false)}
                  variant="secondary"
                  className="flex-1"
                >
                  {t('cancel')}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setEditing(true)}
                className="flex-1"
              >
                {t('editAgent')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Create Agent Modal
function CreateAgentModal({
  onClose,
  onCreated
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const t = useTranslations('agentSquad')
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    session_key: '',
    soul_content: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error(t('failedToCreate'))

      onCreated()
      onClose()
    } catch (error) {
      log.error('Error creating agent:', error)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-[var(--space-4)]"
      onClick={onClose}
    >
      <div
        className="bg-[hsl(var(--card-bg))] border border-[hsl(var(--border-default))] rounded-[var(--card-radius)] shadow-[var(--shadow-xl)] max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="p-[var(--space-6)]">
          <h3 className="text-[var(--text-xl)] font-bold text-[hsl(var(--text-primary))] mb-[var(--space-4)]">{t('createNewAgent')}</h3>

          <div className="space-y-[var(--space-4)]">
            <div>
              <label className="block text-[var(--text-sm)] text-[hsl(var(--text-muted))] mb-[var(--space-1)]">{t('name')}</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-[hsl(var(--input-bg))] text-[hsl(var(--input-text))] border border-[hsl(var(--input-border))] rounded-[var(--input-radius)] px-[var(--space-3)] py-[var(--space-2)] text-[var(--input-font-size)] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--border-focus))]"
                required
              />
            </div>

            <div>
              <label className="block text-[var(--text-sm)] text-[hsl(var(--text-muted))] mb-[var(--space-1)]">{t('role')}</label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                className="w-full bg-[hsl(var(--input-bg))] text-[hsl(var(--input-text))] border border-[hsl(var(--input-border))] rounded-[var(--input-radius)] px-[var(--space-3)] py-[var(--space-2)] text-[var(--input-font-size)] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--border-focus))]"
                placeholder={t('rolePlaceholder')}
                required
              />
            </div>

            <div>
              <label className="block text-[var(--text-sm)] text-[hsl(var(--text-muted))] mb-[var(--space-1)]">{t('sessionKeyOptional')}</label>
              <input
                type="text"
                value={formData.session_key}
                onChange={(e) => setFormData(prev => ({ ...prev, session_key: e.target.value }))}
                className="w-full bg-[hsl(var(--input-bg))] text-[hsl(var(--input-text))] border border-[hsl(var(--input-border))] rounded-[var(--input-radius)] px-[var(--space-3)] py-[var(--space-2)] text-[var(--input-font-size)] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--border-focus))]"
                placeholder={t('sessionKeyPlaceholder')}
              />
            </div>

            <div>
              <label className="block text-[var(--text-sm)] text-[hsl(var(--text-muted))] mb-[var(--space-1)]">{t('soulContentOptional')}</label>
              <textarea
                value={formData.soul_content}
                onChange={(e) => setFormData(prev => ({ ...prev, soul_content: e.target.value }))}
                className="w-full bg-[hsl(var(--input-bg))] text-[hsl(var(--input-text))] border border-[hsl(var(--input-border))] rounded-[var(--input-radius)] px-[var(--space-3)] py-[var(--space-2)] text-[var(--input-font-size)] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--border-focus))]"
                rows={3}
                placeholder={t('soulPlaceholder')}
              />
            </div>
          </div>

          <div className="flex gap-[var(--space-3)] mt-[var(--space-6)]">
            <Button
              type="submit"
              className="flex-1"
            >
              {t('createAgent')}
            </Button>
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              className="flex-1"
            >
              {t('cancel')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
