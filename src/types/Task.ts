import type { Group } from './Group'
import type { Status } from './Status'
import type { Priority } from './Priority'

export interface Task {
  /**
   * 任务名称
   */
  name: string
  /**
   * 任务内容
   */
  content?: string
  /**
   * 任务id
   */
  id: string
  /**
   * 任务状态
   */
  status: Status['id']
  /**
   * 是否移除（软删除）
   */
  isRemoved?: boolean
  /**
   * 分组
   */
  group?: Group['id'][]
  /**
   * 创建时间
   */
  createTime?: string
  /**
   * 更新时间
   */
  updateTime?: string
  /**
   * 期望开始时间
   */
  expectStartTime?: string
  /**
   * 期望结束时间
   */
  expectEndTime?: string
  /**
   * 优先级
   */
  priority: Priority['id']
  /**
   * 是否置顶
   */
  isTop?: boolean // 是否置顶
  /**
   * 排序属性
   */
  sort?: number // 排序属性
}
