import type { Task } from '@/types/Task'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card } from 'antd'

interface KanbanItemProps {
  task: Task
}

export default function KanbanItem({ task }: KanbanItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="mb-3 cursor-move"
    >
      <Card
        size="small"
        title={task.name}
        className="hover:shadow-md transition-shadow"
      >
        {task.content && (
          <p className="text-gray-600 text-sm mb-2">{task.content}</p>
        )}
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>优先级: {task.priority}</span>
          {task.isTop && <span className="text-orange-500">置顶</span>}
        </div>
      </Card>
    </div>
  )
}
