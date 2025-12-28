import type { Group } from '@/types/Group'
import db from '../db'

/**
 * 分组数据仓库类
 * 负责分组数据的增删改查操作
 */
export class GroupRepository {
  /**
   * 获取所有分组
   * @returns Promise<Group[]> 分组列表
   */
  async getAll(): Promise<Group[]> {
    return await db.groups.toArray()
  }

  /**
   * 分页获取数据
   * @param page 页码
   * @param pageSize 每页大小
   * @returns Promise<Group[]> 分页分组列表
   */
  async getPaginated(
    page: number = 1,
    pageSize: number = 10
  ): Promise<Group[]> {
    return await db.groups
      .offset((page - 1) * pageSize)
      .limit(pageSize)
      .toArray()
  }

  /**
   * 根据ID获取分组
   * @param id 分组ID
   * @returns Promise<Group | undefined> 分组对象
   */
  async getById(id: string): Promise<Group | undefined> {
    return await db.groups.get(id)
  }

  /**
   * 添加分组
   * @param group 分组对象
   * @returns Promise<string> 返回分组ID
   */
  async add(group: Group): Promise<string> {
    await db.groups.add(group)
    return group.id
  }

  /**
   * 更新分组
   * @param id 分组ID
   * @param group 部分分组数据
   * @returns Promise<number> 更新的记录数
   */
  async update(id: string, group: Partial<Group>): Promise<number> {
    return await db.groups.update(id, group)
  }

  /**
   * 删除分组
   * @param id 分组ID
   * @returns Promise<void>
   */
  async delete(id: string): Promise<void> {
    await db.groups.delete(id)
  }

  /**
   * 批量添加分组
   * @param groups 分组数组
   * @returns Promise<void>
   */
  async bulkAdd(groups: Group[]): Promise<void> {
    await db.groups.bulkAdd(groups)
  }

  /**
   * 批量更新分组
   * @param groups 分组数组
   * @returns Promise<number> 更新的记录数
   */
  async bulkUpdate(groups: Group[]): Promise<number> {
    return await db.groups.bulkPut(groups)
  }

  /**
   * 批量删除分组
   * @param ids 分组ID数组
   * @returns Promise<void>
   */
  async bulkDelete(ids: string[]): Promise<void> {
    await db.groups.bulkDelete(ids)
  }

  /**
   * 清空所有分组
   * @returns Promise<void>
   */
  async clear(): Promise<void> {
    await db.groups.clear()
  }

  /**
   * 初始化分组数据（仅在数据库为空时添加）
   * @param sampleGroups 示例分组数据
   * @returns Promise<void>
   */
  async initWithSampleData(sampleGroups: Group[]): Promise<void> {
    const existingGroups = await db.groups.toArray()
    if (existingGroups.length === 0) {
      await db.groups.bulkAdd(sampleGroups)
      console.log('分组数据初始化完成')
    }
  }
}

/**
 * 创建分组仓库实例
 */
export const groupRepository = new GroupRepository()
