import { type Task } from '../../types/Task'
import KanbanBoard from './KanbanBoard'

interface KanbanPageProps {
  tasks: Task[]
  onRefresh: () => void
  projectId?: string
}

export default function KanbanPage({
  tasks,
  onRefresh,
  projectId,
}: KanbanPageProps) {
  return (
    <KanbanBoard
      tasks={tasks}
      onUploadSuccess={onRefresh}
      onDragEnd={onRefresh}
      projectId={projectId}
    />
  )
}
