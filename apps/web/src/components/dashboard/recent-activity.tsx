import { MoreHorizontal, Activity as ActivityIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  id: string;
  event_type: string;
  event_data: any;
  created_at: string;
  actor_agent?: {
    name: string;
    avatar_url?: string;
  };
  actor_user?: {
    display_name: string;
    avatar_url?: string;
  };
}

interface RecentActivityProps {
  activities: Activity[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
      </div>

      {/* Activity List */}
      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No recent activity</p>
          </div>
        ) : (
          activities.map((activity) => <ActivityItem key={activity.id} activity={activity} />)
        )}
      </div>
    </div>
  );
}

function ActivityItem({ activity }: { activity: Activity }) {
  // Determine actor name and avatar
  const actorName = activity.actor_agent?.name || activity.actor_user?.display_name || 'System';
  const actorAvatar = activity.actor_agent?.avatar_url || activity.actor_user?.avatar_url;

  // Format event message
  const eventMessage = formatEventMessage(activity.event_type, activity.event_data);

  return (
    <div className="flex items-start gap-3 group">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
        {actorAvatar ? (
          <img src={actorAvatar} alt={actorName} className="w-full h-full object-cover" />
        ) : (
          <ActivityIcon className="w-5 h-5 text-muted-foreground" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-medium">{actorName}</span>{' '}
          <span className="text-muted-foreground">{eventMessage}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
        </p>
      </div>

      {/* More Actions */}
      <button className="p-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
}

function formatEventMessage(eventType: string, eventData: any): string {
  switch (eventType) {
    case 'task.created':
      return 'created a new mission';
    case 'task.updated':
      return 'updated a mission';
    case 'task.completed':
      return 'completed a mission';
    case 'project.created':
      return 'created a new cohort';
    case 'agent.created':
      return 'added a new agent';
    case 'agent.status_changed':
      return `changed status to ${eventData?.status || 'active'}`;
    case 'knowledge.created':
      return 'added new knowledge';
    default:
      return eventType.replace(/[._]/g, ' ');
  }
}
