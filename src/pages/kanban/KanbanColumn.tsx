import type { Task } from '@/types/Task'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Card, Typography } from 'antd'
import KanbanItem from './KanbanItem'

const { Title } = Typography

interface KanbanColumnProps {
  id: string
  title: string
  tasks: Task[]
  color?: string
}

export default function KanbanColumn({
  id,
  title,
  tasks,
  color = '#1890ff',
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  })

  return (
    <div className="flex-1 min-w-[300px] max-w-[350px]">
      <Card
        className={`h-full min-h-[500px] ${
          isOver ? 'border-blue-400 shadow-lg' : 'border-gray-200'
        } transition-all duration-200`}
        title={
          <div className="flex items-center justify-between">
            <Title level={5} className="mb-0" style={{ color }}>
              {title}
            </Title>
            <span className="text-sm text-gray-500">{tasks.length}</span>
          </div>
        }
      >
        <div ref={setNodeRef} className="space-y-2 min-h-[400px] p-2">
          <SortableContext
            items={tasks.map((task) => task.id)}
            strategy={verticalListSortingStrategy}
          >
            {tasks.map((task) => (
              <KanbanItem key={task.id} task={task} />
            ))}
          </SortableContext>
          {tasks.length === 0 && (
            <div className="text-center text-gray-400 py-8">暂无任务</div>
          )}
        </div>
      </Card>
    </div>
  )
}
