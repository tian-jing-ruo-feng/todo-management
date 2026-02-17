import { Entity } from 'dexie'
import type { ToDoDb } from './db'

/**
 * 状态实体类
 */
export class Status extends Entity<ToDoDb> {
  id!: string
  realmId!: string
  owner!: string
  name!: string
  color!: string
  sort!: number
  projectId!: string
}
