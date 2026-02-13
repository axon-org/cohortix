import { KanbanView } from '@/components/kanban/kanban-view'
import { getTasks } from '@/server/db/queries/tasks'

export const metadata = {
  title: 'Tasks | Cohortix',
}

export default async function TasksPage() {
  const tasks = await getTasks()

  return <KanbanView initialTasks={tasks} viewType="tasks" />
}
