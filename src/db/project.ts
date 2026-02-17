import { Entity } from 'dexie'
import type { ToDoDb } from './db'

/**
 * 项目实体类
 * 提供项目相关的业务方法
 */
export class Project extends Entity<ToDoDb> {
  id!: string
  name!: string
  description?: string
  realmId!: string
  owner!: string
  createTime?: string
  updateTime?: string

  /**
   * 创建项目并初始化默认配置
   */
  async createWithDefaults(name: string, description?: string) {
    const db = this.db
    const projectId = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()

    await db.transaction(
      'rw',
      [db.projects, db.statuses, db.priorities, db.groups],
      async () => {
        // 创建项目
        await db.projects.add({
          id: projectId,
          name,
          description,
          owner: db.cloud.currentUserId!,
          realmId: projectId, // 使用项目ID作为 realmId
          createTime: now,
          updateTime: now,
        })

        // 初始化默认状态
        await db.statuses.bulkAdd([
          {
            id: `${projectId}_status_todo`,
            name: '待办',
            color: '#999999',
            projectId,
            realmId: projectId,
            owner: db.cloud.currentUserId!,
          },
          {
            id: `${projectId}_status_progress`,
            name: '进行中',
            color: '#1890ff',
            projectId,
            realmId: projectId,
            owner: db.cloud.currentUserId!,
          },
          {
            id: `${projectId}_status_done`,
            name: '已完成',
            color: '#52c41a',
            projectId,
            realmId: projectId,
            owner: db.cloud.currentUserId!,
          },
        ])

        // 初始化默认优先级
        await db.priorities.bulkAdd([
          {
            id: `${projectId}_priority_low`,
            name: '低',
            color: '#999999',
            projectId,
            realmId: projectId,
            owner: db.cloud.currentUserId!,
          },
          {
            id: `${projectId}_priority_medium`,
            name: '中',
            color: '#1890ff',
            projectId,
            realmId: projectId,
            owner: db.cloud.currentUserId!,
          },
          {
            id: `${projectId}_priority_high`,
            name: '高',
            color: '#ff4d4f',
            projectId,
            realmId: projectId,
            owner: db.cloud.currentUserId!,
          },
        ])
      }
    )

    return projectId
  }

  /**
   * 删除项目（需要检查权限）
   */
  async deleteProject() {
    const db = this.db

    // 只有项目所有者才能删除项目
    if (this.owner !== db.cloud.currentUserId) {
      throw new Error('只有项目所有者才能删除项目')
    }

    await db.transaction(
      'rw',
      [
        db.projects,
        db.tasks,
        db.statuses,
        db.priorities,
        db.groups,
        db.members,
      ],
      async () => {
        // 删除项目下的所有任务
        await db.tasks.where('projectId').equals(this.id).delete()

        // 删除项目下的所有配置
        await db.statuses.where('projectId').equals(this.id).delete()
        await db.priorities.where('projectId').equals(this.id).delete()
        await db.groups.where('projectId').equals(this.id).delete()

        // 删除项目成员
        await db.members.where('realmId').equals(this.realmId).delete()

        // 删除项目
        await db.projects.delete(this.id)
      }
    )
  }
}
