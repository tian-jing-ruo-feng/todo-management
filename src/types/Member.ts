import type { Base } from './base'
import type { RoleType } from './Role'

/**
 * 项目成员实体
 * 存储项目成员关系和角色信息
 */
export interface Member extends Base {
  /**
   * 成员ID
   */
  id: string
  /**
   * 所属项目的权限域ID
   */
  realmId: string
  /**
   * 用户ID（邮箱）
   */
  userId: string
  /**
   * 成员名称
   */
  name?: string
  /**
   * 成员邮箱
   */
  email: string
  /**
   * 是否发送邀请邮件
   */
  invite?: boolean
  /**
   * 成员角色列表
   */
  roles: RoleType[]
  /**
   * 邀请状态：pending（待处理）、accepted（已接受）、rejected（已拒绝）
   */
  inviteStatus?: 'pending' | 'accepted' | 'rejected'
  /**
   * 加入时间
   */
  joinTime?: string
}
