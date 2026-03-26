'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import { useMissionControl } from '@/store'
import { Button } from '@/components/ui/button'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SkillSummary {
  id: string
  name: string
  source: string
  path: string
  description?: string
  registry_slug?: string | null
  security_status?: string | null
}

interface SkillGroup {
  source: string
  path: string
  skills: SkillSummary[]
}

interface SkillsResponse {
  skills: SkillSummary[]
  groups: SkillGroup[]
  total: number
}

interface SkillContentResponse {
  source: string
  name: string
  skillPath: string
  skillDocPath: string
  content: string
  security?: { status: string; issues: Array<{ severity: string; rule: string; description: string; line?: number }> }
}

interface RegistrySkill {
  slug: string
  name: string
  description: string
  author: string
  version: string
  source: string
  installCount?: number
  tags?: string[]
}

type PanelTab = 'installed' | 'registry'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SOURCE_LABELS: Record<string, string> = {
  'user-agents': '~/.agents/skills (global)',
  'user-codex': '~/.codex/skills (global)',
  'project-agents': '.agents/skills (project)',
  'project-codex': '.codex/skills (project)',
  'openclaw': '~/.openclaw/skills (gateway)',
  'workspace': '~/.openclaw/workspace/skills',
}

/** Semantic category names for the marketplace-style display */
const SOURCE_CATEGORY: Record<string, string> = {
  'user-agents': 'Development',
  'user-codex': 'Knowledge',
  'project-agents': 'Project',
  'project-codex': 'Documentation',
  'openclaw': 'Communication',
  'workspace': 'Workspace',
}

/** Emoji icon per source for skill cards */
const SOURCE_EMOJI: Record<string, string> = {
  'user-agents': '🔧',
  'user-codex': '📚',
  'project-agents': '📁',
  'project-codex': '📝',
  'openclaw': '🌐',
  'workspace': '⚡',
}

/** Card icon background tint per source */
const SOURCE_ICON_BG: Record<string, string> = {
  'user-agents': 'rgba(59,130,246,0.12)',
  'user-codex': 'rgba(168,85,247,0.12)',
  'project-agents': 'rgba(234,179,8,0.12)',
  'project-codex': 'rgba(34,197,94,0.12)',
  'openclaw': 'rgba(59,130,246,0.12)',
  'workspace': 'rgba(249,115,22,0.12)',
}

function getCategoryLabel(source: string): string {
  if (SOURCE_CATEGORY[source]) return SOURCE_CATEGORY[source]
  if (source.startsWith('workspace-')) return 'Agent'
  return source
}

function getSkillEmoji(source: string): string {
  if (SOURCE_EMOJI[source]) return SOURCE_EMOJI[source]
  if (source.startsWith('workspace-')) return '🤖'
  return '⭐'
}

function getIconBg(source: string): string {
  if (SOURCE_ICON_BG[source]) return SOURCE_ICON_BG[source]
  if (source.startsWith('workspace-')) return 'rgba(139,92,246,0.12)'
  return 'rgba(59,130,246,0.12)'
}

function getSourceLabel(source: string): string {
  if (SOURCE_LABELS[source]) return SOURCE_LABELS[source]
  if (source.startsWith('workspace-')) {
    const agentName = source.replace('workspace-', '')
    return `${agentName} workspace`
  }
  return source
}

// ---------------------------------------------------------------------------
// Helper: source badge color
// ---------------------------------------------------------------------------

function sourceBadgeClasses(source: string): string {
  if (source === 'openclaw' || source.startsWith('workspace-')) {
    return 'bg-[hsl(var(--status-info-bg))] text-[hsl(var(--interactive-primary))] border-[hsl(var(--status-info-border))]'
  }
  if (source.startsWith('project-')) {
    return 'bg-[hsl(var(--status-warning-bg))] text-[hsl(var(--status-warning-fg))] border-[hsl(var(--status-warning-border))]'
  }
  return 'bg-[hsl(var(--bg-subtle))] text-[hsl(var(--text-muted))] border-[hsl(var(--border-default))]'
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SecurityBadge({ status }: { status?: string | null }) {
  if (!status || status === 'unchecked') return <span className="text-[var(--text-xs)] text-[hsl(var(--text-muted))]">unchecked</span>
  if (status === 'clean') return <span className="text-[var(--text-xs)] text-[hsl(var(--status-success-fg))]">clean</span>
  if (status === 'warning') return <span className="text-[var(--text-xs)] text-[hsl(var(--status-warning-fg))]">warning</span>
  if (status === 'rejected') return <span className="text-[var(--text-xs)] text-[hsl(var(--status-error-fg))]">rejected</span>
  return null
}

function InstallStep({ label, status }: { label: string; status: 'pending' | 'active' | 'done' | 'error' }) {
  return (
    <div className="flex items-center gap-[var(--space-2)]">
      <div className="w-[var(--space-5)] h-[var(--space-5)] flex items-center justify-center shrink-0">
        {status === 'pending' && (
          <span className="w-[var(--space-2)] h-[var(--space-2)] rounded-full bg-[hsl(var(--text-muted))]/30" />
        )}
        {status === 'active' && (
          <span className="w-[var(--space-2)] h-[var(--space-2)] rounded-full bg-[hsl(var(--interactive-primary))] animate-pulse" />
        )}
        {status === 'done' && (
          <svg className="w-[var(--space-4)] h-[var(--space-4)] text-[hsl(var(--status-success-fg))]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3.5 8.5L6.5 11.5L12.5 4.5" />
          </svg>
        )}
        {status === 'error' && (
          <svg className="w-[var(--space-4)] h-[var(--space-4)] text-[hsl(var(--status-error-fg))]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 4.5L11.5 11.5M11.5 4.5L4.5 11.5" />
          </svg>
        )}
      </div>
      <span className={`text-[var(--text-xs)] ${
        status === 'active' ? 'text-[hsl(var(--text-primary))] font-[var(--font-medium)]'
          : status === 'done' ? 'text-[hsl(var(--text-muted))]'
          : status === 'error' ? 'text-[hsl(var(--status-error-fg))]'
          : 'text-[hsl(var(--text-muted))]/50'
      }`}>
        {label}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Category filter — derives categories from source groups
// ---------------------------------------------------------------------------

const CATEGORY_ALL = '__all__'

function deriveCategories(skills: SkillSummary[]): string[] {
  const cats = new Set<string>()
  for (const s of skills) {
    cats.add(s.source)
  }
  return Array.from(cats)
}

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

export function SkillsPanel() {
  const t = useTranslations('skills')
  const { dashboardMode, skillsList, skillGroups, skillsTotal, setSkillsData } = useMissionControl()
  const [loading, setLoading] = useState(skillsList === null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [activeRoot, setActiveRoot] = useState<string | null>(null)
  const [selectedSkill, setSelectedSkill] = useState<SkillSummary | null>(null)
  const [selectedContent, setSelectedContent] = useState<SkillContentResponse | null>(null)
  const [draftContent, setDraftContent] = useState('')
  const [drawerLoading, setDrawerLoading] = useState(false)
  const [drawerError, setDrawerError] = useState<string | null>(null)
  const [createSource, setCreateSource] = useState(dashboardMode === 'full' ? 'openclaw' : 'user-codex')
  const [createName, setCreateName] = useState('')
  const [createContent, setCreateContent] = useState('# new-skill\n\nDescribe this skill.\n')
  const [createError, setCreateError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<PanelTab>('installed')
  const [registrySource, setRegistrySource] = useState<'clawhub' | 'skills-sh' | 'awesome-openclaw'>('awesome-openclaw')
  const [registryQuery, setRegistryQuery] = useState('')
  const [registryResults, setRegistryResults] = useState<RegistrySkill[]>([])
  const [registryLoading, setRegistryLoading] = useState(false)
  const [registryError, setRegistryError] = useState<string | null>(null)
  const [registrySearched, setRegistrySearched] = useState(false)
  const [installTarget, setInstallTarget] = useState(dashboardMode === 'full' ? 'openclaw' : 'user-agents')
  const [installing, setInstalling] = useState<string | null>(null)
  const [installMessage, setInstallMessage] = useState<string | null>(null)
  const [scanAll, setScanAll] = useState<{
    running: boolean
    total: number
    done: number
    current: string | null
    results: { clean: number; warning: number; rejected: number; error: number }
  } | null>(null)
  const [installModal, setInstallModal] = useState<{
    slug: string
    name: string
    step: 'fetching' | 'scanning' | 'writing' | 'done' | 'error'
    message?: string
    securityStatus?: string
  } | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // ---- Data fetching ----

  const loadSkills = useCallback(async (opts?: { initial?: boolean }) => {
    if (opts?.initial) setLoading(true)
    setError(null)
    const res = await fetch('/api/skills', { cache: 'no-store' })
    const body = await res.json()
    if (!res.ok) throw new Error(body?.error || 'Failed to load skills')
    const resp = body as SkillsResponse
    setSkillsData(resp.skills, resp.groups, resp.total)
    if (opts?.initial) setLoading(false)
  }, [setSkillsData])

  useEffect(() => {
    if (skillsList !== null) return
    let cancelled = false
    async function run() {
      try {
        await loadSkills({ initial: true })
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || 'Failed to load skills')
          setLoading(false)
        }
      }
    }
    run()
    return () => { cancelled = true }
  }, [loadSkills, skillsList])

  useEffect(() => {
    const id = window.setInterval(() => {
      loadSkills().catch(() => {})
    }, 10000)
    return () => window.clearInterval(id)
  }, [loadSkills])

  // ---- Filtering ----

  const categories = useMemo(() => deriveCategories(skillsList || []), [skillsList])

  const filtered = useMemo(() => {
    let list = skillsList || []
    if (activeRoot) list = list.filter((s) => s.source === activeRoot)
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter((skill) => {
      const haystack = `${skill.name} ${skill.source} ${skill.description || ''}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [skillsList, query, activeRoot])

  // ---- Skill detail loading ----

  useEffect(() => {
    if (!selectedSkill) return
    const skill = selectedSkill
    let cancelled = false
    async function run() {
      setDrawerLoading(true)
      setDrawerError(null)
      setSelectedContent(null)
      try {
        const params = new URLSearchParams({
          mode: 'content',
          source: skill.source,
          name: skill.name,
        })
        const res = await fetch(`/api/skills?${params.toString()}`, { cache: 'no-store' })
        const body = await res.json()
        if (!res.ok) throw new Error(body?.error || 'Failed to load SKILL.md')
        if (!cancelled) setSelectedContent(body as SkillContentResponse)
      } catch (err: any) {
        if (!cancelled) setDrawerError(err?.message || 'Failed to load SKILL.md')
      } finally {
        if (!cancelled) setDrawerLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [selectedSkill])

  useEffect(() => {
    setDraftContent(selectedContent?.content || '')
  }, [selectedContent?.content])

  useEffect(() => {
    if (!selectedSkill) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedSkill(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedSkill])

  // ---- Actions ----

  const refresh = async () => {
    setLoading(true)
    try {
      await loadSkills()
    } catch (err: any) {
      setError(err?.message || 'Failed to refresh skills')
    } finally {
      setLoading(false)
    }
  }

  const createSkill = async () => {
    setCreateError(null)
    setSaving(true)
    try {
      const res = await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: createSource,
          name: createName.trim(),
          content: createContent,
        }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body?.error || 'Failed to create skill')
      setCreateName('')
      await loadSkills()
    } catch (err: any) {
      setCreateError(err?.message || 'Failed to create skill')
    } finally {
      setSaving(false)
    }
  }

  const saveSkill = async () => {
    if (!selectedSkill) return
    setSaving(true)
    setDrawerError(null)
    try {
      const res = await fetch('/api/skills', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: selectedSkill.source,
          name: selectedSkill.name,
          content: draftContent,
        }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body?.error || 'Failed to save skill')
      await loadSkills()
      setSelectedContent((prev) => prev ? { ...prev, content: draftContent } : prev)
    } catch (err: any) {
      setDrawerError(err?.message || 'Failed to save skill')
    } finally {
      setSaving(false)
    }
  }

  const deleteSkill = async () => {
    if (!selectedSkill) return
    const ok = window.confirm(`Delete skill "${selectedSkill.name}"? This removes it from disk.`)
    if (!ok) return
    setSaving(true)
    setDrawerError(null)
    try {
      const params = new URLSearchParams({ source: selectedSkill.source, name: selectedSkill.name })
      const res = await fetch(`/api/skills?${params.toString()}`, { method: 'DELETE' })
      const body = await res.json()
      if (!res.ok) throw new Error(body?.error || 'Failed to delete skill')
      setSelectedSkill(null)
      setSelectedContent(null)
      await loadSkills()
    } catch (err: any) {
      setDrawerError(err?.message || 'Failed to delete skill')
    } finally {
      setSaving(false)
    }
  }

  const searchRegistry = async () => {
    if (!registryQuery.trim()) return
    setRegistryLoading(true)
    setRegistryError(null)
    try {
      const params = new URLSearchParams({ source: registrySource, q: registryQuery.trim() })
      const res = await fetch(`/api/skills/registry?${params.toString()}`, { cache: 'no-store' })
      const body = await res.json()
      if (!res.ok) throw new Error(body?.error || 'Search failed')
      setRegistryResults(body?.skills || [])
      setRegistrySearched(true)
    } catch (err: any) {
      setRegistryError(err?.message || 'Search failed')
    } finally {
      setRegistryLoading(false)
    }
  }

  const installSkill = async (slug: string, skillName?: string) => {
    const displayName = skillName || slug.split('/').pop() || slug
    setInstalling(slug)
    setInstallMessage(null)
    setInstallModal({ slug, name: displayName, step: 'fetching' })
    try {
      const stepTimer = setTimeout(() => {
        setInstallModal(prev => prev?.slug === slug ? { ...prev, step: 'scanning' } : prev)
      }, 800)
      const writeTimer = setTimeout(() => {
        setInstallModal(prev => prev?.slug === slug ? { ...prev, step: 'writing' } : prev)
      }, 1600)

      const res = await fetch('/api/skills/registry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: registrySource, slug, targetRoot: installTarget }),
      })
      const body = await res.json()
      clearTimeout(stepTimer)
      clearTimeout(writeTimer)

      if (!res.ok) {
        const msg = body?.message || body?.error || 'Install failed'
        setInstallModal({ slug, name: displayName, step: 'error', message: msg, securityStatus: body?.securityReport?.status })
      } else {
        setInstallModal({ slug, name: displayName, step: 'done', message: body?.message || 'Installed successfully', securityStatus: body?.securityReport?.status })
        await loadSkills()
      }
    } catch (err: any) {
      setInstallModal({ slug, name: displayName, step: 'error', message: err?.message || 'Network error' })
    } finally {
      setInstalling(null)
    }
  }

  const checkSecurity = async (skill: SkillSummary) => {
    try {
      const params = new URLSearchParams({ mode: 'check', source: skill.source, name: skill.name })
      const res = await fetch(`/api/skills?${params.toString()}`, { cache: 'no-store' })
      const body = await res.json()
      if (res.ok && body?.security) {
        await loadSkills()
      }
    } catch { /* best-effort */ }
  }

  const scanAllSkills = async () => {
    const skills = skillsList || []
    if (skills.length === 0) return
    const state = {
      running: true,
      total: skills.length,
      done: 0,
      current: null as string | null,
      results: { clean: 0, warning: 0, rejected: 0, error: 0 },
    }
    setScanAll({ ...state })

    for (const skill of skills) {
      state.current = skill.name
      setScanAll({ ...state })
      try {
        const params = new URLSearchParams({ mode: 'check', source: skill.source, name: skill.name })
        const res = await fetch(`/api/skills?${params.toString()}`, { cache: 'no-store' })
        const body = await res.json()
        if (res.ok && body?.security) {
          const s = body.security.status as string
          if (s === 'clean') state.results.clean++
          else if (s === 'warning') state.results.warning++
          else if (s === 'rejected') state.results.rejected++
          else state.results.clean++
        } else {
          state.results.error++
        }
      } catch {
        state.results.error++
      }
      state.done++
      setScanAll({ ...state })
    }

    state.running = false
    state.current = null
    setScanAll({ ...state })
    await loadSkills()
  }

  // ---- Loading state ----

  if (loading) {
    return (
      <div className="p-[var(--space-6)]">
        <div className="flex items-center gap-[var(--space-3)] mb-[var(--space-6)]">
          <div className="w-[var(--space-4)] h-[var(--space-4)] border-2 border-[hsl(var(--interactive-primary))] border-t-transparent rounded-full animate-spin" />
          <span className="text-[var(--text-sm)] text-[hsl(var(--text-muted))]">{t('loadingSkills')}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[var(--space-5)]">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="rounded-[var(--card-radius)] border border-[hsl(var(--card-border))] bg-[hsl(var(--card-bg))] p-[var(--space-5)] animate-pulse">
              <div className="flex items-center gap-[var(--space-3)] mb-[var(--space-4)]">
                <div className="w-[var(--space-10)] h-[var(--space-10)] rounded-[var(--radius-lg)] bg-[hsl(var(--bg-subtle))]" />
                <div>
                  <div className="h-4 bg-[hsl(var(--bg-subtle))] rounded w-24 mb-[var(--space-1)]" />
                  <div className="h-3 bg-[hsl(var(--bg-subtle))] rounded w-16" />
                </div>
              </div>
              <div className="h-3 bg-[hsl(var(--bg-subtle))] rounded w-full mb-[var(--space-2)]" />
              <div className="h-3 bg-[hsl(var(--bg-subtle))] rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ---- Error state ----

  if (error) {
    return (
      <div className="p-[var(--space-6)]">
        <div className="bg-[hsl(var(--status-error-bg))] text-[hsl(var(--status-error-fg))] border border-[hsl(var(--status-error-border))] rounded-[var(--card-radius)] p-[var(--space-4)] text-[var(--text-sm)]">{error}</div>
      </div>
    )
  }

  const totalCount = skillsTotal ?? (skillsList || []).length
  const installedCount = (skillsList || []).filter(s => s.registry_slug).length
  const availableCount = totalCount - installedCount

  return (
    <div className="p-[var(--space-6)]">
      {/* ── Tab switcher (compact, above header) ── */}
      <div className="flex items-center gap-[var(--space-3)] mb-[var(--space-4)]">
        <div className="flex rounded-full bg-[#EBEBF0] p-0.5">
          <button
            onClick={() => setActiveTab('installed')}
            className={`px-4 py-1.5 text-[13px] font-semibold rounded-full transition-colors ${
              activeTab === 'installed'
                ? 'bg-[#6C5CE7] text-white shadow-sm'
                : 'text-[#444455] hover:text-[#1A1A2E]'
            }`}
          >
            {t('tabInstalled')}
          </button>
          <button
            onClick={() => setActiveTab('registry')}
            className={`px-4 py-1.5 text-[13px] font-semibold rounded-full transition-colors ${
              activeTab === 'registry'
                ? 'bg-[#6C5CE7] text-white shadow-sm'
                : 'text-[#444455] hover:text-[#1A1A2E]'
            }`}
          >
            {t('tabRegistry')}
          </button>
        </div>
      </div>

      {/* ── Install message banner ── */}
      {installMessage && (
        <div className={`rounded-[var(--radius-md)] border px-[var(--space-4)] py-[var(--space-2)] text-[var(--text-xs)] mb-[var(--space-4)] ${
          installMessage.startsWith('Failed') || installMessage.startsWith('Install error')
            ? 'bg-[hsl(var(--status-error-bg))] border-[hsl(var(--status-error-border))] text-[hsl(var(--status-error-fg))]'
            : 'bg-[hsl(var(--status-success-bg))] border-[hsl(var(--status-success-border))] text-[hsl(var(--status-success-fg))]'
        }`}>
          {installMessage}
        </div>
      )}

      {/* ================================================================
           INSTALLED TAB
         ================================================================ */}
      {activeTab === 'installed' && (
        <>
          {/* Search + category dropdown + Install Skill button */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888899]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="7" cy="7" r="4.5" />
                <path d="M10.5 10.5L14 14" />
              </svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="h-10 w-full rounded-lg border bg-white pl-10 pr-3 text-sm text-[#1A1A2E] placeholder:text-[#888899] focus:outline-none focus:border-[#6C5CE7]"
                style={{ borderColor: '#E8E8EC' }}
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888899] hover:text-[#1A1A2E] text-xs"
                  title="Clear"
                >
                  ✕
                </button>
              )}
            </div>
            <select
              value={activeRoot || CATEGORY_ALL}
              onChange={(e) => setActiveRoot(e.target.value === CATEGORY_ALL ? null : e.target.value)}
              className="h-10 rounded-lg border bg-white px-3 text-sm text-[#1A1A2E]"
              style={{ borderColor: '#E8E8EC' }}
            >
              <option value={CATEGORY_ALL}>{t('showAllRoots')}</option>
              {(skillGroups || []).filter(g => g.skills.length > 0 || ['user-agents', 'user-codex', 'openclaw', 'workspace'].includes(g.source) || g.source.startsWith('workspace-')).map((group) => (
                <option key={group.source} value={group.source}>{getCategoryLabel(group.source)}</option>
              ))}
            </select>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="h-10 px-4 rounded-lg text-sm font-semibold text-white transition-colors hover:opacity-90"
              style={{ background: '#6C5CE7' }}
            >
              + {t('addSkill')}
            </button>
            <button
              onClick={refresh}
              disabled={loading || saving}
              className="h-10 px-3 rounded-lg border text-sm text-[#444455] hover:text-[#1A1A2E] disabled:opacity-50 transition-colors"
              style={{ borderColor: '#E8E8EC' }}
              title={t('refreshNow')}
            >
              ↻
            </button>
          </div>

          {/* Category filter pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setActiveRoot(null)}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                !activeRoot
                  ? 'text-white border-transparent'
                  : 'text-[#444455] hover:text-[#1A1A2E]'
              }`}
              style={!activeRoot
                ? { background: '#6C5CE7' }
                : { background: '#EBEBF0' }
              }
            >
              All
              <span
                className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                style={!activeRoot
                  ? { background: 'rgba(255,255,255,0.25)', color: '#fff' }
                  : { background: 'rgba(0,0,0,0.08)', color: '#444455' }
                }
              >{totalCount}</span>
            </button>
            {(skillGroups || []).filter(g => g.skills.length > 0 || ['user-agents', 'user-codex', 'openclaw', 'workspace'].includes(g.source) || g.source.startsWith('workspace-')).map((group) => (
              <button
                key={group.source}
                onClick={() => setActiveRoot(activeRoot === group.source ? null : group.source)}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  activeRoot === group.source
                    ? 'text-white border-transparent'
                    : 'text-[#444455] hover:text-[#1A1A2E]'
                }`}
                style={activeRoot === group.source
                  ? { background: '#6C5CE7' }
                  : { background: '#EBEBF0' }
                }
              >
                {getCategoryLabel(group.source)}
                <span
                  className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                  style={activeRoot === group.source
                    ? { background: 'rgba(255,255,255,0.25)', color: '#fff' }
                    : { background: 'rgba(0,0,0,0.08)', color: '#444455' }
                  }
                >{group.skills.length}</span>
              </button>
            ))}
          </div>

          {/* Scan All progress/results */}
          {scanAll && (
            <div className="rounded-[var(--card-radius)] border border-[hsl(var(--card-border))] bg-[hsl(var(--card-bg))] p-[var(--space-4)] mb-[var(--space-4)]">
              {scanAll.running ? (
                <div className="space-y-[var(--space-2)]">
                  <div className="flex items-center justify-between text-[var(--text-xs)] text-[hsl(var(--text-muted))]">
                    <span>{t('scanning')} <span className="text-[hsl(var(--text-primary))] font-[var(--font-medium)]">{scanAll.current}</span></span>
                    <span>{scanAll.done}/{scanAll.total}</span>
                  </div>
                  <div className="h-[var(--space-1-5)] rounded-[var(--radius-full)] bg-[hsl(var(--bg-subtle))] overflow-hidden">
                    <div
                      className="h-full rounded-[var(--radius-full)] bg-[hsl(var(--interactive-primary))] transition-all duration-300"
                      style={{ width: `${(scanAll.done / scanAll.total) * 100}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-[var(--space-3)] text-[var(--text-xs)]">
                    <span className="text-[hsl(var(--status-success-fg))]">{scanAll.results.clean} clean</span>
                    {scanAll.results.warning > 0 && <span className="text-[hsl(var(--status-warning-fg))]">{scanAll.results.warning} warning</span>}
                    {scanAll.results.rejected > 0 && <span className="text-[hsl(var(--status-error-fg))]">{scanAll.results.rejected} rejected</span>}
                    {scanAll.results.error > 0 && <span className="text-[hsl(var(--status-error-fg))]">{scanAll.results.error} errors</span>}
                    <span className="text-[hsl(var(--text-muted))]">— {t('skillsScanned', { count: scanAll.total })}</span>
                  </div>
                  <button onClick={() => setScanAll(null)} className="text-[var(--text-xs)] text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))]">{t('dismiss')}</button>
                </div>
              )}
            </div>
          )}

          {/* Search results count */}
          {query && (
            <div className="text-[var(--text-xs)] text-[hsl(var(--text-muted))] mb-[var(--space-3)]">
              {t('searchResults', { count: filtered.length, total: skillsTotal, query })}
            </div>
          )}

          {/* Create skill card (toggled) */}
          {showCreateForm && (
            <div className="rounded-xl border bg-white p-5 mb-5" style={{ borderColor: '#E8E8EC', boxShadow: 'rgba(0,0,0,0.04) 0px 1px 3px' }}>
              <div className="text-sm font-semibold text-[#1A1A2E] mb-3">
                {t('addSkill')}
              </div>
              <div className="text-xs text-[#888899] mb-3">{t('diskSyncActive')}</div>
              <div className="grid grid-cols-1 md:grid-cols-[240px_1fr_auto] gap-2">
                <select
                  value={createSource}
                  onChange={(e) => setCreateSource(e.target.value)}
                  className="h-10 rounded-lg border bg-white px-3 text-xs text-[#1A1A2E]"
                  style={{ borderColor: '#E8E8EC' }}
                >
                  <option value="user-agents">{SOURCE_LABELS['user-agents']}</option>
                  <option value="user-codex">{SOURCE_LABELS['user-codex']}</option>
                  <option value="project-agents">{SOURCE_LABELS['project-agents']}</option>
                  <option value="project-codex">{SOURCE_LABELS['project-codex']}</option>
                  {dashboardMode === 'full' && (
                    <option value="openclaw">{SOURCE_LABELS['openclaw']}</option>
                  )}
                  <option value="workspace">{SOURCE_LABELS['workspace']}</option>
                </select>
                <input
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="new-skill-name"
                  className="h-10 rounded-lg border bg-white px-3 text-sm text-[#1A1A2E] placeholder:text-[#888899] focus:outline-none focus:border-[#6C5CE7]"
                  style={{ borderColor: '#E8E8EC' }}
                />
                <button
                  onClick={createSkill}
                  disabled={saving || !createName.trim()}
                  className="h-10 px-4 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-colors"
                  style={{ background: '#6C5CE7' }}
                >
                  {t('addSkill')}
                </button>
              </div>
              <textarea
                value={createContent}
                onChange={(e) => setCreateContent(e.target.value)}
                className="w-full h-24 rounded-lg border bg-white p-3 text-xs text-[#1A1A2E] font-mono focus:outline-none focus:border-[#6C5CE7] mt-2"
                style={{ borderColor: '#E8E8EC' }}
                placeholder={t('initialContent')}
              />
              {createError && <p className="text-xs text-red-500 mt-2">{createError}</p>}
            </div>
          )}

          {/* Skills grid */}
          {filtered.length === 0 ? (
            <div className="rounded-xl border bg-white px-6 py-10 text-center text-sm text-[#888899]" style={{ borderColor: '#E8E8EC', boxShadow: 'rgba(0,0,0,0.04) 0px 1px 3px' }}>
              {t('noMatch')}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((skill) => (
                <article
                  key={skill.id}
                  className="flex flex-col gap-3.5 rounded-xl border p-5 transition-shadow hover:shadow-md cursor-pointer"
                  style={{ background: '#fff', borderColor: '#E8E8EC', borderRadius: '12px', boxShadow: 'rgba(0,0,0,0.04) 0px 1px 3px' }}
                  onClick={() => setSelectedSkill(skill)}
                >
                  {/* Row 1: Icon + Name + Version */}
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-[18px] shrink-0"
                      style={{ background: getIconBg(skill.source) }}
                    >
                      {getSkillEmoji(skill.source)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-[15px] font-semibold leading-tight truncate" style={{ color: '#1A1A2E' }}>{skill.name}</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: '#F2F2F6', color: '#888899' }}>
                          {skill.registry_slug ? `v${skill.registry_slug.split('@')[1] || '1.0'}` : 'local'}
                        </span>
                      </div>
                      <SecurityBadge status={skill.security_status} />
                    </div>
                  </div>

                  {/* Row 2: Description (2 lines max) */}
                  {skill.description ? (
                    <p className="text-sm leading-relaxed line-clamp-2" style={{ color: '#444455' }}>
                      {skill.description}
                    </p>
                  ) : (
                    <p className="text-sm leading-relaxed line-clamp-2" style={{ color: '#888899' }}>
                      No description
                    </p>
                  )}

                  {/* Row 3: Tags (source category + path-derived tag) */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-medium" style={{ background: '#F2F2F6', color: '#666677' }}>
                      {getCategoryLabel(skill.source)}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-medium" style={{ background: '#F2F2F6', color: '#666677' }}>
                      {skill.source}
                    </span>
                  </div>

                  {/* Row 4: Footer with used-by + install status */}
                  <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: '#F2F2F6' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: '#888899' }}>
                        {skill.path.split('/').slice(-2, -1)[0] || skill.source}
                      </span>
                    </div>
                    {skill.registry_slug ? (
                      <button
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border"
                        style={{ color: '#6C5CE7', borderColor: '#6C5CE7', background: 'transparent' }}
                        onClick={(e) => { e.stopPropagation(); setSelectedSkill(skill) }}
                      >
                        ✓ Installed
                      </button>
                    ) : (
                      <button
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white"
                        style={{ background: '#6C5CE7' }}
                        onClick={(e) => { e.stopPropagation(); checkSecurity(skill) }}
                      >
                        {t('scan')}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Footer stats bar */}
          <div className="mt-5 py-3 px-4 rounded-lg text-sm" style={{ background: '#F8F8FA', color: '#888899' }}>
            Showing {filtered.length} of {totalCount} skills | {installedCount} installed | {availableCount} available
          </div>
        </>
      )}

      {/* ================================================================
           REGISTRY TAB
         ================================================================ */}
      {activeTab === 'registry' && (
        <>
          {/* Registry search card */}
          <div className="rounded-[var(--card-radius)] border border-[hsl(var(--card-border))] bg-[hsl(var(--card-bg))] p-[var(--space-5)] mb-[var(--space-5)]" style={{ boxShadow: 'var(--card-shadow)' }}>
            <div className="flex flex-wrap items-center gap-[var(--space-3)]">
              <select
                value={registrySource}
                onChange={(e) => { setRegistrySource(e.target.value as 'clawhub' | 'skills-sh' | 'awesome-openclaw'); setRegistryResults([]); setRegistrySearched(false) }}
                className="h-[var(--space-10)] rounded-[var(--input-radius)] border border-[hsl(var(--input-border))] bg-[hsl(var(--bg-surface-raised))] px-[var(--space-3)] text-[var(--text-xs)] text-[hsl(var(--text-primary))]"
              >
                <option value="clawhub">ClawdHub</option>
                <option value="skills-sh">skills.sh</option>
                <option value="awesome-openclaw">Awesome OpenClaw</option>
              </select>
              <div className="relative flex-1 min-w-[200px]">
                <svg className="absolute left-[var(--space-3)] top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--text-muted))]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="7" cy="7" r="4.5" />
                  <path d="M10.5 10.5L14 14" />
                </svg>
                <input
                  value={registryQuery}
                  onChange={(e) => setRegistryQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchRegistry()}
                  placeholder={t('registrySearchPlaceholder')}
                  className="h-[var(--space-10)] w-full rounded-[var(--input-radius)] border border-[hsl(var(--input-border))] bg-[hsl(var(--bg-surface-raised))] pl-[var(--space-10)] pr-[var(--space-3)] text-[var(--input-font-size)] text-[hsl(var(--input-text))] placeholder:text-[hsl(var(--input-placeholder))] focus:outline-none focus:border-[hsl(var(--input-border-focus))]"
                />
              </div>
              <Button variant="default" size="sm" onClick={searchRegistry} disabled={registryLoading || !registryQuery.trim()}>
                {registryLoading ? t('searching') : t('search')}
              </Button>
            </div>
            <div className="flex items-center gap-[var(--space-2)] mt-[var(--space-3)]">
              <span className="text-[var(--text-xs)] text-[hsl(var(--text-muted))]">{t('installTo')}</span>
              <select
                value={installTarget}
                onChange={(e) => setInstallTarget(e.target.value)}
                className="h-7 rounded-[var(--input-radius)] border border-[hsl(var(--input-border))] bg-[hsl(var(--bg-surface-raised))] px-[var(--space-3)] text-[var(--text-xs)] text-[hsl(var(--text-primary))]"
              >
                <option value="user-agents">{SOURCE_LABELS['user-agents']}</option>
                <option value="user-codex">{SOURCE_LABELS['user-codex']}</option>
                <option value="project-agents">{SOURCE_LABELS['project-agents']}</option>
                <option value="project-codex">{SOURCE_LABELS['project-codex']}</option>
                {dashboardMode === 'full' && (
                  <option value="openclaw">{SOURCE_LABELS['openclaw']}</option>
                )}
                <option value="workspace">{SOURCE_LABELS['workspace']}</option>
              </select>
            </div>
          </div>

          {/* Registry error */}
          {registryError && (
            <div className="rounded-[var(--card-radius)] border border-[hsl(var(--status-error-border))] bg-[hsl(var(--status-error-bg))] px-[var(--space-4)] py-[var(--space-3)] text-[var(--text-sm)] text-[hsl(var(--status-error-fg))] mb-[var(--space-5)]">
              {registryError}
            </div>
          )}

          {/* Registry results grid */}
          {registryResults.length > 0 ? (
            <>
              <div className="text-[var(--text-xs)] text-[hsl(var(--text-muted))] mb-[var(--space-3)]">
                {registryResults.length} results from {{ clawhub: 'ClawdHub', 'skills-sh': 'skills.sh', 'awesome-openclaw': 'Awesome OpenClaw' }[registrySource]}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {registryResults.map((skill) => (
                  <article key={skill.slug} className="flex flex-col gap-3.5 rounded-xl border p-5" style={{ background: '#fff', borderColor: '#E8E8EC', borderRadius: '12px', boxShadow: 'rgba(0,0,0,0.04) 0px 1px 3px' }}>
                    {/* Row 1: Icon + Name + Version */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[18px] shrink-0" style={{ background: 'rgba(108,92,231,0.12)' }}>
                        ⭐
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-[15px] font-semibold leading-tight truncate" style={{ color: '#1A1A2E' }}>{skill.name}</h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: '#F2F2F6', color: '#888899' }}>v{skill.version}</span>
                        </div>
                      </div>
                    </div>

                    {/* Row 2: Description */}
                    {skill.description ? (
                      <p className="text-sm leading-relaxed line-clamp-2" style={{ color: '#444455' }}>{skill.description}</p>
                    ) : (
                      <p className="text-sm leading-relaxed" style={{ color: '#888899' }}>No description</p>
                    )}

                    {/* Row 3: Tags */}
                    {skill.tags && skill.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {skill.tags.slice(0, 5).map((tag) => (
                          <span key={tag} className="px-2 py-0.5 rounded-md text-[11px] font-medium" style={{ background: '#F2F2F6', color: '#666677' }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Row 4: Footer with author + installs + install button */}
                    <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: '#F2F2F6' }}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: '#888899' }}>by {skill.author}</span>
                        {skill.installCount != null && (
                          <span className="text-xs" style={{ color: '#888899' }}>{skill.installCount.toLocaleString()} installs</span>
                        )}
                      </div>
                      <button
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white disabled:opacity-50"
                        style={{ background: '#6C5CE7' }}
                        onClick={() => installSkill(skill.slug, skill.name)}
                        disabled={installing === skill.slug}
                      >
                        {installing === skill.slug ? t('installing') : t('install')}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : registryLoading ? (
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
                  <div className="h-3 bg-[hsl(var(--bg-subtle))] rounded w-full mb-[var(--space-2)]" />
                  <div className="h-3 bg-[hsl(var(--bg-subtle))] rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : registrySearched ? (
            <div className="rounded-[var(--card-radius)] border border-[hsl(var(--card-border))] bg-[hsl(var(--card-bg))] px-[var(--space-6)] py-[var(--space-10)] text-center text-[var(--text-sm)] text-[hsl(var(--text-muted))]" style={{ boxShadow: 'var(--card-shadow)' }}>
              {t('noRegistryResults', { query: registryQuery, registry: { clawhub: 'ClawdHub', 'skills-sh': 'skills.sh', 'awesome-openclaw': 'Awesome OpenClaw' }[registrySource] })}
            </div>
          ) : (
            <div className="rounded-[var(--card-radius)] border border-[hsl(var(--card-border))] bg-[hsl(var(--card-bg))] px-[var(--space-6)] py-[var(--space-10)] text-center text-[var(--text-sm)] text-[hsl(var(--text-muted))]" style={{ boxShadow: 'var(--card-shadow)' }}>
              {t('registryPrompt')}
            </div>
          )}
        </>
      )}

      {/* ================================================================
           INSTALL MODAL
         ================================================================ */}
      {isMounted && installModal && createPortal(
        <div className="fixed inset-0 z-[130]">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="absolute inset-0 flex items-center justify-center p-[var(--space-4)]">
            <div className="w-full max-w-md rounded-[var(--card-radius)] border border-[hsl(var(--card-border))] bg-[hsl(var(--card-bg))] shadow-[var(--shadow-xl)] overflow-hidden">
              <div className="px-[var(--space-5)] pt-[var(--space-5)] pb-[var(--space-4)]">
                <h3 className="text-[var(--text-base)] font-[var(--font-semibold)] text-[hsl(var(--text-primary))]">
                  {installModal.step === 'done' ? t('skillInstalled') : installModal.step === 'error' ? t('installFailed') : t('installingSkill')}
                </h3>
                <p className="text-[var(--text-xs)] text-[hsl(var(--text-muted))] mt-[var(--space-1)] truncate">{installModal.name}</p>
              </div>

              <div className="px-[var(--space-5)] pb-[var(--space-5)] space-y-[var(--space-3)]">
                {/* Progress steps */}
                <div className="space-y-[var(--space-2)]">
                  <InstallStep
                    label={t('stepFetching')}
                    status={installModal.step === 'fetching' ? 'active' : installModal.step === 'error' && !installModal.securityStatus ? 'error' : 'done'}
                  />
                  <InstallStep
                    label={t('stepScanning')}
                    status={
                      installModal.step === 'fetching' ? 'pending'
                        : installModal.step === 'scanning' ? 'active'
                        : installModal.step === 'error' && installModal.securityStatus === 'rejected' ? 'error'
                        : installModal.step === 'error' && !installModal.securityStatus ? 'error'
                        : 'done'
                    }
                  />
                  <InstallStep
                    label={t('stepWriting')}
                    status={
                      ['fetching', 'scanning'].includes(installModal.step) ? 'pending'
                        : installModal.step === 'writing' ? 'active'
                        : installModal.step === 'error' ? 'error'
                        : 'done'
                    }
                  />
                </div>

                {/* Result message */}
                {installModal.message && (installModal.step === 'done' || installModal.step === 'error') && (
                  <div className={`rounded-[var(--radius-md)] border px-[var(--space-3)] py-[var(--space-2)] text-[var(--text-xs)] ${
                    installModal.step === 'error'
                      ? 'bg-[hsl(var(--status-error-bg))] border-[hsl(var(--status-error-border))] text-[hsl(var(--status-error-fg))]'
                      : 'bg-[hsl(var(--status-success-bg))] border-[hsl(var(--status-success-border))] text-[hsl(var(--status-success-fg))]'
                  }`}>
                    {installModal.message}
                  </div>
                )}

                {/* Security badge */}
                {installModal.securityStatus && installModal.step === 'done' && (
                  <div className="flex items-center gap-[var(--space-2)] text-[var(--text-xs)]">
                    <span className="text-[hsl(var(--text-muted))]">{t('security')}</span>
                    <span className={
                      installModal.securityStatus === 'clean' ? 'text-[hsl(var(--status-success-fg))]'
                        : installModal.securityStatus === 'warning' ? 'text-[hsl(var(--status-warning-fg))]'
                        : 'text-[hsl(var(--status-error-fg))]'
                    }>{installModal.securityStatus}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              {(installModal.step === 'done' || installModal.step === 'error') && (
                <div className="px-[var(--space-5)] py-[var(--space-3)] border-t border-[hsl(var(--border-default))] flex items-center justify-end gap-[var(--space-2)]">
                  {installModal.step === 'done' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setInstallModal(null); setActiveTab('installed') }}
                    >
                      {t('viewInstalled')}
                    </Button>
                  )}
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setInstallModal(null)}
                  >
                    {installModal.step === 'done' ? t('done') : t('close')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ================================================================
           SKILL DETAIL DRAWER
         ================================================================ */}
      {isMounted && selectedSkill && createPortal(
        <div className="fixed inset-0 z-[120]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedSkill(null)} />
          <aside className="absolute right-0 top-0 h-full w-[min(52rem,100vw)] bg-[hsl(var(--card-bg))] border-l border-[hsl(var(--border-default))] shadow-[var(--shadow-xl)] flex flex-col">
            {/* Drawer header */}
            <div className="px-[var(--space-5)] py-[var(--space-4)] border-b border-[hsl(var(--border-default))] flex items-center justify-between gap-[var(--space-3)]">
              <div className="min-w-0">
                <h3 className="text-[var(--text-lg)] font-[var(--font-semibold)] text-[hsl(var(--text-primary))] truncate">{selectedSkill.name}</h3>
                <p className="text-[var(--text-xs)] text-[hsl(var(--text-muted))] truncate mt-[var(--space-0-5)]">
                  {selectedSkill.source} • {selectedSkill.path}
                </p>
              </div>
              <div className="flex items-center gap-[var(--space-2)]">
                <Button variant="destructive" size="sm" onClick={deleteSkill} disabled={saving || drawerLoading}>
                  {t('delete')}
                </Button>
                <Button variant="outline" size="sm" onClick={saveSkill} disabled={saving || drawerLoading}>
                  {t('save')}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedSkill(null)}>{t('close')}</Button>
              </div>
            </div>
            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto">
              {drawerLoading ? (
                <div className="p-[var(--space-5)] text-[var(--text-sm)] text-[hsl(var(--text-muted))]">{t('loadingSkillContent')}</div>
              ) : drawerError ? (
                <div className="p-[var(--space-5)] text-[var(--text-sm)] text-[hsl(var(--status-error-fg))]">{drawerError}</div>
              ) : selectedContent ? (
                <>
                  {selectedContent.security && selectedContent.security.issues.length > 0 && (
                    <div className={`mx-[var(--space-5)] mt-[var(--space-4)] rounded-[var(--radius-lg)] border p-[var(--space-4)] text-[var(--text-xs)] ${
                      selectedContent.security.status === 'rejected'
                        ? 'bg-[hsl(var(--status-error-bg))] border-[hsl(var(--status-error-border))] text-[hsl(var(--status-error-fg))]'
                        : selectedContent.security.status === 'warning'
                          ? 'bg-[hsl(var(--status-warning-bg))] border-[hsl(var(--status-warning-border))] text-[hsl(var(--status-warning-fg))]'
                          : 'bg-[hsl(var(--bg-subtle))] border-[hsl(var(--border-default))] text-[hsl(var(--text-muted))]'
                    }`}>
                      <div className="font-[var(--font-medium)] mb-[var(--space-2)]">{t('security')}: {selectedContent.security.status}</div>
                      {selectedContent.security.issues.map((issue, i) => (
                        <div key={i} className="flex items-start gap-[var(--space-2)] mt-[var(--space-1)]">
                          <span className={`mt-[var(--space-0-5)] text-[var(--text-xs)] font-[var(--font-mono)] ${
                            issue.severity === 'critical' ? 'text-[hsl(var(--status-error-fg))]' : issue.severity === 'warning' ? 'text-[hsl(var(--status-warning-fg))]' : 'text-[hsl(var(--text-muted))]'
                          }`}>[{issue.severity}]</span>
                          <span>{issue.description}{issue.line ? ` (line ${issue.line})` : ''}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <textarea
                    value={draftContent}
                    onChange={(e) => setDraftContent(e.target.value)}
                    className="w-full h-full min-h-[70vh] bg-[hsl(var(--card-bg))] p-[var(--space-5)] text-[var(--text-xs)] text-[hsl(var(--text-muted))] leading-[var(--leading-relaxed)] font-[var(--font-mono)] whitespace-pre rounded-none border-0 focus:outline-none"
                  />
                </>
              ) : (
                <div className="p-[var(--space-5)] text-[var(--text-sm)] text-[hsl(var(--text-muted))]">{t('noContent')}</div>
              )}
            </div>
          </aside>
        </div>,
        document.body
      )}
    </div>
  )
}
