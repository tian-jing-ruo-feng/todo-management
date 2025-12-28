import type { Status } from './Status'
import type { Priority } from './Priority'
import type { Group } from './Group'

/**
 * 配置类型枚举
 */
export enum ConfigType {
  Status = 'status',
  Priority = 'priority',
  Group = 'group',
}

/**
 * 配置项基础接口
 * 所有配置类型都需要实现此接口
 */
export interface ConfigItem {
  id: string
  name: string
  color: string
}

/**
 * 配置类型映射
 * 根据类型返回对应的接口类型
 */
export type ConfigData = Status | Priority | Group

/**
 * 配置表单数据
 */
export interface ConfigFormData {
  id?: string
  name: string
  color: string
}

/**
 * 配置表单验证规则
 */
export interface ConfigFormRule {
  name: string
  color: string
}

/**
 * 配置列定义
 */
export interface ConfigColumn {
  title: string
  dataIndex: string
  key: string
  width?: number
  render?: (value: any, record: ConfigItem, index: number) => React.ReactNode
}
