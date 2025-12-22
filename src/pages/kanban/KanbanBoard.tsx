import type { Task } from '@/types/Task'
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  rectIntersection,
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

  // 记忆化当前任务分布，避免不必要的计算
  const memoizedTasksByColumn = useMemo(() => tasksByColumn, [tasksByColumn])

  // 使用 ref 来跟踪拖拽状态，避免状态更新导致的问题
  const dragStateRef = useRef<{
    activeId: string | null
    sourceColumn: string | null
    tasksSnapshot: Record<string, Task[]> | null
    lastTargetColumn: string | null
  }>({
    activeId: null,
    sourceColumn: null,
    tasksSnapshot: null,
    lastTargetColumn: null,
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
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

      // 找到源列
      let sourceColumn = null
      for (const [columnId, columnTasks] of Object.entries(tasksByColumn)) {
        if (columnTasks.some((task) => task.id === active.id)) {
          sourceColumn = columnId
          break
        }
      }

      dragStateRef.current = {
        activeId: active.id as string,
        sourceColumn,
        tasksSnapshot: JSON.parse(JSON.stringify(tasksByColumn)),
        lastTargetColumn: null,
      }
    },
    [tasksByColumn, findTaskByIdSimple]
  )

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event
      if (!over) return

      const activeId = active.id as string
      const overId = over.id as string
      const dragState = dragStateRef.current

      // 如果拖拽到自己身上，不处理
      if (activeId === overId) return

      // 确定目标列 - overId可能是列ID或任务ID
      let targetColumnId = columns.find((col) => col.id === overId)?.id

      // 如果不是列ID，查找overId所在的任务所在列
      if (!targetColumnId) {
        for (const [columnId, columnTasks] of Object.entries(
          memoizedTasksByColumn
        )) {
          if (columnTasks.some((task) => task.id === overId)) {
            targetColumnId = columnId
            break
          }
        }
      }

      // 如果还是找不到目标列或源列无效，不处理
      if (!targetColumnId || !dragState.sourceColumn) return

      // 优化：减少不必要的状态更新，只在真正需要时处理
      if (dragState.lastTargetColumn === targetColumnId) return
      dragState.lastTargetColumn = targetColumnId

      // 获取当前状态快照，确保数据一致性
      const currentTasks = dragState.tasksSnapshot || memoizedTasksByColumn
      const sourceColumn = dragState.sourceColumn
      const activeTask = findTaskByIdSimple(activeId, currentTasks)
      if (!activeTask) return

      // 只在同列内排序时提供即时反馈，跨列移动延迟到handleDragEnd处理
      if (sourceColumn === targetColumnId) {
        const targetTasks = [...currentTasks[targetColumnId]]
        const currentIndex = targetTasks.findIndex(
          (task) => task.id === activeId
        )
        const overIndex = targetTasks.findIndex((task) => task.id === overId)

        // 如果找不到目标任务或位置无效，不更新
        if (overIndex === -1 || currentIndex === -1) return

        // 性能优化：只有位置真正改变时才更新
        if (currentIndex !== overIndex) {
          // 重新排序：移除当前任务，然后插入到目标位置
          const newTargetTasks = targetTasks.filter(
            (task) => task.id !== activeId
          )

          // 计算插入位置
          let insertIndex = overIndex
          if (currentIndex < overIndex) {
            // 如果从上往下拖，插入位置减1（因为已经移除了当前元素）
            insertIndex = overIndex - 1
          }

          newTargetTasks.splice(insertIndex, 0, activeTask)

          // 使用批量更新减少重渲染
          const newTasksByColumn = {
            ...currentTasks,
            [targetColumnId]: newTargetTasks,
          }

          // 只在同列内排序时提供即时反馈
          setTasksByColumn(newTasksByColumn)
        }
      }
      // 跨列移动不在handleDragOver中处理，只在handleDragEnd中处理
    },
    [columns, memoizedTasksByColumn, findTaskByIdSimple]
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over) return

      const activeId = active.id as string
      const overId = over.id as string
      const draggedTask = draggedTaskRef.current
      if (!draggedTask) return

      const dragState = dragStateRef.current
      const sourceColumn = dragState.sourceColumn
      if (!sourceColumn) return

      // 确定最终的目标列
      let targetColumnId = columns.find((col) => col.id === overId)?.id

      // 如果不是列ID，查找overId所在的任务所在列
      if (!targetColumnId) {
        for (const [columnId, columnTasks] of Object.entries(
          memoizedTasksByColumn
        )) {
          if (columnTasks.some((task) => task.id === overId)) {
            targetColumnId = columnId
            break
          }
        }
      }

      // 如果找不到目标列，则使用源列
      if (!targetColumnId) {
        targetColumnId = sourceColumn
      }

      // 获取当前状态（可能是经过handleDragOver处理后的状态）
      let finalTasksByColumn = { ...memoizedTasksByColumn }

      // 如果是跨列移动，需要重新计算最终状态
      if (sourceColumn !== targetColumnId) {
        // 使用初始状态快照进行跨列计算
        const initialTasks = dragState.tasksSnapshot || memoizedTasksByColumn

        const sourceTasks = [...(initialTasks[sourceColumn] || [])]
        const targetTasks = [...(initialTasks[targetColumnId] || [])]

        // 从源列移除拖拽的任务
        const newSourceTasks = sourceTasks.filter(
          (task) => task.id !== activeId
        )

        // 添加到目标列的合适位置
        let insertIndex = targetTasks.findIndex((task) => task.id === overId)
        if (insertIndex === -1) {
          // 如果没有具体目标任务，添加到末尾
          insertIndex = targetTasks.length
        }

        const newTargetTasks = [...targetTasks]
        newTargetTasks.splice(insertIndex, 0, draggedTask)

        finalTasksByColumn = {
          ...initialTasks,
          [sourceColumn]: newSourceTasks,
          [targetColumnId]: newTargetTasks,
        }
      }

      // 更新状态以确保UI显示正确
      setTasksByColumn(finalTasksByColumn)

      // 从最终的 finalTasksByColumn 状态重建完整的任务列表
      const newTasks: Task[] = []

      columns.forEach((column) => {
        const columnTasks = finalTasksByColumn[column.id] || []
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

      // 添加可能遗漏的任务（理论上不应该有遗漏）
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

      // 重置拖拽状态
      dragStateRef.current = {
        activeId: null,
        sourceColumn: null,
        tasksSnapshot: null,
        lastTargetColumn: null,
      }
    },
    [tasks, columns, onTasksChange, memoizedTasksByColumn]
  )

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">任务看板</h1>
        <p className="text-gray-600">拖拽任务卡片来改变状态和顺序</p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
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
