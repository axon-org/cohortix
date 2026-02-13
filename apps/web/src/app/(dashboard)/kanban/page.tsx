import { KanbanView } from '@/components/kanban/kanban-view'
import { getOperations } from '@/server/db/queries/operations'

export const metadata = {
  title: 'Kanban | Cohortix',
}

export default async function KanbanPage() {
  const operations = await getOperations()

  return <KanbanView initialTasks={operations} />
}
