import { Entity } from 'dexie'
import type { ToDoDb } from './db'

/**
 * 分组实体类
 */
export class Group extends Entity<ToDoDb> {
  id!: string
  realmId!: string
  owner!: string
  name!: string
  color!: string
  sort!: number
  projectId!: string
}
