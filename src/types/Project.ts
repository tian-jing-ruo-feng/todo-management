import type { Base } from './base'

/**
 * 项目实体
 * 项目作为顶层容器，包含任务、配置和成员
 */
export interface Project extends Base {
  /**
   * 项目ID
   */
  id: string
  /**
   * 项目名称
   */
  name: string
  /**
   * 项目描述
   */
  description?: string
  /**
   * 项目统一的权限域ID
   */
  realmId: string
  /**
   * 项目所有者ID
   */
  owner: string
  /**
   * 创建时间
   */
  createTime?: string
  /**
   * 更新时间
   */
  updateTime?: string
}
