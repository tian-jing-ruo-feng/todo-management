import db from '@/utils/db'
import { useLiveQuery } from 'dexie-react-hooks'

/**
 * 过滤选项
 */
export function useFilterOptions(projectId?: string) {
  const statusList = useLiveQuery(
    async () => {
      console.log('[useFilterOptions] 查询状态, projectId:', projectId)
      const allStatuses = await db.statuses.toArray()
      console.log('[useFilterOptions] 所有状态:', allStatuses.length)

      if (projectId) {
        const filtered = await db.statuses
          .where('projectId')
          .equals(projectId)
          .toArray()
        console.log('[useFilterOptions] 项目状态:', filtered.length)
        return filtered
      }
      return allStatuses
    },
    [projectId],
    []
  )

  const priorityList = useLiveQuery(
    async () => {
      console.log('[useFilterOptions] 查询优先级, projectId:', projectId)
      const allPriorities = await db.priorities.toArray()
      console.log('[useFilterOptions] 所有优先级:', allPriorities.length)

      if (projectId) {
        const filtered = await db.priorities
          .where('projectId')
          .equals(projectId)
          .toArray()
        console.log('[useFilterOptions] 项目优先级:', filtered.length)
        return filtered
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
