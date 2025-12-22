import mockTasks from '@/mock/task.json'
import KanbanBoard from './KanbanBoard'

export default function KanbanPage() {
  return <KanbanBoard tasks={mockTasks} />
}
