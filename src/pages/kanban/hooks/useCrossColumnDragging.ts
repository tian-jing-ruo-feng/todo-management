import type { Task } from '@/types/Task'
import type { DragEndEvent } from '@dnd-kit/core'
import { useCallback, useRef } from 'react'
import {
  findTargetColumn,
  rebuildTasksList,
  saveTaskChanges,
  updateTasksSortOrder,
} from '../utils/taskOperations'

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
}

export function useCrossColumnDragging({
  tasksByColumn,
  setTasksByColumn,
  columns,
  originalTasks,
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
      const foundTargetColumn = findTargetColumn(overId, columns, tasksByColumn)
      const targetColumnId = foundTargetColumn || sourceColumn

      // 跨列移动：使用初始状态快照进行计算
      const initialTasks = dragState.tasksSnapshot || tasksByColumn
      const sourceTasks = [...(initialTasks[sourceColumn] || [])]
      const targetTasks = [...(initialTasks[targetColumnId] || [])]

      // 从源列移除拖拽的任务
      const newSourceTasks = sourceTasks.filter((task) => task.id !== activeId)

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
        updateTime: new Date().toISOString(),
      })

      // 更新源列和目标列的sort属性（倒序）
      const updatedSourceTasks = updateTasksSortOrder(newSourceTasks)
      const updatedTargetTasks = updateTasksSortOrder(newTargetTasks)

      const finalTasksByColumn = {
        ...initialTasks,
        [sourceColumn]: updatedSourceTasks,
        [targetColumnId]: updatedTargetTasks,
      }

      // 更新状态以确保UI显示正确
      setTasksByColumn(finalTasksByColumn)

      // 重建完整的任务列表
      const newTasks = rebuildTasksList(
        finalTasksByColumn,
        originalTasks,
        activeId
      )

      // 异步保存所有任务到数据库（不阻塞UI）
      saveTaskChanges(newTasks)

      // 重置拖拽状态
      dragStateRef.current = {
        activeId: null,
        sourceColumn: null,
        tasksSnapshot: null,
        lastTargetColumn: null,
      }
    },
    [tasksByColumn, setTasksByColumn, columns, originalTasks]
  )

  return {
    dragStateRef,
    initializeDrag,
    updateTargetColumn,
    handleCrossColumnMove,
  }
}
