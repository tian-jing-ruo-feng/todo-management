import type { Base } from './base'

export interface Group extends Base {
  /**
   * 分组别标识
   */
  id: string
  /**
   * 分组名称
   */
  name: string
  /**
   * 分组颜色
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
