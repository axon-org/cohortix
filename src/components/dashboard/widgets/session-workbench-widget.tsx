'use client'

import type { DashboardData } from '../widget-primitives'

export function SessionWorkbenchWidget({ data }: { data: DashboardData }) {
  const { isLocal, sessions, isSessionsLoading, openSession } = data

  return (
    <div className="panel">
      <div className="panel-header">
        <h3>{isLocal ? 'Session Workbench' : 'Session Router'}</h3>
        <span className="text-2xs text-muted-foreground font-mono-tight">{sessions.length}</span>
      </div>
      <div className="divide-y divide-border max-h-80 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-xs text-muted-foreground">
              {isSessionsLoading
                ? 'Loading sessions...'
                : isLocal
                  ? 'No active sessions'
                  : 'No gateway sessions'}
            </p>
            <p className="text-2xs text-muted-foreground mt-1">
              {isLocal
                ? 'Start a Claude or Codex session to see it here.'
                : 'Sessions appear when gateway agents connect.'}
            </p>
          </div>
        ) : (
          sessions.slice(0, 10).map((session) => (
            <div key={session.id} className="px-5 py-3 hover:bg-muted/50 transition-smooth">
              <button
                type="button"
                onClick={() => openSession(session)}
                className="w-full text-left flex items-center gap-3 min-h-11"
              >
                <div className={`w-2 h-2 rounded-full shrink-0 ${session.active ? 'bg-status-success-solid' : 'bg-muted-foreground/30'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate font-mono-tight">{session.key || session.id}</div>
                  <div className="text-2xs text-muted-foreground">
                    {session.kind === 'codex-cli' ? 'Codex' : session.kind === 'claude-code' ? 'Claude' : session.kind === 'hermes' ? 'Hermes' : session.kind} · {session.model?.split('/').pop() || 'unknown'}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xs font-mono-tight text-muted-foreground">{session.tokens}</div>
                  <div className="text-2xs text-muted-foreground">{session.age}</div>
                </div>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
