import type { Task } from '@/types/Task'
import type { DragOverEvent } from '@dnd-kit/core'
import { useCallback, useMemo } from 'react'
import {
  reorderTasksInColumn,
  saveTasksToDatabaseAndSync,
} from '../utils/taskOperations'

interface UseSameColumnSortingProps {
  tasksByColumn: Record<string, Task[]>
  setTasksByColumn: (tasks: Record<string, Task[]>) => void
  tasksSnapshot: Record<string, Task[]>
  originalTasks: Task[]
  onTasksChange?: (tasks: Task[]) => void
  onDragEndCallback?: (activeId: string, columnId: string) => void
}

export function useSameColumnSorting({
  tasksByColumn,
  setTasksByColumn,
  tasksSnapshot,
  originalTasks,
  onTasksChange,
  onDragEndCallback,
}: UseSameColumnSortingProps) {
  // 记忆化依赖项，避免不必要的重新创建
  const memoizedDeps = useMemo(
    () => ({
      tasksByColumn,
      setTasksByColumn,
      tasksSnapshot,
      originalTasks,
      onTasksChange,
      onDragEndCallback,
    }),
    [
      tasksByColumn,
      setTasksByColumn,
      tasksSnapshot,
      originalTasks,
      onTasksChange,
      onDragEndCallback,
    ]
  )

  const handleSameColumnSorting = useCallback(
    (
      _event: DragOverEvent, // 使用下划线前缀表示未使用的参数
      activeId: string,
      overId: string,
      columnId: string
    ) => {
      const currentTasks =
        memoizedDeps.tasksSnapshot || memoizedDeps.tasksByColumn
      const targetTasks = [...currentTasks[columnId]]

      // 使用通用函数重新排序任务
      const updatedTasks = reorderTasksInColumn(targetTasks, activeId, overId)

      if (!updatedTasks) return

      // 使用批量更新减少重渲染
      const newTasksByColumn = {
        ...currentTasks,
        [columnId]: updatedTasks,
      }

      // 实时更新状态，确保交互和数据的实时同步
      memoizedDeps.setTasksByColumn(newTasksByColumn)

      // 异步保存到数据库和父组件状态
      saveTasksToDatabaseAndSync(
        updatedTasks,
        memoizedDeps.originalTasks,
        newTasksByColumn,
        memoizedDeps.onTasksChange
      )

      // 调用拖拽结束回调
      if (memoizedDeps.onDragEndCallback) {
        memoizedDeps.onDragEndCallback(activeId, columnId)
      }
    },
    [memoizedDeps]
  )

  return {
    handleSameColumnSorting,
  }
}
