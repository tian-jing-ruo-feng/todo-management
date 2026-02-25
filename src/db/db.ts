import Dexie from 'dexie'
import {
  dexieCloud,
  type DBRealm,
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
  // 使用 Dexie Cloud 内置的 members, roles 和 realms 表
  members!: Dexie.Table<DBRealmMember>
  roles!: Dexie.Table<DBRealmRole>
  realms!: Dexie.Table<DBRealm>

  constructor() {
    super('TodoDB', {
      addons: [dexieCloud],
    })

    // 升级到版本2：添加项目中心架构
    this.version(2).stores({
      projects: 'id, name, owner',
      tasks: 'id, name, projectId, status, priority, assignee',
      statuses: 'id, name, projectId',
      priorities: 'id, name, projectId',
      groups: 'id, name, projectId',
      // Dexie Cloud 内置表的索引定义
      // 添加 email 单独索引，支持通过邮箱查询邀请
      members: '@id, [userId+realmId], [email+realmId], email, realmId',
      roles: '[realmId+name]',
      realms: '@realmId', // realmId 作为主键
    })

    // 升级到版本3：添加 realmId 索引
    this.version(3).stores({
      projects: 'id, name, owner, realmId',
    })

    this.cloud.configure({
      databaseUrl: import.meta.env.VITE_DATABASE_URL,
      requireAuth: false, // 禁用自动认证检查，使用自定义登录
      customLoginGui: true,
    })

    // 初始化时检查并恢复登录状态
    this.initializeAuthState()

    this.groups.mapToClass(Group)
    this.priorities.mapToClass(Priority)
    this.projects.mapToClass(Project)
    this.statuses.mapToClass(Status)
    this.tasks.mapToClass(Task)
  }

  /**
   * 初始化认证状态
   * 在应用启动时检查 $logins 表是否有有效的登录数据
   * 如果有，触发同步以恢复登录状态
   */
  private async initializeAuthState() {
    try {
      // 等待数据库打开
      await this.open()

      // 检查 $logins 表是否有数据
      const loginsTable = this.table('$logins')
      if (loginsTable) {
        const logins = await loginsTable.toArray()

        if (logins.length > 0) {
          // 有登录数据，检查 currentUser 状态
          const currentUser = this.cloud.currentUser.value

          // 如果有登录数据但 isLoggedIn 为 false，触发同步
          if (!currentUser?.isLoggedIn) {
            await this.cloud.sync()
          }
        }
      }
    } catch (error) {
      console.error('[DB初始化] 认证状态初始化失败:', error)
    }
  }
}

const db = new ToDoDb()

// 开发环境将 db 挂载到全局对象，方便控制台调试
if (import.meta.env.DEV) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).db = db

  // 动态导入 MemberService 用于诊断
  import('@/services/memberService').then(({ MemberService }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).MemberService = MemberService
    console.log('🔧 调试工具已加载:')
    console.log('  - window.db: 数据库实例')
    console.log('  - window.MemberService: 成员服务')
    console.log('使用示例:')
    console.log('  - await MemberService.verifyMemberPermissions("memberId")')
    console.log('  - await MemberService.diagnoseTaskPermission("taskId")')
  })
}

export default db
