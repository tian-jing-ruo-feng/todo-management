import { Entity } from 'dexie'
import { getTiedRealmId } from 'dexie-cloud-addon'
import type { ToDoDb } from './db'

export class Status extends Entity<ToDoDb> {
  id!: string
  realmId!: string
  owner!: string
  name!: string
  color!: string
  sort!: number

  isSharable() {
    return this.realmId === getTiedRealmId(this.id)
  }

  async makeSharable() {
    // Compute a deterministic realmId tied to this statuses:
    const realmId = getTiedRealmId(this.id)

    const db = this.db // Entity<T> provides this.db - avoids cyclic deps.
    await db.transaction('rw', [db.statuses, db.tasks, db.realms], () => {
      // Make sure a realm exists (using a deterministic id based on the id of the
      // todo-list)
      // We use Table.upsert() instead of add(), put() here:
      //   In case same user does this on two offline devices, we don't
      //   want one of the actions to fail (which would be the case if using add())
      //   and we don't want to overwrite existing props like owner (which
      //   would be the case if using put())
      db.realms.upsert(realmId, {
        name: this.name,
        represents: '一个任务状态设置',
      })

      // Move the statuses into the new realm
      db.statuses.update(this.id!, { realmId: realmId })

      // Move all todo items into the new realm consistently
      // (modify() is consistent across sync peers)
      db.statuses.where({ id: this.id }).modify({ realmId: realmId })
    })
    return realmId
  }
}
