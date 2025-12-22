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
        className={`h-full min-h-[500px] transition-all duration-200 ${
          isOver 
            ? 'border-blue-500 shadow-xl scale-[1.02] bg-blue-50/30' 
            : 'border-gray-200 bg-white'
        }`}
        title={
          <div className="flex items-center justify-between">
            <Title 
              level={5} 
              className={`mb-0 transition-colors duration-200 ${
                isOver ? 'text-blue-600' : ''
              }`} 
              style={{ color: isOver ? undefined : color }}
            >
              {title}
            </Title>
            <span className={`text-sm transition-colors duration-200 ${
              isOver ? 'text-blue-600 font-semibold' : 'text-gray-500'
            }`}>
              {tasks.length}
            </span>
          </div>
        }
      >
        <div 
          ref={setNodeRef} 
          className={`space-y-2 min-h-[400px] p-2 rounded-lg transition-all duration-200 ${
            isOver 
              ? 'bg-blue-100/20 border-2 border-dashed border-blue-300' 
              : ''
          }`}
        >
          <SortableContext
            items={tasks.map((task) => task.id)}
            strategy={verticalListSortingStrategy}
          >
            {tasks.map((task) => (
              <KanbanItem key={task.id} task={task} />
            ))}
          </SortableContext>
          {tasks.length === 0 && (
            <div className={`text-center py-8 transition-colors duration-200 ${
              isOver ? 'text-blue-500' : 'text-gray-400'
            }`}>
              {isOver ? '放开以添加任务' : '暂无任务'}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
