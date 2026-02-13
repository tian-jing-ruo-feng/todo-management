import Dexie from 'dexie'
import { dexieCloud } from 'dexie-cloud-addon'
import type { Group as GroupType } from '@/types/Group'
import type { Priority as PriorityType } from '@/types/Priority'
import type { Status as StatusType } from '@/types/Status'
import type { Task as TaskType } from '@/types/Task'
import { Group } from './group'
import { Priority } from './priority'
import { Status } from './status'
import { Task } from './task'

export class ToDoDb extends Dexie {
  tasks!: Dexie.Table<TaskType>
  statuses!: Dexie.Table<StatusType>
  priorities!: Dexie.Table<PriorityType>
  groups!: Dexie.Table<GroupType>

  constructor() {
    super('ToDoDB', {
      addons: [dexieCloud],
    })

    this.version(1).stores({
      tasks: 'id, name, group, status, priority',
      statuses: 'id, name',
      priorities: 'id, name',
      groups: 'id, name',
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
    this.statuses.mapToClass(Status)
    this.tasks.mapToClass(Task)
  }
}

const db = new ToDoDb()

export default db
