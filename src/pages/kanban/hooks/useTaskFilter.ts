import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useMemo, useState } from 'react'
import type { TaskFilterValues } from '../../../components/TaskFilterForm'
import type { Status } from '../../../types/Status'
import db from '../../../utils/db'
import { decryptTasks } from '../../../utils/crypto'

// 从环境变量获取加密密钥
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || ''

export type TaskFilterProps = {
  statusList: Status[]
  beforeCreateTask: (columnId: string) => void
  projectId?: string
}

/**
 * 任务过滤逻辑
 */
export const useTaskFilter = ({
  statusList,
  beforeCreateTask,
  projectId,
}: TaskFilterProps) => {
  // 任务列表 - 直接使用 db.tasks 查询以确保响应式更新
  const tasks = useLiveQuery(
    async () => {
      let allTasks
      if (projectId) {
        allTasks = await db.tasks.where('projectId').equals(projectId).toArray()
      } else {
        allTasks = await db.tasks.toArray()
      }
      // 过滤已删除的任务
      const activeTasks = allTasks.filter((task) => !task.isRemoved)
      // 解密敏感字段
      return ENCRYPTION_KEY
        ? decryptTasks(activeTasks, ENCRYPTION_KEY)
        : activeTasks
    },
    [projectId],
    [] // 默认值为空数组
  )
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
