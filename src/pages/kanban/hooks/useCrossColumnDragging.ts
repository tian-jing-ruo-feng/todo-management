import type { Task } from '@/types/Task'
import type { DragEndEvent } from '@dnd-kit/core'
import { useCallback, useRef } from 'react'
import { saveTask } from '@/utils/db'

// 异步保存任务变更
const saveTaskChanges = async (tasks: Task[]) => {
  try {
    for (const task of tasks) {
      await saveTask(task)
    }
  } catch (error) {
    console.error('保存任务状态失败:', error)
  }
}

interface DragState {
  activeId: string | null
  sourceColumn: string | null
  tasksSnapshot: Record<string, Task[]> | null
  lastTargetColumn: string | null
}

interface UseCrossColumnDraggingProps {
  tasksByColumn: Record<string, Task[]>
  setTasksByColumn: (tasks: Record<string, Task[]>) => void
  columns: Array<{ id: string }>
  originalTasks: Task[]
  onTasksChange?: (tasks: Task[]) => void
}

export function useCrossColumnDragging({
  tasksByColumn,
  setTasksByColumn,
  columns,
  originalTasks,
  onTasksChange,
}: UseCrossColumnDraggingProps) {
  const dragStateRef = useRef<DragState>({
    activeId: null,
    sourceColumn: null,
    tasksSnapshot: null,
    lastTargetColumn: null,
  })

  const initializeDrag = useCallback(
    (
      activeId: string,
      sourceColumn: string,
      currentTasksByColumn: Record<string, Task[]>
    ) => {
      dragStateRef.current = {
        activeId,
        sourceColumn,
        tasksSnapshot: structuredClone(currentTasksByColumn),
        lastTargetColumn: null,
      }
    },
    []
  )

  const updateTargetColumn = useCallback((targetColumnId: string) => {
    const dragState = dragStateRef.current
    if (dragState.lastTargetColumn !== targetColumnId) {
      dragState.lastTargetColumn = targetColumnId
      return true // 表示需要处理
    }
    return false // 表示不需要处理
  }, [])

  const handleCrossColumnMove = useCallback(
    (event: DragEndEvent, draggedTask: Task) => {
      const { active, over } = event
      if (!over) return

      const activeId = active.id as string
      const overId = over.id as string
      const dragState = dragStateRef.current
      const sourceColumn = dragState.sourceColumn
      if (!sourceColumn) return

      // 确定最终的目标列
      let targetColumnId = columns.find((col) => col.id === overId)?.id

      // 如果不是列ID，查找overId所在的任务所在列
      if (!targetColumnId) {
        for (const [columnId, columnTasks] of Object.entries(tasksByColumn)) {
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

      let finalTasksByColumn: Record<string, Task[]>

      // 区分同列排序和跨列移动
      if (sourceColumn === targetColumnId) {
        // 同列内排序：使用当前memoized状态（已通过handleDragOver实时更新）
        finalTasksByColumn = { ...tasksByColumn }
      } else {
        // 跨列移动：使用初始状态快照进行计算
        const initialTasks = dragState.tasksSnapshot || tasksByColumn
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
        newTargetTasks.splice(insertIndex, 0, {
          ...draggedTask,
          status: targetColumnId,
        })

        finalTasksByColumn = {
          ...initialTasks,
          [sourceColumn]: newSourceTasks,
          [targetColumnId]: newTargetTasks,
        }
      }

      // 更新状态以确保UI显示正确
      setTasksByColumn(finalTasksByColumn)

      // 重建完整的任务列表，使用Map提高查找性能
      const originalTasksMap = new Map(
        originalTasks.map((task) => [task.id, task])
      )
      const newTasks: Task[] = []

      columns.forEach((column) => {
        const columnTasks = finalTasksByColumn[column.id] || []
        columnTasks.forEach((task) => {
          // 使用Map查找，提高性能
          const originalTask = originalTasksMap.get(task.id)
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
      const newTasksMap = new Map(newTasks.map((task) => [task.id, task]))
      originalTasks.forEach((task) => {
        if (!newTasksMap.has(task.id)) {
          newTasks.push(task)
        }
      })

      if (onTasksChange) {
        onTasksChange(newTasks)
      }

      // 异步保存所有任务到数据库（不阻塞UI）
      saveTaskChanges(newTasks)

      // 重置拖拽状态
      dragStateRef.current = {
        activeId: null,
        sourceColumn: null,
        tasksSnapshot: null,
        lastTargetColumn: null,
      }

      return newTasks
    },
    [tasksByColumn, setTasksByColumn, columns, originalTasks, onTasksChange]
  )

  return {
    dragStateRef,
    initializeDrag,
    updateTargetColumn,
    handleCrossColumnMove,
  }
}
