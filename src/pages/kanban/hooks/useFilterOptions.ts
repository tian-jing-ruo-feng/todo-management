import db from '@/utils/db'
import { useLiveQuery } from 'dexie-react-hooks'

/**
 * 过滤选项
 */
export function useFilterOptions(projectId?: string) {
  const statusList = useLiveQuery(async () => {
    if (projectId) {
      return db.statuses.where('projectId').equals(projectId).toArray()
    }
    return db.statuses.toArray()
  }, [projectId])

  const priorityList = useLiveQuery(async () => {
    if (projectId) {
      return db.priorities.where('projectId').equals(projectId).toArray()
    }
    return db.priorities.toArray()
  }, [projectId])

  const groupList = useLiveQuery(async () => {
    if (projectId) {
      return db.groups.where('projectId').equals(projectId).toArray()
    }
    return db.groups.toArray()
  }, [projectId])

  return {
    statusList,
    priorityList,
    groupList,
  }
}
