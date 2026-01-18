import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useMemo, useState } from 'react'
import type { TaskFilterValues } from '../../../components/TaskFilterForm'
import type { Status } from '../../../types/Status'
import { getAllTasks } from '../../../utils/db'

export type TaskFilterProps = {
  statusList: Status[]
  beforeCreateTask: (columnId: string) => void
}

/**
 * 任务过滤逻辑
 */
export const useTaskFilter = ({
  statusList,
  beforeCreateTask,
}: TaskFilterProps) => {
  // 任务列表
  const tasks = useLiveQuery(async () => {
    const tasks = await getAllTasks()
    return tasks
  })
  // 当前过滤条件
  const [filters, setFilters] = useState<TaskFilterValues>({})

  // 使用 useMemo 派生过滤后的任务列表
  const filteredTasks = useMemo(() => {
    if (!tasks) return []

    const { status, priority, group, keyword } = filters

    let result = [...tasks!]

    if (status) {
      result = result.filter((task) => task.status === status)
    }
    if (priority) {
      result = result.filter((task) => task.priority === priority)
    }
    if (group) {
      result = result.filter((task) => task.group?.includes(group))
    }
    if (keyword) {
      result = result.filter((task) => task.name.includes(keyword))
    }

    return result
  }, [tasks, filters])

  const handleFilterChange = useCallback((newFilters: TaskFilterValues) => {
    setFilters(newFilters)
  }, [])

  const handleResetFilter = useCallback(() => {
    setFilters({})
  }, [])

  // 打开新增任务弹窗
  const handleAddTask = useCallback(
    (columnId?: string) => {
      if (!columnId) {
        columnId = statusList.length ? statusList[0].id : ''
      }

      beforeCreateTask(columnId)
    },
    [statusList, beforeCreateTask]
  )

  const handleUploadSuccess = () => {}

  return {
    tasks,
    filteredTasks,
    handleFilterChange,
    handleResetFilter,
    handleAddTask,
    handleUploadSuccess,
  }
}
