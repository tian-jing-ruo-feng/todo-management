import type { Base } from './base'

/**
 * 用户配置实体
 * 存储用户的全局配置信息，跨项目共享
 */
export interface User extends Base {
  /**
   * 用户ID（来自 Dexie Cloud）
   */
  userId: string

  /**
   * 用户邮箱
   */
  email?: string

  /**
   * 用户别名
   */
  name?: string

  /**
   * 头像 URL
   */
  avatar?: string

  /**
   * 创建时间
   */
  createdAt?: string

  /**
   * 更新时间
   */
  updatedAt?: string
}
