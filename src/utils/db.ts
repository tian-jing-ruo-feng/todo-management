// 重新导出新的数据库实例
export { default, ToDoDb } from '@/db/db'

// 保留原有的工具函数
import type { Task } from '@/types/Task'
import db from '@/db/db'

// 从环境变量获取加密密钥
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || ''

import {
  decryptTaskFields,
  decryptTasks,
  encryptTaskFields,
  encryptTasks,
} from './crypto'

/**
 * 添加或更新任务
 * @param task 任务对象，如果包含id则为更新，否则为添加
 * @returns Promise<string> 返回任务ID
 */
export const saveTask = async (task: Task): Promise<string> => {
  // 如果任务存在id，则更新；否则添加
  if (task.id && (await db.tasks.get(task.id))) {
    // 更新时加密敏感字段
    const updateData = ENCRYPTION_KEY
      ? encryptTaskFields(task, ENCRYPTION_KEY)
      : task
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.tasks.update(task.id, updateData as any)
    return task.id
  } else {
    // 添加新任务时，需要填充 realmId 和 owner
    const newTaskData = { ...task }

    // 如果任务没有 realmId，从项目获取
    if (!newTaskData.realmId && newTaskData.projectId) {
      const project = await db.projects.get(newTaskData.projectId)
      if (project) {
        newTaskData.realmId = project.realmId
        // 如果任务没有 owner，使用项目的 owner 或当前用户
        if (!newTaskData.owner) {
          newTaskData.owner =
            project.owner || db.cloud.currentUser.value?.userId
        }
      }
    }

    // 如果还是没有 owner，使用当前用户
    if (!newTaskData.owner) {
      newTaskData.owner = db.cloud.currentUser.value?.userId
    }

    // 加密敏感字段
    const encryptedTaskData = ENCRYPTION_KEY
      ? encryptTaskFields(newTaskData, ENCRYPTION_KEY)
      : newTaskData
    await db.tasks.add(encryptedTaskData)
    return encryptedTaskData.id
  }
}

/**
 * 删除任务（软删除）
 * @param taskId 任务ID
 */
export const deleteTask = async (taskId: string): Promise<void> => {
  const task = await db.tasks.get(taskId)
  if (task) {
    await db.tasks.update(taskId, {
      isRemoved: true,
      updateTime: new Date().toISOString(),
    })
  }
}

/**
 * 获取所有任务（排除已删除的）
 * @returns Promise<Task[]> 任务列表
 */
export const getAllTasks = async (): Promise<Task[]> => {
  const tasks = await db.tasks.toArray()
  const activeTasks = tasks.filter((task) => !task.isRemoved)
  // 解密敏感字段
  return ENCRYPTION_KEY
    ? decryptTasks(activeTasks, ENCRYPTION_KEY)
    : activeTasks
}

/**
 * 根据状态获取任务
 * @param status 任务状态
 * @returns Promise<Task[]> 任务列表
 */
export const getTasksByStatus = async (status: string): Promise<Task[]> => {
  const tasks = await db.tasks.where('status').equals(status).toArray()
  const activeTasks = tasks.filter((task) => !task.isRemoved)
  // 解密敏感字段
  return ENCRYPTION_KEY
    ? decryptTasks(activeTasks, ENCRYPTION_KEY)
    : activeTasks
}

/**
 * 批量添加任务
 * @param tasks 任务数组
 */
export const bulkAddTasks = async (tasks: Task[]): Promise<void> => {
  // 为每个任务填充 realmId 和 owner
  const tasksWithRealm = await Promise.all(
    tasks.map(async (task) => {
      const newTask = { ...task }

      // 如果任务没有 realmId，从项目获取
      if (!newTask.realmId && newTask.projectId) {
        const project = await db.projects.get(newTask.projectId)
        if (project) {
          newTask.realmId = project.realmId
          if (!newTask.owner) {
            newTask.owner = project.owner || db.cloud.currentUser.value?.userId
          }
        }
      }

      // 如果还是没有 owner，使用当前用户
      if (!newTask.owner) {
        newTask.owner = db.cloud.currentUser.value?.userId
      }

      return newTask
    })
  )

  // 加密敏感字段
  const encryptedTasks = ENCRYPTION_KEY
    ? encryptTasks(tasksWithRealm, ENCRYPTION_KEY)
    : tasksWithRealm
  await db.tasks.bulkAdd(encryptedTasks)
}

/**
 * 清空所有任务
 */
export const clearAllTasks = async (): Promise<void> => {
  await db.tasks.clear()
}

/**
 * 根据ID获取任务
 * @param taskId 任务ID
 * @returns Promise<Task | undefined> 任务对象
 */
export const getTaskById = async (
  taskId: string
): Promise<Task | undefined> => {
  const task = await db.tasks.get(taskId)
  // 解密敏感字段
  return task && ENCRYPTION_KEY ? decryptTaskFields(task, ENCRYPTION_KEY) : task
}

/**
 * 批量更新任务
 * @param tasks 任务数组
 */
export const bulkUpdateTasks = async (tasks: Task[]): Promise<void> => {
  // 加密敏感字段
  const encryptedTasks = ENCRYPTION_KEY
    ? encryptTasks(tasks, ENCRYPTION_KEY)
    : tasks
  await db.tasks.bulkPut(encryptedTasks)
}

/**
 * 获取所有任务总数（包括删除）
 */
export const getAllTasksCount = async (): Promise<number> => {
  return await db.tasks.count()
}

/**
 * 初始化数据库，添加示例数据（仅在数据库为空时）
 */
export const initDatabaseWithSampleData = async (
  sampleTasks: Task[]
): Promise<void> => {
  const existingTasks = await db.tasks.toArray()
  if (existingTasks.length === 0) {
    // 加密示例数据
    const encryptedTasks = ENCRYPTION_KEY
      ? encryptTasks(sampleTasks, ENCRYPTION_KEY)
      : sampleTasks
    await db.tasks.bulkAdd(encryptedTasks)
  }
}
