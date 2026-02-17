import { Entity } from 'dexie'
import type { ToDoDb } from './db'

/**
 * 优先级实体类
 */
export class Priority extends Entity<ToDoDb> {
  id!: string
  realmId!: string
  owner!: string
  name!: string
  color!: string
  sort!: number
  projectId!: string
}
