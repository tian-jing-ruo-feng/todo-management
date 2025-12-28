import type { Priority } from '@/types/Priority'
import db from '../db'

/**
 * 优先级数据仓库类
 * 负责优先级数据的增删改查操作
 */
export class PriorityRepository {
  /**
   * 获取所有优先级
   * @returns Promise<Priority[]> 优先级列表
   */
  async getAll(): Promise<Priority[]> {
    return await db.priorities.toArray()
  }

  /**
   * 根据ID获取优先级
   * @param id 优先级ID
   * @returns Promise<Priority | undefined> 优先级对象
   */
  async getById(id: string): Promise<Priority | undefined> {
    return await db.priorities.get(id)
  }

  /**
   * 添加优先级
   * @param priority 优先级对象
   * @returns Promise<string> 返回优先级ID
   */
  async add(priority: Priority): Promise<string> {
    await db.priorities.add(priority)
    return priority.id
  }

  /**
   * 更新优先级
   * @param id 优先级ID
   * @param priority 部分优先级数据
   * @returns Promise<number> 更新的记录数
   */
  async update(id: string, priority: Partial<Priority>): Promise<number> {
    return await db.priorities.update(id, priority)
  }

  /**
   * 删除优先级
   * @param id 优先级ID
   * @returns Promise<void>
   */
  async delete(id: string): Promise<void> {
    await db.priorities.delete(id)
  }

  /**
   * 批量添加优先级
   * @param priorities 优先级数组
   * @returns Promise<void>
   */
  async bulkAdd(priorities: Priority[]): Promise<void> {
    await db.priorities.bulkAdd(priorities)
  }

  /**
   * 批量更新优先级
   * @param priorities 优先级数组
   * @returns Promise<number> 更新的记录数
   */
  async bulkUpdate(priorities: Priority[]): Promise<number> {
    return await db.priorities.bulkPut(priorities)
  }

  /**
   * 批量删除优先级
   * @param ids 优先级ID数组
   * @returns Promise<void>
   */
  async bulkDelete(ids: string[]): Promise<void> {
    await db.priorities.bulkDelete(ids)
  }

  /**
   * 清空所有优先级
   * @returns Promise<void>
   */
  async clear(): Promise<void> {
    await db.priorities.clear()
  }

  /**
   * 初始化优先级数据（仅在数据库为空时添加）
   * @param samplePriorities 示例优先级数据
   * @returns Promise<void>
   */
  async initWithSampleData(samplePriorities: Priority[]): Promise<void> {
    const existingPriorities = await db.priorities.toArray()
    if (existingPriorities.length === 0) {
      await db.priorities.bulkAdd(samplePriorities)
      console.log('优先级数据初始化完成')
    }
  }
}

/**
 * 创建优先级仓库实例
 */
export const priorityRepository = new PriorityRepository()
