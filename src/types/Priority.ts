import type { Base } from './base'

export interface Priority extends Base {
  /**
   * 优先级别标识
   */
  id: string
  /**
   * 优先级名称
   */
  name: string
  /**
   * 优先级颜色
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
