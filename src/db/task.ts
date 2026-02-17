import { Entity } from 'dexie'
import type { ToDoDb } from './db'

/**
 * 任务实体类
 */
export class Task extends Entity<ToDoDb> {
  id!: string
  realmId!: string
  owner!: string
  name!: string
  content?: string
  status?: string
  isRemoved?: boolean
  group?: string[]
  createTime?: string
  updateTime?: string
  expectStartTime?: string
  expectEndTime?: string
  priority!: string
  isTop?: boolean
  sort?: number
  projectId!: string
  assignee?: string
}
