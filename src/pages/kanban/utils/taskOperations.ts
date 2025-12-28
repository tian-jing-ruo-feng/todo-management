import type { Task } from '@/types/Task'
import { saveTask } from '@/utils/db'

/**
 * 异步保存任务变更到数据库
 */
export const saveTaskChanges = async (tasks: Task[]) => {
  try {
    const savePromises = tasks.map((task) => saveTask(task))
    await Promise.all(savePromises)
  } catch (error) {
    console.error('保存任务状态失败:', error)
  }
}

/**
 * 根据ID查找任务
 */
export const findTaskById = (
  taskId: string,
  tasksByColumn: Record<string, Task[]>
): Task | null => {
  for (const columnTasks of Object.values(tasksByColumn)) {
    const task = columnTasks.find((task) => task.id === taskId)
    if (task) return task
  }
  return null
}

/**
 * 根据当前列状态重建完整的任务列表
 */
export const rebuildTasksList = (
  tasksByColumn: Record<string, Task[]>,
  originalTasks: Task[],
  activeTaskId?: string
): Task[] => {
  const originalTasksMap = new Map(originalTasks.map((task) => [task.id, task]))
  const newTasks: Task[] = []

  Object.entries(tasksByColumn).forEach(([colId, colTasks]) => {
    colTasks.forEach((task) => {
      const originalTask = originalTasksMap.get(task.id)
      if (originalTask) {
        newTasks.push({
          ...originalTask,
          status: colId as Task['status'],
          sort: task.sort,
          updateTime:
            task.id === activeTaskId
              ? new Date().toISOString()
              : originalTask.updateTime,
        })
      }
    })
  })

  // 添加可能遗漏的任务
  const newTasksMap = new Map(newTasks.map((task) => [task.id, task]))
  originalTasks.forEach((task) => {
    if (!newTasksMap.has(task.id)) {
      newTasks.push(task)
    }
  })

  return newTasks
}

/**
 * 更新任务列表的排序属性（倒序）
 */
export const updateTasksSortOrder = (tasks: Task[]): Task[] => {
  return tasks.map((task, index) => ({
    ...task,
    sort: tasks.length - index, // 倒序：第一个元素sort值最大
  }))
}

/**
 * 在同列内重新排序任务
 */
export const reorderTasksInColumn = (
  tasks: Task[],
  activeId: string,
  overId: string
): Task[] | null => {
  const currentIndex = tasks.findIndex((task) => task.id === activeId)
  const overIndex = tasks.findIndex((task) => task.id === overId)

  if (overIndex === -1 || currentIndex === -1 || currentIndex === overIndex) {
    return null
  }

  const activeTask = tasks.find((task) => task.id === activeId)
  if (!activeTask) return null

  const newTasks = tasks.filter((task) => task.id !== activeId)

  let insertIndex = overIndex
  if (currentIndex < overIndex) {
    insertIndex = overIndex - 1
  }

  newTasks.splice(insertIndex, 0, activeTask)

  return updateTasksSortOrder(newTasks)
}

/**
 * 保存任务到数据库并同步状态
 */
export const saveTasksToDatabaseAndSync = async (
  updatedTasks: Task[],
  originalTasks: Task[],
  tasksByColumn: Record<string, Task[]>,
  onTasksChange?: (tasks: Task[]) => void
): Promise<void> => {
  try {
    await saveTaskChanges(updatedTasks)

    const newTasks = rebuildTasksList(tasksByColumn, originalTasks)

    if (onTasksChange) {
      onTasksChange(newTasks)
    }
  } catch (error) {
    console.error('保存任务失败:', error)
  }
}

/**
 * 确定拖拽的目标列
 */
export const findTargetColumn = (
  overId: string,
  columns: Array<{ id: string }>,
  tasksByColumn: Record<string, Task[]>
): string => {
  // 首先检查是否是列ID
  const targetColumn = columns.find((col) => col.id === overId)?.id
  if (targetColumn) return targetColumn

  // 如果不是列ID，查找任务所在的列
  for (const [columnId, columnTasks] of Object.entries(tasksByColumn)) {
    if (columnTasks.some((task) => task.id === overId)) {
      return columnId
    }
  }

  // 如果都找不到，返回空字符串
  return ''
}
