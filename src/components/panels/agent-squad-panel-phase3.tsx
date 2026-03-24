'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/ui/loader'
import { useSmartPoll } from '@/lib/use-smart-poll'
import { createClientLogger } from '@/lib/client-logger'
import { AgentAvatar } from '@/components/ui/agent-avatar'
import {
  OverviewTab,
  SoulTab,
  MemoryTab,
  TasksTab,
  ActivityTab,
  ConfigTab,
  FilesTab,
  ToolsTab,
  ChannelsTab,
  CronTab,
  ModelsTab,
  CreateAgentModal
} from './agent-detail-tabs'
import { formatModelName, buildTaskStatParts } from '@/lib/agent-card-helpers'
import { useMissionControl, type Agent } from '@/store'

const log = createClientLogger('AgentSquadPhase3')

interface WorkItem {
  type: string
  count: number
  items: any[]
}

interface HeartbeatResponse {
  status: 'HEARTBEAT_OK' | 'WORK_ITEMS_FOUND'
  agent: string
  checked_at: number
  work_items?: WorkItem[]
  total_items?: number
  message?: string
}

interface SoulTemplate {
  name: string
  description: string
  size: number
}

const statusDotClasses: Record<string, string> = {
  offline: 'bg-muted-foreground/40',
  idle: 'bg-status-success-solid',
  busy: 'bg-status-warning-solid',
  error: 'bg-status-error-solid',
}

const statusBadgeStyles: Record<string, string> = {
  offline: 'bg-muted text-muted-foreground border-border',
  idle: 'bg-status-success-bg text-status-success-fg border-status-success-border',
  busy: 'bg-status-warning-bg text-status-warning-fg border-status-warning-border',
  error: 'bg-status-error-bg text-status-error-fg border-status-error-border',
}

const statusEdgeClasses: Record<string, string> = {
  offline: 'bg-muted-foreground/20',
  idle: 'bg-status-success-solid',
  busy: 'bg-status-warning-solid',
  error: 'bg-status-error-solid',
}

export function AgentSquadPanelPhase3() {
  const t = useTranslations('agentSquadPhase3')
  const { agents, setAgents } = useMissionControl()
  const [loading, setLoading] = useState(agents.length === 0)
  const [error, setError] = useState<string | null>(null)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showQuickSpawnModal, setShowQuickSpawnModal] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncToast, setSyncToast] = useState<string | null>(null)

  // Sync agents from gateway config or local disk
  const syncFromConfig = async (source?: 'local') => {
    setSyncing(true)
    setSyncToast(null)
    try {
      const url = source === 'local' ? '/api/agents/sync?source=local' : '/api/agents/sync'
      const response = await fetch(url, { method: 'POST' })
      if (response.status === 401) {
        window.location.assign('/login?next=%2Fagents')
        return
      }
      const data = await response.json()
      if (response.status === 403) {
        throw new Error('Admin access required for agent sync')
      }
      if (!response.ok) throw new Error(data.error || 'Sync failed')
      if (source === 'local') {
        setSyncToast(data.message || 'Local agent sync complete')
      } else {
        setSyncToast(`Synced ${data.synced} agents (${data.created} new, ${data.updated} updated)`)
      }
      fetchAgents()
      setTimeout(() => setSyncToast(null), 5000)
    } catch (err: any) {
      setSyncToast(`Sync failed: ${err.message}`)
      setTimeout(() => setSyncToast(null), 5000)
    } finally {
      setSyncing(false)
    }
  }

  // Fetch agents
  const fetchAgents = useCallback(async () => {
    try {
      setError(null)
      if (agents.length === 0) setLoading(true)

      const response = await fetch('/api/agents')
      if (response.status === 401) {
        window.location.assign('/login?next=%2Fagents')
        return
      }
      if (response.status === 403) {
        throw new Error('Access denied')
      }
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to fetch agents')
      }

      const data = await response.json()
      setAgents(data.agents || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [agents.length, setAgents])

  // Smart polling with visibility pause
  useSmartPoll(fetchAgents, 30000, { enabled: autoRefresh, pauseWhenSseConnected: true })

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

      if (!response.ok) throw new Error('Failed to update agent status')

      // Update store state
      setAgents(agents.map(agent =>
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
      setError('Failed to update agent status')
    }
  }

  // Wake agent via session_send
  const wakeAgent = async (agentName: string, sessionKey: string) => {
    try {
      const response = await fetch(`/api/agents/${agentName}/wake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `🤖 **Wake Up Call**\n\nAgent ${agentName}, you have been manually woken up.\nCheck Cohortix for any pending tasks or notifications.\n\n⏰ ${new Date().toLocaleString()}`
        })
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to wake agent')
      }

      await updateAgentStatus(agentName, 'idle', 'Manually woken via session')
    } catch (error) {
      log.error('Failed to wake agent:', error)
      setError('Failed to wake agent')
    }
  }

  const deleteAgent = async (agentId: number, removeWorkspace: boolean) => {
    const previousAgents = agents
    setAgents(agents.filter((agent) => agent.id !== agentId))

    const response = await fetch(`/api/agents/${agentId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remove_workspace: removeWorkspace }),
    })

    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      setAgents(previousAgents)
      throw new Error(payload?.error || 'Failed to delete agent')
    }

    setSyncToast(
      removeWorkspace
        ? `Deleted agent and workspace: ${payload?.deleted || agentId}`
        : `Deleted agent: ${payload?.deleted || agentId}`,
    )
    await fetchAgents()
    setTimeout(() => setSyncToast(null), 5000)
  }

  // Format last seen time
  const formatLastSeen = (timestamp?: number) => {
    if (!timestamp) return 'Never'

    const now = Date.now()
    const diffMs = now - (timestamp * 1000)
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return new Date(timestamp * 1000).toLocaleDateString()
  }

  // Check if agent had recent heartbeat (within 30 minutes)
  const hasRecentHeartbeat = (agent: Agent) => {
    if (!agent.last_seen) return false
    const thirtyMinutesAgo = Math.floor(Date.now() / 1000) - (30 * 60)
    return agent.last_seen > thirtyMinutesAgo
  }

  // Get status distribution for summary
  const statusCounts = agents.reduce((acc, agent) => {
    acc[agent.status] = (acc[agent.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  if (loading && agents.length === 0) {
    return <Loader variant="panel" label="Loading agents" />
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-[var(--space-5)] border-b border-[hsl(var(--border-default))] flex-shrink-0">
        <div className="flex items-center gap-[var(--space-4)]">
          <h2 className="text-[var(--text-2xl)] font-bold text-[hsl(var(--text-primary))]">{t('title')}</h2>

          {/* Status Summary */}
          <div className="flex gap-[var(--space-3)] text-[var(--text-sm)]">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center gap-[var(--space-1)]">
                <div className={`w-2 h-2 rounded-full ${statusDotClasses[status]}`}></div>
                <span className="text-[hsl(var(--text-muted))]">{count}</span>
              </div>
            ))}
          </div>

          {/* Active Heartbeats Indicator */}
          <div className="flex items-center gap-[var(--space-1)]">
            <div className="w-2 h-2 rounded-full bg-status-info-bg animate-pulse"></div>
            <span className="text-[var(--text-sm)] text-[hsl(var(--text-muted))]">
              {t('activeHeartbeats', { count: agents.filter(hasRecentHeartbeat).length })}
            </span>
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
            onClick={() => syncFromConfig()}
            disabled={syncing}
            size="sm"
            className="bg-status-info-bg text-primary border border-status-info-border hover:bg-status-info-bg"
          >
            {syncing ? t('syncing') : t('syncConfig')}
          </Button>
          <Button
            onClick={() => syncFromConfig('local')}
            disabled={syncing}
            size="sm"
            className="bg-status-info-bg text-primary border border-status-info-border hover:bg-status-info-bg"
          >
            {t('syncLocal')}
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            size="sm"
          >
            {t('addAgent')}
          </Button>
          <Button
            onClick={fetchAgents}
            variant="secondary"
            size="sm"
          >
            {t('refresh')}
          </Button>
        </div>
      </div>

      {/* Sync Toast */}
      {syncToast && (
        <div className={`p-[var(--space-3)] m-[var(--space-4)] rounded-[var(--radius-lg)] text-[var(--text-sm)] ${syncToast.includes('failed') ? 'bg-status-error-bg border border-status-error-border text-status-error-fg' : 'bg-status-success-bg border border-status-success-border text-status-success-fg'}`}>
          {syncToast}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-status-error-bg border border-status-error-border text-status-error-fg p-[var(--space-3)] m-[var(--space-4)] rounded-[var(--radius-lg)] text-[var(--text-sm)] flex items-center justify-between">
          <span>{error}</span>
          <Button
            onClick={() => setError(null)}
            variant="ghost"
            size="icon-sm"
            className="text-status-error-fg/60 hover:text-status-error-fg ml-[var(--space-2)]"
          >
            ×
          </Button>
        </div>
      )}

      {/* Agent Grid */}
      <div className="flex-1 p-[var(--space-5)] overflow-y-auto">
        {agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-[var(--space-12)] text-[hsl(var(--text-muted))]">
            <div className="w-14 h-14 rounded-full bg-[hsl(var(--bg-subtle))] flex items-center justify-center mb-[var(--space-3)]">
              <svg width="24" height="24" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="8" cy="5" r="3" />
                <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" />
              </svg>
            </div>
            <p className="text-[var(--text-base)] font-medium">{t('noAgents')}</p>
            <p className="text-[var(--text-xs)] text-[hsl(var(--text-muted))]/70 mt-[var(--space-1)] max-w-xs text-center">
              {t('noAgentsHint')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[var(--space-4)]">
            {agents.map(agent => {
              const modelName = formatModelName(agent.config)
              const taskStatsLine = buildTaskStatParts(agent.taskStats)

              return (
                <div
                  key={agent.id}
                  className="group relative overflow-hidden rounded-[var(--card-radius)] border border-[hsl(var(--card-border))] bg-[hsl(var(--card-bg))] p-[var(--space-5)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[var(--card-shadow-hover)] cursor-pointer"
                  style={{ boxShadow: 'var(--card-shadow)' }}
                  onClick={() => setSelectedAgent(agent)}
                >
                  {/* Accent left edge */}
                  <div className={`pointer-events-none absolute inset-y-0 left-0 w-1 ${statusEdgeClasses[agent.status]}`} />

                  {/* Header: larger avatar + name + status badge */}
                  <div className="flex items-start gap-[var(--space-3)] mb-[var(--space-3)]">
                    <AgentAvatar name={agent.name} size="lg" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-[var(--space-1-5)]">
                        <h3 className="font-semibold text-[var(--text-md)] text-[hsl(var(--text-primary))] truncate">{agent.name}</h3>
                        {(agent as any).source && (agent as any).source !== 'manual' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full border bg-status-info-bg text-primary border-status-info-border">
                            {(agent as any).source}
                          </span>
                        )}
                      </div>
                      <p className="text-[var(--text-sm)] text-[hsl(var(--text-muted))] truncate">
                        {agent.role}
                      </p>
                      {/* Model badge */}
                      {modelName && (
                        <span className="inline-flex mt-[var(--space-1)] px-[var(--space-2)] py-0.5 rounded-[var(--radius-sm)] bg-[hsl(var(--color-indigo-50))] text-[hsl(var(--interactive-primary))] text-[10px] font-mono border border-[hsl(var(--color-indigo-200))]">
                          {modelName}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-[var(--space-1)] shrink-0">
                      {hasRecentHeartbeat(agent) && (
                        <div className="w-2 h-2 rounded-full bg-status-info-solid animate-pulse" title="Recent heartbeat" />
                      )}
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[var(--text-xs)] capitalize ${statusBadgeStyles[agent.status]}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${statusDotClasses[agent.status]}`} />
                        {agent.status}
                      </span>
                    </div>
                  </div>

                  {/* Task stats — inline */}
                  {taskStatsLine && (
                    <div className="text-[var(--text-xs)] text-[hsl(var(--text-muted))] mb-[var(--space-2)] pl-0.5">
                      {taskStatsLine.map((part, i) => (
                        <span key={part.label}>
                          {i > 0 && <span className="mx-1 opacity-40">·</span>}
                          <span className={part.color || 'text-[hsl(var(--text-primary))]/80'}>{part.count}</span>
                          {' '}{part.label}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer: last seen + actions */}
                  <div className="flex items-center justify-between mt-[var(--space-2)] pt-[var(--space-2)] border-t border-[hsl(var(--border-subtle))]">
                    <span className="text-[11px] text-[hsl(var(--text-muted))]/70">
                      {formatLastSeen(agent.last_seen)}
                    </span>
                    <div className="flex gap-[var(--space-1)]">
                      {agent.session_key ? (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            wakeAgent(agent.name, agent.session_key!)
                          }}
                          size="xs"
                          variant="ghost"
                          className="h-6 px-2 text-[var(--text-xs)] text-primary hover:bg-status-info-bg hover:text-primary"
                          title="Wake agent via session"
                        >
                          {t('wake')}
                        </Button>
                      ) : (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            updateAgentStatus(agent.name, 'idle', 'Manually activated')
                          }}
                          disabled={agent.status === 'idle'}
                          size="xs"
                          variant="ghost"
                          className="h-6 px-2 text-[var(--text-xs)]"
                        >
                          {t('wake')}
                        </Button>
                      )}
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedAgent(agent)
                          setShowQuickSpawnModal(true)
                        }}
                        size="xs"
                        variant="ghost"
                        className="h-6 px-2 text-[var(--text-xs)] text-status-info-fg hover:bg-status-info-bg/15 hover:text-status-info-fg"
                      >
                        {t('spawn')}
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
        <AgentDetailModalPhase3
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
          onUpdate={fetchAgents}
          onStatusUpdate={updateAgentStatus}
          onWakeAgent={wakeAgent}
          onDelete={deleteAgent}
        />
      )}

      {/* Create Agent Modal */}
      {showCreateModal && (
        <CreateAgentModal
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchAgents}
        />
      )}

      {/* Quick Spawn Modal */}
      {showQuickSpawnModal && selectedAgent && (
        <QuickSpawnModal
          agent={selectedAgent}
          onClose={() => {
            setShowQuickSpawnModal(false)
            setSelectedAgent(null)
          }}
          onSpawned={fetchAgents}
        />
      )}
    </div>
  )
}

// ─── Settings Accordion Section ────────────────────────────────────────────────
function SettingsAccordionSection({
  title,
  summary,
  isOpen,
  onToggle,
  children
}: {
  title: string
  summary: string
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="border border-[hsl(var(--border-default))] rounded-[var(--radius-lg)] overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-[var(--space-4)] py-[var(--space-3)] bg-[hsl(var(--bg-subtle))] hover:bg-[hsl(var(--bg-subtle))]/80 transition-colors text-left"
      >
        <div className="flex items-center gap-[var(--space-3)] min-w-0">
          <span className="text-[var(--text-base)] font-medium text-[hsl(var(--text-primary))]">{title}</span>
          <span className="text-[var(--text-xs)] text-[hsl(var(--text-muted))] truncate">{summary}</span>
        </div>
        <svg
          className={`w-4 h-4 shrink-0 text-[hsl(var(--text-muted))] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>
      {isOpen && (
        <div className="border-t border-[hsl(var(--border-default))]">
          {children}
        </div>
      )}
    </div>
  )
}

// ─── Consolidated Settings Tab (Accordion: Config, Models, Channels, Cron, Tools) ──
function SettingsTab({
  agent,
  workspaceFiles,
  onSaveWorkspaceFile,
  onSave
}: {
  agent: Agent & { config?: any; working_memory?: string }
  workspaceFiles: { identityMd: string; agentMd: string }
  onSaveWorkspaceFile: (file: 'identity.md' | 'agent.md', content: string) => Promise<void>
  onSave: () => void
}) {
  const [openSection, setOpenSection] = useState<string | null>('config')

  const toggle = (section: string) => {
    setOpenSection(prev => prev === section ? null : section)
  }

  // Build summaries
  const agentConfig = (agent as any).config || {}
  const modelCfg = agentConfig.model || {}
  const modelPrimary = typeof modelCfg === 'string' ? modelCfg : (modelCfg.primary || '')
  const modelFallbacks: string[] = Array.isArray(modelCfg.fallbacks) ? modelCfg.fallbacks : []
  const modelSummary = modelPrimary
    ? `${formatModelName(agentConfig) || modelPrimary}${modelFallbacks.length ? ` + ${modelFallbacks.length} fallback${modelFallbacks.length > 1 ? 's' : ''}` : ''}`
    : 'Not configured'

  const tools = agentConfig.tools || {}
  const toolAllow = Array.isArray(tools.allow) ? tools.allow : []
  const toolDeny = Array.isArray(tools.deny) ? tools.deny : []
  const totalTools = toolAllow.length + toolDeny.length
  const toolsSummary = totalTools > 0 ? `${toolAllow.length} allowed, ${toolDeny.length} denied` : 'Default profile'

  const cronSummary = 'View cron jobs'
  const channelsSummary = 'View connected channels'
  const configSummary = agentConfig.model ? 'Custom configuration' : 'Default configuration'

  return (
    <div className="p-[var(--space-5)] space-y-[var(--space-3)]">
      <SettingsAccordionSection
        title="Config"
        summary={configSummary}
        isOpen={openSection === 'config'}
        onToggle={() => toggle('config')}
      >
        <ConfigTab
          agent={agent}
          workspaceFiles={workspaceFiles}
          onSaveWorkspaceFile={onSaveWorkspaceFile}
          onSave={onSave}
        />
      </SettingsAccordionSection>

      <SettingsAccordionSection
        title="Models"
        summary={modelSummary}
        isOpen={openSection === 'models'}
        onToggle={() => toggle('models')}
      >
        <ModelsTab agent={agent} />
      </SettingsAccordionSection>

      <SettingsAccordionSection
        title="Channels"
        summary={channelsSummary}
        isOpen={openSection === 'channels'}
        onToggle={() => toggle('channels')}
      >
        <ChannelsTab agent={agent} />
      </SettingsAccordionSection>

      <SettingsAccordionSection
        title="Cron"
        summary={cronSummary}
        isOpen={openSection === 'cron'}
        onToggle={() => toggle('cron')}
      >
        <CronTab agent={agent} />
      </SettingsAccordionSection>

      <SettingsAccordionSection
        title="Tools"
        summary={toolsSummary}
        isOpen={openSection === 'tools'}
        onToggle={() => toggle('tools')}
      >
        <ToolsTab agent={agent} />
      </SettingsAccordionSection>
    </div>
  )
}

// ─── Consolidated Identity Tab (Soul + Memory with segmented control) ──────────
function IdentityTab({
  agent,
  soulContent,
  workingMemory,
  soulTemplates,
  onSoulSave,
  onMemorySave
}: {
  agent: Agent & { config?: any; working_memory?: string }
  soulContent: string
  workingMemory: string
  soulTemplates: SoulTemplate[]
  onSoulSave: (content: string, templateName?: string) => Promise<void>
  onMemorySave: (content: string, append?: boolean) => Promise<void>
}) {
  const [activeView, setActiveView] = useState<'soul' | 'memory'>('soul')

  return (
    <div className="flex flex-col">
      {/* Segmented Control */}
      <div className="flex px-[var(--space-5)] pt-[var(--space-4)] pb-0">
        <div className="inline-flex rounded-[var(--radius-lg)] bg-[hsl(var(--bg-subtle))] p-[var(--space-0-5)]">
          {(['soul', 'memory'] as const).map(view => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`px-[var(--space-4)] py-[var(--space-1-5)] rounded-[var(--radius-md)] text-[var(--text-sm)] font-medium transition-colors ${
                activeView === view
                  ? 'bg-[hsl(var(--card-bg))] text-[hsl(var(--text-primary))] shadow-[var(--shadow-sm)]'
                  : 'text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))]'
              }`}
            >
              {view === 'soul' ? 'Soul Editor' : 'Memory Browser'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activeView === 'soul' ? (
        <SoulTab
          agent={agent}
          soulContent={soulContent}
          templates={soulTemplates}
          onSave={onSoulSave}
        />
      ) : (
        <MemoryTab
          agent={agent}
          workingMemory={workingMemory}
          onSave={onMemorySave}
        />
      )}
    </div>
  )
}

// ─── Consolidated Work Tab (Tasks + Files) ─────────────────────────────────────
function WorkTab({ agent }: { agent: Agent & { config?: any } }) {
  const [activeView, setActiveView] = useState<'tasks' | 'files'>('tasks')

  return (
    <div className="flex flex-col">
      {/* Segmented Control */}
      <div className="flex px-[var(--space-5)] pt-[var(--space-4)] pb-0">
        <div className="inline-flex rounded-[var(--radius-lg)] bg-[hsl(var(--bg-subtle))] p-[var(--space-0-5)]">
          {(['tasks', 'files'] as const).map(view => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`px-[var(--space-4)] py-[var(--space-1-5)] rounded-[var(--radius-md)] text-[var(--text-sm)] font-medium transition-colors ${
                activeView === view
                  ? 'bg-[hsl(var(--card-bg))] text-[hsl(var(--text-primary))] shadow-[var(--shadow-sm)]'
                  : 'text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))]'
              }`}
            >
              {view === 'tasks' ? 'Tasks' : 'Files'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activeView === 'tasks' ? (
        <TasksTab agent={agent} />
      ) : (
        <FilesTab agent={agent} />
      )}
    </div>
  )
}

// ─── Consolidated Overview Tab (Overview + Activity) ───────────────────────────
function ConsolidatedOverviewTab({
  agent,
  editing,
  formData,
  setFormData,
  onSave,
  saveBusy,
  onStatusUpdate,
  onWakeAgent,
  onEdit,
  onCancel,
  heartbeatData,
  loadingHeartbeat,
  onPerformHeartbeat
}: {
  agent: Agent & { config?: any; working_memory?: string }
  editing: boolean
  formData: any
  setFormData: (data: any) => void
  onSave: () => Promise<void>
  saveBusy?: boolean
  onStatusUpdate: (name: string, status: Agent['status'], activity?: string) => Promise<void>
  onWakeAgent: (name: string, sessionKey: string) => Promise<void>
  onEdit: () => void
  onCancel: () => void
  heartbeatData: HeartbeatResponse | null
  loadingHeartbeat: boolean
  onPerformHeartbeat: () => Promise<void>
}) {
  const [showActivity, setShowActivity] = useState(false)

  return (
    <div className="flex flex-col">
      {/* Overview content */}
      <OverviewTab
        agent={agent}
        editing={editing}
        formData={formData}
        setFormData={setFormData}
        onSave={onSave}
        saveBusy={saveBusy}
        onStatusUpdate={onStatusUpdate}
        onWakeAgent={onWakeAgent}
        onEdit={onEdit}
        onCancel={onCancel}
        heartbeatData={heartbeatData}
        loadingHeartbeat={loadingHeartbeat}
        onPerformHeartbeat={onPerformHeartbeat}
      />

      {/* Activity Stream */}
      <div className="border-t border-[hsl(var(--border-default))]">
        <button
          onClick={() => setShowActivity(!showActivity)}
          className="w-full flex items-center justify-between px-[var(--space-5)] py-[var(--space-3)] hover:bg-[hsl(var(--bg-subtle))] transition-colors"
        >
          <span className="text-[var(--text-sm)] font-medium text-[hsl(var(--text-primary))]">Recent Activity</span>
          <svg
            className={`w-4 h-4 text-[hsl(var(--text-muted))] transition-transform duration-200 ${showActivity ? 'rotate-180' : ''}`}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M4 6l4 4 4-4" />
          </svg>
        </button>
        {showActivity && <ActivityTab agent={agent} />}
      </div>
    </div>
  )
}

// ─── Enhanced Agent Detail Modal with 4 Primary Tabs ───────────────────────────
function AgentDetailModalPhase3({
  agent,
  onClose,
  onUpdate,
  onStatusUpdate,
  onWakeAgent,
  onDelete
}: {
  agent: Agent
  onClose: () => void
  onUpdate: () => void
  onStatusUpdate: (name: string, status: Agent['status'], activity?: string) => Promise<void>
  onWakeAgent: (name: string, sessionKey: string) => Promise<void>
  onDelete: (agentId: number, removeWorkspace: boolean) => Promise<void>
}) {
  const [agentState, setAgentState] = useState<Agent & { config?: any; working_memory?: string }>(agent as Agent & { config?: any; working_memory?: string })
  const [activeTab, setActiveTab] = useState<'overview' | 'identity' | 'work' | 'settings'>('overview')
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    role: agent.role,
    session_key: agent.session_key || '',
    soul_content: agent.soul_content || '',
    working_memory: agent.working_memory || '',
    model: (() => { const p = (agent as any).config?.model?.primary; return (typeof p === 'string' ? p : p?.primary) || '' })(),
  })
  const [workspaceFiles, setWorkspaceFiles] = useState<{ identityMd: string; agentMd: string }>({
    identityMd: '',
    agentMd: '',
  })
  const [soulTemplates, setSoulTemplates] = useState<SoulTemplate[]>([])
  const [heartbeatData, setHeartbeatData] = useState<HeartbeatResponse | null>(null)
  const [loadingHeartbeat, setLoadingHeartbeat] = useState(false)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [showDeleteMenu, setShowDeleteMenu] = useState(false)
  const [saveBusy, setSaveBusy] = useState(false)
  const deleteMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (deleteBusy) return
      if (deleteMenuRef.current && !deleteMenuRef.current.contains(e.target as Node)) {
        setShowDeleteMenu(false)
      }
    }
    if (showDeleteMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showDeleteMenu, deleteBusy])

  useEffect(() => {
    setAgentState(agent as Agent & { config?: any; working_memory?: string })
    setFormData({
      role: agent.role,
      session_key: agent.session_key || '',
      soul_content: agent.soul_content || '',
      working_memory: (agent as any).working_memory || '',
      model: (() => { const p = (agent as any).config?.model?.primary; return (typeof p === 'string' ? p : p?.primary) || '' })(),
    })
  }, [agent])

  useEffect(() => {
    const loadCanonicalAgentData = async () => {
      try {
        const [agentRes, soulRes, memoryRes, filesRes] = await Promise.all([
          fetch(`/api/agents/${agent.id}`),
          fetch(`/api/agents/${agent.id}/soul`),
          fetch(`/api/agents/${agent.id}/memory`),
          fetch(`/api/agents/${agent.id}/files`),
        ])

        if (agentRes.ok) {
          const payload = await agentRes.json()
          if (payload?.agent) {
            const freshAgent = payload.agent as Agent & { config?: any; working_memory?: string }
            setAgentState((prev) => ({ ...prev, ...freshAgent }))
            setFormData((prev) => ({
              ...prev,
              role: freshAgent.role || prev.role,
              session_key: freshAgent.session_key || '',
              model: (freshAgent as any).config?.model?.primary || prev.model,
            }))
          }
        }

        if (soulRes.ok) {
          const payload = await soulRes.json()
          setFormData((prev) => ({ ...prev, soul_content: String(payload?.soul_content || '') }))
        }

        if (memoryRes.ok) {
          const payload = await memoryRes.json()
          setFormData((prev) => ({ ...prev, working_memory: String(payload?.working_memory || '') }))
        }

        if (filesRes.ok) {
          const payload = await filesRes.json()
          setWorkspaceFiles({
            identityMd: String(payload?.files?.['identity.md']?.content || ''),
            agentMd: String(payload?.files?.['agent.md']?.content || ''),
          })
        }
      } catch (error) {
        log.error('Failed to load canonical agent data:', error)
      }
    }

    loadCanonicalAgentData()
  }, [agent.id])

  const formatLastSeen = (timestamp?: number) => {
    if (!timestamp) return 'Never'
    const diffMs = Date.now() - (timestamp * 1000)
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  // Load SOUL templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await fetch(`/api/agents/${agent.name}/soul`, {
          method: 'PATCH'
        })
        if (response.ok) {
          const data = await response.json()
          setSoulTemplates(data.templates || [])
        }
      } catch (error) {
        log.error('Failed to load SOUL templates:', error)
      }
    }

    if (activeTab === 'identity') {
      loadTemplates()
    }
  }, [activeTab, agent.name])

  // Perform heartbeat check
  const performHeartbeat = async () => {
    setLoadingHeartbeat(true)
    try {
      const response = await fetch(`/api/agents/${agent.name}/heartbeat`)
      if (response.ok) {
        const data = await response.json()
        setHeartbeatData(data)
      }
    } catch (error) {
      log.error('Failed to perform heartbeat:', error)
    } finally {
      setLoadingHeartbeat(false)
    }
  }

  const handleSave = async () => {
    setSaveBusy(true)
    try {
      const response = await fetch('/api/agents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: agentState.name,
          ...formData
        })
      })

      if (!response.ok) throw new Error('Failed to update agent')

      setEditing(false)
      onUpdate()
    } catch (error) {
      log.error('Failed to update agent:', error)
    } finally {
      setSaveBusy(false)
    }
  }

  const handleSoulSave = async (content: string, templateName?: string) => {
    try {
      const response = await fetch(`/api/agents/${agentState.id}/soul`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          soul_content: content,
          template_name: templateName
        })
      })

      if (!response.ok) throw new Error('Failed to update SOUL')

      setFormData(prev => ({ ...prev, soul_content: content }))
      setAgentState(prev => ({ ...prev, soul_content: content }))
      onUpdate()
    } catch (error) {
      log.error('Failed to update SOUL:', error)
    }
  }

  const handleMemorySave = async (content: string, append: boolean = false) => {
    try {
      const response = await fetch(`/api/agents/${agentState.id}/memory`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          working_memory: content,
          append
        })
      })

      if (!response.ok) throw new Error('Failed to update memory')

      const data = await response.json()
      setFormData(prev => ({ ...prev, working_memory: data.working_memory }))
      setAgentState(prev => ({ ...prev, working_memory: data.working_memory }))
      onUpdate()
    } catch (error) {
      log.error('Failed to update memory:', error)
    }
  }

  const handleWorkspaceFileSave = async (file: 'identity.md' | 'agent.md', content: string) => {
    const response = await fetch(`/api/agents/${agentState.id}/files`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file, content }),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(payload?.error || `Failed to save ${file}`)
    }
    setWorkspaceFiles((prev) => ({
      ...prev,
      ...(file === 'identity.md' ? { identityMd: content } : { agentMd: content }),
    }))
  }

  // 4 primary tabs
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'identity', label: 'Identity' },
    { id: 'work', label: 'Work' },
    { id: 'settings', label: 'Settings' },
  ] as const

  const handleDelete = async (removeWorkspace: boolean) => {
    const scope = removeWorkspace ? 'agent and workspace' : 'agent'
    const confirmed = window.confirm(`Delete ${scope} for "${agentState.name}"? This cannot be undone.`)
    if (!confirmed) return

    setDeleteBusy(true)
    setDeleteError(null)
    try {
      await onDelete(agentState.id, removeWorkspace)
      onClose()
    } catch (error: any) {
      setDeleteError(error?.message || `Failed to delete ${scope}`)
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-[var(--space-4)]"
      onClick={onClose}
    >
      <div
        className="bg-[hsl(var(--card-bg))] border border-[hsl(var(--border-default))]/80 rounded-[var(--card-radius)] shadow-[var(--shadow-xl)] max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-[var(--space-5)] pt-[var(--space-5)] pb-0 border-b border-[hsl(var(--border-default))]">
          <div className="flex justify-between items-center gap-[var(--space-4)] mb-[var(--space-4)]">
            <div className="flex items-center gap-[var(--space-3)] min-w-0">
              <AgentAvatar name={agent.name} size="lg" />
              <div className="min-w-0">
                <div className="flex items-center gap-[var(--space-2)]">
                  <h3 className="text-[var(--text-lg)] font-semibold text-[hsl(var(--text-primary))] leading-tight truncate">{agentState.name}</h3>
                  <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${statusBadgeStyles[agentState.status]}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusDotClasses[agentState.status]}`} />
                    {agentState.status}
                  </span>
                  {agentState.session_key && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full border border-status-info-border bg-status-info-bg text-primary">
                      Session
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-[var(--space-2)] mt-0.5">
                  <span className="text-[var(--text-sm)] text-[hsl(var(--text-muted))]">{agentState.role}</span>
                  <span className="text-[var(--text-xs)] text-[hsl(var(--text-muted))]/60">·</span>
                  <span className="text-[var(--text-xs)] text-[hsl(var(--text-muted))]/60">seen {formatLastSeen(agentState.last_seen)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-[var(--space-1-5)]">
              <div className="relative" ref={deleteMenuRef}>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-status-error-fg"
                  title="Delete agent"
                  onClick={() => setShowDeleteMenu(prev => !prev)}
                >
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 4h12M5.33 4V2.67a1.33 1.33 0 0 1 1.34-1.34h2.66a1.33 1.33 0 0 1 1.34 1.34V4M12.67 4v9.33a1.33 1.33 0 0 1-1.34 1.34H4.67a1.33 1.33 0 0 1-1.34-1.34V4" />
                  </svg>
                </Button>
                {showDeleteMenu && (
                  <div className="absolute right-0 top-full mt-1 flex flex-col gap-[var(--space-1)] bg-[hsl(var(--card-bg))] border border-[hsl(var(--border-default))] rounded-[var(--radius-md)] shadow-[var(--shadow-xl)] p-[var(--space-1-5)] z-10 min-w-[180px]">
                    <button
                      onClick={() => handleDelete(false)}
                      disabled={deleteBusy}
                      className="text-left text-[var(--text-xs)] px-2.5 py-1.5 rounded-[var(--radius-sm)] text-status-error-fg hover:bg-status-error-bg transition-colors disabled:opacity-50"
                    >
                      {deleteBusy ? (
                        <span className="flex items-center gap-1.5">
                          <svg className="w-3 h-3 animate-spin" viewBox="0 0 16 16" fill="none">
                            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="8" />
                          </svg>
                          Deleting...
                        </span>
                      ) : 'Delete agent'}
                    </button>
                    <button
                      onClick={() => handleDelete(true)}
                      disabled={deleteBusy}
                      className="text-left text-[var(--text-xs)] px-2.5 py-1.5 rounded-[var(--radius-sm)] text-status-error-fg hover:bg-status-error-bg transition-colors disabled:opacity-50"
                    >
                      {deleteBusy ? (
                        <span className="flex items-center gap-1.5">
                          <svg className="w-3 h-3 animate-spin" viewBox="0 0 16 16" fill="none">
                            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="8" />
                          </svg>
                          Deleting...
                        </span>
                      ) : 'Delete agent + workspace'}
                    </button>
                  </div>
                )}
              </div>
              <Button
                onClick={onClose}
                aria-label="Close agent details"
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </Button>
            </div>
          </div>

          {deleteError && (
            <div className="mb-[var(--space-3)] rounded-[var(--radius-md)] border border-status-error-border bg-status-error-bg px-[var(--space-3)] py-[var(--space-2)] text-[var(--text-xs)] text-status-error-fg">
              {deleteError}
            </div>
          )}

          {/* 4 Primary Tab Navigation */}
          <div className="flex gap-0 -mb-px">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-[var(--space-5)] py-[var(--space-2-5,10px)] text-[var(--text-sm)] font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[hsl(var(--interactive-primary))] text-[hsl(var(--text-primary))]'
                    : 'border-transparent text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] hover:border-[hsl(var(--border-default))]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'overview' && (
            <ConsolidatedOverviewTab
              agent={agentState}
              editing={editing}
              formData={formData}
              setFormData={setFormData}
              onSave={handleSave}
              saveBusy={saveBusy}
              onStatusUpdate={onStatusUpdate}
              onWakeAgent={onWakeAgent}
              onEdit={() => setEditing(true)}
              onCancel={() => setEditing(false)}
              heartbeatData={heartbeatData}
              loadingHeartbeat={loadingHeartbeat}
              onPerformHeartbeat={performHeartbeat}
            />
          )}

          {activeTab === 'identity' && (
            <IdentityTab
              agent={agentState}
              soulContent={formData.soul_content}
              workingMemory={formData.working_memory}
              soulTemplates={soulTemplates}
              onSoulSave={handleSoulSave}
              onMemorySave={handleMemorySave}
            />
          )}

          {activeTab === 'work' && (
            <WorkTab agent={agentState} />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              agent={agentState}
              workspaceFiles={workspaceFiles}
              onSaveWorkspaceFile={handleWorkspaceFileSave}
              onSave={onUpdate}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// Quick Spawn Modal Component
function QuickSpawnModal({
  agent,
  onClose,
  onSpawned
}: {
  agent: Agent
  onClose: () => void
  onSpawned: () => void
}) {
  const [spawnData, setSpawnData] = useState({
    task: '',
    model: 'sonnet',
    label: `${agent.name}-subtask-${Date.now()}`,
    timeoutSeconds: 300
  })
  const [isSpawning, setIsSpawning] = useState(false)
  const [spawnResult, setSpawnResult] = useState<any>(null)

  const models = [
    { id: 'haiku', name: 'Claude Haiku', cost: '$0.25/1K', speed: 'Ultra Fast' },
    { id: 'sonnet', name: 'Claude Sonnet', cost: '$3.00/1K', speed: 'Fast' },
    { id: 'opus', name: 'Claude Opus', cost: '$15.00/1K', speed: 'Slow' },
    { id: 'groq-fast', name: 'Groq Llama 8B', cost: '$0.05/1K', speed: '840 tok/s' },
    { id: 'groq', name: 'Groq Llama 70B', cost: '$0.59/1K', speed: '150 tok/s' },
    { id: 'deepseek', name: 'DeepSeek R1', cost: 'FREE', speed: 'Local' },
  ]

  const handleSpawn = async () => {
    if (!spawnData.task.trim()) {
      alert('Please enter a task description')
      return
    }

    setIsSpawning(true)
    try {
      const response = await fetch('/api/spawn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...spawnData,
          parentAgent: agent.name,
          sessionKey: agent.session_key
        })
      })

      const result = await response.json()
      if (response.ok) {
        setSpawnResult(result)
        onSpawned()

        // Auto-close after 2 seconds if successful
        setTimeout(() => {
          onClose()
        }, 2000)
      } else {
        alert(result.error || 'Failed to spawn agent')
      }
    } catch (error) {
      log.error('Spawn failed:', error)
      alert('Network error occurred')
    } finally {
      setIsSpawning(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-[var(--space-4)]"
      onClick={onClose}
    >
      <div
        className="bg-[hsl(var(--card-bg))] border border-[hsl(var(--border-default))] rounded-[var(--card-radius)] shadow-[var(--shadow-xl)] max-w-md w-full p-[var(--space-6)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-[var(--space-4)]">
          <h3 className="text-[var(--text-lg)] font-bold text-[hsl(var(--text-primary))]">
            Quick Spawn for {agent.name}
          </h3>
          <Button onClick={onClose} variant="ghost" size="icon-sm">
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </Button>
        </div>

        {spawnResult ? (
          <div className="space-y-[var(--space-4)]">
            <div className="bg-status-success-bg border border-status-success-border text-status-success-fg p-[var(--space-3)] rounded-[var(--radius-lg)] text-[var(--text-sm)]">
              Agent spawned successfully!
            </div>
            <div className="text-[var(--text-sm)] text-[hsl(var(--text-secondary))]">
              <p><strong>Agent ID:</strong> {spawnResult.agentId}</p>
              <p><strong>Session:</strong> {spawnResult.sessionId}</p>
              <p><strong>Model:</strong> {spawnResult.model}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-[var(--space-4)]">
            {/* Task Description */}
            <div>
              <label className="block text-[var(--text-sm)] font-medium text-[hsl(var(--text-secondary))] mb-[var(--space-2)]">
                Task Description *
              </label>
              <textarea
                value={spawnData.task}
                onChange={(e) => setSpawnData(prev => ({ ...prev, task: e.target.value }))}
                placeholder={`Delegate a subtask to ${agent.name}...`}
                className="w-full h-24 px-[var(--space-3)] py-[var(--space-2)] bg-[hsl(var(--input-bg))] border border-[hsl(var(--input-border))] rounded-[var(--input-radius)] text-[hsl(var(--input-text))] placeholder-[hsl(var(--input-placeholder))] focus:border-[hsl(var(--input-border-focus))] focus:ring-1 focus:ring-[hsl(var(--input-border-focus))] resize-none"
              />
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-[var(--text-sm)] font-medium text-[hsl(var(--text-secondary))] mb-[var(--space-2)]">
                Model
              </label>
              <select
                value={spawnData.model}
                onChange={(e) => setSpawnData(prev => ({ ...prev, model: e.target.value }))}
                className="w-full px-[var(--space-3)] py-[var(--space-2)] bg-[hsl(var(--input-bg))] border border-[hsl(var(--input-border))] rounded-[var(--input-radius)] text-[hsl(var(--input-text))] focus:border-[hsl(var(--input-border-focus))] focus:ring-1 focus:ring-[hsl(var(--input-border-focus))]"
              >
                {models.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name} - {model.cost} ({model.speed})
                  </option>
                ))}
              </select>
            </div>

            {/* Agent Label */}
            <div>
              <label className="block text-[var(--text-sm)] font-medium text-[hsl(var(--text-secondary))] mb-[var(--space-2)]">
                Agent Label
              </label>
              <input
                type="text"
                value={spawnData.label}
                onChange={(e) => setSpawnData(prev => ({ ...prev, label: e.target.value }))}
                className="w-full px-[var(--space-3)] py-[var(--space-2)] bg-[hsl(var(--input-bg))] border border-[hsl(var(--input-border))] rounded-[var(--input-radius)] text-[hsl(var(--input-text))] focus:border-[hsl(var(--input-border-focus))] focus:ring-1 focus:ring-[hsl(var(--input-border-focus))]"
              />
            </div>

            {/* Timeout */}
            <div>
              <label className="block text-[var(--text-sm)] font-medium text-[hsl(var(--text-secondary))] mb-[var(--space-2)]">
                Timeout (seconds)
              </label>
              <input
                type="number"
                value={spawnData.timeoutSeconds}
                onChange={(e) => setSpawnData(prev => ({ ...prev, timeoutSeconds: parseInt(e.target.value) }))}
                min={30}
                max={3600}
                className="w-full px-[var(--space-3)] py-[var(--space-2)] bg-[hsl(var(--input-bg))] border border-[hsl(var(--input-border))] rounded-[var(--input-radius)] text-[hsl(var(--input-text))] focus:border-[hsl(var(--input-border-focus))] focus:ring-1 focus:ring-[hsl(var(--input-border-focus))]"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-[var(--space-3)] pt-[var(--space-4)]">
              <Button
                onClick={handleSpawn}
                disabled={isSpawning || !spawnData.task.trim()}
                className="flex-1"
              >
                {isSpawning ? 'Spawning...' : 'Spawn Agent'}
              </Button>
              <Button
                onClick={onClose}
                variant="secondary"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AgentSquadPanelPhase3
