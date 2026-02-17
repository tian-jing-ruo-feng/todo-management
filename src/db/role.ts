import { Entity } from 'dexie'
import type { ToDoDb } from './db'
import type { Role } from '@/types/Role'

/**
 * 角色实体类
 * 提供角色相关的业务方法
 */
export class Role extends Entity<ToDoDb> {
  id!: string
  name!: string
  description!: string
  permissions!: string[]

  /**
   * 检查是否拥有某个权限
   */
  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission)
  }

  /**
   * 从 JSON 文件加载角色配置
   */
  static async loadFromJSON(): Promise<Role[]> {
    const response = await fetch('/role.json')
    if (!response.ok) {
      throw new Error('Failed to load role configuration')
    }
    return response.json()
  }

  /**
   * 初始化角色到数据库
   */
  static async initializeRoles(db: ToDoDb): Promise<void> {
    const roles = await this.loadFromJSON()

    await db.transaction('rw', db.roles, async () => {
      for (const role of roles) {
        // 使用 put 而不是 add，这样如果角色已存在会更新
        await db.roles.put(role)
      }
    })
  }
}
