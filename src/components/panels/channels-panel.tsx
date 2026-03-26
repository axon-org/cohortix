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
    <div className="flex justify-between items-center py-0.5">
      <span className="text-[11px] text-[var(--muted-foreground)]">{label}</span>
      <span className="text-[11px] font-medium text-[var(--foreground)]">{value}</span>
    </div>
  )
}

function StatsRow({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="flex items-center gap-4 text-[11px] text-[var(--muted-foreground)]">
      {items.map((item, i) => (
        <span key={i}>{item.label}: {item.value}</span>
      ))}
    </div>
  )
}

function ErrorCallout({ message }: { message: string | null | undefined }) {
  if (!message) return null
  return (
    <div className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-3 break-words">
      {message}
    </div>
  )
}

function ProbeResult({ probe }: { probe: ChannelStatus['probe'] }) {
  if (!probe) return null
  const ok = probe.ok
  return (
    <div className={`text-[11px] mt-3 px-3 py-2 rounded-lg border ${ok ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-red-700 bg-red-50 border-red-200'}`}>
      Probe {ok ? 'OK' : 'failed'}
      {probe.elapsedMs != null && ` \u2014 ${probe.elapsedMs}ms`}
      {probe.error && ` \u2014 ${probe.error}`}
    </div>
  )
}

function StatusBadge({ connected, running, configured, isActive }: { connected?: boolean; running?: boolean; configured?: boolean; isActive: boolean }) {
  const t = useTranslations('channels')
  let badgeClasses = 'bg-[var(--muted)] text-[var(--muted-foreground)] border border-[var(--border)]'
  let label = t('statusInactive')

  if (isActive) {
    if (connected) {
      badgeClasses = 'bg-emerald-50 text-emerald-700 border border-emerald-200'
      label = t('statusConnected')
    } else if (running) {
      badgeClasses = 'bg-amber-50 text-amber-700 border border-amber-200'
      label = t('statusRunning')
    } else if (configured) {
      badgeClasses = 'bg-amber-50 text-amber-700 border border-amber-200'
      label = t('statusConfigured')
    }
  }

  return (
    <span className={`text-[10px] font-semibold rounded-full px-2.5 py-1 ${badgeClasses}`}>
      {label}
    </span>
  )
}

function PlatformIcon({ platform }: { platform: string }) {
  const colors = PLATFORM_COLORS[platform] ?? { bg: 'bg-[#6C5CE7]', fg: 'text-white' }
  const icon = PLATFORM_ICONS[platform] ?? '\u{1F4E1}'
  return (
    <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center text-lg ${colors.fg} shrink-0`}>
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
    <div className={`group rounded-xl border bg-[var(--card)] p-4 transition-all duration-150 shadow-sm hover:shadow-md border-[var(--border)] ${!isActive ? 'opacity-75' : ''}`}>
      {/* Card header: icon + name + status badge */}
      <div className="flex items-center gap-3 mb-3">
        <PlatformIcon platform={platform} />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-[var(--foreground)] truncate">{name}</p>
          <p className="text-[11px] text-[var(--muted-foreground)] capitalize">{platform.replace(/-/g, ' ')}</p>
        </div>
        <StatusBadge connected={status?.connected} running={status?.running} configured={status?.configured} isActive={isActive} />
      </div>

      {/* Card body */}
      {children}

      {/* Action row */}
      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-[var(--border)]">
        <button
          onClick={onProbe}
          disabled={probing}
          className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
        >
          {probing ? (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              {t('probing')}
            </span>
          ) : t('probe')}
        </button>
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

      <div className="mt-3 space-y-0.5 border-t border-[var(--border)] pt-3">
        <StatusRow label="Configured" value={yesNo(status?.configured)} />
        <StatusRow label="Linked" value={yesNo(status?.linked)} />
        <StatusRow label="Running" value={yesNo(status?.running)} />
        <StatusRow label="Connected" value={yesNo(status?.connected)} />
      </div>

      <ErrorCallout message={status?.lastError} />

      {message && (
        <div className="text-[11px] text-[var(--muted-foreground)] bg-[var(--muted)] rounded-lg px-3 py-2 mt-3">
          {message}
        </div>
      )}

      {qrDataUrl && (
        <div className="flex justify-center mt-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="WhatsApp QR" className="w-48 h-48 rounded-lg" />
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-3">
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

      <div className="mt-3 space-y-0.5 border-t border-[var(--border)] pt-3">
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

      <div className="mt-3 space-y-0.5 border-t border-[var(--border)] pt-3">
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

      <div className="mt-3 space-y-0.5 border-t border-[var(--border)] pt-3">
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

      <div className="mt-3 space-y-0.5 border-t border-[var(--border)] pt-3">
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

      <div className="mt-3 space-y-0.5 border-t border-[var(--border)] pt-3">
        <StatusRow label="Configured" value={yesNo(status?.configured)} />
        <StatusRow label="Running" value={yesNo(status?.running)} />
      </div>

      <ErrorCallout message={status?.lastError} />

      {/* Profile Section */}
      {!editingProfile ? (
        <div className="mt-3 p-3 bg-[var(--muted)]/60 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-medium text-[var(--foreground)]">{t('profile')}</span>
            {status?.configured && (
              <Button onClick={openProfileForm} variant="ghost" size="xs" className="h-5 text-[10px] px-2">
                {t('edit')}
              </Button>
            )}
          </div>
          {profile?.displayName || profile?.name ? (
            <div className="space-y-0.5">
              {profile.displayName && <StatusRow label={t('displayName')} value={profile.displayName} />}
              {profile.name && <StatusRow label={t('username')} value={profile.name} />}
              {profile.about && <StatusRow label={t('about')} value={profile.about.slice(0, 80)} />}
              {profile.nip05 && <StatusRow label="NIP-05" value={profile.nip05} />}
            </div>
          ) : (
            <span className="text-[11px] text-[var(--muted-foreground)]">{t('noProfileSet')}</span>
          )}
        </div>
      ) : (
        <div className="mt-3 p-3 bg-[var(--muted)]/60 rounded-lg space-y-2">
          <div className="text-[11px] font-medium text-[var(--foreground)]">{t('editProfile')}</div>
          {profileMessage && (
            <div className="text-[11px] text-[var(--muted-foreground)] bg-white rounded px-2 py-1">{profileMessage}</div>
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
          <div className="flex flex-wrap gap-2">
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

      <div className="mt-3 space-y-0.5 border-t border-[var(--border)] pt-3">
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
  const baseInputClasses = "w-full bg-white border border-[var(--border)] rounded-lg px-2 py-1 text-[11px] text-[var(--foreground)] focus:outline-none focus:border-[#6C5CE7]"
  return (
    <div>
      <label className="text-[10px] text-[var(--muted-foreground)] mb-0.5 block">{label}</label>
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
    <div className="mt-4 space-y-2">
      <div className="text-[10px] text-[var(--muted-foreground)] font-medium uppercase tracking-wider">
        {t('accounts', { count: accounts.length })}
      </div>
      {accounts.map(acct => (
        <div key={acct.accountId} className="p-3 bg-[var(--muted)]/60 rounded-lg space-y-0.5">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-medium text-[var(--foreground)]">{acct.name || acct.accountId}</span>
            <span className="text-[10px] text-[var(--muted-foreground)]">{acct.accountId}</span>
          </div>
          <StatusRow label="Running" value={yesNo(acct.running)} />
          <StatusRow label="Configured" value={yesNo(acct.configured)} />
          <StatusRow label="Connected" value={yesNo(acct.connected)} />
          {acct.lastInboundAt && <StatusRow label="Last inbound" value={relativeTime(acct.lastInboundAt)} />}
          {acct.lastError && (
            <div className="text-[11px] text-red-700 break-words mt-1">{acct.lastError}</div>
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
    <div className="flex items-center gap-3 mb-4">
      <span className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">{label}</span>
      <span className="text-[11px] font-medium text-[var(--muted-foreground)]">{count}</span>
      <div className="flex-1 h-px bg-[var(--border)]" />
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
  const filters: { key: ChannelFilter; label: string }[] = [
    { key: 'all', label: `All` },
    { key: 'connected', label: `Connected` },
    { key: 'disconnected', label: `Disconnected` },
  ]

  return (
    <div className="inline-flex items-center gap-1 rounded-xl bg-[var(--muted)]/60 p-1 border border-[var(--border)] mb-6">
      {filters.map(f => {
        const isActive = active === f.key
        const count = counts[f.key]
        return (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
              isActive
                ? 'bg-white text-[var(--foreground)] shadow-sm'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            {f.label}
            <span className={`ml-1 text-[11px] ${isActive ? 'opacity-80' : 'opacity-60'}`}>{count}</span>
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
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-4 h-4 border-2 border-[var(--foreground)] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-[var(--muted-foreground)]">{t('loadingChannels')}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--muted)]" />
                <div>
                  <div className="h-4 bg-[var(--muted)] rounded w-24 mb-1" />
                  <div className="h-3 bg-[var(--muted)] rounded w-16" />
                </div>
              </div>
              <div className="h-3 bg-[var(--muted)] rounded w-1/3 mb-2" />
              <div className="h-3 bg-[var(--muted)] rounded w-1/4" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-4 text-sm">{error}</div>
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
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight">{t('title')}</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            {gatewayConnected ? t('gatewayConnected') : t('gatewayDisconnected')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Gateway status indicator */}
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${gatewayConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span className="text-[11px] text-[var(--muted-foreground)]">
              {gatewayConnected ? 'Online' : 'Offline'}
            </span>
          </div>
          <button
            onClick={() => { setLoading(true); fetchChannels() }}
            className="px-3 py-1.5 rounded-lg text-[12px] font-medium border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
          >
            {t('refresh')}
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <FilterTabs active={filter} onChange={setFilter} counts={counts} />

      {/* Channel cards */}
      {channelOrder.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-[var(--muted-foreground)]">
            {gatewayConnected
              ? t('noChannelsConfigured')
              : t('gatewayUnreachable')}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Connected section */}
          {showConnected && connectedKeys.length > 0 && (
            <div>
              <SectionHeader label="Connected" count={connectedKeys.length} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {connectedKeys.map(key => renderCard(key))}
              </div>
            </div>
          )}

          {/* Disconnected section */}
          {showDisconnected && disconnectedKeys.length > 0 && (
            <div>
              <SectionHeader label="Disconnected" count={disconnectedKeys.length} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {disconnectedKeys.map(key => renderCard(key))}
              </div>
            </div>
          )}

          {/* Empty state for filtered views */}
          {filter === 'connected' && connectedKeys.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-[var(--muted-foreground)]">{t('noChannelsConfigured')}</p>
            </div>
          )}
          {filter === 'disconnected' && disconnectedKeys.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-[var(--muted-foreground)]">{t('noChannelsConfigured')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
