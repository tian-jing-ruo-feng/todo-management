import db from '@/utils/db'
import { useLiveQuery } from 'dexie-react-hooks'

/**
 * 过滤选项
 */
export function useFilterOptions(projectId?: string) {
  const statusList = useLiveQuery(
    async () => {
      if (projectId) {
        return await db.statuses
          .where('projectId')
          .equals(projectId)
          .sortBy('sort')
      }
      return (await db.statuses.toArray()).sort(
        (a, b) => (a.sort || 0) - (b.sort || 0)
      )
    },
    [projectId],
    []
  )

  const priorityList = useLiveQuery(
    async () => {
      if (projectId) {
        return await db.priorities
          .where('projectId')
          .equals(projectId)
          .sortBy('sort')
      }
      return (await db.priorities.toArray()).sort(
        (a, b) => (a.sort || 0) - (b.sort || 0)
      )
    },
    [projectId],
    []
  )

  const groupList = useLiveQuery(
    async () => {
      if (projectId) {
        return (
          await db.groups.where('projectId').equals(projectId).toArray()
        ).sort((a, b) => (a.sort || 0) - (b.sort || 0))
      }
      return (await db.groups.toArray()).sort(
        (a, b) => (a.sort || 0) - (b.sort || 0)
      )
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
