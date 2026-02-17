import Dexie from 'dexie'
import {
  dexieCloud,
  type DBRealmMember,
  type DBRealmRole,
} from 'dexie-cloud-addon'
import type { Group as GroupType } from '@/types/Group'
import type { Priority as PriorityType } from '@/types/Priority'
import type { Project as ProjectType } from '@/types/Project'
import type { Status as StatusType } from '@/types/Status'
import type { Task as TaskType } from '@/types/Task'
import { Group } from './group'
import { Priority } from './priority'
import { Project } from './project'
import { Status } from './status'
import { Task } from './task'

export class ToDoDb extends Dexie {
  projects!: Dexie.Table<ProjectType>
  tasks!: Dexie.Table<TaskType>
  statuses!: Dexie.Table<StatusType>
  priorities!: Dexie.Table<PriorityType>
  groups!: Dexie.Table<GroupType>
  // 使用 Dexie Cloud 内置的 members 和 roles 表
  members!: Dexie.Table<DBRealmMember>
  roles!: Dexie.Table<DBRealmRole>

  constructor() {
    super('TodoDB', {
      addons: [dexieCloud],
    })

    this.version(1).stores({
      tasks: 'id, name, group, status, priority',
      statuses: 'id, name',
      priorities: 'id, name',
      groups: 'id, name',
    })

    // 升级到版本2：添加项目中心架构
    this.version(2).stores({
      projects: 'id, name, owner',
      tasks: 'id, name, projectId, status, priority, assignee',
      statuses: 'id, name, projectId',
      priorities: 'id, name, projectId',
      groups: 'id, name, projectId',
      // Dexie Cloud 内置表的索引定义
      members: '@id, [userId+realmId], [email+realmId], realmId',
      roles: '[realmId+name]',
    })

    this.cloud.configure({
      databaseUrl: import.meta.env.VITE_DATABASE_URL,
      requireAuth: true,
      customLoginGui: true,
      // When set, local changes will not trigger a sync towards the server.
      // disableEagerSync: true,
    })

    this.groups.mapToClass(Group)
    this.priorities.mapToClass(Priority)
    this.projects.mapToClass(Project)
    this.statuses.mapToClass(Status)
    this.tasks.mapToClass(Task)
  }
}

const db = new ToDoDb()

export default db
