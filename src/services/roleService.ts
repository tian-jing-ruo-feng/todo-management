import db from '@/utils/db'
import { useLiveQuery } from 'dexie-react-hooks'
import type { DBRealmRole, DBPermissionSet } from 'dexie-cloud-addon'

/**
 * 角色信息（用于 UI 显示）
 */
export interface RoleInfo {
  id: string // 使用 name 作为 id
  name: string
  description: string
  permissions: DBPermissionSet
}

/**
 * 角色服务
 * 提供角色相关的业务逻辑
 */
export class RoleService {
  /**
   * 获取项目的所有角色
   */
  static async getProjectRoles(realmId: string): Promise<RoleInfo[]> {
    const roles = await db.roles.where('realmId').equals(realmId).toArray()

    return roles.map((role) => ({
      id: role.name,
      name: this.getRoleDisplayName(role.name),
      description: this.getRoleDescription(role.name),
      permissions: role.permissions,
    }))
  }

  /**
   * 获取角色显示名称
   */
  static getRoleDisplayName(roleName: string): string {
    const displayNames: Record<string, string> = {
      owner: '所有者',
      admin: '管理员',
      member: '成员',
      guest: '访客',
    }
    return displayNames[roleName] || roleName
  }

  /**
   * 获取角色描述
   */
  static getRoleDescription(roleName: string): string {
    const descriptions: Record<string, string> = {
      owner: '项目所有者，拥有完全管理权限',
      admin: '管理员，可以管理项目数据和成员',
      member: '成员，可以创建和编辑任务',
      guest: '访客，只能查看项目数据',
    }
    return descriptions[roleName] || ''
  }

  /**
   * 根据名称获取项目角色
   */
  static async getProjectRoleByName(
    realmId: string,
    roleName: string
  ): Promise<DBRealmRole | undefined> {
    return db.roles.where('[realmId+name]').equals([realmId, roleName]).first()
  }
}

/**
 * Hook: 获取项目的角色列表
 */
export function useProjectRoles(realmId: string | undefined) {
  return useLiveQuery(async () => {
    if (!realmId) return []
    return RoleService.getProjectRoles(realmId)
  }, [realmId])
}

/**
 * Hook: 获取默认角色列表（用于邀请时的角色选择）
 */
export function useDefaultRoles() {
  return useLiveQuery(async () => {
    // 返回预定义的默认角色列表
    return [
      {
        id: 'admin',
        name: '管理员',
        description: '管理员，可以管理项目数据和成员',
        permissions: { add: '*', update: '*', manage: '*' } as DBPermissionSet,
      },
      {
        id: 'member',
        name: '成员',
        description: '成员，可以创建任务，只能编辑分配给自己的任务',
        permissions: {
          add: ['tasks'], // 可以创建任务
          update: {
            tasks: [
              'name',
              'description',
              'status',
              'priority',
              'groupId',
              'assignee',
              'dueDate',
              'tags',
            ], // 可更新的任务字段
          },
        } as DBPermissionSet,
      },
      {
        id: 'guest',
        name: '访客',
        description: '访客，只能查看项目数据',
        permissions: {} as DBPermissionSet,
      },
    ]
  }, [])
}

/**
 * Hook: 获取角色列表（兼容旧代码）
 * @deprecated 请使用 useProjectRoles 或 useDefaultRoles
 */
export function useRoles() {
  return useDefaultRoles()
}
