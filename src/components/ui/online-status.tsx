'use client'

interface OnlineStatusProps {
  isConnected: boolean
}

export function OnlineStatus({ isConnected }: OnlineStatusProps) {
  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${
        isConnected ? 'bg-status-success-solid status-online' : 'bg-status-error-solid'
      }`}></div>
      <span className={`text-sm font-semibold tracking-wide ${
        isConnected ? 'text-status-success-fg' : 'text-status-error-fg'
      }`}>
        {isConnected ? 'ONLINE' : 'OFFLINE'}
      </span>
    </div>
  )
}