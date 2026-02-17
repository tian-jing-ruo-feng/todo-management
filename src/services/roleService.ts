import db from '@/utils/db'
import type { Role } from '@/types/Role'
import { useLiveQuery } from 'dexie-react-hooks'

/**
 * 角色服务
 * 提供角色相关的业务逻辑
 */
export class RoleService {
  /**
   * 从 JSON 文件加载角色配置
   */
  static async loadRolesFromJSON(): Promise<Role[]> {
    const response = await fetch('/role.json')
    if (!response.ok) {
      throw new Error('Failed to load role configuration')
    }
    return response.json()
  }

  /**
   * 初始化角色到数据库
   */
  static async initializeRoles(): Promise<void> {
    const roles = await this.loadRolesFromJSON()

    await db.transaction('rw', db.roles, async () => {
      for (const role of roles) {
        // 使用 put 而不是 add，这样如果角色已存在会更新
        await db.roles.put({
          id: role.id,
          name: role.name,
          description: role.description,
          permissions: role.permissions,
          realmId: db.cloud.currentUserId!,
          owner: db.cloud.currentUserId!,
        })
      }
    })
  }

  /**
   * 获取所有角色
   */
  static async getAllRoles(): Promise<Role[]> {
    return db.roles.toArray()
  }

  /**
   * 根据ID获取角色
   */
  static async getRoleById(roleId: string): Promise<Role | undefined> {
    const role = await db.roles.get(roleId)
    if (!role) return undefined

    return {
      id: role.id,
      name: role.name,
      description: role.description || '',
      permissions: role.permissions || [],
    }
  }

  /**
   * 检查角色是否拥有某个权限
   */
  static async hasPermission(
    roleId: string,
    permission: string
  ): Promise<boolean> {
    const role = await this.getRoleById(roleId)
    if (!role) return false

    return role.permissions.includes(permission)
  }
}

/**
 * Hook: 获取所有角色
 */
export function useRoles() {
  return useLiveQuery(async () => {
    const roles = await RoleService.getAllRoles()
    if (roles.length === 0) {
      // 如果数据库中没有角色，从 JSON 文件加载
      return await RoleService.loadRolesFromJSON()
    }
    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description || '',
      permissions: role.permissions || [],
    }))
  }, [])
}

/**
 * Hook: 根据ID获取角色
 */
export function useRole(roleId: string | undefined) {
  return useLiveQuery(() => {
    if (!roleId) return undefined
    return RoleService.getRoleById(roleId)
  }, [roleId])
}
