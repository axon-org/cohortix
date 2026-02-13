import { KanbanView } from '@/components/kanban/kanban-view'
import { getOperations } from '@/server/db/queries/operations'

export const metadata = {
  title: 'Tasks | Cohortix',
}

export default async function TasksPage() {
  const operations = await getOperations()

  return <KanbanView initialTasks={operations} viewType="tasks" />
}
