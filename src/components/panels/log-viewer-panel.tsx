'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/ui/loader'
import { useMissionControl } from '@/store'
import { useSmartPoll } from '@/lib/use-smart-poll'
import { createClientLogger } from '@/lib/client-logger'
// Inline SVG icon components (project does not use lucide-react)
function IconAlertCircle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="8" cy="8" r="6" />
      <path d="M8 5v3.5M8 11h.01" strokeWidth="2" />
    </svg>
  )
}
function IconAlertTriangle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7.3 2.5a.8.8 0 0 1 1.4 0L14.7 13a.8.8 0 0 1-.7 1.2H2a.8.8 0 0 1-.7-1.2z" />
      <path d="M8 6.5v3M8 11.5h.01" strokeWidth="2" />
    </svg>
  )
}
function IconArrowDown({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 3v10M4 9l4 4 4-4" />
    </svg>
  )
}
function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 6l4 4 4-4" />
    </svg>
  )
}
function IconDownload({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 3v7M5 7l3 3 3-3M3 13h10" />
    </svg>
  )
}
function IconFileJson({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 2H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6z" />
      <path d="M9 2v4h4" />
      <path d="M6 9.5c-.5 0-.75.25-.75.75v.5c0 .5-.5.75-.75.75" />
      <path d="M10 9.5c.5 0 .75.25.75.75v.5c0 .5.5.75.75.75" />
    </svg>
  )
}
function IconInfo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="8" cy="8" r="6" />
      <path d="M8 7v4M8 5h.01" strokeWidth="2" />
    </svg>
  )
}
function IconScrollText({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 2h7a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4" />
      <path d="M3 4a1 1 0 0 0 1 1h1V3H4a1 1 0 0 0-1 1z" />
      <path d="M7 6h4M7 9h4M7 12h2" />
    </svg>
  )
}
function IconSearch({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5L14 14" />
    </svg>
  )
}
function IconTrash2({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-9" />
    </svg>
  )
}
function IconX({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  )
}

const log = createClientLogger('LogViewer')

const MAX_LOG_BUFFER = 1000

interface LogFilters {
  level?: string
  source?: string
  search?: string
  session?: string
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function LogViewerPanel() {
  const t = useTranslations('logViewer')
  const { logs, logFilters, setLogFilters, clearLogs, addLog } = useMissionControl()
  const [isAutoScroll, setIsAutoScroll] = useState(true)
  const [availableSources, setAvailableSources] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [logFilePath, setLogFilePath] = useState<string | null>(null)
  const logContainerRef = useRef<HTMLDivElement>(null)
  const autoScrollRef = useRef<boolean>(true)
  const logsRef = useRef(logs)
  const logFiltersRef = useRef(logFilters)

  const isBufferFull = logs.length >= MAX_LOG_BUFFER

  // Update ref when autoScroll state changes
  useEffect(() => {
    autoScrollRef.current = isAutoScroll
  }, [isAutoScroll])

  // Keep refs in sync so callbacks don't need `logs` / `logFilters` deps.
  useEffect(() => {
    logsRef.current = logs
  }, [logs])

  useEffect(() => {
    logFiltersRef.current = logFilters
  }, [logFilters])

  const loadLogs = useCallback(async (tail = false) => {
    log.debug(`Loading logs (tail=${tail})`)
    setIsLoading(!tail) // Only show loading for initial load, not for tailing

    try {
      const currentFilters = logFiltersRef.current
      const currentLogs = logsRef.current

      const params = new URLSearchParams({
        action: tail ? 'tail' : 'recent',
        limit: '200',
        ...(currentFilters.level && { level: currentFilters.level }),
        ...(currentFilters.source && { source: currentFilters.source }),
        ...(currentFilters.search && { search: currentFilters.search }),
        ...(currentFilters.session && { session: currentFilters.session }),
        ...(tail && currentLogs.length > 0 && { since: currentLogs[0]?.timestamp.toString() })
      })

      log.debug(`Fetching /api/logs?${params}`)
      const response = await fetch(`/api/logs?${params}`)
      const data = await response.json()

      log.debug(`Received ${data.logs?.length || 0} logs from API`)

      if (data.logs && data.logs.length > 0) {
        if (tail) {
          // Add new logs for tail mode - prepend to existing logs
          let newLogsAdded = 0
          const existingIds = new Set((currentLogs || []).map((l: any) => l?.id).filter(Boolean))
          data.logs.reverse().forEach((entry: any) => {
            if (existingIds.has(entry?.id)) return
            addLog(entry)
            newLogsAdded++
          })
          log.debug(`Added ${newLogsAdded} new logs (tail mode)`)
        } else {
          // Replace logs for initial load or refresh
          log.debug(`Clearing existing logs and loading ${data.logs.length} logs`)
          clearLogs() // Clear existing logs
          data.logs.reverse().forEach((entry: any) => {
            addLog(entry)
          })
          log.debug(`Successfully added ${data.logs.length} logs to store`)
        }
      } else {
        log.debug('No logs received from API')
      }
    } catch (error) {
      log.error('Failed to load logs:', error)
    } finally {
      setIsLoading(false)
    }
  }, [addLog, clearLogs])

  const loadSources = useCallback(async () => {
    try {
      const response = await fetch('/api/logs?action=sources')
      const data = await response.json()
      setAvailableSources(data.sources || [])
    } catch (error) {
      log.error('Failed to load log sources:', error)
    }
  }, [])

  // Try to fetch log file path from gateway status
  const loadLogFilePath = useCallback(async () => {
    try {
      const response = await fetch('/api/status')
      const data = await response.json()
      const path = data?.config?.logFile || data?.logFile || null
      setLogFilePath(path)
    } catch {
      // Gateway may not expose this — silently ignore
    }
  }, [])

  // Load initial logs and sources
  useEffect(() => {
    log.debug('Initial load started')
    loadLogs()
    loadSources()
    loadLogFilePath()
  }, [loadLogs, loadSources, loadLogFilePath])

  // Smart polling for log tailing (10s, visibility-aware, logs mostly come via WS)
  const pollLogs = useCallback(() => {
    if (autoScrollRef.current && !isLoading) {
      loadLogs(true) // tail mode
    }
  }, [isLoading, loadLogs])

  useSmartPoll(pollLogs, 30000, { pauseWhenConnected: true })

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (isAutoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [logs, isAutoScroll])

  const handleFilterChange = (newFilters: Partial<LogFilters>) => {
    setLogFilters(newFilters)
    // Reload logs with new filters
    setTimeout(() => loadLogs(), 100)
  }

  const handleScrollToBottom = () => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }

  const getLogLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error': return 'text-status-error-fg'
      case 'warn': return 'text-status-warning-fg'
      case 'info': return 'text-status-info-fg'
      case 'debug': return 'text-muted-foreground'
      default: return 'text-foreground'
    }
  }

  const getLogLevelBg = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error': return 'bg-status-error-bg/10 border-status-error-border/30'
      case 'warn': return 'bg-status-warning-bg/10 border-status-warning-border/30'
      case 'info': return 'border-transparent'
      case 'debug': return 'border-transparent'
      default: return 'border-transparent'
    }
  }

  const getSeverityBadgeClass = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error': return 'bg-status-error-bg text-status-error-fg border-status-error-border'
      case 'warn': return 'bg-status-warning-bg text-status-warning-fg border-status-warning-border'
      case 'info': return 'bg-status-info-bg text-status-info-fg border-status-info-border'
      case 'debug': return 'bg-surface-2 text-muted-foreground border-border'
      default: return 'bg-surface-2 text-muted-foreground border-border'
    }
  }

  const getSeverityIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error': return <IconAlertCircle className="w-2.5 h-2.5" />
      case 'warn': return <IconAlertTriangle className="w-2.5 h-2.5" />
      case 'info': return <IconInfo className="w-2.5 h-2.5" />
      default: return null
    }
  }

  const filteredLogs = logs.filter(entry => {
    if (logFilters.level && entry.level !== logFilters.level) return false
    if (logFilters.source && entry.source !== logFilters.source) return false
    if (logFilters.search && !entry.message.toLowerCase().includes(logFilters.search.toLowerCase())) return false
    if (logFilters.session && (!entry.session || !entry.session.includes(logFilters.session))) return false
    return true
  })

  const handleExportText = useCallback(() => {
    const lines = filteredLogs.map(entry => {
      const ts = new Date(entry.timestamp).toISOString()
      return `[${ts}] [${entry.level.toUpperCase()}] [${entry.source}] ${entry.message}`
    })
    const filename = `logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.log`
    downloadFile(lines.join('\n'), filename, 'text/plain')
  }, [filteredLogs])

  const handleExportJson = useCallback(() => {
    const filename = `logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`
    downloadFile(JSON.stringify(filteredLogs, null, 2), filename, 'application/json')
  }, [filteredLogs])

  // Debug logging
  log.debug(`Store has ${logs.length} logs, filtered to ${filteredLogs.length}`)

  return (
    <div className="flex flex-col h-full p-6 gap-4">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-border pb-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t('description')}
            {logFilePath && (
              <span className="ml-3 font-mono text-xs text-muted-foreground/70">{logFilePath}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleExportText}
            disabled={filteredLogs.length === 0}
            variant="secondary"
            size="sm"
            className="flex items-center gap-1.5"
          >
            <IconDownload className="w-3.5 h-3.5" />
            {t('exportLog')}
          </Button>
          <Button
            onClick={handleExportJson}
            disabled={filteredLogs.length === 0}
            variant="secondary"
            size="sm"
            className="flex items-center gap-1.5"
          >
            <IconFileJson className="w-3.5 h-3.5" />
            {t('exportJson')}
          </Button>
          <Button
            onClick={clearLogs}
            variant="destructive"
            size="sm"
            className="flex items-center gap-1.5"
          >
            <IconTrash2 className="w-3.5 h-3.5" />
            {t('clear')}
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-card border border-border rounded-xl p-4 flex-shrink-0">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Level Filter */}
          <div className="min-w-[130px]">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              {t('filterLevel')}
            </label>
            <div className="relative">
              <select
                value={logFilters.level || ''}
                onChange={(e) => handleFilterChange({ level: e.target.value || undefined })}
                className="w-full appearance-none pl-3 pr-8 py-2 border border-border rounded-lg bg-surface-1 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">{t('allLevels')}</option>
                <option value="error">{t('levelError')}</option>
                <option value="warn">{t('levelWarning')}</option>
                <option value="info">{t('levelInfo')}</option>
                <option value="debug">{t('levelDebug')}</option>
              </select>
              <IconChevronDown className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Source Filter */}
          <div className="min-w-[140px]">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              {t('filterSource')}
            </label>
            <div className="relative">
              <select
                value={logFilters.source || ''}
                onChange={(e) => handleFilterChange({ source: e.target.value || undefined })}
                className="w-full appearance-none pl-3 pr-8 py-2 border border-border rounded-lg bg-surface-1 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">{t('allSources')}</option>
                {availableSources.map((source) => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
              <IconChevronDown className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Session Filter */}
          <div className="min-w-[160px]">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              {t('filterSession')}
            </label>
            <input
              type="text"
              value={logFilters.session || ''}
              onChange={(e) => handleFilterChange({ session: e.target.value || undefined })}
              placeholder={t('sessionPlaceholder')}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface-1 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Search Filter */}
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              {t('filterSearch')}
            </label>
            <div className="relative">
              <IconSearch className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                value={logFilters.search || ''}
                onChange={(e) => handleFilterChange({ search: e.target.value || undefined })}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-surface-1 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          {/* Auto-scroll + Scroll-to-bottom */}
          <div className="flex items-end gap-2">
            <Button
              onClick={() => setIsAutoScroll(!isAutoScroll)}
              variant={isAutoScroll ? 'success' : 'secondary'}
              size="sm"
              className="flex items-center gap-1.5"
            >
              <IconScrollText className="w-3.5 h-3.5" />
              {isAutoScroll ? t('auto') : t('manual')}
            </Button>
            <Button
              onClick={handleScrollToBottom}
              variant="secondary"
              size="sm"
              className="flex items-center gap-1.5"
            >
              <IconArrowDown className="w-3.5 h-3.5" />
              {t('bottom')}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground flex-shrink-0">
        <div className="flex items-center gap-2">
          <span>{t('showing', { filtered: filteredLogs.length, total: logs.length })}</span>
          {isBufferFull && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-status-warning-bg text-status-warning-fg border border-status-warning-border">
              <IconAlertTriangle className="w-3 h-3" />
              {t('bufferFull', { max: MAX_LOG_BUFFER })}
            </span>
          )}
        </div>
        <span className="text-muted-foreground">
          {t('autoScroll')}: {isAutoScroll ? t('on') : t('off')} · {t('lastUpdated')}: {logs.length > 0 ? new Date(logs[0]?.timestamp).toLocaleTimeString() : t('never')}
        </span>
      </div>

      {/* Log Display — dark terminal area */}
      <div className="flex-1 bg-inverse rounded-xl border border-border overflow-hidden min-h-0">
        <div
          ref={logContainerRef}
          className="h-full overflow-auto p-4 space-y-1 font-mono text-sm"
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader variant="panel" label="Loading logs" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <IconScrollText className="w-6 h-6 text-muted-foreground/40" />
              <p className="text-muted-foreground/60 text-sm">{t('noLogs')}</p>
            </div>
          ) : (
            filteredLogs.map((logEntry) => (
              <div
                key={logEntry.id}
                className={`flex items-start gap-3 px-3 py-2 rounded-lg border ${getLogLevelBg(logEntry.level)}`}
              >
                {/* Severity badge */}
                <span className={`flex-shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold uppercase border leading-none mt-0.5 ${getSeverityBadgeClass(logEntry.level)}`}>
                  {getSeverityIcon(logEntry.level)}
                  {logEntry.level}
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-0.5">
                    <span className="font-mono">{new Date(logEntry.timestamp).toLocaleTimeString()}</span>
                    <span className="text-muted-foreground/50">·</span>
                    <span>[{logEntry.source}]</span>
                    {logEntry.session && (
                      <>
                        <span className="text-muted-foreground/50">·</span>
                        <span>session:{logEntry.session}</span>
                      </>
                    )}
                  </div>
                  <div className="text-foreground break-words leading-relaxed">
                    {logEntry.message}
                  </div>
                  {logEntry.data && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                        <IconChevronDown className="w-3 h-3" />
                        {t('additionalData')}
                      </summary>
                      <pre className="mt-1 text-xs text-muted-foreground overflow-auto bg-surface-1/10 rounded p-2 border border-border/30">
                        {JSON.stringify(logEntry.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>

                {/* Dismiss */}
                <IconX className="flex-shrink-0 w-3.5 h-3.5 text-muted-foreground/30 mt-0.5 cursor-default" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
