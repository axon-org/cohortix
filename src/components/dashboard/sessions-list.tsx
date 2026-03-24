'use client'

import { Session } from '@/types'
import { formatAge, parseTokenUsage, getStatusBadgeColor } from '@/lib/utils'

interface SessionsListProps {
  sessions: Session[]
}

interface SessionCardProps {
  session: Session
}

function SessionCard({ session }: SessionCardProps) {
  const tokenUsage = parseTokenUsage(session.tokens)
  const statusColor = session.active ? 'success' : 'warning'
  
  const getSessionTypeIcon = (key: string) => {
    if (key.includes('main:main')) return '👑'
    if (key.includes('subagent')) return '🤖'
    if (key.includes('cron')) return '⏰'
    if (key.includes('group')) return '👥'
    return '📄'
  }

  const getModelColor = (model: string) => {
    if (model.includes('opus')) return 'text-primary'
    if (model.includes('sonnet')) return 'text-status-info-fg'
    if (model.includes('haiku')) return 'text-status-success-fg'
    return 'text-muted-foreground'
  }

  const getRoleBadge = (key: string) => {
    if (key.includes('main:main')) {
      return { label: 'LEAD', color: 'bg-primary/20 text-primary border-primary/30' }
    }
    if (key.includes('subagent')) {
      return { label: 'WORKER', color: 'bg-status-info-bg text-status-info-fg border-status-info-border' }
    }
    if (key.includes('cron')) {
      return { label: 'CRON', color: 'bg-status-warning-bg text-status-warning-fg border-status-warning-border' }
    }
    return { label: 'SYSTEM', color: 'bg-muted text-muted-foreground border-border' }
  }

  const getCurrentTask = (session: Session) => {
    // Extract task from session label or key
    if (session.label && session.label !== session.key.split(':').pop()) {
      return session.label
    }
    // For sub-agents, try to extract task from key
    const parts = session.key.split(':')
    if (parts.length > 3 && parts[2] === 'subagent') {
      return parts[3] || 'Unknown task'
    }
    return session.active ? 'Active' : 'Idle'
  }

  const roleBadge = getRoleBadge(session.key)
  const currentTask = getCurrentTask(session)

  return (
    <div className="bg-card border border-border rounded-[var(--card-radius)] p-4 hover:bg-muted/50 transition-colors" style={{ boxShadow: 'var(--card-shadow)' }}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className={`text-xl ${session.active ? 'working-indicator' : ''}`}>
            {getSessionTypeIcon(session.key)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-medium text-foreground truncate">
                {session.key.split(':').pop() || session.key}
              </h4>
              {/* Role Badge */}
              <span className={`px-2 py-0.5 text-xs font-bold border rounded-full ${roleBadge.color}`}>
                {roleBadge.label}
              </span>
            </div>
            
            {/* Current Task/Status */}
            <div className="text-xs text-muted-foreground mb-1">
              <span className="font-medium">{currentTask}</span>
            </div>
            
            <p className="text-xs text-muted-foreground truncate">
              {session.key}
            </p>
            
            <div className="flex items-center space-x-2 mt-2">
              <span className={`text-xs font-mono ${getModelColor(session.model)}`}>
                {session.model}
              </span>
              <span className="text-xs text-muted-foreground">
                • {formatAge(session.age)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end space-y-1">
          {/* Working/Status Badge */}
          <div className={`px-2 py-1 rounded-full border text-xs font-medium ${
            session.active 
              ? 'bg-status-success-bg text-status-success-fg border-status-success-border animate-pulse'
              : 'bg-status-warning-bg text-status-warning-fg border-status-warning-border'
          }`}>
            {session.active ? 'WORKING' : 'IDLE'}
          </div>

          {/* Token Usage */}
          {session.tokens !== '-' && (
            <div className="text-right">
              <div className="text-xs text-muted-foreground">
                {session.tokens}
              </div>
              {tokenUsage.total > 0 && (
                <div className="w-16 h-1 bg-secondary rounded-full mt-1">
                  <div 
                    className={`h-full rounded-full ${
                      tokenUsage.percentage > 80 ? 'bg-status-error-solid' :
                      tokenUsage.percentage > 60 ? 'bg-status-warning-solid' :
                      'bg-status-success-solid'
                    }`}
                    style={{ width: `${Math.min(tokenUsage.percentage, 100)}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Flags */}
      {session.flags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {session.flags.map((flag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-primary/20 text-primary rounded text-xs"
            >
              {flag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export function SessionsList({ sessions }: SessionsListProps) {
  const activeSessions = sessions.filter(s => s.active)
  const idleSessions = sessions.filter(s => !s.active)

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h3>Active Sessions</h3>
          <p className="text-xs text-muted-foreground">
            {sessions.length} total · {activeSessions.length} active
          </p>
        </div>
      </div>

      <div className="panel-body">
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-4xl mb-2">🤖</div>
            <p className="text-sm">No sessions active</p>
            <p className="text-xs mt-1">Sessions will appear here when agents start</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Active Sessions */}
            {activeSessions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2 flex items-center">
                  <span className="w-2 h-2 bg-status-success-solid rounded-full mr-2"></span>
                  Active ({activeSessions.length})
                </h4>
                <div className="space-y-2">
                  {activeSessions.map((session) => (
                    <SessionCard key={session.id} session={session} />
                  ))}
                </div>
              </div>
            )}

            {/* Idle Sessions */}
            {idleSessions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2 flex items-center">
                  <span className="w-2 h-2 bg-status-warning-solid rounded-full mr-2"></span>
                  Idle ({idleSessions.length})
                </h4>
                <div className="space-y-2">
                  {idleSessions.map((session) => (
                    <SessionCard key={session.id} session={session} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}