import type { Task } from '@/types/Task'
import { PlusOutlined } from '@ant-design/icons'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Button, Card, Typography } from 'antd'
import KanbanItem from './KanbanItem'

const { Title } = Typography

interface KanbanColumnProps {
  id: string
  title: string
  tasks: Task[]
  color?: string
  onEditTask?: (task: Task) => void
  onAddTask?: (columnId: string) => void
  onDeleteTask?: (task: Task) => void
}

export default function KanbanColumn({
  id,
  title,
  tasks,
  color = '#1890ff',
  onEditTask,
  onAddTask,
  onDeleteTask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  })

  return (
    <div className="flex-1 min-w-[300px] max-w-[350px]  relative size-full">
      <Card
        className={`size-full transition-all duration-300 flex flex-col  ${
          isOver
            ? 'border-blue-500 shadow-xl bg-white/90'
            : 'border-gray-200 bg-white hover:shadow-md'
        }`}
        classNames={{ body: 'size-full overflow-hidden' }}
        title={
          <div className="flex items-center justify-between">
            <Title
              level={5}
              className={`mb-0 transition-all duration-300 ${
                isOver ? 'text-blue-700 font-medium' : 'font-normal'
              }`}
              style={{ color: isOver ? undefined : color }}
            >
              {title}
            </Title>
            <span
              className={`text-sm transition-all duration-300 ${
                isOver ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              {tasks.length}
            </span>
          </div>
        }
      >
        <div className="flex flex-col gap-3 h-full overflow-hidden">
          {/* 固定在标题下方的添加按钮 */}
          <div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => onAddTask?.(id)}
              className="w-full shadow-md hover:shadow-lg transition-all duration-300"
            >
              添加任务
            </Button>
          </div>
          <div
            ref={setNodeRef} // 将拖拽区域设置为除去标题和按钮后的内容区域
            className={`space-y-2 flex-1 overflow-y-auto h-full pt-8 px-3 pb-3 rounded-lg transition-all duration-300 ${
              isOver
                ? 'bg-linear-to-br from-blue-100/40 via-white/30 to-indigo-100/20 border-3 border-dashed border-blue-400'
                : 'bg-gray-50/30'
            }`}
          >
            <SortableContext
              items={tasks.map((task) => task.id)}
              strategy={verticalListSortingStrategy}
            >
              {tasks.map((task) => (
                <KanbanItem
                  key={task.id}
                  task={task}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                />
              ))}
            </SortableContext>

            {tasks.length === 0 && (
              <div
                className={`text-center py-12 transition-all duration-300 rounded-lg border-2 border-dashed ${
                  isOver
                    ? 'text-blue-600 bg-blue-50/50 border-blue-400'
                    : 'text-gray-400 border-gray-300'
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <span className="text-lg">{isOver ? '📋' : '📝'}</span>
                  <span className="font-medium">
                    {isOver ? '放开以添加任务' : '暂无任务'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
