'use client'

export function PromoBanner() {
  return (
    <div className="mx-4 mt-3 mb-0 flex flex-col gap-2 px-4 py-2.5 rounded-lg bg-status-warning-bg border border-status-warning-border text-sm md:flex-row md:items-center">
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-1.5 h-1.5 rounded-full bg-status-warning-solid shrink-0" />
        <p className="text-xs text-status-warning-fg/90">
          Built with care by <span className="font-semibold text-status-warning-fg/80">nyk</span> · available for client and custom AI orchestration work.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 md:ml-auto">
        <a
          href="https://x.com/nyk_builderz"
          target="_blank"
          rel="noopener noreferrer"
          className="text-2xs font-medium text-status-warning-fg/80 hover:text-foreground px-2 py-1 rounded border border-status-warning-border/30 hover:border-status-warning-border/60 transition-colors"
        >
          Hire nyk
        </a>
        <a
          href="https://github.com/0xNyk"
          target="_blank"
          rel="noopener noreferrer"
          className="text-2xs font-medium text-status-warning-fg hover:text-status-warning-fg/80 px-2 py-1 rounded border border-status-warning-border hover:border-status-warning-border/80 transition-colors"
        >
          Follow nyk
        </a>
        <a
          href="https://dictx.splitlabs.io"
          target="_blank"
          rel="noopener noreferrer"
          className="text-2xs font-medium text-status-warning-fg hover:text-status-warning-fg/80 px-2 py-1 rounded border border-status-warning-border hover:border-status-warning-border/80 transition-colors"
        >
          DictX (Upcoming)
        </a>
        <a
          href="https://x.com/nyk_builderz/status/2029007663011643498?s=20"
          target="_blank"
          rel="noopener noreferrer"
          className="text-2xs font-medium text-status-warning-fg hover:text-status-warning-fg/80 px-2 py-1 rounded border border-status-warning-border hover:border-status-warning-border/80 transition-colors"
        >
          Flight Deck Pro (Upcoming)
        </a>
      </div>
    </div>
  )
}
