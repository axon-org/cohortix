'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/ui/loader'
import { useMissionControl } from '@/store'
import { createClientLogger } from '@/lib/client-logger'
import { MemoryGraph } from './memory-graph'

const log = createClientLogger('MemoryBrowser')

interface MemoryFile {
  path: string
  name: string
  type: 'file' | 'directory'
  size?: number
  modified?: number
  children?: MemoryFile[]
}

function mergeDirectoryChildren(files: MemoryFile[], targetPath: string, children: MemoryFile[]): MemoryFile[] {
  return files.map((file) => {
    if (file.path === targetPath && file.type === 'directory') {
      return { ...file, children }
    }
    if (!file.children?.length) return file
    return { ...file, children: mergeDirectoryChildren(file.children, targetPath, children) }
  })
}

interface HealthCategory {
  name: string
  status: 'healthy' | 'warning' | 'critical'
  score: number
  issues: string[]
  suggestions: string[]
}

interface HealthReport {
  overall: 'healthy' | 'warning' | 'critical'
  overallScore: number
  categories: HealthCategory[]
  generatedAt: number
}

interface MOCGroup {
  directory: string
  entries: { title: string; path: string; linkCount: number }[]
}

interface ProcessingResult {
  action: string
  filesProcessed: number
  changes: string[]
  suggestions: string[]
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function countFiles(files: MemoryFile[]): number {
  return files.reduce((acc, f) => {
    if (f.type === 'file') return acc + 1
    return acc + countFiles(f.children || [])
  }, 0)
}

function totalSize(files: MemoryFile[]): number {
  return files.reduce((acc, f) => {
    if (f.type === 'file' && f.size) return acc + f.size
    return acc + totalSize(f.children || [])
  }, 0)
}

// ---------------------------------------------------------------------------
// File type icons (SVG) for VS Code-style tree
// ---------------------------------------------------------------------------

function FileTypeIcon({ name, isDir, isOpen }: { name: string; isDir: boolean; isOpen?: boolean }) {
  if (isDir) {
    return isOpen ? (
      <svg className="w-[var(--space-4)] h-[var(--space-4)] shrink-0" viewBox="0 0 16 16" fill="none">
        <path d="M1.5 2.5h4.5l1.5 1.5h7v9.5h-13z" fill="#6C5CE7" opacity="0.85" />
        <path d="M1.5 6h13l-2 7.5h-9z" fill="#6C5CE7" opacity="0.6" />
      </svg>
    ) : (
      <svg className="w-[var(--space-4)] h-[var(--space-4)] shrink-0" viewBox="0 0 16 16" fill="none">
        <path d="M1.5 2.5h4.5l1.5 1.5h7v9.5h-13z" fill="#6C5CE7" opacity="0.7" />
      </svg>
    )
  }
  if (name.endsWith('.md')) {
    return (
      <svg className="w-[var(--space-4)] h-[var(--space-4)] shrink-0 text-[hsl(var(--interactive-primary))]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
        <rect x="2" y="1" width="12" height="14" rx="1.5" />
        <path d="M5 5h6M5 8h4M5 11h5" strokeLinecap="round" />
      </svg>
    )
  }
  if (name.endsWith('.json') || name.endsWith('.jsonl')) {
    return (
      <svg className="w-[var(--space-4)] h-[var(--space-4)] shrink-0 text-[hsl(var(--status-warning-fg))]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M5 2c-2 0-2 2-2 3s1 1.5 1 2-1 1-1 2 0 3 2 3M11 2c2 0 2 2 2 3s-1 1.5-1 2 1 1 1 2 0 3-2 3" strokeLinecap="round" />
      </svg>
    )
  }
  if (name.endsWith('.txt') || name.endsWith('.log')) {
    return (
      <svg className="w-[var(--space-4)] h-[var(--space-4)] shrink-0 text-[hsl(var(--text-muted))]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
        <rect x="2" y="1" width="12" height="14" rx="1.5" />
        <path d="M5 5h6M5 8h6M5 11h3" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg className="w-[var(--space-4)] h-[var(--space-4)] shrink-0 text-[hsl(var(--text-muted))]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="2" y="1" width="12" height="14" rx="1.5" />
    </svg>
  )
}

function statusColor(status: 'healthy' | 'warning' | 'critical'): string {
  if (status === 'healthy') return 'text-[hsl(var(--status-success-fg))]'
  if (status === 'warning') return 'text-[hsl(var(--status-warning-fg))]'
  return 'text-[hsl(var(--status-error-fg))]'
}

function statusBgClass(status: 'healthy' | 'warning' | 'critical'): string {
  if (status === 'healthy') return 'bg-[hsl(var(--status-success-solid))]'
  if (status === 'warning') return 'bg-[hsl(var(--status-warning-solid))]'
  return 'bg-[hsl(var(--status-error-solid))]'
}

function statusPillBg(status: 'healthy' | 'warning' | 'critical'): string {
  if (status === 'healthy') return 'bg-[hsl(var(--status-success-bg))] text-[hsl(var(--status-success-fg))] border-[hsl(var(--status-success-border))]'
  if (status === 'warning') return 'bg-[hsl(var(--status-warning-bg))] text-[hsl(var(--status-warning-fg))] border-[hsl(var(--status-warning-border))]'
  return 'bg-[hsl(var(--status-error-bg))] text-[hsl(var(--status-error-fg))] border-[hsl(var(--status-error-border))]'
}

// ---------------------------------------------------------------------------
// Sparkline mini chart for Health view
// ---------------------------------------------------------------------------

function Sparkline({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  // Simple bar-style sparkline
  const points = useMemo(() => {
    const bars = 8
    const result: number[] = []
    for (let i = 0; i < bars; i++) {
      const base = (pct / 100) * 0.8
      const jitter = Math.sin(i * 1.7 + value * 0.1) * 0.15
      result.push(Math.max(0.05, Math.min(1, base + jitter)))
    }
    return result
  }, [pct, value])

  return (
    <svg className="w-[var(--space-16)] h-[var(--space-6)]" viewBox="0 0 64 24">
      {points.map((h, i) => (
        <rect
          key={i}
          x={i * 8 + 1}
          y={24 - h * 20}
          width="5"
          height={h * 20}
          rx="1"
          fill={color}
          opacity={0.6 + h * 0.4}
        />
      ))}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Pipeline stage node
// ---------------------------------------------------------------------------

function PipelineStageNode({ label, description, status, onClick, disabled }: {
  label: string
  description: string
  status: 'idle' | 'running' | 'done'
  onClick: () => void
  disabled: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center p-[var(--space-4)] rounded-[var(--card-radius)] border transition-all min-w-[140px] ${
        status === 'done'
          ? 'border-[hsl(var(--status-success-border))] bg-[hsl(var(--status-success-bg))]'
          : status === 'running'
            ? 'border-[hsl(var(--interactive-primary))] bg-[hsl(var(--interactive-primary-subtle))]'
            : 'border-[hsl(var(--card-border))] bg-[hsl(var(--card-bg))] hover:border-[hsl(var(--border-strong))] hover:shadow-[var(--card-shadow-hover)]'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      style={{ boxShadow: 'var(--card-shadow)' }}
    >
      <div className={`w-[var(--space-8)] h-[var(--space-8)] rounded-full flex items-center justify-center mb-[var(--space-2)] ${
        status === 'done'
          ? 'bg-[hsl(var(--status-success-solid))]'
          : status === 'running'
            ? 'bg-[hsl(var(--interactive-primary))]'
            : 'bg-[hsl(var(--bg-subtle))]'
      }`}>
        {status === 'done' ? (
          <svg className="w-[var(--space-4)] h-[var(--space-4)] text-white" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3.5 8.5L6.5 11.5L12.5 4.5" />
          </svg>
        ) : status === 'running' ? (
          <div className="w-[var(--space-3)] h-[var(--space-3)] border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-[var(--space-4)] h-[var(--space-4)] text-[hsl(var(--text-muted))]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="8" cy="8" r="3" />
          </svg>
        )}
      </div>
      <span className="text-[var(--text-sm)] font-[var(--font-medium)] text-[hsl(var(--text-primary))] mb-[var(--space-0-5)]">{label}</span>
      <span className="text-[var(--text-xs)] text-[hsl(var(--text-muted))] text-center leading-[var(--leading-snug)]">{description}</span>
    </button>
  )
}

function PipelineArrow() {
  return (
    <div className="flex items-center px-[var(--space-1)] shrink-0">
      <svg className="w-[var(--space-6)] h-[var(--space-4)] text-[hsl(var(--border-default))]" viewBox="0 0 24 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 8h18M16 4l4 4-4 4" />
      </svg>
    </div>
  )
}

export function MemoryBrowserPanel() {
  const t = useTranslations('memoryBrowser')
  const {
    memoryFiles,
    selectedMemoryFile,
    memoryContent,
    memoryFileLinks,
    memoryHealth,
    dashboardMode,
    setMemoryFiles,
    setSelectedMemoryFile,
    setMemoryContent,
    setMemoryFileLinks,
    setMemoryHealth
  } = useMissionControl()
  const isLocal = dashboardMode === 'local'

  const [isLoading, setIsLoading] = useState(false)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [searchResults, setSearchResults] = useState<{ path: string; name: string; matches: number }[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeView, setActiveView] = useState<'files' | 'graph' | 'health' | 'pipeline' | 'hermes'>(!isLocal ? 'graph' : 'files')
  const [hermesMemory, setHermesMemory] = useState<{ agentMemory: string | null; userMemory: string | null; agentMemorySize: number; userMemorySize: number; agentMemoryEntries: number; userMemoryEntries: number } | null>(null)
  const [hermesInstalled, setHermesInstalled] = useState<boolean | null>(null)
  const [isLoadingHermes, setIsLoadingHermes] = useState(false)
  const [fileFilter, setFileFilter] = useState<'all' | 'daily' | 'knowledge'>('all')
  const [schemaWarnings, setSchemaWarnings] = useState<string[]>([])
  const [linksOpen, setLinksOpen] = useState(false)
  const [healthReport, setHealthReport] = useState<HealthReport | null>(null)
  const [isLoadingHealth, setIsLoadingHealth] = useState(false)
  const [pipelineResult, setPipelineResult] = useState<ProcessingResult | null>(null)
  const [mocGroups, setMocGroups] = useState<MOCGroup[]>([])
  const [isRunningPipeline, setIsRunningPipeline] = useState(false)
  const [isHydratingTree, setIsHydratingTree] = useState(false)
  const memoryFilesRef = useRef(memoryFiles)

  useEffect(() => {
    memoryFilesRef.current = memoryFiles
  }, [memoryFiles])

  const fetchTree = useCallback(async (options?: { path?: string; depth?: number }) => {
    const params = new URLSearchParams({ action: 'tree' })
    if (typeof options?.depth === 'number') params.set('depth', String(options.depth))
    if (options?.path) params.set('path', options.path)
    const response = await fetch(`/api/memory?${params.toString()}`)
    return response.json()
  }, [])

  const loadFileTree = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchTree({ depth: 1 })
      setMemoryFiles(data.tree || [])
      setExpandedFolders(new Set(['daily', 'knowledge', 'memory', 'knowledge-base']))
      setIsHydratingTree(true)
      void fetchTree()
        .then((fullData) => {
          setMemoryFiles(fullData.tree || [])
        })
        .catch((error) => {
          log.error('Failed to hydrate full file tree:', error)
        })
        .finally(() => {
          setIsHydratingTree(false)
        })
    } catch (error) {
      log.error('Failed to load file tree:', error)
    } finally {
      setIsLoading(false)
    }
  }, [fetchTree, setMemoryFiles])

  useEffect(() => {
    loadFileTree()
  }, [loadFileTree])

  const filteredFiles = useMemo(() => {
    if (fileFilter === 'all') return memoryFiles
    const prefixes = fileFilter === 'daily'
      ? ['daily/', 'memory/']
      : ['knowledge/', 'knowledge-base/']
    return memoryFiles.filter((file) => {
      const p = `${file.path.replace(/\\/g, '/')}/`
      return prefixes.some((prefix) => p.startsWith(prefix))
    })
  }, [memoryFiles, fileFilter])

  const loadFileContent = async (filePath: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/memory?action=content&path=${encodeURIComponent(filePath)}`)
      const data = await response.json()
      if (data.content !== undefined) {
        setSelectedMemoryFile(filePath)
        setMemoryContent(data.content)
        setIsEditing(false)
        setEditedContent('')
        setSchemaWarnings([])
        if (data.wikiLinks) {
          setMemoryFileLinks({
            wikiLinks: data.wikiLinks,
            incoming: [],
            outgoing: [],
          })
          fetch(`/api/memory/links?file=${encodeURIComponent(filePath)}`)
            .then((r) => r.json())
            .then((linkData) => {
              setMemoryFileLinks({
                wikiLinks: linkData.wikiLinks || data.wikiLinks,
                incoming: linkData.incoming || [],
                outgoing: linkData.outgoing || [],
              })
            })
            .catch(() => {})
        }
        if (activeView === 'graph' || activeView === 'health' || activeView === 'pipeline') {
          setActiveView('files')
        }
      }
    } catch (error) {
      log.error('Failed to load file content:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const searchFiles = async () => {
    if (!searchQuery.trim()) return
    setIsSearching(true)
    try {
      const response = await fetch(`/api/memory?action=search&query=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      setSearchResults(data.results || [])
    } catch (error) {
      log.error('Search failed:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const toggleFolder = async (folderPath: string, needsChildren: boolean) => {
    if (!expandedFolders.has(folderPath) && needsChildren) {
      try {
        const data = await fetchTree({ path: folderPath, depth: 1 })
        setMemoryFiles(mergeDirectoryChildren(memoryFilesRef.current, folderPath, data.tree || []))
      } catch (error) {
        log.error('Failed to load folder children:', error)
      }
    }
    const next = new Set(expandedFolders)
    if (next.has(folderPath)) next.delete(folderPath)
    else next.add(folderPath)
    setExpandedFolders(next)
  }

  const saveFile = async () => {
    if (!selectedMemoryFile) return
    setIsSaving(true)
    try {
      const response = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', path: selectedMemoryFile, content: editedContent })
      })
      const data = await response.json()
      if (data.success) {
        setMemoryContent(editedContent)
        setIsEditing(false)
        setEditedContent('')
        setSchemaWarnings(data.schemaWarnings || [])
        loadFileTree()
      }
    } catch (error) {
      log.error('Failed to save file:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const createNewFile = async (filePath: string, content: string = '') => {
    try {
      const response = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', path: filePath, content })
      })
      const data = await response.json()
      if (data.success) {
        loadFileTree()
        loadFileContent(filePath)
      }
    } catch (error) {
      log.error('Failed to create file:', error)
    }
  }

  const deleteFile = async () => {
    if (!selectedMemoryFile) return
    try {
      const response = await fetch('/api/memory', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', path: selectedMemoryFile })
      })
      const data = await response.json()
      if (data.success) {
        setSelectedMemoryFile('')
        setMemoryContent('')
        setMemoryFileLinks(null)
        setShowDeleteConfirm(false)
        loadFileTree()
      }
    } catch (error) {
      log.error('Failed to delete file:', error)
    }
  }

  const loadHealth = useCallback(async () => {
    setIsLoadingHealth(true)
    try {
      const response = await fetch('/api/memory/health')
      const data = await response.json()
      if (data.categories) {
        setHealthReport(data)
        setMemoryHealth(data)
      }
    } catch (error) {
      log.error('Failed to load health:', error)
    } finally {
      setIsLoadingHealth(false)
    }
  }, [setMemoryHealth])

  useEffect(() => {
    if (activeView === 'health' && !healthReport) {
      loadHealth()
    }
  }, [activeView, healthReport, loadHealth])

  useEffect(() => {
    if (hermesInstalled === null) {
      fetch('/api/hermes').then(r => r.json()).then(d => setHermesInstalled(d.installed === true)).catch(() => setHermesInstalled(false))
    }
  }, [hermesInstalled])

  useEffect(() => {
    if (activeView === 'hermes' && !hermesMemory && !isLoadingHermes) {
      setIsLoadingHermes(true)
      fetch('/api/hermes/memory')
        .then(r => r.json())
        .then(d => setHermesMemory(d))
        .catch(() => {})
        .finally(() => setIsLoadingHermes(false))
    }
  }, [activeView, hermesMemory, isLoadingHermes])

  const runPipelineAction = async (action: string) => {
    setIsRunningPipeline(true)
    setPipelineResult(null)
    setMocGroups([])
    try {
      const response = await fetch('/api/memory/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      const data = await response.json()
      if (action === 'generate-moc') {
        setMocGroups(data.groups || [])
      } else {
        setPipelineResult(data)
      }
    } catch (error) {
      log.error('Pipeline action failed:', error)
    } finally {
      setIsRunningPipeline(false)
    }
  }

  const fileCount = useMemo(() => countFiles(memoryFiles), [memoryFiles])
  const sizeTotal = useMemo(() => totalSize(memoryFiles), [memoryFiles])

  const navigateToWikiLink = (target: string) => {
    const findFile = (files: MemoryFile[]): string | null => {
      for (const f of files) {
        if (f.type === 'file') {
          const stem = f.name.replace(/\.[^.]+$/, '')
          if (stem === target || f.name === target || f.name === `${target}.md`) {
            return f.path
          }
        }
        if (f.children) {
          const found = findFile(f.children)
          if (found) return found
        }
      }
      return null
    }
    const found = findFile(memoryFiles)
    if (found) {
      loadFileContent(found)
    }
  }

  // ---------------------------------------------------------------------------
  // VS Code-style tree with indent guides, hover actions, breadcrumb path
  // ---------------------------------------------------------------------------

  const renderTree = (files: MemoryFile[], depth = 0): React.ReactElement[] => {
    return files.map((file) => {
      const isDir = file.type === 'directory'
      const isExpanded = expandedFolders.has(file.path)
      const isSelected = selectedMemoryFile === file.path
      return (
        <div key={file.path}>
          <div
            className={`group flex items-center gap-[var(--space-1)] py-[var(--space-1)] pr-[var(--space-3)] cursor-pointer text-[var(--text-sm)] transition-colors duration-75 rounded-[var(--radius-sm)] ${
              isSelected
                ? 'bg-[#EDE9FD] text-[#6C5CE7]'
                : 'text-[#444455] hover:bg-black/[0.03]'
            }`}
            style={{ paddingLeft: `${8 + depth * 16}px` }}
            onClick={() => void (isDir ? toggleFolder(file.path, file.children === undefined) : loadFileContent(file.path))}
          >
            {/* Indent guides */}
            {depth > 0 && (
              <div className="absolute left-0 top-0 bottom-0 pointer-events-none" aria-hidden="true">
                {Array.from({ length: depth }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 w-px bg-[hsl(var(--border-subtle))]"
                    style={{ left: `${12 + i * 16}px` }}
                  />
                ))}
              </div>
            )}
            {/* Chevron */}
            {isDir ? (
              <svg
                className={`w-[var(--space-4)] h-[var(--space-4)] shrink-0 text-[hsl(var(--text-muted))] transition-transform duration-100 ${isExpanded ? 'rotate-90' : ''}`}
                viewBox="0 0 16 16" fill="currentColor"
              >
                <path d="M6 4l4 4-4 4z" />
              </svg>
            ) : (
              <span className="w-[var(--space-4)] shrink-0" />
            )}
            {/* File type icon */}
            <FileTypeIcon name={file.name} isDir={isDir} isOpen={isDir && isExpanded} />
            {/* Name */}
            <span className="truncate flex-1 font-[var(--font-regular)]">{file.name}</span>
            {/* Size (muted) */}
            {!isDir && file.size != null && (
              <span className="text-[var(--text-xs)] text-[#888899] shrink-0 tabular-nums">{formatFileSize(file.size)}</span>
            )}
            {/* Hover actions */}
            {!isDir && (
              <div className="flex items-center gap-[var(--space-0-5)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); loadFileContent(file.path) }}
                  className="p-[var(--space-0-5)] rounded-[var(--radius-xs)] hover:bg-[hsl(var(--bg-subtle))] text-[hsl(var(--text-muted))]"
                  title="Open"
                >
                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 6h8M7 3l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </div>
            )}
          </div>
          {isDir && isExpanded && file.children && <div>{renderTree(file.children, depth + 1)}</div>}
        </div>
      )
    })
  }

  const renderInline = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = []
    const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[\[([^\]|]+)(?:\|([^\]]+))?\]\])/g
    let lastIndex = 0
    let match: RegExpExecArray | null
    let key = 0
    while ((match = pattern.exec(text)) !== null) {
      if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index))
      const m = match[0]
      if (m.startsWith('[[') && m.endsWith(']]')) {
        const target = match[2]?.trim() || ''
        const display = (match[3] || match[2] || '').trim()
        parts.push(
          <button
            key={key++}
            onClick={() => navigateToWikiLink(target)}
            className="text-[#6C5CE7] hover:text-[#5B4BD5] underline underline-offset-2 decoration-[#6C5CE7]/30 hover:decoration-[#6C5CE7]/60 transition-colors font-mono text-xs cursor-pointer"
            title={`Navigate to [[${target}]]`}
          >
            {display}
          </button>
        )
      } else if (m.startsWith('`') && m.endsWith('`')) {
        parts.push(<code key={key++} className="px-1 py-0.5 rounded text-xs font-mono" style={{ background: '#F0EDFF', color: '#6C5CE7' }}>{m.slice(1, -1)}</code>)
      } else if (m.startsWith('**') && m.endsWith('**')) {
        parts.push(<strong key={key++} className="font-semibold" style={{ color: '#1A1A2E' }}>{m.slice(2, -2)}</strong>)
      } else if (m.startsWith('*') && m.endsWith('*')) {
        parts.push(<em key={key++}>{m.slice(1, -1)}</em>)
      }
      lastIndex = pattern.lastIndex
    }
    if (lastIndex < text.length) parts.push(text.slice(lastIndex))
    return parts
  }

  const renderMarkdown = (content: string) => {
    const lines = content.split('\n')
    const elements: React.ReactElement[] = []
    const seenHeaders = new Set<string>()
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()
      if (trimmed.startsWith('# ')) {
        const text = trimmed.slice(2)
        const id = `h1-${text.toLowerCase().replace(/\s+/g, '-')}`
        if (seenHeaders.has(id)) continue
        seenHeaders.add(id)
        elements.push(<h1 key={i} className="text-xl font-bold mt-6 mb-2" style={{ color: '#1A1A2E' }}>{renderInline(text)}</h1>)
      } else if (trimmed.startsWith('## ')) {
        const text = trimmed.slice(3)
        const id = `h2-${text.toLowerCase().replace(/\s+/g, '-')}`
        if (seenHeaders.has(id)) continue
        seenHeaders.add(id)
        elements.push(<h2 key={i} className="text-base font-semibold mt-5 mb-2" style={{ color: '#1A1A2E' }}>{renderInline(text)}</h2>)
      } else if (trimmed.startsWith('### ')) {
        const text = trimmed.slice(4)
        const id = `h3-${text.toLowerCase().replace(/\s+/g, '-')}`
        if (seenHeaders.has(id)) continue
        seenHeaders.add(id)
        elements.push(<h3 key={i} className="text-sm font-semibold mt-4 mb-1.5" style={{ color: '#1A1A2E' }}>{renderInline(text)}</h3>)
      } else if (trimmed.startsWith('> ')) {
        elements.push(
          <blockquote key={i} className="border-l-2 pl-4 my-2 italic text-sm leading-relaxed" style={{ borderColor: '#6C5CE7', color: '#888899' }}>{renderInline(trimmed.slice(2))}</blockquote>
        )
      } else if (trimmed.startsWith('- ')) {
        elements.push(
          <li key={i} className="ml-5 mb-0.5 text-sm leading-relaxed marker:text-[#6C5CE7]" style={{ color: '#444455', listStyleType: 'disc' }}>
            {renderInline(trimmed.slice(2))}
          </li>
        )
      } else if (trimmed === '---' || trimmed === '***') {
        elements.push(<hr key={i} className="my-4" style={{ borderColor: '#E8E8EC' }} />)
      } else if (trimmed === '') {
        elements.push(<div key={i} className="h-2" />)
      } else if (trimmed.startsWith('```')) {
        const codeLang = trimmed.slice(3)
        const codeLines: string[] = []
        let j = i + 1
        while (j < lines.length && !lines[j].trim().startsWith('```')) {
          codeLines.push(lines[j])
          j++
        }
        elements.push(
          <div key={i} className="rounded-lg overflow-hidden my-3">
            {codeLang && <div className="px-3 py-1.5 text-[10px] font-mono font-medium" style={{ background: '#F5F4FF', color: '#6C5CE7' }}>{codeLang}</div>}
            <pre className="px-3 py-2 text-xs font-mono overflow-x-auto" style={{ background: '#1E1E2D', color: '#E8E8EC' }}>
              <code>{codeLines.join('\n')}</code>
            </pre>
          </div>
        )
        i = j
      } else {
        elements.push(
          <p key={i} className="mb-1.5 text-sm leading-relaxed" style={{ color: '#444455' }}>{renderInline(trimmed)}</p>
        )
      }
    }
    return elements
  }

  // ---------------------------------------------------------------------------
  // View switcher config with hints (FR50a)
  // ---------------------------------------------------------------------------

  const viewTabs = useMemo(() => {
    const tabs: { key: typeof activeView; label: string; hint?: string }[] = [
      { key: 'files', label: 'Files', hint: fileCount > 0 ? `${fileCount}` : undefined },
      ...(!isLocal ? [{ key: 'graph' as const, label: 'Graph' }] : []),
      { key: 'health', label: 'Health', hint: healthReport ? (healthReport.overall === 'healthy' ? '\u2713' : healthReport.overall === 'warning' ? '!' : '\u2717') : undefined },
      { key: 'pipeline', label: 'Pipeline' },
      ...(hermesInstalled ? [{ key: 'hermes' as const, label: 'Hermes' }] : []),
    ]
    return tabs
  }, [isLocal, hermesInstalled, fileCount, healthReport])

  const folderCount = useMemo(() => {
    const countDirs = (files: MemoryFile[]): number =>
      files.reduce((acc, f) => acc + (f.type === 'directory' ? 1 + countDirs(f.children || []) : 0), 0)
    return countDirs(memoryFiles)
  }, [memoryFiles])

  const selectedFileName = selectedMemoryFile ? selectedMemoryFile.split('/').pop() || '' : ''
  const selectedFileData = useMemo(() => {
    if (!selectedMemoryFile || !memoryContent) return null
    const lines = memoryContent.split('\n').length
    const words = memoryContent.split(/\s+/).filter(Boolean).length
    const file = (function findFile(files: MemoryFile[]): MemoryFile | null {
      for (const f of files) {
        if (f.path === selectedMemoryFile) return f
        if (f.children) { const found = findFile(f.children); if (found) return found }
      }
      return null
    })(memoryFiles)
    const ext = selectedMemoryFile.split('.').pop() || 'txt'
    const modified = file?.modified ? new Date(file.modified) : null
    const modifiedLabel = modified ? (() => {
      const diffMs = Date.now() - modified.getTime()
      const diffDays = Math.floor(diffMs / 86400000)
      if (diffDays === 0) return 'Modified today'
      if (diffDays === 1) return 'Modified yesterday'
      return `Modified ${diffDays} days ago`
    })() : null
    return { lines, words, size: file?.size || 0, ext, modifiedLabel }
  }, [selectedMemoryFile, memoryContent, memoryFiles])

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden bg-[hsl(var(--bg-canvas))]">
      {/* Top bar */}
      <div className="flex items-center gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-2)] border-b border-[hsl(var(--border-default))] bg-[hsl(var(--bg-surface-raised))]">
        {/* Segmented pill control */}
        <div className="inline-flex rounded-full bg-[#F0F0F5] p-0.5">
          {viewTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveView(tab.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
                activeView === tab.key
                  ? 'bg-white text-[#1A1A2E] shadow-sm'
                  : 'text-[#888899] hover:text-[#444455]'
              }`}
            >
              {tab.label}
              {tab.hint && (
                <span className={`ml-1 text-[10px] ${
                  activeView === tab.key ? 'text-[#888899]' : 'text-[#888899]/60'
                }`}>
                  ({tab.hint})
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Status hints */}
        {healthReport && (
          <span className={`text-[var(--text-xs)] font-[var(--font-mono)] tabular-nums ${statusColor(healthReport.overall)}`}>{healthReport.overallScore}%</span>
        )}
        {isHydratingTree && <span className="text-xs text-[#888899]/50 font-mono">{t('indexing')}</span>}

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:bg-[#F0F0F5]"
          style={{ borderColor: '#E8E8EC', color: '#444455' }}
        >
          + {t('newFile')}
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Non-files views still use full width */}
        {activeView === 'graph' && !isLocal ? (
          <div className="flex-1 overflow-hidden flex flex-col"><MemoryGraph /></div>
        ) : activeView === 'health' ? (
          <div className="flex-1 overflow-auto p-[var(--space-6)]"><HealthView report={healthReport} isLoading={isLoadingHealth} onRefresh={loadHealth} /></div>
        ) : activeView === 'pipeline' ? (
          <div className="flex-1 overflow-auto p-[var(--space-6)]"><PipelineView result={pipelineResult} mocGroups={mocGroups} isRunning={isRunningPipeline} onRunAction={runPipelineAction} onNavigate={loadFileContent} /></div>
        ) : activeView === 'hermes' ? (
          <div className="flex-1 overflow-auto p-[var(--space-6)]">
            <HermesMemoryView data={hermesMemory} isLoading={isLoadingHermes} onRefresh={() => { setHermesMemory(null); setIsLoadingHermes(false) }} />
          </div>
        ) : (
        /* FILES VIEW — 2-panel card layout matching v0 mockup */
        <div className="flex flex-1 min-h-0 gap-4 p-4">
          {/* LEFT PANEL — File Tree (35%) */}
          <div className="w-[35%] shrink-0 min-w-0 overflow-hidden">
            <div className="flex flex-col h-full bg-white rounded-xl border" style={{ borderColor: '#E8E8EC', boxShadow: 'rgba(0,0,0,0.06) 0px 1px 3px' }}>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#F0F0F5' }}>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none">
                    <path d="M1.5 2.5h4.5l1.5 1.5h7v9.5h-13z" fill="#6C5CE7" opacity="0.7" />
                  </svg>
                  <span className="text-sm font-semibold" style={{ color: '#1A1A2E' }}>Knowledge Base</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#F0F0F5', color: '#888899' }}>{fileCount} files</span>
                  <button
                    onClick={loadFileTree}
                    disabled={isLoading}
                    className="p-1 rounded-md hover:bg-black/[0.03] transition-colors"
                    style={{ color: '#888899' }}
                    title={t('refresh')}
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M2 8a6 6 0 0111.5-2.3M14 8a6 6 0 01-11.5 2.3" />
                      <path d="M14 2v4h-4M2 14v-4h4" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="px-3 pt-2 pb-1">
                <div className="relative">
                  <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#888899' }} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="7" cy="7" r="4.5" />
                    <path d="M10.5 10.5L14 14" strokeLinecap="round" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchFiles()}
                    placeholder={t('searchPlaceholder')}
                    className="w-full pl-7 pr-2 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:border-[#6C5CE7]/40 transition-colors"
                    style={{ borderColor: '#E8E8EC', color: '#1A1A2E' }}
                />
              </div>
            </div>

            {/* Filter pills */}
            <div className="flex gap-1 px-3 pb-2">
              {(['all', 'daily', 'knowledge'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFileFilter(f)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors capitalize ${
                    fileFilter === f
                      ? 'bg-[#EDE9FD] text-[#6C5CE7]'
                      : 'text-[#888899] hover:text-[#444455] hover:bg-black/[0.03]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Search results */}
            {searchResults.length > 0 && (
              <div className="px-3 pb-2 border-b" style={{ borderColor: '#F0F0F5' }}>
                <div className="text-[10px] font-mono mb-1" style={{ color: '#888899' }}>{t('searchResults', { count: searchResults.length })}</div>
                <div className="max-h-28 overflow-y-auto space-y-px">
                  {searchResults.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 py-1 px-1.5 rounded text-xs cursor-pointer hover:bg-black/[0.03]"
                      style={{ color: '#444455' }}
                      onClick={() => { loadFileContent(r.path); setSearchResults([]) }}
                    >
                      <span className="truncate flex-1">{r.name}</span>
                      <span className="text-[10px]" style={{ color: '#888899' }}>{r.matches}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

              {/* File tree */}
              <div className="flex-1 overflow-y-auto py-1 relative">
                {isLoading ? (
                  <div className="flex items-center justify-center h-20"><Loader variant="inline" /></div>
                ) : filteredFiles.length === 0 ? (
                  <div className="text-center text-xs py-8" style={{ color: '#888899' }}>{t('noFiles')}</div>
                ) : renderTree(filteredFiles)}
              </div>

              {/* Footer: file/folder count + total size */}
              <div className="px-4 py-2.5 border-t flex items-center justify-between" style={{ borderColor: '#F0F0F5' }}>
                <span className="text-xs" style={{ color: '#888899' }}>{folderCount} folders · {fileCount} files</span>
                <span className="text-xs" style={{ color: '#888899' }}>{formatFileSize(sizeTotal)} total</span>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL — File Viewer (65%) */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex flex-col h-full bg-white rounded-xl border" style={{ borderColor: '#E8E8EC', boxShadow: 'rgba(0,0,0,0.06) 0px 1px 3px' }}>
              {selectedMemoryFile ? (
                <>
                  {/* File header */}
                  <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: '#F0F0F5' }}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#F0EDFF' }}>
                        <svg className="w-3.5 h-3.5" style={{ color: '#6C5CE7' }} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
                          <rect x="2" y="1" width="12" height="14" rx="1.5" />
                          <path d="M5 5h6M5 8h4M5 11h5" strokeLinecap="round" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: '#1A1A2E' }}>{selectedFileName}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          {selectedFileData && <span className="text-xs" style={{ color: '#888899' }}>{formatFileSize(selectedFileData.size)}</span>}
                          {selectedFileData?.modifiedLabel && <span className="text-xs" style={{ color: '#888899' }}>{selectedFileData.modifiedLabel}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => setLinksOpen(!linksOpen)} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${linksOpen ? 'bg-[#F0EDFF] text-[#6C5CE7] border-[#6C5CE7]/20' : ''}`} style={linksOpen ? {} : { borderColor: '#E8E8EC', color: '#444455' }} title={t('toggleBacklinks')}>{t('links')}</button>
                      {!isEditing ? (
                        <>
                          <button onClick={() => { setIsEditing(true); setEditedContent(memoryContent ?? '') }} className="px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:bg-[#F0F0F5]" style={{ borderColor: '#E8E8EC', color: '#444455' }}>{t('edit')}</button>
                          <button onClick={() => setShowDeleteConfirm(true)} className="px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:bg-red-50" style={{ borderColor: '#E8E8EC', color: '#888899' }}>{t('delete')}</button>
                        </>
                      ) : (
                        <>
                          <button onClick={saveFile} disabled={isSaving} className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#6C5CE7] text-white transition-colors hover:bg-[#5B4BD5]">{isSaving ? t('saving') : t('save')}</button>
                          <button onClick={() => { setIsEditing(false); setEditedContent('') }} className="px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:bg-[#F0F0F5]" style={{ borderColor: '#E8E8EC', color: '#444455' }}>{t('cancel')}</button>
                        </>
                      )}
                      <button onClick={() => { setSelectedMemoryFile(''); setMemoryContent(''); setMemoryFileLinks(null); setIsEditing(false); setEditedContent(''); setSchemaWarnings([]); setLinksOpen(false) }} className="p-1 rounded-lg hover:bg-[#F0F0F5] transition-colors" style={{ color: '#888899' }}>
                        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8" /></svg>
                      </button>
                    </div>
                  </div>
                  {schemaWarnings.length > 0 && (
                    <div className="px-5 py-2 bg-[hsl(var(--status-warning-bg))] border-b border-[hsl(var(--status-warning-border))]">
                      <div className="text-xs font-medium text-[hsl(var(--status-warning-fg))]">{t('schemaWarnings')}</div>
                      {schemaWarnings.map((w, i) => (
                        <div key={i} className="text-xs text-[hsl(var(--status-warning-fg))]/70 ml-2">- {w}</div>
                      ))}
                    </div>
                  )}
                  {/* Content */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="flex min-h-full">
                      <div className="flex-1 px-6 py-5">
                        {isLoading ? (
                          <div className="flex items-center justify-center h-40"><Loader variant="inline" /></div>
                        ) : isEditing ? (
                          <textarea
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            className="w-full min-h-[500px] p-3 bg-white text-sm font-mono border rounded-lg resize-none focus:outline-none focus:border-[#6C5CE7]/40 leading-relaxed"
                            style={{ borderColor: '#E8E8EC', color: '#444455' }}
                            placeholder={t('editPlaceholder')}
                          />
                        ) : selectedMemoryFile.endsWith('.md') ? (
                          <div>{renderMarkdown(memoryContent ?? '')}</div>
                        ) : selectedMemoryFile.endsWith('.json') ? (
                          <pre className="text-sm font-mono overflow-auto whitespace-pre-wrap break-words leading-relaxed" style={{ color: '#444455' }}>
                            <code>{(() => { try { return JSON.stringify(JSON.parse(memoryContent ?? ''), null, 2) } catch { return memoryContent } })()}</code>
                          </pre>
                        ) : (
                          <pre className="text-sm font-mono whitespace-pre-wrap break-words leading-relaxed" style={{ color: '#444455' }}>{memoryContent}</pre>
                        )}
                      </div>
                      {linksOpen && memoryFileLinks && (
                        <LinksSidebar fileLinks={memoryFileLinks} onNavigate={loadFileContent} />
                      )}
                    </div>
                  </div>
                  {/* Footer */}
                  {selectedFileData && (
                    <div className="px-5 py-2.5 border-t flex items-center gap-3" style={{ borderColor: '#F0F0F5', background: '#FAFAFA' }}>
                      <span className="text-xs px-2 py-0.5 rounded-full font-mono font-medium" style={{ background: '#F0EDFF', color: '#6C5CE7' }}>{selectedFileData.ext}</span>
                      <span className="text-xs" style={{ color: '#888899' }}>{selectedFileData.lines} lines</span>
                      <span className="text-xs" style={{ color: '#888899' }}>{selectedFileData.words} words</span>
                      <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: '#EDFBF2', color: '#22C55E' }}>synced</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <svg className="w-12 h-12 mb-3" style={{ color: '#E8E8EC' }} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="8" y="4" width="32" height="40" rx="4" />
                    <path d="M16 16h16M16 24h12M16 32h8" strokeLinecap="round" />
                  </svg>
                  <span className="text-sm" style={{ color: '#888899' }}>{t('selectFilePrompt')}</span>
                  <span className="text-xs mt-1" style={{ color: '#888899', opacity: 0.6 }}>{t('orSwitchView')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        )}
      </div>

      {showCreateModal && <CreateFileModal onClose={() => setShowCreateModal(false)} onCreate={createNewFile} />}
      {showDeleteConfirm && selectedMemoryFile && <DeleteConfirmModal fileName={selectedMemoryFile} onClose={() => setShowDeleteConfirm(false)} onConfirm={deleteFile} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Hermes Memory View — Timeline feed with filters (FR47)
// ---------------------------------------------------------------------------

function HermesMemoryView({ data, isLoading, onRefresh }: { data: { agentMemory: string | null; userMemory: string | null; agentMemorySize: number; userMemorySize: number; agentMemoryEntries: number; userMemoryEntries: number } | null; isLoading: boolean; onRefresh: () => void }) {
  const t = useTranslations('memoryBrowser')
  const [filter, setFilter] = useState<'all' | 'agent' | 'user'>('all')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader variant="inline" label={t('loadingHermes')} />
      </div>
    )
  }
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[hsl(var(--text-muted))]">
        <span className="text-[var(--text-sm)] mb-[var(--space-3)]">{t('noHermesData')}</span>
        <Button onClick={onRefresh} size="sm" variant="secondary">{t('refresh')}</Button>
      </div>
    )
  }

  const AGENT_CAP = 2200
  const USER_CAP = 1375
  const agentPct = Math.min(100, Math.round((data.agentMemorySize / AGENT_CAP) * 100))
  const userPct = Math.min(100, Math.round((data.userMemorySize / USER_CAP) * 100))

  const showAgent = filter === 'all' || filter === 'agent'
  const showUser = filter === 'all' || filter === 'user'

  return (
    <div className="max-w-3xl space-y-[var(--space-5)]">
      {/* Header with filter */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[var(--text-lg)] font-[var(--font-semibold)] text-[hsl(var(--text-primary))] mb-[var(--space-1)]">{t('hermesMemoryTitle')}</h2>
          <p className="text-[var(--text-xs)] text-[hsl(var(--text-muted))]">{t('hermesMemoryDesc')}</p>
        </div>
        <div className="flex items-center gap-[var(--space-2)]">
          {/* Timeline filter (FR47) */}
          <div className="inline-flex rounded-[var(--radius-lg)] bg-[hsl(var(--bg-subtle))] p-[var(--space-0-5)]">
            {(['all', 'agent', 'user'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-[var(--space-3)] py-[var(--space-1)] rounded-[var(--radius-md)] text-[var(--text-xs)] font-[var(--font-medium)] transition-all capitalize ${
                  filter === f
                    ? 'bg-[hsl(var(--card-bg))] text-[hsl(var(--text-primary))] shadow-[var(--shadow-sm)]'
                    : 'text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <Button onClick={onRefresh} size="sm" variant="secondary">{t('refresh')}</Button>
        </div>
      </div>

      {/* Timeline entries */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[19px] top-0 bottom-0 w-px bg-[hsl(var(--border-default))]" />

        <div className="space-y-[var(--space-4)]">
          {/* MEMORY.md entry */}
          {showAgent && (
            <div className="relative pl-[var(--space-10)]">
              {/* Timeline dot */}
              <div className="absolute left-[12px] top-[var(--space-4)] w-[var(--space-4)] h-[var(--space-4)] rounded-full bg-[hsl(var(--interactive-primary))] border-2 border-[hsl(var(--bg-canvas))]" />
              <div className="rounded-[var(--card-radius)] border border-[hsl(var(--card-border))] bg-[hsl(var(--card-bg))] p-[var(--space-4)]" style={{ boxShadow: 'var(--card-shadow)' }}>
                <div className="flex items-center justify-between mb-[var(--space-2)]">
                  <div className="flex items-center gap-[var(--space-2)]">
                    <span className="text-[var(--text-sm)] font-[var(--font-semibold)] text-[hsl(var(--text-primary))]">MEMORY.md</span>
                    <span className="px-[var(--space-2)] py-[var(--space-0-5)] rounded-[var(--radius-full)] text-[var(--text-xs)] font-[var(--font-medium)] bg-[hsl(var(--interactive-primary-subtle))] text-[hsl(var(--interactive-primary))]">{data.agentMemoryEntries} entries</span>
                  </div>
                  <span className="text-[var(--text-xs)] font-[var(--font-mono)] text-[hsl(var(--text-muted))] tabular-nums">
                    {data.agentMemorySize}/{AGENT_CAP} chars ({agentPct}%)
                  </span>
                </div>
                <div className="h-[var(--space-1-5)] bg-[hsl(var(--bg-subtle))] rounded-[var(--radius-full)] overflow-hidden mb-[var(--space-3)]">
                  <div
                    className={`h-full rounded-[var(--radius-full)] transition-all ${agentPct > 90 ? 'bg-[hsl(var(--status-error-solid))]' : agentPct > 70 ? 'bg-[hsl(var(--status-warning-solid))]' : 'bg-[hsl(var(--interactive-primary))]'}`}
                    style={{ width: `${agentPct}%`, opacity: 0.7 }}
                  />
                </div>
                {data.agentMemory ? (
                  <pre className="text-[var(--text-xs)] font-[var(--font-mono)] whitespace-pre-wrap break-words text-[hsl(var(--text-secondary))] leading-[var(--leading-relaxed)] max-h-80 overflow-y-auto bg-[hsl(var(--bg-subtle))] rounded-[var(--radius-md)] p-[var(--space-3)] border border-[hsl(var(--border-subtle))]">{data.agentMemory}</pre>
                ) : (
                  <div className="text-[var(--text-xs)] text-[hsl(var(--text-muted))] py-[var(--space-4)] text-center">{t('noAgentMemory')}</div>
                )}
              </div>
            </div>
          )}

          {/* USER.md entry */}
          {showUser && (
            <div className="relative pl-[var(--space-10)]">
              {/* Timeline dot */}
              <div className="absolute left-[12px] top-[var(--space-4)] w-[var(--space-4)] h-[var(--space-4)] rounded-full bg-[hsl(var(--status-info-solid))] border-2 border-[hsl(var(--bg-canvas))]" />
              <div className="rounded-[var(--card-radius)] border border-[hsl(var(--card-border))] bg-[hsl(var(--card-bg))] p-[var(--space-4)]" style={{ boxShadow: 'var(--card-shadow)' }}>
                <div className="flex items-center justify-between mb-[var(--space-2)]">
                  <div className="flex items-center gap-[var(--space-2)]">
                    <span className="text-[var(--text-sm)] font-[var(--font-semibold)] text-[hsl(var(--text-primary))]">USER.md</span>
                    <span className="px-[var(--space-2)] py-[var(--space-0-5)] rounded-[var(--radius-full)] text-[var(--text-xs)] font-[var(--font-medium)] bg-[hsl(var(--status-info-bg))] text-[hsl(var(--status-info-fg))]">{data.userMemoryEntries} entries</span>
                  </div>
                  <span className="text-[var(--text-xs)] font-[var(--font-mono)] text-[hsl(var(--text-muted))] tabular-nums">
                    {data.userMemorySize}/{USER_CAP} chars ({userPct}%)
                  </span>
                </div>
                <div className="h-[var(--space-1-5)] bg-[hsl(var(--bg-subtle))] rounded-[var(--radius-full)] overflow-hidden mb-[var(--space-3)]">
                  <div
                    className={`h-full rounded-[var(--radius-full)] transition-all ${userPct > 90 ? 'bg-[hsl(var(--status-error-solid))]' : userPct > 70 ? 'bg-[hsl(var(--status-warning-solid))]' : 'bg-[hsl(var(--status-info-solid))]'}`}
                    style={{ width: `${userPct}%`, opacity: 0.7 }}
                  />
                </div>
                {data.userMemory ? (
                  <pre className="text-[var(--text-xs)] font-[var(--font-mono)] whitespace-pre-wrap break-words text-[hsl(var(--text-secondary))] leading-[var(--leading-relaxed)] max-h-80 overflow-y-auto bg-[hsl(var(--bg-subtle))] rounded-[var(--radius-md)] p-[var(--space-3)] border border-[hsl(var(--border-subtle))]">{data.userMemory}</pre>
                ) : (
                  <div className="text-[var(--text-xs)] text-[hsl(var(--text-muted))] py-[var(--space-4)] text-center">{t('noUserMemory')}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Links Sidebar
// ---------------------------------------------------------------------------

function LinksSidebar({ fileLinks, onNavigate }: { fileLinks: { wikiLinks: unknown[]; incoming: string[]; outgoing: string[] }; onNavigate: (path: string) => void }) {
  const t = useTranslations('memoryBrowser')
  const links = fileLinks.wikiLinks as { target: string; display: string; line: number }[]
  return (
    <div className="w-56 shrink-0 border-l border-[hsl(var(--border-default))] bg-[hsl(var(--bg-surface-raised))] flex flex-col min-h-0 overflow-y-auto">
      <div className="p-[var(--space-3)] border-b border-[hsl(var(--border-subtle))]">
        <div className="text-[var(--text-xs)] text-[hsl(var(--text-muted))] uppercase tracking-wider mb-[var(--space-2)] font-[var(--font-medium)]">{t('outgoing', { count: fileLinks.outgoing.length })}</div>
        {fileLinks.outgoing.length === 0 ? (
          <div className="text-[var(--text-xs)] text-[hsl(var(--text-muted))]/50">none</div>
        ) : (
          <div className="space-y-[var(--space-0-5)]">
            {fileLinks.outgoing.map((path, i) => (
              <button key={i} onClick={() => onNavigate(path)} className="block w-full text-left px-[var(--space-1-5)] py-[var(--space-1)] rounded-[var(--radius-sm)] text-[var(--text-xs)] text-[hsl(var(--interactive-primary))] hover:bg-[hsl(var(--bg-subtle))] transition-colors truncate min-h-[var(--space-8)]">
                {path.split('/').pop()?.replace(/\.[^.]+$/, '')}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="p-[var(--space-3)] border-b border-[hsl(var(--border-subtle))]">
        <div className="text-[var(--text-xs)] text-[hsl(var(--text-muted))] uppercase tracking-wider mb-[var(--space-2)] font-[var(--font-medium)]">{t('backlinks', { count: fileLinks.incoming.length })}</div>
        {fileLinks.incoming.length === 0 ? (
          <div className="text-[var(--text-xs)] text-[hsl(var(--text-muted))]/50">none</div>
        ) : (
          <div className="space-y-[var(--space-0-5)]">
            {fileLinks.incoming.map((path, i) => (
              <button key={i} onClick={() => onNavigate(path)} className="block w-full text-left px-[var(--space-1-5)] py-[var(--space-1)] rounded-[var(--radius-sm)] text-[var(--text-xs)] text-[hsl(var(--interactive-primary))] hover:bg-[hsl(var(--bg-subtle))] transition-colors truncate min-h-[var(--space-8)]">
                {path.split('/').pop()?.replace(/\.[^.]+$/, '')}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="p-[var(--space-3)]">
        <div className="text-[var(--text-xs)] text-[hsl(var(--text-muted))] uppercase tracking-wider mb-[var(--space-2)] font-[var(--font-medium)]">{t('wikiLinks', { count: links.length })}</div>
        {links.length === 0 ? (
          <div className="text-[var(--text-xs)] text-[hsl(var(--text-muted))]/50">none</div>
        ) : (
          <div className="space-y-[var(--space-0-5)]">
            {links.map((link, i) => (
              <div key={i} className="flex items-center gap-[var(--space-1)] text-[var(--text-xs)]">
                <span className="text-[hsl(var(--text-muted))] tabular-nums shrink-0">L{link.line}</span>
                <span className="text-[hsl(var(--interactive-primary))]/60 truncate">[[{link.target}]]</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Health View — Dashboard cards with status pill + metric + sparkline (FR45)
// ---------------------------------------------------------------------------

function HealthView({ report, isLoading, onRefresh }: { report: HealthReport | null; isLoading: boolean; onRefresh: () => void }) {
  const t = useTranslations('memoryBrowser')
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader variant="inline" label={t('runningDiagnostics')} />
      </div>
    )
  }
  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[hsl(var(--text-muted))]">
        <svg className="w-[var(--space-12)] h-[var(--space-12)] mb-[var(--space-3)] text-[hsl(var(--border-default))]" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="24" cy="24" r="18" />
          <path d="M24 14v10l7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-[var(--text-sm)] mb-[var(--space-3)]">{t('noHealthData')}</span>
        <Button onClick={onRefresh} size="sm" variant="secondary">{t('runDiagnostics')}</Button>
      </div>
    )
  }

  const statusSolidColor = (s: 'healthy' | 'warning' | 'critical') =>
    s === 'healthy' ? 'hsl(var(--status-success-solid))' : s === 'warning' ? 'hsl(var(--status-warning-solid))' : 'hsl(var(--status-error-solid))'

  return (
    <div className="max-w-3xl space-y-[var(--space-6)]">
      {/* Overall score card */}
      <div className="rounded-[var(--card-radius)] border border-[hsl(var(--card-border))] bg-[hsl(var(--card-bg))] p-[var(--space-5)]" style={{ boxShadow: 'var(--card-shadow)' }}>
        <div className="flex items-center gap-[var(--space-4)]">
          <div className={`text-[var(--text-3xl)] font-[var(--font-bold)] font-[var(--font-mono)] tabular-nums ${statusColor(report.overall)}`}>{report.overallScore}</div>
          <div className="flex-1">
            <div className="flex items-center gap-[var(--space-2)] mb-[var(--space-0-5)]">
              <span className={`px-[var(--space-2)] py-[var(--space-0-5)] rounded-[var(--radius-full)] text-[var(--text-xs)] font-[var(--font-medium)] border uppercase ${statusPillBg(report.overall)}`}>{report.overall}</span>
            </div>
            <div className="text-[var(--text-xs)] text-[hsl(var(--text-muted))] font-[var(--font-mono)]">{t('healthCategories', { time: new Date(report.generatedAt).toLocaleTimeString() })}</div>
          </div>
          <Button onClick={onRefresh} size="sm" variant="secondary">{t('refresh')}</Button>
        </div>
      </div>

      {/* Category cards — 3-4 visible without scroll (FR45) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--space-4)]">
        {report.categories.map((cat) => (
          <div key={cat.name} className="rounded-[var(--card-radius)] border border-[hsl(var(--card-border))] bg-[hsl(var(--card-bg))] p-[var(--space-4)]" style={{ boxShadow: 'var(--card-shadow)' }}>
            <div className="flex items-center gap-[var(--space-3)] mb-[var(--space-3)]">
              {/* Status pill */}
              <span className={`px-[var(--space-2)] py-[var(--space-0-5)] rounded-[var(--radius-full)] text-[10px] font-[var(--font-medium)] border uppercase ${statusPillBg(cat.status)}`}>{cat.status}</span>
              <span className="text-[var(--text-sm)] font-[var(--font-medium)] text-[hsl(var(--text-primary))] flex-1">{cat.name}</span>
              {/* Metric */}
              <span className={`text-[var(--text-lg)] font-[var(--font-bold)] font-[var(--font-mono)] tabular-nums ${statusColor(cat.status)}`}>{cat.score}</span>
            </div>

            {/* Sparkline */}
            <div className="flex items-center gap-[var(--space-3)] mb-[var(--space-2)]">
              <Sparkline value={cat.score} color={statusSolidColor(cat.status)} />
              <div className="flex-1 h-[var(--space-1)] bg-[hsl(var(--bg-subtle))] rounded-[var(--radius-full)] overflow-hidden">
                <div className={`h-full rounded-[var(--radius-full)] transition-all ${statusBgClass(cat.status)}`} style={{ width: `${cat.score}%`, opacity: 0.7 }} />
              </div>
            </div>

            {cat.issues.length > 0 && (
              <div className="mt-[var(--space-2)] space-y-[var(--space-0-5)]">
                {cat.issues.map((issue, i) => <div key={i} className="text-[var(--text-xs)] text-[hsl(var(--text-muted))]">- {issue}</div>)}
              </div>
            )}
            {cat.suggestions.length > 0 && (
              <div className="mt-[var(--space-2)] space-y-[var(--space-0-5)]">
                {cat.suggestions.map((sug, i) => <div key={i} className="text-[var(--text-xs)] text-[hsl(var(--interactive-primary))]">{sug}</div>)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Pipeline View — Horizontal flow diagram (FR46)
// ---------------------------------------------------------------------------

function PipelineView({ result, mocGroups, isRunning, onRunAction, onNavigate }: { result: ProcessingResult | null; mocGroups: MOCGroup[]; isRunning: boolean; onRunAction: (action: string) => void; onNavigate: (path: string) => void }) {
  const t = useTranslations('memoryBrowser')
  const [lastAction, setLastAction] = useState<string | null>(null)

  const handleAction = (action: string) => {
    setLastAction(action)
    onRunAction(action)
  }

  return (
    <div className="max-w-4xl space-y-[var(--space-6)]">
      <div>
        <h2 className="text-[var(--text-lg)] font-[var(--font-semibold)] text-[hsl(var(--text-primary))] mb-[var(--space-1)]">{t('pipelineTitle')}</h2>
        <p className="text-[var(--text-xs)] text-[hsl(var(--text-muted))]">{t('pipelineDesc')}</p>
      </div>

      {/* Horizontal flow diagram (FR46) */}
      <div className="rounded-[var(--card-radius)] border border-[hsl(var(--card-border))] bg-[hsl(var(--card-bg))] p-[var(--space-6)]" style={{ boxShadow: 'var(--card-shadow)' }}>
        <div className="flex items-center justify-center overflow-x-auto pb-[var(--space-2)]">
          <PipelineStageNode
            label={t('pipelineReflect')}
            description={t('pipelineReflectDesc')}
            status={isRunning && lastAction === 'reflect' ? 'running' : result && lastAction === 'reflect' ? 'done' : 'idle'}
            onClick={() => handleAction('reflect')}
            disabled={isRunning}
          />
          <PipelineArrow />
          <PipelineStageNode
            label={t('pipelineReweave')}
            description={t('pipelineReweaveDesc')}
            status={isRunning && lastAction === 'reweave' ? 'running' : result && lastAction === 'reweave' ? 'done' : 'idle'}
            onClick={() => handleAction('reweave')}
            disabled={isRunning}
          />
          <PipelineArrow />
          <PipelineStageNode
            label={t('pipelineGenerateMoc')}
            description={t('pipelineGenerateMocDesc')}
            status={isRunning && lastAction === 'generate-moc' ? 'running' : (mocGroups.length > 0 && lastAction === 'generate-moc') ? 'done' : 'idle'}
            onClick={() => handleAction('generate-moc')}
            disabled={isRunning}
          />
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="rounded-[var(--card-radius)] border border-[hsl(var(--card-border))] bg-[hsl(var(--card-bg))] p-[var(--space-4)]" style={{ boxShadow: 'var(--card-shadow)' }}>
          <div className="flex items-center gap-[var(--space-2)] mb-[var(--space-3)]">
            <span className="px-[var(--space-2)] py-[var(--space-0-5)] rounded-[var(--radius-full)] text-[var(--text-xs)] font-[var(--font-medium)] bg-[hsl(var(--status-success-bg))] text-[hsl(var(--status-success-fg))] border border-[hsl(var(--status-success-border))]">done</span>
            <span className="text-[var(--text-sm)] font-[var(--font-semibold)] text-[hsl(var(--text-primary))] capitalize">{result.action}</span>
            <span className="text-[var(--text-xs)] text-[hsl(var(--text-muted))]">{t('filesProcessed', { count: result.filesProcessed })}</span>
          </div>
          {result.suggestions.length === 0 ? (
            <div className="text-[var(--text-xs)] text-[hsl(var(--status-success-fg))]">{t('noSuggestions')}</div>
          ) : (
            <div className="space-y-[var(--space-1-5)]">
              {result.suggestions.map((sug, i) => <div key={i} className="text-[var(--text-xs)] text-[hsl(var(--text-secondary))] leading-[var(--leading-relaxed)]">{sug}</div>)}
            </div>
          )}
        </div>
      )}

      {/* MOC groups */}
      {mocGroups.length > 0 && (
        <div className="space-y-[var(--space-3)]">
          <div className="text-[var(--text-sm)] font-[var(--font-semibold)] text-[hsl(var(--text-primary))]">{t('mapsOfContent', { count: mocGroups.length })}</div>
          {mocGroups.map((group) => (
            <div key={group.directory} className="rounded-[var(--card-radius)] border border-[hsl(var(--card-border))] bg-[hsl(var(--card-bg))] p-[var(--space-4)]" style={{ boxShadow: 'var(--card-shadow)' }}>
              <div className="text-[var(--text-xs)] font-[var(--font-semibold)] text-[hsl(var(--text-secondary))] mb-[var(--space-2)]">{group.directory}</div>
              <div className="space-y-[var(--space-0-5)]">
                {group.entries.map((entry, i) => (
                  <div key={i} className="flex items-center gap-[var(--space-2)]">
                    <button onClick={() => onNavigate(entry.path)} className="text-[var(--text-xs)] text-[hsl(var(--interactive-primary))] hover:text-[hsl(var(--interactive-primary-hover))] truncate flex-1 text-left min-h-[var(--space-8)]">{entry.title}</button>
                    {entry.linkCount > 0 && <span className="text-[10px] font-[var(--font-mono)] text-[hsl(var(--text-muted))] tabular-nums shrink-0">{entry.linkCount} links</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Create File Modal
// ---------------------------------------------------------------------------

function CreateFileModal({ onClose, onCreate }: { onClose: () => void; onCreate: (path: string, content: string) => void }) {
  const t = useTranslations('memoryBrowser')
  const [fileName, setFileName] = useState('')
  const [filePath, setFilePath] = useState('knowledge/')
  const [initialContent, setInitialContent] = useState('')
  const [fileType, setFileType] = useState('md')
  const templates: Record<string, string> = { md: '# New Document\n\n', json: '{\n  \n}', txt: '', log: '' }
  const handleCreate = () => {
    if (!fileName.trim()) return
    onCreate(filePath + fileName + '.' + fileType, initialContent)
    onClose()
  }
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-[var(--space-4)]">
      <div className="bg-[hsl(var(--card-bg))] border border-[hsl(var(--border-default))] rounded-[var(--card-radius)] max-w-md w-full p-[var(--space-5)] shadow-[var(--shadow-xl)]">
        <div className="flex justify-between items-center mb-[var(--space-4)]">
          <h3 className="text-[var(--text-sm)] font-[var(--font-semibold)] text-[hsl(var(--text-primary))]">{t('newFileTitle')}</h3>
          <button onClick={onClose} className="text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] p-[var(--space-1)] rounded-[var(--radius-md)] hover:bg-[hsl(var(--bg-subtle))] min-w-[var(--space-8)] min-h-[var(--space-8)] flex items-center justify-center">
            <svg className="w-[var(--space-4)] h-[var(--space-4)]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8" /></svg>
          </button>
        </div>
        <div className="space-y-[var(--space-3)]">
          <div>
            <label className="block text-[var(--text-xs)] text-[hsl(var(--text-muted))] mb-[var(--space-1)] font-[var(--font-medium)]">{t('directory')}</label>
            <select value={filePath} onChange={(e) => setFilePath(e.target.value)} className="w-full px-[var(--space-3)] py-[var(--space-1-5)] text-[var(--text-sm)] bg-[hsl(var(--input-bg))] border border-[hsl(var(--input-border))] rounded-[var(--input-radius)] text-[hsl(var(--input-text))] focus:outline-none focus:border-[hsl(var(--input-border-focus))]">
              <option value="knowledge-base/">knowledge-base/</option>
              <option value="memory/">memory/</option>
              <option value="knowledge/">knowledge/</option>
              <option value="daily/">daily/</option>
              <option value="logs/">logs/</option>
              <option value="">root/</option>
            </select>
          </div>
          <div>
            <label className="block text-[var(--text-xs)] text-[hsl(var(--text-muted))] mb-[var(--space-1)] font-[var(--font-medium)]">{t('fileName')}</label>
            <input type="text" value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="my-file" className="w-full px-[var(--space-3)] py-[var(--space-1-5)] text-[var(--text-sm)] bg-[hsl(var(--input-bg))] border border-[hsl(var(--input-border))] rounded-[var(--input-radius)] text-[hsl(var(--input-text))] focus:outline-none focus:border-[hsl(var(--input-border-focus))]" autoFocus />
          </div>
          <div>
            <label className="block text-[var(--text-xs)] text-[hsl(var(--text-muted))] mb-[var(--space-1)] font-[var(--font-medium)]">{t('fileType')}</label>
            <select value={fileType} onChange={(e) => { setFileType(e.target.value); setInitialContent(templates[e.target.value] || '') }} className="w-full px-[var(--space-3)] py-[var(--space-1-5)] text-[var(--text-sm)] bg-[hsl(var(--input-bg))] border border-[hsl(var(--input-border))] rounded-[var(--input-radius)] text-[hsl(var(--input-text))] focus:outline-none focus:border-[hsl(var(--input-border-focus))]">
              <option value="md">.md</option>
              <option value="json">.json</option>
              <option value="txt">.txt</option>
              <option value="log">.log</option>
            </select>
          </div>
          <div>
            <label className="block text-[var(--text-xs)] text-[hsl(var(--text-muted))] mb-[var(--space-1)] font-[var(--font-medium)]">{t('content')}</label>
            <textarea value={initialContent} onChange={(e) => setInitialContent(e.target.value)} className="w-full h-20 px-[var(--space-3)] py-[var(--space-1-5)] text-[var(--text-sm)] font-[var(--font-mono)] bg-[hsl(var(--input-bg))] border border-[hsl(var(--input-border))] rounded-[var(--input-radius)] text-[hsl(var(--input-text))] focus:outline-none focus:border-[hsl(var(--input-border-focus))] resize-none" placeholder={t('contentOptional')} />
          </div>
          <div className="text-[var(--text-xs)] font-[var(--font-mono)] text-[hsl(var(--text-muted))] bg-[hsl(var(--bg-subtle))] px-[var(--space-2)] py-[var(--space-1)] rounded-[var(--radius-md)]">{filePath}{fileName || '...'}.{fileType}</div>
          <div className="flex gap-[var(--space-2)] pt-[var(--space-2)]">
            <Button onClick={handleCreate} disabled={!fileName.trim()} size="sm" className="flex-1">{t('create')}</Button>
            <Button onClick={onClose} variant="secondary" size="sm">{t('cancel')}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Delete Confirm Modal
// ---------------------------------------------------------------------------

function DeleteConfirmModal({ fileName, onClose, onConfirm }: { fileName: string; onClose: () => void; onConfirm: () => void }) {
  const t = useTranslations('memoryBrowser')
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-[var(--space-4)]">
      <div className="bg-[hsl(var(--card-bg))] border border-[hsl(var(--border-default))] rounded-[var(--card-radius)] max-w-sm w-full p-[var(--space-5)] shadow-[var(--shadow-xl)]">
        <h3 className="text-[var(--text-sm)] font-[var(--font-semibold)] text-[hsl(var(--status-error-fg))] mb-[var(--space-3)]">{t('deleteFileTitle')}</h3>
        <div className="bg-[hsl(var(--status-error-bg))] border border-[hsl(var(--status-error-border))] rounded-[var(--radius-md)] p-[var(--space-3)] mb-[var(--space-4)]">
          <p className="text-[var(--text-xs)] text-[hsl(var(--text-muted))]">{t('permanentlyDelete')}</p>
          <p className="text-[var(--text-xs)] font-[var(--font-mono)] text-[hsl(var(--text-primary))] mt-[var(--space-1)] bg-[hsl(var(--bg-subtle))] px-[var(--space-2)] py-[var(--space-1)] rounded-[var(--radius-sm)]">{fileName}</p>
        </div>
        <div className="flex gap-[var(--space-2)]">
          <Button onClick={onConfirm} variant="destructive" size="sm" className="flex-1">{t('delete')}</Button>
          <Button onClick={onClose} variant="secondary" size="sm">{t('cancel')}</Button>
        </div>
      </div>
    </div>
  )
}
