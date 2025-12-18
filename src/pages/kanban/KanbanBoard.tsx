import type { Task } from '@/types/Task'
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core'
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'
import {
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { useCallback, useMemo, useRef, useState } from 'react'
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

export default function KanbanBoard({
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

  const [tasksByColumn, setTasksByColumn] = useState<Record<string, Task[]>>(
    () => {
      const grouped: Record<string, Task[]> = {}
      columns.forEach((col) => {
        grouped[col.id] = []
      })

      // 根据任务状态分配到不同列
      tasks.forEach((task) => {
        const columnId = getColumnByStatus(task.status)
        if (grouped[columnId]) {
          grouped[columnId].push(task)
        }
      })

      return grouped
    }
  )

  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const draggedTaskRef = useRef<Task | null>(null)
  const draggedOverRef = useRef<string | null>(null)

  // 简化的查找函数，不依赖状态，避免循环依赖
  const findTaskByIdSimple = useCallback(
    (taskId: string, currentState: Record<string, Task[]>): Task | null => {
      for (const columnTasks of Object.values(currentState)) {
        const task = columnTasks.find((t) => t.id === taskId)
        if (task) return task
      }
      return null
    },
    []
  )

  // 使用 ref 来跟踪拖拽状态，避免状态更新导致的问题
  const dragStateRef = useRef<{
    activeId: string | null
    sourceColumn: string | null
    tasksSnapshot: Record<string, Task[]> | null
  }>({
    activeId: null,
    sourceColumn: null,
    tasksSnapshot: null,
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event
      const task = findTaskByIdSimple(active.id as string, tasksByColumn)
      setActiveTask(task)
      draggedTaskRef.current = task
      draggedOverRef.current = null

      // 重置拖拽状态
      dragStateRef.current = {
        activeId: active.id as string,
        sourceColumn: null,
        tasksSnapshot: null,
      }
    },
    [findTaskByIdSimple, tasksByColumn]
  )

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event
      if (!over) return

      const activeId = active.id as string
      const overId = over.id as string

      // 避免重复处理相同的目标
      if (draggedOverRef.current === overId) return
      draggedOverRef.current = overId

      // 初始化拖拽状态快照
      if (dragStateRef.current.activeId !== activeId) {
        const currentSnapshot = tasksByColumn
        dragStateRef.current = {
          activeId,
          sourceColumn: null,
          tasksSnapshot: currentSnapshot,
        }

        // 找到源列
        for (const [columnId, columnTasks] of Object.entries(currentSnapshot)) {
          if (columnTasks.some((task) => task.id === activeId)) {
            dragStateRef.current.sourceColumn = columnId
            break
          }
        }
      }

      setTasksByColumn((prev) => {
        const activeTask = findTaskByIdSimple(activeId, prev)
        if (!activeTask) return prev

        // 确定目标列 - overId可能是列ID或任务ID
        let targetColumnId = columns.find((col) => col.id === overId)?.id
        if (!targetColumnId) {
          // 如果不是列ID，查找overId所在的任务所在列
          for (const [columnId, columnTasks] of Object.entries(prev)) {
            if (columnTasks.some((task) => task.id === overId)) {
              targetColumnId = columnId
              break
            }
          }
          // 如果还是找不到，使用任务状态的默认列
          if (!targetColumnId) {
            targetColumnId = getColumnByStatus(activeTask.status)
          }
        }

        const sourceColumn = dragStateRef.current.sourceColumn

        // 安全检查
        if (!sourceColumn) return prev

        // 如果目标列和源列相同，检查是否需要排序
        if (sourceColumn === targetColumnId) {
          const targetTasks = [...prev[targetColumnId]]
          const currentIndex = targetTasks.findIndex(
            (task) => task.id === activeId
          )
          const overIndex = targetTasks.findIndex((task) => task.id === overId)

          // 如果拖拽到自己身上，或者位置没有实际变化，则不更新
          if (
            overId === activeId ||
            overIndex === -1 ||
            overIndex === currentIndex ||
            overIndex === currentIndex + 1
          ) {
            return prev
          }

          // 重新排序
          const newTargetTasks = targetTasks.filter(
            (task) => task.id !== activeId
          )
          const insertIndex =
            overIndex > currentIndex ? overIndex - 1 : overIndex
          newTargetTasks.splice(insertIndex, 0, activeTask)

          return {
            ...prev,
            [targetColumnId]: newTargetTasks,
          }
        } else {
          // 跨列移动
          const sourceTasks = [...(prev[sourceColumn] || [])]
          const targetTasks = [...(prev[targetColumnId] || [])]

          // 从源列移除
          const newSourceTasks = sourceTasks.filter(
            (task) => task.id !== activeId
          )

          // 添加到目标列
          const overIndex = targetTasks.findIndex((task) => task.id === overId)
          if (overIndex !== -1) {
            targetTasks.splice(overIndex, 0, activeTask)
          } else {
            targetTasks.push(activeTask)
          }

          return {
            ...prev,
            [sourceColumn]: newSourceTasks,
            [targetColumnId]: targetTasks,
          }
        }
      })
    },
    [columns, findTaskByIdSimple, getColumnByStatus, tasksByColumn]
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over) return

      const activeId = active.id as string
      const draggedTask = draggedTaskRef.current
      if (!draggedTask) return

      // 从最终的 tasksByColumn 状态重建完整的任务列表
      // 这样可以保证使用最新的排序和位置
      const newTasks: Task[] = []

      columns.forEach((column) => {
        const columnTasks = tasksByColumn[column.id] || []
        columnTasks.forEach((task) => {
          // 找到原始任务数据，保持其他属性
          const originalTask = tasks.find((t) => t.id === task.id)
          if (originalTask) {
            newTasks.push({
              ...originalTask,
              // 使用当前列作为状态，反映拖拽后的实际位置
              status: column.id as Task['status'],
              // 如果是当前拖拽的任务，更新时间
              updateTime:
                task.id === activeId
                  ? new Date().toISOString()
                  : originalTask.updateTime,
            })
          }
        })
      })

      // 添加可能遗漏的任务
      tasks.forEach((task) => {
        if (!newTasks.find((t) => t.id === task.id)) {
          newTasks.push(task)
        }
      })

      if (onTasksChange) {
        onTasksChange(newTasks)
      }

      setActiveTask(null)
      draggedTaskRef.current = null
      draggedOverRef.current = null

      // 重置拖拽状态
      dragStateRef.current = {
        activeId: null,
        sourceColumn: null,
        tasksSnapshot: null,
      }
    },
    [tasks, columns, onTasksChange, tasksByColumn]
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
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToWindowEdges]}
      >
        <SortableContext
          items={columns.map((col) => col.id)}
          strategy={rectSortingStrategy}
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
        </SortableContext>

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
