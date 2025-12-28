import type { Status } from '@/types/Status'
import db from '../db'

/**
 * 状态数据仓库类
 * 负责状态数据的增删改查操作
 */
export class StatusRepository {
  /**
   * 获取所有状态
   * @returns Promise<Status[]> 状态列表
   */
  async getAll(): Promise<Status[]> {
    return await db.statuses.toArray()
  }

  /**
   * 分页获取数据
   * @param page 页码
   * @param pageSize 每页大小
   * @returns Promise<Status[]> 分页状态列表
   */
  async getPaginated(
    page: number = 1,
    pageSize: number = 10
  ): Promise<Status[]> {
    return await db.statuses
      .offset((page - 1) * pageSize)
      .limit(pageSize)
      .toArray()
  }

  /**
   * 根据ID获取状态
   * @param id 状态ID
   * @returns Promise<Status | undefined> 状态对象
   */
  async getById(id: string): Promise<Status | undefined> {
    return await db.statuses.get(id)
  }

  /**
   * 添加状态
   * @param status 状态对象
   * @returns Promise<string> 返回状态ID
   */
  async add(status: Status): Promise<string> {
    await db.statuses.add(status)
    return status.id
  }

  /**
   * 更新状态
   * @param id 状态ID
   * @param status 部分状态数据
   * @returns Promise<number> 更新的记录数
   */
  async update(id: string, status: Partial<Status>): Promise<number> {
    return await db.statuses.update(id, status)
  }

  /**
   * 删除状态
   * @param id 状态ID
   * @returns Promise<void>
   */
  async delete(id: string): Promise<void> {
    await db.statuses.delete(id)
  }

  /**
   * 批量添加状态
   * @param statuses 状态数组
   * @returns Promise<void>
   */
  async bulkAdd(statuses: Status[]): Promise<void> {
    await db.statuses.bulkAdd(statuses)
  }

  /**
   * 批量更新状态
   * @param statuses 状态数组
   * @returns Promise<number> 更新的记录数
   */
  async bulkUpdate(statuses: Status[]): Promise<number> {
    return await db.statuses.bulkPut(statuses)
  }

  /**
   * 批量删除状态
   * @param ids 状态ID数组
   * @returns Promise<void>
   */
  async bulkDelete(ids: string[]): Promise<void> {
    await db.statuses.bulkDelete(ids)
  }

  /**
   * 清空所有状态
   * @returns Promise<void>
   */
  async clear(): Promise<void> {
    await db.statuses.clear()
  }

  /**
   * 初始化状态数据（仅在数据库为空时添加）
   * @param sampleStatuses 示例状态数据
   * @returns Promise<void>
   */
  async initWithSampleData(sampleStatuses: Status[]): Promise<void> {
    const existingStatuses = await db.statuses.toArray()
    if (existingStatuses.length === 0) {
      await db.statuses.bulkAdd(sampleStatuses)
      console.log('状态数据初始化完成')
    }
  }
}

/**
 * 创建状态仓库实例
 */
export const statusRepository = new StatusRepository()
