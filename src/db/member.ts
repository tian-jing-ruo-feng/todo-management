import { Entity } from 'dexie'
import type { ToDoDb } from './db'

/**
 * 成员实体类
 * 提供成员相关的业务方法
 */
export class Member extends Entity<ToDoDb> {
  id!: string
  realmId!: string
  userId!: string
  name?: string
  email!: string
  invite?: boolean
  roles!: string[]
  inviteStatus?: 'pending' | 'accepted' | 'rejected'
  joinTime?: string

  /**
   * 接受邀请
   */
  async acceptInvite() {
    const db = this.db
    await db.members.update(this.id, {
      inviteStatus: 'accepted',
      joinTime: new Date().toISOString(),
    })
  }

  /**
   * 拒绝邀请
   */
  async rejectInvite() {
    const db = this.db
    await db.members.update(this.id, {
      inviteStatus: 'rejected',
    })
  }

  /**
   * 修改成员角色
   */
  async changeRole(newRole: string) {
    const db = this.db
    await db.members.update(this.id, {
      roles: [newRole],
    })
  }

  /**
   * 移除成员
   */
  async removeMember() {
    const db = this.db
    await db.members.delete(this.id)
  }
}
