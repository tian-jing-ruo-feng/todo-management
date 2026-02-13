import { Entity } from 'dexie'
import { getTiedRealmId, type DBRealmMember } from 'dexie-cloud-addon'
import type { ToDoDb } from './db'

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

  isSharable() {
    return this.realmId === getTiedRealmId(this.id)
  }

  async makeSharable() {
    const realmId = getTiedRealmId(this.id)

    const db = this.db // Entity<T> provides this.db - avoids cyclic deps.
    await db.transaction('rw', [db.tasks, db.realms], () => {
      db.realms.upsert(realmId, {
        name: this.name,
        represents: '一个任务设置',
      })

      db.tasks.update(this.id!, { realmId: realmId })

      db.tasks.where({ id: this.id }).modify({ realmId: realmId })
    })
    return realmId
  }

  async makePrivate() {
    const tiedRealmId = getTiedRealmId(this.id)
    const db = this.db
    await db.transaction('rw', [db.tasks, db.members, db.realms], async () => {
      await db.tasks.where({ id: this.id, realmId: tiedRealmId }).modify({
        realmId: db.cloud.currentUserId,
        owner: db.cloud.currentUserId,
      })

      await db.members.where('realmId').equals(tiedRealmId).delete()

      await db.realms.delete(tiedRealmId)
    })
  }

  /** 分享任务给其他用户
   * Share the task with another user
   * @param name - The name of the user to share with
   * @param email - The email of the user to share with
   * @param sendEmail - Whether to send an email notification
   * @param roles - The roles to assign to the shared user

   */
  async shareWith(
    name: string,
    email: string,
    sendEmail: boolean,
    roles: string[]
  ) {
    const { db } = this
    await db.transaction('rw', [db.members, db.tasks, db.realms], async () => {
      const reamId = await this.makeSharable()

      await db.members.add({
        realmId: reamId,
        userId: email,
        name,
        invite: sendEmail,
        roles,
      })
    })
  }

  /**
   * 取消分享任务
   * @param member 成员
   */
  async unshareWith(member: DBRealmMember) {
    await this.db.members.delete(member.id)
  }

  /**
   * 退出任务
   */
  async leaveTask() {
    const { db } = this
    const tiedRealmId = getTiedRealmId(this.id)

    await db.members
      .where({
        realmId: tiedRealmId,
        userId: db.cloud.currentUserId,
      })
      .delete()
  }

  /**
   * 删除任务
   */
  async deleteTask() {
    const { db } = this
    await db.transaction('rw', [db.tasks, db.realms], async () => {
      db.transaction('rw', [db.tasks, db.realms], async () => {
        db.tasks.delete(this.id)

        const tiedRealmId = getTiedRealmId(this.id)
        await db.realms.delete(tiedRealmId)
      })
    })
  }

  /** 改变任务的所有者
   * Change the owner of the task
   * @param userId 用户id
   */
  async changeOwner(userId: string) {
    const { db } = this
    const realmId = getTiedRealmId(this.id)
    await db.transaction('rw', [db.tasks, db.realms, db.members], async () => {
      db.members.where({ realmId, userId }).modify({ roles: ['manager'] })

      db.members.where({ realmId }).modify({
        owner: userId,
      })

      db.tasks.where({ realmId, id: this.id }).modify({
        owner: userId,
      })

      db.realms.where({ realmId }).modify({
        owner: userId,
      })
    })
  }

  /**
   * 改变成员角色
   * @param member 成员
   * @param role 角色
   */
  async changeMemberRole(member: DBRealmMember, role: string) {
    await this.db.members.update(member.id, {
      permissions: {},
      roles: [role],
    })
  }
}
