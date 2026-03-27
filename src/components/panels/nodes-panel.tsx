'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

interface PresenceEntry {
  id: string
  clientId: string
  displayName: string
  platform: string
  version: string
  roles: string[]
  connectedAt: number
  lastActivity: number
  host?: string
  ip?: string
  status: 'online' | 'idle' | 'offline'
}

interface DeviceTokenSummary {
  role: string
  scopes?: string[]
  createdAtMs?: number
  rotatedAtMs?: number
  revokedAtMs?: number
  lastUsedAtMs?: number
}

interface PendingDevice {
  requestId: string
  deviceId: string
  displayName?: string
  role?: string
  remoteIp?: string
  isRepair?: boolean
  ts?: number
}

interface PairedDevice {
  id: string
  deviceId: string
  displayName: string
  publicKey?: string
  pairedAt?: number
  lastSeen?: number
  trusted?: boolean
  roles?: string[]
  scopes?: string[]
  tokens?: DeviceTokenSummary[]
  createdAtMs?: number
  approvedAtMs?: number
}

type Tab = 'instances' | 'devices'

function relativeTime(ts: number): string {
  if (!ts) return '--'
  const now = Date.now()
  const diffMs = now - (ts < 1e12 ? ts * 1000 : ts)
  if (diffMs < 0) return 'just now'
  const seconds = Math.floor(diffMs / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function statusColor(status: PresenceEntry['status']): string {
  switch (status) {
    case 'online': return 'bg-status-success-bg text-status-success-fg border-status-success-border'
    case 'idle': return 'bg-status-warning-bg text-status-warning-fg border-status-warning-border'
    case 'offline': return 'bg-muted text-muted-foreground border-border'
    default: return 'bg-muted text-muted-foreground border-border'
  }
}

async function deviceAction(
  action: string,
  params: Record<string, unknown>,
): Promise<{ ok: boolean; error?: string; data?: Record<string, unknown> }> {
  try {
    const res = await fetch('/api/nodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...params }),
    })
    const data = await res.json()
    if (!res.ok) return { ok: false, error: data.error || `Request failed (${res.status})` }
    return { ok: true, data }
  } catch {
    return { ok: false, error: 'Network error' }
  }
}

export function NodesPanel() {
  const t = useTranslations('nodes')
  const [tab, setTab] = useState<Tab>('instances')
  const [nodes, setNodes] = useState<PresenceEntry[]>([])
  const [devices, setDevices] = useState<PairedDevice[]>([])
  const [pendingDevices, setPendingDevices] = useState<PendingDevice[]>([])
  const [connected, setConnected] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNodes = useCallback(async () => {
    try {
      const res = await fetch('/api/nodes')
      if (!res.ok) { setError('Failed to fetch nodes'); return }
      const data = await res.json()
      setNodes(data.nodes || data.entries || [])
      setConnected(data.connected !== false)
      setError(null)
    } catch {
      setError('Failed to fetch nodes')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetch('/api/nodes?action=devices')
      if (!res.ok) return
      const data = await res.json()
      setDevices(data.paired || data.devices || [])
      setPendingDevices(data.pending || [])
    } catch {
      // silent fallback
    }
  }, [])

  useEffect(() => {
    fetchNodes()
    fetchDevices()
    const interval = setInterval(() => {
      fetchNodes()
      fetchDevices()
    }, 30000)
    return () => clearInterval(interval)
  }, [fetchNodes, fetchDevices])

  const pendingCount = pendingDevices.length
  const totalDeviceCount = devices.length + pendingCount

  return (
    <div className="m-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
            connected
              ? 'bg-status-success-bg text-status-success-fg border-status-success-border'
              : 'bg-status-error-bg text-status-error-fg border-status-error-border'
          }`}
        >
          {connected ? t('gatewayConnected') : t('gatewayUnreachable')}
        </span>
      </div>

      {/* Pill tab bar */}
      <div className="inline-flex items-center gap-1 bg-secondary rounded-full p-1 mb-5">
        <button
          onClick={() => setTab('instances')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
            tab === 'instances'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('tabInstances', { count: nodes.length })}
        </button>
        <button
          onClick={() => setTab('devices')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
            tab === 'devices'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('tabDevices', { count: totalDeviceCount })}
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-status-warning-bg text-status-warning-fg border border-status-warning-border">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-status-error-bg border border-status-error-border text-status-error-fg text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-muted-foreground text-sm py-12 text-center">{t('loading')}</div>
      ) : tab === 'instances' ? (
        <InstancesTab nodes={nodes} />
      ) : (
        <DevicesTab
          devices={devices}
          pendingDevices={pendingDevices}
          onRefresh={fetchDevices}
        />
      )}
    </div>
  )
}

function InstancesTab({ nodes }: { nodes: PresenceEntry[] }) {
  const t = useTranslations('nodes')
  if (nodes.length === 0) {
    return (
      <div className="text-muted-foreground text-sm py-12 text-center">
        {t('noInstances')}
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      {nodes.map((node) => (
        <div
          key={node.id}
          className="bg-card rounded-xl p-5 border border-border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-foreground text-sm">{node.displayName}</span>
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor(node.status)}`}
                >
                  {node.status}
                </span>
              </div>

              <div className="flex items-center gap-1.5 mb-3">
                <span className="px-2 py-0.5 rounded bg-surface-1 border border-border font-mono text-xs text-muted-foreground">
                  {node.clientId?.slice(0, 12)}…
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>{node.platform}</span>
                <span className="text-border">·</span>
                <span>v{node.version}</span>
                {(node.host || node.ip) && (
                  <>
                    <span className="text-border">·</span>
                    <span className="font-mono">{node.host || node.ip}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0 text-right">
              <div className="flex gap-1 flex-wrap justify-end">
                {(node.roles || []).map((role) => (
                  <span
                    key={role}
                    className="px-2 py-0.5 rounded-full text-xs bg-secondary text-muted-foreground"
                  >
                    {role}
                  </span>
                ))}
              </div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <div>{t('colConnected')}: {relativeTime(node.connectedAt)}</div>
                <div>{t('colLastActivity')}: {relativeTime(node.lastActivity)}</div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function DevicesTab({
  devices,
  pendingDevices,
  onRefresh,
}: {
  devices: PairedDevice[]
  pendingDevices: PendingDevice[]
  onRefresh: () => void
}) {
  return (
    <div className="space-y-6">
      {pendingDevices.length > 0 && (
        <PendingDevicesSection devices={pendingDevices} onRefresh={onRefresh} />
      )}
      <PairedDevicesSection devices={devices} onRefresh={onRefresh} />
    </div>
  )
}

function PendingDevicesSection({
  devices,
  onRefresh,
}: {
  devices: PendingDevice[]
  onRefresh: () => void
}) {
  const t = useTranslations('nodes')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleAction(action: 'approve' | 'reject', requestId: string) {
    setActionError(null)
    setActionLoading(`${action}-${requestId}`)
    const result = await deviceAction(action, { requestId })
    setActionLoading(null)
    if (!result.ok) {
      setActionError(result.error || 'Action failed')
    } else {
      onRefresh()
    }
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-status-warning-fg mb-3 flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-status-warning-bg border border-status-warning-border text-[10px] font-bold text-status-warning-fg">
          {devices.length}
        </span>
        {t('pendingPairingRequests', { count: devices.length })}
      </h3>
      {actionError && (
        <div className="mb-3 px-4 py-2 rounded-xl bg-status-error-bg border border-status-error-border text-status-error-fg text-xs">
          {actionError}
        </div>
      )}
      <div className="space-y-2">
        {devices.map((device) => (
          <div
            key={device.requestId}
            className="flex items-center justify-between px-4 py-3 rounded-xl bg-status-warning-bg border border-status-warning-border"
          >
            <div>
              <span className="text-sm font-medium text-foreground">
                {device.displayName || device.deviceId}
              </span>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span className="font-mono px-1.5 py-0.5 rounded bg-card border border-border">
                  {device.deviceId?.slice(0, 16)}
                </span>
                {device.role && (
                  <span className="px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">
                    {device.role}
                  </span>
                )}
                {device.remoteIp && <span>{device.remoteIp}</span>}
                {device.isRepair && (
                  <span className="px-1.5 py-0.5 rounded-full bg-status-info-bg text-status-info-fg border border-status-info-border">
                    repair
                  </span>
                )}
                {device.ts && <span>{relativeTime(device.ts)}</span>}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                variant="ghost"
                className="text-status-success-fg hover:text-status-success-fg hover:bg-status-success-bg"
                disabled={actionLoading !== null}
                onClick={() => handleAction('approve', device.requestId)}
              >
                {actionLoading === `approve-${device.requestId}` ? t('approving') : t('approve')}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-status-error-fg hover:text-status-error-fg hover:bg-status-error-bg"
                disabled={actionLoading !== null}
                onClick={() => handleAction('reject', device.requestId)}
              >
                {actionLoading === `reject-${device.requestId}` ? t('rejecting') : t('reject')}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PairedDevicesSection({
  devices,
  onRefresh,
}: {
  devices: PairedDevice[]
  onRefresh: () => void
}) {
  const t = useTranslations('nodes')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null)
  const [expandedDevice, setExpandedDevice] = useState<string | null>(null)

  async function handleRotateToken(deviceId: string, role?: string) {
    setActionError(null)
    setActionLoading(`rotate-${deviceId}`)
    const result = await deviceAction('rotate-token', { deviceId, role })
    setActionLoading(null)
    if (!result.ok) {
      setActionError(result.error || 'Failed to rotate token')
    } else {
      onRefresh()
    }
  }

  async function handleRevokeToken(deviceId: string, role?: string) {
    setActionError(null)
    setActionLoading(`revoke-${deviceId}`)
    const result = await deviceAction('revoke-token', { deviceId, role })
    setActionLoading(null)
    setConfirmRevoke(null)
    if (!result.ok) {
      setActionError(result.error || 'Failed to revoke token')
    } else {
      onRefresh()
    }
  }

  if (devices.length === 0) {
    return (
      <div className="text-muted-foreground text-sm py-12 text-center">
        {t('noPairedDevices')}
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground mb-3">
        {t('pairedDevices', { count: devices.length })}
      </h3>
      {actionError && (
        <div className="mb-3 px-4 py-2 rounded-xl bg-status-error-bg border border-status-error-border text-status-error-fg text-xs">
          {actionError}
        </div>
      )}
      <div className="grid gap-3">
        {devices.map((device) => {
          const deviceKey = device.deviceId || device.id
          const isExpanded = expandedDevice === deviceKey
          const tokens = device.tokens || []

          return (
            <div
              key={device.id || device.deviceId}
              className="bg-card rounded-xl p-5 border border-border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              {/* Card header */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground text-sm">{device.displayName}</span>
                    {device.trusted ? (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium border bg-status-success-bg text-status-success-fg border-status-success-border">
                        {t('trusted')}
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium border bg-muted text-muted-foreground border-border">
                        {t('untrusted')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-surface-1 border border-border font-mono text-xs text-muted-foreground">
                      {(device.deviceId || device.id)?.slice(0, 12)}…
                    </span>
                    {(device.roles || []).map((role) => (
                      <span
                        key={role}
                        className="px-2 py-0.5 rounded-full text-xs bg-secondary text-muted-foreground"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground text-right shrink-0 space-y-0.5">
                  <div>{t('colPaired')}: {relativeTime(device.pairedAt || device.approvedAtMs || device.createdAtMs || 0)}</div>
                  <div>{t('colLastSeen')}: {device.lastSeen ? relativeTime(device.lastSeen) : '--'}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-1.5 pt-3 border-t border-border">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2.5 text-xs"
                  disabled={actionLoading !== null}
                  onClick={() => handleRotateToken(deviceKey)}
                >
                  {actionLoading === `rotate-${deviceKey}` ? '...' : t('rotateToken')}
                </Button>
                {confirmRevoke === deviceKey ? (
                  <div className="flex gap-1 items-center">
                    <span className="text-xs text-status-error-fg">{t('revokeConfirm')}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs text-status-error-fg hover:bg-status-error-bg"
                      disabled={actionLoading !== null}
                      onClick={() => handleRevokeToken(deviceKey)}
                    >
                      {actionLoading === `revoke-${deviceKey}` ? '...' : t('yes')}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={() => setConfirmRevoke(null)}
                    >
                      {t('no')}
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2.5 text-xs text-status-error-fg hover:bg-status-error-bg"
                    disabled={actionLoading !== null}
                    onClick={() => setConfirmRevoke(deviceKey)}
                  >
                    {t('revoke')}
                  </Button>
                )}
                {tokens.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2.5 text-xs text-muted-foreground ml-auto"
                    onClick={() => setExpandedDevice(isExpanded ? null : deviceKey)}
                  >
                    {isExpanded ? t('hideTokens') : t('tokens', { count: tokens.length })}
                  </Button>
                )}
              </div>

              {/* Token list */}
              {isExpanded && tokens.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {tokens.map((token, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-1 border border-border text-xs"
                    >
                      <span className="font-medium text-foreground">{token.role}</span>
                      {token.scopes && token.scopes.length > 0 && (
                        <span className="text-muted-foreground">
                          [{token.scopes.join(', ')}]
                        </span>
                      )}
                      {token.lastUsedAtMs && (
                        <span className="text-muted-foreground">
                          {t('tokenUsed', { time: relativeTime(token.lastUsedAtMs) })}
                        </span>
                      )}
                      {token.revokedAtMs && (
                        <span className="text-status-error-fg">{t('revoked')}</span>
                      )}
                      <div className="flex gap-1 ml-auto">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 px-1.5 text-[10px]"
                          disabled={actionLoading !== null}
                          onClick={() => handleRotateToken(deviceKey, token.role)}
                        >
                          {t('rotate')}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 px-1.5 text-[10px] text-status-error-fg hover:bg-status-error-bg"
                          disabled={actionLoading !== null || !!token.revokedAtMs}
                          onClick={() => handleRevokeToken(deviceKey, token.role)}
                        >
                          {t('revoke')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
