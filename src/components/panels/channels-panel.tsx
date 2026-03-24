'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { useMissionControl } from '@/store'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChannelStatus {
  configured: boolean
  linked?: boolean
  running: boolean
  connected?: boolean
  lastConnectedAt?: number | null
  lastMessageAt?: number | null
  lastStartAt?: number | null
  lastError?: string | null
  authAgeMs?: number | null
  mode?: string | null
  baseUrl?: string | null
  publicKey?: string | null
  probe?: { ok?: boolean; status?: number; error?: string; elapsedMs?: number; bot?: { username?: string; id?: string }; team?: { id?: string; name?: string }; webhook?: { url?: string }; version?: string }
  profile?: NostrProfile
}

interface ChannelAccount {
  accountId: string
  name?: string | null
  configured?: boolean | null
  linked?: boolean | null
  running?: boolean | null
  connected?: boolean | null
  lastConnectedAt?: number | null
  lastInboundAt?: number | null
  lastOutboundAt?: number | null
  lastError?: string | null
  lastStartAt?: number | null
  mode?: string | null
  probe?: { ok?: boolean; bot?: { username?: string }; [key: string]: unknown }
  publicKey?: string | null
  profile?: NostrProfile
}

interface NostrProfile {
  name?: string | null
  displayName?: string | null
  about?: string | null
  picture?: string | null
  banner?: string | null
  website?: string | null
  nip05?: string | null
  lud16?: string | null
}

interface ChannelsSnapshot {
  channels: Record<string, ChannelStatus>
  channelAccounts: Record<string, ChannelAccount[]>
  channelOrder: string[]
  channelLabels: Record<string, string>
  connected: boolean
  updatedAt?: number
}

type ActionResult = {
  ok?: boolean
  error?: string
  message?: string
  qrDataUrl?: string
  connected?: boolean
  persisted?: boolean
  merged?: NostrProfile
  imported?: NostrProfile
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PLATFORM_COLORS: Record<string, { bg: string; fg: string }> = {
  whatsapp:  { bg: 'bg-[#25D366]', fg: 'text-white' },
  telegram:  { bg: 'bg-[#0088CC]', fg: 'text-white' },
  discord:   { bg: 'bg-[#5865F2]', fg: 'text-white' },
  slack:     { bg: 'bg-[#E01E5A]', fg: 'text-white' },
  signal:    { bg: 'bg-[#3A76F0]', fg: 'text-white' },
  imessage:  { bg: 'bg-[#34C759]', fg: 'text-white' },
  nostr:     { bg: 'bg-[#8B5CF6]', fg: 'text-white' },
  'google-chat': { bg: 'bg-[#00AC47]', fg: 'text-white' },
  googlechat:    { bg: 'bg-[#00AC47]', fg: 'text-white' },
  'ms-teams':    { bg: 'bg-[#6264A7]', fg: 'text-white' },
}

const PLATFORM_ICONS: Record<string, string> = {
  whatsapp: '\u{1F4F1}',
  telegram: '\u2708',
  discord: '\u{1F3AE}',
  slack: '#',
  signal: '\u{1F512}',
  imessage: '\u{1F4AC}',
  nostr: '\u{1F310}',
  'google-chat': '\u{1F4E8}',
  googlechat: '\u{1F4E8}',
  'ms-teams': '\u{1F465}',
}

const PLATFORM_NAMES: Record<string, string> = {
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  discord: 'Discord',
  slack: 'Slack',
  signal: 'Signal',
  imessage: 'iMessage',
  nostr: 'Nostr',
  'google-chat': 'Google Chat',
  googlechat: 'Google Chat',
  'ms-teams': 'MS Teams',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function relativeTime(ts: number | null | undefined): string {
  if (ts == null) return 'n/a'
  const now = Date.now()
  const diff = Math.max(0, now - ts)
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatDuration(ms: number | null | undefined): string {
  if (ms == null) return 'n/a'
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

function truncatePubkey(pubkey: string | null | undefined): string {
  if (!pubkey) return 'n/a'
  if (pubkey.length <= 20) return pubkey
  return `${pubkey.slice(0, 8)}...${pubkey.slice(-8)}`
}

function yesNo(val: boolean | null | undefined): string {
  if (val == null) return 'n/a'
  return val ? 'Yes' : 'No'
}

function channelIsActive(status: ChannelStatus | undefined, accounts: ChannelAccount[]): boolean {
  if (!status) return false
  if (status.configured || status.running || status.connected) return true
  return accounts.some(a => a.configured || a.running || a.connected)
}

function channelIsConnected(status: ChannelStatus | undefined, accounts: ChannelAccount[]): boolean {
  if (status?.connected) return true
  return accounts.some(a => a.connected)
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function readActionResult(value: unknown): ActionResult | null {
  const record = asRecord(value)
  if (!record) return null

  const readProfile = (candidate: unknown): NostrProfile | undefined => {
    const profile = asRecord(candidate)
    if (!profile) return undefined
    return {
      name: typeof profile.name === 'string' ? profile.name : null,
      displayName: typeof profile.displayName === 'string' ? profile.displayName : null,
      about: typeof profile.about === 'string' ? profile.about : null,
      picture: typeof profile.picture === 'string' ? profile.picture : null,
      banner: typeof profile.banner === 'string' ? profile.banner : null,
      website: typeof profile.website === 'string' ? profile.website : null,
      nip05: typeof profile.nip05 === 'string' ? profile.nip05 : null,
      lud16: typeof profile.lud16 === 'string' ? profile.lud16 : null,
    }
  }

  return {
    ok: typeof record.ok === 'boolean' ? record.ok : undefined,
    error: typeof record.error === 'string' ? record.error : undefined,
    message: typeof record.message === 'string' ? record.message : undefined,
    qrDataUrl: typeof record.qrDataUrl === 'string' ? record.qrDataUrl : undefined,
    connected: typeof record.connected === 'boolean' ? record.connected : undefined,
    persisted: typeof record.persisted === 'boolean' ? record.persisted : undefined,
    merged: readProfile(record.merged),
    imported: readProfile(record.imported),
  }
}

// ---------------------------------------------------------------------------
// Filter type
// ---------------------------------------------------------------------------

type ChannelFilter = 'all' | 'connected' | 'disconnected'

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-[var(--space-1)]">
      <span className="text-[var(--text-xs)] text-[hsl(var(--text-muted))]">{label}</span>
      <span className="text-[var(--text-xs)] font-[var(--font-medium)] text-[hsl(var(--text-primary))]">{value}</span>
    </div>
  )
}

function StatsRow({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="flex divide-x divide-[hsl(var(--border-subtle))] mt-[var(--space-3)]">
      {items.map((item, i) => (
        <div key={i} className="flex-1 px-[var(--space-3)] first:pl-0 last:pr-0">
          <div className="text-[var(--text-md)] font-[var(--font-semibold)] text-[hsl(var(--text-primary))]">{item.value}</div>
          <div className="text-[var(--text-xs)] text-[hsl(var(--text-muted))]">{item.label}</div>
        </div>
      ))}
    </div>
  )
}

function ErrorCallout({ message }: { message: string | null | undefined }) {
  if (!message) return null
  return (
    <div className="text-[var(--text-xs)] text-[hsl(var(--status-error-fg))] bg-[hsl(var(--status-error-bg))] border border-[hsl(var(--status-error-border))] rounded-[var(--radius-md)] px-[var(--space-3)] py-[var(--space-2)] mt-[var(--space-3)] break-words">
      {message}
    </div>
  )
}

function ProbeResult({ probe }: { probe: ChannelStatus['probe'] }) {
  if (!probe) return null
  const ok = probe.ok
  return (
    <div className={`text-[var(--text-xs)] mt-[var(--space-3)] px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-md)] border ${ok ? 'text-[hsl(var(--status-success-fg))] bg-[hsl(var(--status-success-bg))] border-[hsl(var(--status-success-border))]' : 'text-[hsl(var(--status-error-fg))] bg-[hsl(var(--status-error-bg))] border-[hsl(var(--status-error-border))]'}`}>
      Probe {ok ? 'OK' : 'failed'}
      {probe.elapsedMs != null && ` \u2014 ${probe.elapsedMs}ms`}
      {probe.error && ` \u2014 ${probe.error}`}
    </div>
  )
}

function StatusBadge({ connected, running, configured, isActive }: { connected?: boolean; running?: boolean; configured?: boolean; isActive: boolean }) {
  const t = useTranslations('channels')
  let dotColor = 'bg-[hsl(var(--status-neutral-fg))]'
  let label = t('statusInactive')

  if (isActive) {
    if (connected) {
      dotColor = 'bg-[hsl(var(--status-success-solid))]'
      label = t('statusConnected')
    } else if (running) {
      dotColor = 'bg-[hsl(var(--status-warning-solid))]'
      label = t('statusRunning')
    } else if (configured) {
      dotColor = 'bg-[hsl(var(--text-muted))]'
      label = t('statusConfigured')
    }
  }

  return (
    <div className="flex items-center gap-[var(--space-1-5)]">
      <span className={`w-[var(--space-2)] h-[var(--space-2)] rounded-full ${dotColor}`} />
      <span className="text-[var(--text-xs)] text-[hsl(var(--text-muted))]">{label}</span>
    </div>
  )
}

function PlatformIcon({ platform }: { platform: string }) {
  const colors = PLATFORM_COLORS[platform] ?? { bg: 'bg-[hsl(var(--interactive-primary))]', fg: 'text-white' }
  const icon = PLATFORM_ICONS[platform] ?? '\u{1F4E1}'
  return (
    <div className={`w-[var(--space-10)] h-[var(--space-10)] rounded-[var(--radius-lg)] ${colors.bg} flex items-center justify-center text-[var(--text-lg)] ${colors.fg} shrink-0`}>
      {icon}
    </div>
  )
}

function CardShell({ platform, label, children, status, accounts, onProbe, probing }: {
  platform: string
  label?: string
  children: React.ReactNode
  status?: ChannelStatus
  accounts?: ChannelAccount[]
  onProbe: () => void
  probing: boolean
}) {
  const t = useTranslations('channels')
  const name = label || (PLATFORM_NAMES[platform] ?? platform)
  const accts = accounts ?? []
  const isActive = channelIsActive(status, accts)
  const isConnected = channelIsConnected(status, accts)

  return (
    <div className={`rounded-[var(--card-radius)] border border-[hsl(var(--card-border))] bg-[hsl(var(--card-bg))] shadow-[var(--card-shadow)] overflow-hidden transition-shadow hover:shadow-[var(--card-shadow-hover)] ${isConnected ? 'border-l-[3px] border-l-[hsl(var(--status-success-solid))]' : ''} ${!isActive ? 'opacity-75' : ''}`}>
      <div className="p-[var(--space-5)]">
        {/* Card header: icon + name + status badge */}
        <div className="flex items-start justify-between mb-[var(--space-4)]">
          <div className="flex items-center gap-[var(--space-3)]">
            <PlatformIcon platform={platform} />
            <div>
              <div className="text-[var(--text-md)] font-[var(--font-semibold)] text-[hsl(var(--text-primary))]">{name}</div>
              <div className="text-[var(--text-xs)] text-[hsl(var(--text-muted))] capitalize">{platform.replace(/-/g, ' ')}</div>
            </div>
          </div>
          <StatusBadge connected={status?.connected} running={status?.running} configured={status?.configured} isActive={isActive} />
        </div>

        {/* Card body */}
        {children}

        {/* Probe button */}
        <Button
          onClick={onProbe}
          disabled={probing}
          variant="outline"
          size="xs"
          className="w-full mt-[var(--space-4)]"
        >
          {probing ? (
            <>
              <span className="w-[var(--space-3)] h-[var(--space-3)] border-2 border-current border-t-transparent rounded-full animate-spin" />
              {t('probing')}
            </>
          ) : t('probe')}
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Per-Platform Cards
// ---------------------------------------------------------------------------

function WhatsAppCard({ status, accounts, onProbe, probing, onAction, actionBusy }: PlatformCardProps) {
  const t = useTranslations('channels')
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleLink = async (force: boolean) => {
    setMessage(null)
    setQrDataUrl(null)
    const res = readActionResult(await onAction('whatsapp-link', { force }))
    if (res) {
      setMessage(res.message ?? null)
      setQrDataUrl(res.qrDataUrl ?? null)
    }
  }

  const handleWait = async () => {
    setMessage(null)
    const res = readActionResult(await onAction('whatsapp-wait', {}))
    if (res) {
      setMessage(res.message ?? null)
      if (res.connected) setQrDataUrl(null)
    }
  }

  const handleLogout = async () => {
    setMessage(null)
    setQrDataUrl(null)
    await onAction('whatsapp-logout', {})
    setMessage(t('loggedOut'))
  }

  return (
    <CardShell platform="whatsapp" status={status} accounts={accounts} onProbe={onProbe} probing={probing}>
      <StatsRow items={[
        { label: 'Last connect', value: relativeTime(status?.lastConnectedAt) },
        { label: 'Last message', value: relativeTime(status?.lastMessageAt) },
        { label: 'Auth age', value: formatDuration(status?.authAgeMs) },
      ]} />

      <div className="mt-[var(--space-3)] space-y-[var(--space-1)] border-t border-[hsl(var(--border-subtle))] pt-[var(--space-3)]">
        <StatusRow label="Configured" value={yesNo(status?.configured)} />
        <StatusRow label="Linked" value={yesNo(status?.linked)} />
        <StatusRow label="Running" value={yesNo(status?.running)} />
        <StatusRow label="Connected" value={yesNo(status?.connected)} />
      </div>

      <ErrorCallout message={status?.lastError} />

      {message && (
        <div className="text-[var(--text-xs)] text-[hsl(var(--text-muted))] bg-[hsl(var(--bg-subtle))] rounded-[var(--radius-md)] px-[var(--space-3)] py-[var(--space-2)] mt-[var(--space-3)]">
          {message}
        </div>
      )}

      {qrDataUrl && (
        <div className="flex justify-center mt-[var(--space-4)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="WhatsApp QR" className="w-48 h-48 rounded-[var(--radius-md)]" />
        </div>
      )}

      <div className="flex flex-wrap gap-[var(--space-2)] mt-[var(--space-3)]">
        <Button onClick={() => handleLink(false)} disabled={actionBusy} variant="outline" size="xs">
          {t('showQr')}
        </Button>
        <Button onClick={() => handleLink(true)} disabled={actionBusy} variant="outline" size="xs">
          {t('relink')}
        </Button>
        <Button onClick={handleWait} disabled={actionBusy} variant="outline" size="xs">
          {t('waitForScan')}
        </Button>
        <Button onClick={handleLogout} disabled={actionBusy} variant="destructive" size="xs">
          {t('logout')}
        </Button>
      </div>

      {accounts.length > 0 && <AccountList accounts={accounts} />}
    </CardShell>
  )
}

function TelegramCard({ status, accounts, onProbe, probing }: PlatformCardProps) {
  const botUsername = status?.probe?.bot?.username

  return (
    <CardShell platform="telegram" status={status} accounts={accounts} onProbe={onProbe} probing={probing}>
      <StatsRow items={[
        { label: 'Mode', value: status?.mode ?? 'n/a' },
        { label: 'Last start', value: relativeTime(status?.lastStartAt) },
        ...(botUsername ? [{ label: 'Bot', value: `@${botUsername}` }] : []),
      ]} />

      <div className="mt-[var(--space-3)] space-y-[var(--space-1)] border-t border-[hsl(var(--border-subtle))] pt-[var(--space-3)]">
        <StatusRow label="Configured" value={yesNo(status?.configured)} />
        <StatusRow label="Running" value={yesNo(status?.running)} />
      </div>

      <ErrorCallout message={status?.lastError} />
      <ProbeResult probe={status?.probe} />
      {accounts.length > 1 && <AccountList accounts={accounts} />}
    </CardShell>
  )
}

function DiscordCard({ status, accounts, onProbe, probing }: PlatformCardProps) {
  const botUsername = status?.probe?.bot?.username

  return (
    <CardShell platform="discord" status={status} accounts={accounts} onProbe={onProbe} probing={probing}>
      <StatsRow items={[
        { label: 'Last start', value: relativeTime(status?.lastStartAt) },
        ...(botUsername ? [{ label: 'Bot', value: botUsername }] : [{ label: 'Bot', value: 'n/a' }]),
      ]} />

      <div className="mt-[var(--space-3)] space-y-[var(--space-1)] border-t border-[hsl(var(--border-subtle))] pt-[var(--space-3)]">
        <StatusRow label="Configured" value={yesNo(status?.configured)} />
        <StatusRow label="Running" value={yesNo(status?.running)} />
      </div>

      <ErrorCallout message={status?.lastError} />
      <ProbeResult probe={status?.probe} />
      {accounts.length > 1 && <AccountList accounts={accounts} />}
    </CardShell>
  )
}

function SlackCard({ status, accounts, onProbe, probing }: PlatformCardProps) {
  const teamName = status?.probe?.team?.name
  const botName = status?.probe?.bot?.username

  return (
    <CardShell platform="slack" status={status} accounts={accounts} onProbe={onProbe} probing={probing}>
      <StatsRow items={[
        { label: 'Workspace', value: teamName ?? 'n/a' },
        { label: 'Bot', value: botName ?? 'n/a' },
        { label: 'Last start', value: relativeTime(status?.lastStartAt) },
      ]} />

      <div className="mt-[var(--space-3)] space-y-[var(--space-1)] border-t border-[hsl(var(--border-subtle))] pt-[var(--space-3)]">
        <StatusRow label="Configured" value={yesNo(status?.configured)} />
        <StatusRow label="Running" value={yesNo(status?.running)} />
      </div>

      <ErrorCallout message={status?.lastError} />
      <ProbeResult probe={status?.probe} />
      {accounts.length > 1 && <AccountList accounts={accounts} />}
    </CardShell>
  )
}

function SignalCard({ status, accounts, onProbe, probing }: PlatformCardProps) {
  return (
    <CardShell platform="signal" status={status} accounts={accounts} onProbe={onProbe} probing={probing}>
      <StatsRow items={[
        { label: 'Base URL', value: status?.baseUrl ?? 'n/a' },
        { label: 'Last start', value: relativeTime(status?.lastStartAt) },
      ]} />

      <div className="mt-[var(--space-3)] space-y-[var(--space-1)] border-t border-[hsl(var(--border-subtle))] pt-[var(--space-3)]">
        <StatusRow label="Configured" value={yesNo(status?.configured)} />
        <StatusRow label="Running" value={yesNo(status?.running)} />
      </div>

      <ErrorCallout message={status?.lastError} />
      <ProbeResult probe={status?.probe} />
      {accounts.length > 1 && <AccountList accounts={accounts} />}
    </CardShell>
  )
}

function NostrCard({ status, accounts, onProbe, probing, onAction, actionBusy }: PlatformCardProps) {
  const t = useTranslations('channels')
  const primaryAccount = accounts[0]
  const profile: NostrProfile | null = primaryAccount?.profile ?? status?.profile ?? null
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState<NostrProfile>({})
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const openProfileForm = () => {
    setProfileForm({
      name: profile?.name ?? '',
      displayName: profile?.displayName ?? '',
      about: profile?.about ?? '',
      picture: profile?.picture ?? '',
      banner: profile?.banner ?? '',
      website: profile?.website ?? '',
      nip05: profile?.nip05 ?? '',
      lud16: profile?.lud16 ?? '',
    })
    setShowAdvanced(Boolean(profile?.banner || profile?.website || profile?.nip05 || profile?.lud16))
    setProfileMessage(null)
    setEditingProfile(true)
  }

  const handleProfileSave = async () => {
    setProfileSaving(true)
    setProfileMessage(null)
    const accountId = primaryAccount?.accountId ?? 'default'
    const res = readActionResult(await onAction('nostr-profile-save', { accountId, profile: profileForm }))
    setProfileSaving(false)
    if (res?.ok !== false && res?.persisted) {
      setProfileMessage(t('profilePublished'))
      setEditingProfile(false)
    } else {
      setProfileMessage(res?.error ?? t('saveFailed'))
    }
  }

  const handleProfileImport = async () => {
    setProfileSaving(true)
    setProfileMessage(null)
    const accountId = primaryAccount?.accountId ?? 'default'
    const res = readActionResult(await onAction('nostr-profile-import', { accountId }))
    setProfileSaving(false)
    if (res?.merged || res?.imported) {
      const merged = res.merged ?? res.imported
      setProfileForm(prev => ({ ...prev, ...merged }))
      setProfileMessage(t('profileImported'))
    } else {
      setProfileMessage(res?.error ?? t('importFailed'))
    }
  }

  return (
    <CardShell platform="nostr" status={status} accounts={accounts} onProbe={onProbe} probing={probing}>
      <StatsRow items={[
        { label: 'Public Key', value: truncatePubkey(status?.publicKey ?? primaryAccount?.publicKey) },
        { label: 'Last start', value: relativeTime(status?.lastStartAt) },
      ]} />

      <div className="mt-[var(--space-3)] space-y-[var(--space-1)] border-t border-[hsl(var(--border-subtle))] pt-[var(--space-3)]">
        <StatusRow label="Configured" value={yesNo(status?.configured)} />
        <StatusRow label="Running" value={yesNo(status?.running)} />
      </div>

      <ErrorCallout message={status?.lastError} />

      {/* Profile Section */}
      {!editingProfile ? (
        <div className="mt-[var(--space-3)] p-[var(--space-3)] bg-[hsl(var(--bg-subtle))] rounded-[var(--radius-md)]">
          <div className="flex justify-between items-center mb-[var(--space-2)]">
            <span className="text-[var(--text-xs)] font-[var(--font-medium)] text-[hsl(var(--text-primary))]">{t('profile')}</span>
            {status?.configured && (
              <Button onClick={openProfileForm} variant="ghost" size="xs" className="h-5 text-[10px] px-[var(--space-2)]">
                {t('edit')}
              </Button>
            )}
          </div>
          {profile?.displayName || profile?.name ? (
            <div className="space-y-[var(--space-1)]">
              {profile.displayName && <StatusRow label={t('displayName')} value={profile.displayName} />}
              {profile.name && <StatusRow label={t('username')} value={profile.name} />}
              {profile.about && <StatusRow label={t('about')} value={profile.about.slice(0, 80)} />}
              {profile.nip05 && <StatusRow label="NIP-05" value={profile.nip05} />}
            </div>
          ) : (
            <span className="text-[var(--text-xs)] text-[hsl(var(--text-muted))]">{t('noProfileSet')}</span>
          )}
        </div>
      ) : (
        <div className="mt-[var(--space-3)] p-[var(--space-3)] bg-[hsl(var(--bg-subtle))] rounded-[var(--radius-md)] space-y-[var(--space-2)]">
          <div className="text-[var(--text-xs)] font-[var(--font-medium)] text-[hsl(var(--text-primary))]">{t('editProfile')}</div>
          {profileMessage && (
            <div className="text-[var(--text-xs)] text-[hsl(var(--text-muted))] bg-[hsl(var(--bg-surface))] rounded-[var(--radius-sm)] px-[var(--space-2)] py-[var(--space-1)]">{profileMessage}</div>
          )}
          <ProfileField label={t('username')} value={profileForm.name ?? ''} onChange={v => setProfileForm(p => ({ ...p, name: v }))} disabled={profileSaving} />
          <ProfileField label={t('displayName')} value={profileForm.displayName ?? ''} onChange={v => setProfileForm(p => ({ ...p, displayName: v }))} disabled={profileSaving} />
          <ProfileField label={t('bio')} value={profileForm.about ?? ''} onChange={v => setProfileForm(p => ({ ...p, about: v }))} disabled={profileSaving} multiline />
          <ProfileField label={t('avatarUrl')} value={profileForm.picture ?? ''} onChange={v => setProfileForm(p => ({ ...p, picture: v }))} disabled={profileSaving} />
          {showAdvanced && (
            <>
              <ProfileField label={t('bannerUrl')} value={profileForm.banner ?? ''} onChange={v => setProfileForm(p => ({ ...p, banner: v }))} disabled={profileSaving} />
              <ProfileField label={t('website')} value={profileForm.website ?? ''} onChange={v => setProfileForm(p => ({ ...p, website: v }))} disabled={profileSaving} />
              <ProfileField label="NIP-05" value={profileForm.nip05 ?? ''} onChange={v => setProfileForm(p => ({ ...p, nip05: v }))} disabled={profileSaving} />
              <ProfileField label={t('lightning')} value={profileForm.lud16 ?? ''} onChange={v => setProfileForm(p => ({ ...p, lud16: v }))} disabled={profileSaving} />
            </>
          )}
          <div className="flex flex-wrap gap-[var(--space-2)]">
            <Button onClick={handleProfileSave} disabled={profileSaving || actionBusy} variant="default" size="xs">
              {profileSaving ? t('saving') : t('saveAndPublish')}
            </Button>
            <Button onClick={handleProfileImport} disabled={profileSaving || actionBusy} variant="outline" size="xs">
              {t('importFromRelays')}
            </Button>
            <Button onClick={() => setShowAdvanced(!showAdvanced)} variant="outline" size="xs">
              {showAdvanced ? t('hideAdvanced') : t('showAdvanced')}
            </Button>
            <Button onClick={() => setEditingProfile(false)} disabled={profileSaving} variant="ghost" size="xs">
              {t('cancel')}
            </Button>
          </div>
        </div>
      )}

      {accounts.length > 1 && <AccountList accounts={accounts} />}
    </CardShell>
  )
}

function GenericChannelCard({ platform, label, status, accounts, onProbe, probing }: PlatformCardProps & { label?: string }) {
  return (
    <CardShell platform={platform} label={label} status={status} accounts={accounts} onProbe={onProbe} probing={probing}>
      <StatsRow items={[
        { label: 'Last start', value: relativeTime(status?.lastStartAt) },
        { label: 'Connected', value: yesNo(status?.connected) },
      ]} />

      <div className="mt-[var(--space-3)] space-y-[var(--space-1)] border-t border-[hsl(var(--border-subtle))] pt-[var(--space-3)]">
        <StatusRow label="Configured" value={yesNo(status?.configured)} />
        <StatusRow label="Running" value={yesNo(status?.running)} />
      </div>

      <ErrorCallout message={status?.lastError} />
      <ProbeResult probe={status?.probe} />
      {accounts.length > 0 && <AccountList accounts={accounts} />}
    </CardShell>
  )
}

// ---------------------------------------------------------------------------
// Shared sub-components (continued)
// ---------------------------------------------------------------------------

function ProfileField({ label, value, onChange, disabled, multiline }: {
  label: string; value: string; onChange: (v: string) => void; disabled: boolean; multiline?: boolean
}) {
  const baseInputClasses = "w-full bg-[hsl(var(--bg-surface-raised))] border border-[hsl(var(--input-border))] rounded-[var(--input-radius)] px-[var(--space-2)] py-[var(--space-1)] text-[var(--text-xs)] text-[hsl(var(--input-text))] focus:outline-none focus:border-[hsl(var(--input-border-focus))]"
  return (
    <div>
      <label className="text-[10px] text-[hsl(var(--text-muted))] mb-[var(--space-0-5)] block">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          rows={2}
          className={`${baseInputClasses} resize-y`}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className={baseInputClasses}
        />
      )}
    </div>
  )
}

function AccountList({ accounts }: { accounts: ChannelAccount[] }) {
  const t = useTranslations('channels')
  return (
    <div className="mt-[var(--space-4)] space-y-[var(--space-2)]">
      <div className="text-[10px] text-[hsl(var(--text-muted))] font-[var(--font-medium)] uppercase tracking-wider">
        {t('accounts', { count: accounts.length })}
      </div>
      {accounts.map(acct => (
        <div key={acct.accountId} className="p-[var(--space-3)] bg-[hsl(var(--bg-subtle))] rounded-[var(--radius-md)] space-y-[var(--space-1)]">
          <div className="flex justify-between items-center">
            <span className="text-[var(--text-xs)] font-[var(--font-medium)] text-[hsl(var(--text-primary))]">{acct.name || acct.accountId}</span>
            <span className="text-[10px] text-[hsl(var(--text-muted))]">{acct.accountId}</span>
          </div>
          <StatusRow label="Running" value={yesNo(acct.running)} />
          <StatusRow label="Configured" value={yesNo(acct.configured)} />
          <StatusRow label="Connected" value={yesNo(acct.connected)} />
          {acct.lastInboundAt && <StatusRow label="Last inbound" value={relativeTime(acct.lastInboundAt)} />}
          {acct.lastError && (
            <div className="text-[var(--text-xs)] text-[hsl(var(--status-error-fg))] break-words mt-[var(--space-1)]">{acct.lastError}</div>
          )}
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section Header
// ---------------------------------------------------------------------------

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-[var(--space-3)] mb-[var(--space-4)]">
      <span className="text-[var(--text-xs)] font-[var(--font-semibold)] text-[hsl(var(--text-muted))] uppercase tracking-wider">{label}</span>
      <span className="text-[var(--text-xs)] font-[var(--font-medium)] text-[hsl(var(--text-muted))]">{count}</span>
      <div className="flex-1 h-px bg-[hsl(var(--border-default))]" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Filter Tabs
// ---------------------------------------------------------------------------

function FilterTabs({ active, onChange, counts }: {
  active: ChannelFilter
  onChange: (f: ChannelFilter) => void
  counts: { all: number; connected: number; disconnected: number }
}) {
  const filters: { key: ChannelFilter; label: string; dot?: string }[] = [
    { key: 'all', label: `All Channels` },
    { key: 'connected', label: `Connected`, dot: 'bg-[hsl(var(--status-success-solid))]' },
    { key: 'disconnected', label: `Disconnected`, dot: 'bg-[hsl(var(--text-muted))]' },
  ]

  return (
    <div className="flex items-center gap-[var(--space-2)] mb-[var(--space-6)]">
      {filters.map(f => {
        const isActive = active === f.key
        const count = counts[f.key]
        return (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            className={`flex items-center gap-[var(--space-1-5)] px-[var(--space-4)] py-[var(--space-2)] rounded-full text-[var(--text-sm)] font-[var(--font-medium)] transition-colors ${
              isActive
                ? 'bg-[hsl(var(--interactive-primary))] text-[hsl(var(--interactive-primary-fg))]'
                : 'bg-[hsl(var(--bg-subtle))] text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--interactive-secondary-hover))]'
            }`}
          >
            {f.dot && <span className={`w-[6px] h-[6px] rounded-full ${f.dot}`} />}
            {f.label}
            <span className={`ml-[var(--space-0-5)] text-[var(--text-xs)] ${isActive ? 'opacity-80' : 'opacity-60'}`}>{count}</span>
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Card Props
// ---------------------------------------------------------------------------

interface PlatformCardProps {
  platform: string
  status?: ChannelStatus
  accounts: ChannelAccount[]
  onProbe: () => void
  probing: boolean
  onAction: (action: string, params: Record<string, unknown>) => Promise<unknown>
  actionBusy: boolean
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ChannelsPanel() {
  const t = useTranslations('channels')
  const { connection } = useMissionControl()
  const [snapshot, setSnapshot] = useState<ChannelsSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [probing, setProbing] = useState<string | null>(null)
  const [actionBusy, setActionBusy] = useState(false)
  const [filter, setFilter] = useState<ChannelFilter>('all')

  const fetchChannels = useCallback(async () => {
    try {
      const res = await fetch('/api/channels')
      if (res.status === 401 || res.status === 403) {
        setError('Authentication required')
        return
      }
      if (!res.ok) {
        setError('Failed to load channels')
        return
      }
      const data: ChannelsSnapshot = await res.json()
      setSnapshot(data)
      setError(null)
    } catch {
      setError('Failed to load channels')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchChannels()
    const interval = setInterval(fetchChannels, 30000)
    return () => clearInterval(interval)
  }, [fetchChannels])

  const handleProbe = async (channelId: string) => {
    setProbing(channelId)
    try {
      await fetch(`/api/channels?action=probe&channel=${encodeURIComponent(channelId)}`)
      await fetchChannels()
    } catch {
      // next poll will refresh
    } finally {
      setProbing(null)
    }
  }

  const handleAction = async (action: string, params: Record<string, unknown>): Promise<unknown> => {
    setActionBusy(true)
    try {
      const res = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...params }),
      })
      const data = await res.json()
      // Refresh channel data after action
      await fetchChannels()
      return data
    } catch {
      return null
    } finally {
      setActionBusy(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="p-[var(--space-6)]">
        <div className="flex items-center gap-[var(--space-3)] mb-[var(--space-6)]">
          <div className="w-[var(--space-4)] h-[var(--space-4)] border-2 border-[hsl(var(--interactive-primary))] border-t-transparent rounded-full animate-spin" />
          <span className="text-[var(--text-sm)] text-[hsl(var(--text-muted))]">{t('loadingChannels')}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[var(--space-5)]">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-[var(--card-radius)] border border-[hsl(var(--card-border))] bg-[hsl(var(--card-bg))] p-[var(--space-5)] animate-pulse">
              <div className="flex items-center gap-[var(--space-3)] mb-[var(--space-4)]">
                <div className="w-[var(--space-10)] h-[var(--space-10)] rounded-[var(--radius-lg)] bg-[hsl(var(--bg-subtle))]" />
                <div>
                  <div className="h-4 bg-[hsl(var(--bg-subtle))] rounded w-24 mb-[var(--space-1)]" />
                  <div className="h-3 bg-[hsl(var(--bg-subtle))] rounded w-16" />
                </div>
              </div>
              <div className="h-3 bg-[hsl(var(--bg-subtle))] rounded w-1/3 mb-[var(--space-2)]" />
              <div className="h-3 bg-[hsl(var(--bg-subtle))] rounded w-1/4" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="p-[var(--space-6)]">
        <div className="bg-[hsl(var(--status-error-bg))] text-[hsl(var(--status-error-fg))] border border-[hsl(var(--status-error-border))] rounded-[var(--card-radius)] p-[var(--space-4)] text-[var(--text-sm)]">{error}</div>
      </div>
    )
  }

  const channelOrder = snapshot?.channelOrder ?? []
  const channels = snapshot?.channels ?? {}
  const channelAccounts = snapshot?.channelAccounts ?? {}
  const channelLabels = snapshot?.channelLabels ?? {}
  const gatewayConnected = snapshot?.connected ?? connection.isConnected

  // Partition into connected / disconnected
  const connectedKeys: string[] = []
  const disconnectedKeys: string[] = []
  for (const key of channelOrder) {
    const status = channels[key]
    const accts = channelAccounts[key] ?? []
    if (channelIsConnected(status, accts)) {
      connectedKeys.push(key)
    } else {
      disconnectedKeys.push(key)
    }
  }

  const counts = {
    all: channelOrder.length,
    connected: connectedKeys.length,
    disconnected: disconnectedKeys.length,
  }

  const showConnected = filter === 'all' || filter === 'connected'
  const showDisconnected = filter === 'all' || filter === 'disconnected'

  const renderCard = (key: string) => {
    const status = channels[key]
    const accounts = channelAccounts[key] ?? []
    const label = channelLabels[key]
    const isPlatformProbing = probing === key

    const cardProps: PlatformCardProps = {
      platform: key,
      status,
      accounts,
      onProbe: () => handleProbe(key),
      probing: isPlatformProbing,
      onAction: handleAction,
      actionBusy,
    }

    switch (key) {
      case 'whatsapp':
        return <WhatsAppCard key={key} {...cardProps} />
      case 'telegram':
        return <TelegramCard key={key} {...cardProps} />
      case 'discord':
        return <DiscordCard key={key} {...cardProps} />
      case 'slack':
        return <SlackCard key={key} {...cardProps} />
      case 'signal':
        return <SignalCard key={key} {...cardProps} />
      case 'nostr':
        return <NostrCard key={key} {...cardProps} />
      default:
        return <GenericChannelCard key={key} {...cardProps} label={label} />
    }
  }

  return (
    <div className="p-[var(--space-6)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-[var(--space-2)]">
        <div>
          <h2 className="text-[var(--text-2xl)] font-[var(--font-bold)] text-[hsl(var(--text-primary))]">{t('title')}</h2>
          <p className="text-[var(--text-sm)] text-[hsl(var(--text-muted))] mt-[var(--space-1)]">
            {gatewayConnected ? t('gatewayConnected') : t('gatewayDisconnected')}
          </p>
        </div>
        <Button
          onClick={() => { setLoading(true); fetchChannels() }}
          variant="outline"
          size="sm"
        >
          {t('refresh')}
        </Button>
      </div>

      {/* Gateway status indicator */}
      <div className="flex items-center gap-[var(--space-1-5)] mb-[var(--space-5)]">
        <span className={`w-[var(--space-2)] h-[var(--space-2)] rounded-full ${gatewayConnected ? 'bg-[hsl(var(--status-success-solid))]' : 'bg-[hsl(var(--status-error-solid))]'}`} />
        <span className="text-[var(--text-xs)] text-[hsl(var(--text-muted))]">
          {gatewayConnected ? t('gatewayConnected') : t('gatewayDisconnected')}
        </span>
      </div>

      {/* Filter tabs */}
      <FilterTabs active={filter} onChange={setFilter} counts={counts} />

      {/* Channel cards */}
      {channelOrder.length === 0 ? (
        <div className="text-center py-[var(--space-16)]">
          <p className="text-[var(--text-sm)] text-[hsl(var(--text-muted))]">
            {gatewayConnected
              ? t('noChannelsConfigured')
              : t('gatewayUnreachable')}
          </p>
        </div>
      ) : (
        <div className="space-y-[var(--space-6)]">
          {/* Connected section */}
          {showConnected && connectedKeys.length > 0 && (
            <div>
              <SectionHeader label="Connected" count={connectedKeys.length} />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[var(--space-5)]">
                {connectedKeys.map(key => renderCard(key))}
              </div>
            </div>
          )}

          {/* Disconnected section */}
          {showDisconnected && disconnectedKeys.length > 0 && (
            <div>
              <SectionHeader label="Disconnected" count={disconnectedKeys.length} />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[var(--space-5)]">
                {disconnectedKeys.map(key => renderCard(key))}
              </div>
            </div>
          )}

          {/* Empty state for filtered views */}
          {filter === 'connected' && connectedKeys.length === 0 && (
            <div className="text-center py-[var(--space-12)]">
              <p className="text-[var(--text-sm)] text-[hsl(var(--text-muted))]">{t('noChannelsConfigured')}</p>
            </div>
          )}
          {filter === 'disconnected' && disconnectedKeys.length === 0 && (
            <div className="text-center py-[var(--space-12)]">
              <p className="text-[var(--text-sm)] text-[hsl(var(--text-muted))]">{t('noChannelsConfigured')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
