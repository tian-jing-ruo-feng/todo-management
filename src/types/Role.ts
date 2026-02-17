/**
 * 角色类型枚举
 */
export enum RoleType {
  ADMIN = 'admin', // 管理员
  MEMBER = 'member', // 成员
  GUEST = 'guest', // 访客
}

/**
 * 角色实体
 */
export interface Role {
  /**
   * 角色ID，对应 Dexie Cloud 的角色标识
   */
  id: string
  /**
   * 角色显示名称
   */
  name: string
  /**
   * 角色描述
   */
  description: string
  /**
   * 权限列表
   */
  permissions: string[]
}
