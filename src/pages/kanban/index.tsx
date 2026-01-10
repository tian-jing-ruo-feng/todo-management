import { type Task } from '../../types/Task'
import KanbanBoard from './KanbanBoard'

interface KanbanPageProps {
  tasks: Task[]
  onRefresh: () => void
}

export default function KanbanPage({ tasks, onRefresh }: KanbanPageProps) {
  return (
    <KanbanBoard
      tasks={tasks}
      onUploadSuccess={onRefresh}
      onDragEnd={onRefresh}
    />
  )
}
