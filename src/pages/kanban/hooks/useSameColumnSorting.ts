import type { Task } from '@/types/Task'
import type { DragOverEvent } from '@dnd-kit/core'
import { useCallback, useMemo } from 'react'
import { saveTask } from '@/utils/db'

interface UseSameColumnSortingProps {
  tasksByColumn: Record<string, Task[]>
  setTasksByColumn: (tasks: Record<string, Task[]>) => void
  findTaskById: (
    taskId: string,
    currentState: Record<string, Task[]>
  ) => Task | null
  tasksSnapshot: Record<string, Task[]>
  originalTasks: Task[]
  onTasksChange?: (tasks: Task[]) => void
  onDragEndCallback?: (activeId: string, columnId: string) => void
}

export function useSameColumnSorting({
  tasksByColumn,
  setTasksByColumn,
  findTaskById,
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
      findTaskById,
      tasksSnapshot,
      originalTasks,
      onTasksChange,
      onDragEndCallback,
    }),
    [
      tasksByColumn,
      setTasksByColumn,
      findTaskById,
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

      const currentIndex = targetTasks.findIndex((task) => task.id === activeId)
      const overIndex = targetTasks.findIndex((task) => task.id === overId)

      // 如果找不到目标任务或位置无效，不更新
      if (overIndex === -1 || currentIndex === -1) return

      // 性能优化：只有位置真正改变时才更新
      if (currentIndex !== overIndex) {
        // 获取被拖拽的任务
        const activeTask = memoizedDeps.findTaskById(activeId, currentTasks)
        if (!activeTask) return

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

        // 更新sort属性：根据任务在列中的位置重新分配sort值（倒序）
        const updatedTasks = newTargetTasks.map((task, index) => ({
          ...task,
          sort: newTargetTasks.length - index, // 倒序：第一个元素sort值最大
        }))

        // 使用批量更新减少重渲染
        const newTasksByColumn = {
          ...currentTasks,
          [columnId]: updatedTasks,
        }

        // 实时更新状态，确保交互和数据的实时同步
        memoizedDeps.setTasksByColumn(newTasksByColumn)

        // 异步保存到数据库和父组件状态
        saveTasksToDatabaseAndColumn(
          updatedTasks,
          memoizedDeps.originalTasks,
          columnId,
          activeId
        )
      }
    },
    [memoizedDeps]
  )

  // 异步保存任务到数据库并同步到父组件状态
  const saveTasksToDatabaseAndColumn = useCallback(
    async (
      updatedTasks: Task[],
      originalTasks: Task[],
      _columnId: string,
      activeId: string
    ) => {
      try {
        // 批量保存到数据库
        const savePromises = updatedTasks.map((task) => saveTask(task))
        await Promise.all(savePromises)

        // 重建完整的任务列表
        const originalTasksMap = new Map(
          originalTasks.map((task) => [task.id, task])
        )
        const newTasks: Task[] = []

        // 遍历所有列，构建完整的任务列表
        Object.entries(memoizedDeps.tasksByColumn).forEach(
          ([colId, colTasks]) => {
            colTasks.forEach((task) => {
              const originalTask = originalTasksMap.get(task.id)
              if (originalTask) {
                newTasks.push({
                  ...originalTask,
                  status: colId as Task['status'],
                  sort: task.sort,
                  updateTime:
                    task.id === activeId
                      ? new Date().toISOString()
                      : originalTask.updateTime,
                })
              }
            })
          }
        )

        // 通知父组件更新
        if (memoizedDeps.onTasksChange) {
          memoizedDeps.onTasksChange(newTasks)
        }
      } catch (error) {
        console.error('保存任务排序失败:', error)
      }
    },
    [memoizedDeps.tasksByColumn, memoizedDeps.onTasksChange]
  )

  return {
    handleSameColumnSorting,
  }
}
