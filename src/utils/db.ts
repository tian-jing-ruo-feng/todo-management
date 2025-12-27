import Dexie from 'dexie'
import type { Table } from 'dexie'

/**
 * 任务接口定义
 * 用于 IndexedDB 数据库存储
 */
export interface Task {
  /**
   * 任务ID
   */
  id: string
  /**
   * 任务名称
   */
  name: string
  /**
   * 任务内容
   */
  content?: string
  /**
   * 任务状态
   */
  status: string
  /**
   * 是否移除（软删除）
   */
  isRemoved?: boolean
  /**
   * 分组
   */
  group?: string[]
  /**
   * 创建时间
   */
  createTime?: string
  /**
   * 更新时间
   */
  updateTime?: string
  /**
   * 期望开始时间
   */
  expectStartTime?: string
  /**
   * 期望结束时间
   */
  expectEndTime?: string
  /**
   * 优先级
   */
  priority: string
  /**
   * 是否置顶
   */
  isTop?: boolean
}

/**
 * 任务数据库类，继承 Dexie
 */
class TaskDatabase extends Dexie {
  tasks!: Table<Task>

  constructor() {
    super('TodoDB')
    // 定义数据库版本和存储结构
    // ++id 表示自增主键，但这里我们使用字符串ID
    // 后续字段表示创建索引
    this.version(1).stores({
      tasks: 'id, status, priority, createTime, updateTime, isTop, isRemoved',
    })
  }
}

/**
 * 创建数据库实例
 */
const db = new TaskDatabase()

/**
 * 添加或更新任务
 * @param task 任务对象，如果包含id则为更新，否则为添加
 * @returns Promise<string> 返回任务ID
 */
export const saveTask = async (task: Task): Promise<string> => {
  const taskData = {
    ...task,
    updateTime: new Date().toISOString(),
  }

  // 如果任务存在id，则更新；否则添加
  if (task.id && (await db.tasks.get(task.id))) {
    await db.tasks.update(task.id, taskData)
    return task.id
  } else {
    await db.tasks.add(taskData)
    return taskData.id
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
  return tasks.filter((task) => !task.isRemoved)
}

/**
 * 根据状态获取任务
 * @param status 任务状态
 * @returns Promise<Task[]> 任务列表
 */
export const getTasksByStatus = async (status: string): Promise<Task[]> => {
  const tasks = await db.tasks.where('status').equals(status).toArray()
  return tasks.filter((task) => !task.isRemoved)
}

/**
 * 批量添加任务
 * @param tasks 任务数组
 */
export const bulkAddTasks = async (tasks: Task[]): Promise<void> => {
  await db.tasks.bulkAdd(tasks)
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
  return await db.tasks.get(taskId)
}

/**
 * 批量更新任务
 * @param tasks 任务数组
 */
export const bulkUpdateTasks = async (tasks: Task[]): Promise<void> => {
  await db.tasks.bulkPut(tasks)
}

/**
 * 初始化数据库，添加示例数据（仅在数据库为空时）
 */
export const initDatabaseWithSampleData = async (
  sampleTasks: Task[]
): Promise<void> => {
  const existingTasks = await db.tasks.toArray()
  if (existingTasks.length === 0) {
    await db.tasks.bulkAdd(sampleTasks)
    console.log('数据库初始化完成，已添加示例数据')
  }
}

export default db
