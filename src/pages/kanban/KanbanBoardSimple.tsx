import type { Task } from '@/types/Task'
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from '@dnd-kit/core'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useCallback, useMemo, useState } from 'react'
import KanbanColumn from './KanbanColumn'
import KanbanItem from './KanbanItem'

interface Column {
  id: string
  title: string
  color?: string
}

const initialColumns: Column[] = [
  { id: 'todo', title: '待办', color: '#ff4d4f' },
  { id: 'in-progress', title: '进行中', color: '#1890ff' },
  { id: 'review', title: '待审核', color: '#faad14' },
  { id: 'done', title: '已完成', color: '#52c41a' },
]

interface KanbanBoardProps {
  tasks: Task[]
  onTasksChange?: (tasks: Task[]) => void
}

export default function KanbanBoardSimple({
  tasks,
  onTasksChange,
}: KanbanBoardProps) {
  const columns = useMemo(() => initialColumns, [])

  const getColumnByStatus = useCallback((status: string): string => {
    const statusMap: Record<string, string> = {
      todo: 'todo',
      pending: 'todo',
      'in-progress': 'in-progress',
      progress: 'in-progress',
      review: 'review',
      testing: 'review',
      done: 'done',
      completed: 'done',
    }
    return statusMap[status] || 'todo'
  }, [])

  // 根据状态分配任务到列
  const tasksByColumn = useMemo(() => {
    const grouped: Record<string, Task[]> = {}
    columns.forEach((col) => {
      grouped[col.id] = []
    })

    tasks.forEach((task) => {
      const columnId = getColumnByStatus(task.status)
      if (grouped[columnId]) {
        grouped[columnId].push(task)
      }
    })

    return grouped
  }, [tasks, columns, getColumnByStatus])

  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event
      const task = tasks.find((t) => t.id === active.id)
      setActiveTask(task || null)
    },
    [tasks],
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over) return

      const activeId = active.id as string
      const overId = over.id as string

      // 找到被拖拽的任务
      const draggedTask = tasks.find((t) => t.id === activeId)
      if (!draggedTask) return

      // 判断目标是否是列
      const targetColumn = columns.find((col) => col.id === overId)
      
      let newTasks = [...tasks]
      
      if (targetColumn) {
        // 拖到列 - 更新状态
        newTasks = newTasks.map((task) =>
          task.id === activeId
            ? {
                ...task,
                status: targetColumn.id as Task['status'],
                updateTime: new Date().toISOString(),
              }
            : task,
        )
      } else {
        // 拖到其他任务上 - 重新排序
        // 简化处理：先移除，再插入
        const filteredTasks = newTasks.filter((t) => t.id !== activeId)
        const overTask = filteredTasks.find((t) => t.id === overId)
        
        if (overTask) {
          const overIndex = filteredTasks.findIndex((t) => t.id === overId)
          filteredTasks.splice(overIndex + 1, 0, draggedTask)
        } else {
          filteredTasks.push(draggedTask)
        }
        
        newTasks = filteredTasks
      }

      if (onTasksChange) {
        onTasksChange(newTasks)
      }

      setActiveTask(null)
    },
    [tasks, columns, onTasksChange],
  )

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">任务看板</h1>
        <p className="text-gray-600">拖拽任务卡片来改变状态和顺序</p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToWindowEdges]}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              tasks={tasksByColumn[column.id] || []}
              color={column.color}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="rotate-6 shadow-2xl">
              <KanbanItem task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}