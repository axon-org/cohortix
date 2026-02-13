import Link from 'next/link'
import { AlertTriangle, TrendingDown, AlertCircle, XCircle } from 'lucide-react'

interface Alert {
  type: 'warning' | 'error' | 'info'
  title: string
  message: string
  action?: {
    label: string
    href: string
  }
}

interface UrgentAlertsProps {
  alerts: Alert[]
}

export function UrgentAlerts({ alerts }: UrgentAlertsProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-destructive" />
        <h3 className="text-lg font-semibold text-destructive">Urgent Alerts</h3>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">✨ All systems operational</p>
            <p className="text-xs mt-1">No urgent alerts at the moment</p>
          </div>
        ) : (
          alerts.map((alert, index) => (
            <AlertItem key={index} alert={alert} />
          ))
        )}
      </div>
    </div>
  )
}

function AlertItem({ alert }: { alert: Alert }) {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return XCircle
      case 'warning':
        return TrendingDown
      case 'info':
      default:
        return AlertCircle
    }
  }

  const Icon = getAlertIcon(alert.type)

  const typeColors = {
    error: 'bg-destructive/10 border-destructive/20 text-destructive',
    warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-500',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-500',
  }

  const typeColor = typeColors[alert.type as keyof typeof typeColors]

  return (
    <div className={`p-4 rounded-lg border ${typeColor}`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          <Icon className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm mb-1">{alert.title}</h4>
          <p className="text-xs opacity-90 mb-2">{alert.message}</p>
          {alert.action && (
            <Link
              href={alert.action.href}
              className="text-xs font-medium hover:underline inline-flex items-center gap-1"
            >
              {alert.action.label} →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
