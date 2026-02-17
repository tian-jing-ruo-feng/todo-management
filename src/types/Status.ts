import type { Base } from './base'

export interface Status extends Base {
  /**
   * 状态别标识
   */
  id: string
  /**
   * 状态名称
   */
  name: string
  /**
   * 状态颜色
   */
  color: string
  /**
   * 排序
   */
  sort: number
  /**
   * 所属项目ID
   */
  projectId: string
}
