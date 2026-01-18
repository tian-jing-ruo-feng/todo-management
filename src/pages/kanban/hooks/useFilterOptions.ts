import db from '@/utils/db'
import { useLiveQuery } from 'dexie-react-hooks'

/**
 * 过滤选项
 */
export function useFilterOptions() {
  const statusList = useLiveQuery(() => db.statuses.toArray())
  const priorityList = useLiveQuery(() => db.priorities.toArray())
  const groupList = useLiveQuery(() => db.groups.toArray())

  return {
    statusList,
    priorityList,
    groupList,
  }
}
