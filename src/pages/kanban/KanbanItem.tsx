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
    transition: isDragging ? 'none' : transition, // 拖拽时移除过渡效果
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1000 : 'auto',
    position: isDragging ? 'relative' : 'static' as const,
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-500'
      case 'medium':
        return 'text-yellow-500'
      case 'low':
        return 'text-green-500'
      default:
        return 'text-gray-500'
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`mb-3 transition-all duration-200 ${
        isDragging 
          ? 'cursor-grabbing scale-105' 
          : 'cursor-grab hover:scale-[1.01]'
      }`}
    >
      <Card
        size="small"
        title={task.name}
        className={`transition-all duration-200 ${
          isDragging 
            ? 'shadow-2xl border-blue-400' 
            : 'hover:shadow-lg hover:border-gray-300'
        }`}
      >
        {task.content && (
          <p className="text-gray-600 text-sm mb-2 line-clamp-2">{task.content}</p>
        )}
        <div className="flex justify-between items-center text-xs">
          <span className={`font-medium ${getPriorityColor(task.priority)}`}>
            {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}优先级
          </span>
          {task.isTop && (
            <span className="text-orange-500 font-semibold bg-orange-50 px-2 py-1 rounded">
              置顶
            </span>
          )}
        </div>
      </Card>
    </div>
  )
}
