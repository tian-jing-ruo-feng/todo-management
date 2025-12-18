import mockTasks from '@/mock/task.json'
import KanbanBoardSimple from './KanbanBoardSimple'

export default function KanbanPage() {
  return <KanbanBoardSimple tasks={mockTasks} />
}

export { KanbanBoardSimple }
