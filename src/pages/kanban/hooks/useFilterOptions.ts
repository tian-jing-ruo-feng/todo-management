import db from '@/utils/db'
import { useLiveQuery } from 'dexie-react-hooks'

/**
 * 过滤选项
 */
export function useFilterOptions(projectId?: string) {
  const statusList = useLiveQuery(
    async () => {
      const allStatuses = await db.statuses.toArray()

      if (projectId) {
        return await db.statuses
          .where('projectId')
          .equals(projectId)
          .toArray()
      }
      return allStatuses
    },
    [projectId],
    []
  )

  const priorityList = useLiveQuery(
    async () => {
      const allPriorities = await db.priorities.toArray()

      if (projectId) {
        return await db.priorities
          .where('projectId')
          .equals(projectId)
          .toArray()
      }
      return allPriorities
    },
    [projectId],
    []
  )

  const groupList = useLiveQuery(
    async () => {
      if (projectId) {
        return db.groups.where('projectId').equals(projectId).toArray()
      }
      return db.groups.toArray()
    },
    [projectId],
    []
  )

  return {
    statusList,
    priorityList,
    groupList,
  }
}
