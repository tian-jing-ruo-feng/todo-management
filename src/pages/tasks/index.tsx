import type { Task } from '@/types/Task'
import { useCallback, useEffect, useState } from 'react'
import TaskCreateModal from '../../components/TaskCreateModal'
import TaskFilterForm from '../../components/TaskFilterForm'
import type { Group } from '../../types/Group'
import type { Priority } from '../../types/Priority'
import type { Status } from '../../types/Status'
import { getAllTasks, getAllTasksCount, saveTask } from '../../utils/db'
import {
  groupRepository,
  priorityRepository,
  statusRepository,
} from '../../utils/repositories'
import ConfigPage from '../config'
import KanbanPage from '../kanban'
import { useTaskFilter } from '../kanban/hooks/useTaskFilter'
import SelectTab, { type ButtonItem } from './SelectTab'
import TaskTable from './TaskTable'

export default function Tasks() {
  const [selectTab, setSelectTab] = useState<ButtonItem>()
  const [statusList, setStatusList] = useState<Status[]>([])
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [defaultColumnId, setDefaultColumnId] = useState<string>('')
  const [statusOptions, setStatusOptions] = useState<Status[]>([])
  const [priorityOptions, setPriorityOptions] = useState<Priority[]>([])
  const [groupOptions, setGroupOptions] = useState<Group[]>([])

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [statuses, priorities, groups] = await Promise.all([
          statusRepository.getAll(),
          priorityRepository.getAll(),
          groupRepository.getAll(),
        ])
        setStatusOptions(statuses)
        setPriorityOptions(priorities)
        setGroupOptions(groups)
      } catch (error) {
        console.error('加载配置数据失败:', error)
      }
    }

    loadOptions()
  }, [])
  const beforeCreateTask = () => {}
  const {
    filteredTasks,
    setTasks,
    handleFilterChange,
    handleResetFilter,
    handleUploadSuccess,
  } = useTaskFilter({ statusList, beforeCreateTask })

  useEffect(() => {
    const loadStatusData = async () => {
      try {
        const statuses = await statusRepository.getAll()
        setStatusList(statuses)
      } catch (error) {
        console.error('加载状态数据失败:', error)
      }
    }
    loadStatusData()
  }, [])

  const handleSelectTabChange = (item: ButtonItem) => {
    setSelectTab(item)
  }

  const handleRefresh = useCallback(async () => {
    const allTasks = await getAllTasks()
    setTasks(allTasks)
  }, [setTasks])

  // 打开新增任务弹窗
  const handleAddTask = useCallback(
    (columnId?: string) => {
      if (!columnId) {
        columnId = statusList.length ? statusList[0].id : ''
      }
      // 直接使用列ID作为状态ID
      setDefaultColumnId(columnId)
      setCreateModalVisible(true)
    },
    [statusList]
  )

  const handleCreateModalClose = useCallback(() => {
    setCreateModalVisible(false)
    setDefaultColumnId('')
  }, [])

  // 创建新任务
  const handleCreateTask = useCallback(
    async (newTask: Task) => {
      let newTaskWithSort = newTask
      // 保存到数据库
      try {
        // 获取任务总数
        const taskCount = await getAllTasksCount()
        // 为新任务设置sort字段
        newTaskWithSort = { ...newTask, sort: taskCount + 1 }
        await saveTask(newTaskWithSort)
        handleRefresh()
      } catch (error) {
        console.error('创建任务失败:', error)

        return // 如果保存失败，直接返回
      }
    },
    [handleRefresh]
  )

  return (
    <div className="flex flex-col gap-3 p-3 size-full overflow-hidden">
      {/* <TaskStatistc></TaskStatistc> */}
      <SelectTab onChange={handleSelectTabChange}></SelectTab>
      {/* 任务过滤表单 */}
      <TaskFilterForm
        onFilterChange={handleFilterChange}
        onReset={handleResetFilter}
        onUploadSuccess={handleUploadSuccess}
        onAddTask={handleAddTask}
      ></TaskFilterForm>
      {selectTab?.key === 'kanban' && (
        <div className="flex-1 size-full overflow-auto">
          <KanbanPage
            tasks={filteredTasks}
            onRefresh={handleRefresh}
          ></KanbanPage>
        </div>
      )}

      {selectTab?.key === 'config' && <ConfigPage />}

      {selectTab?.key === 'priority' && (
        <div className="flex-1 size-full flex flex-col overflow-hidden">
          <TaskTable
            filteredTasks={filteredTasks}
            statusOptions={statusOptions}
            priorityOptions={priorityOptions}
            groupOptions={groupOptions}
          ></TaskTable>
        </div>
      )}
      <TaskCreateModal
        visible={createModalVisible}
        defaultStatus={defaultColumnId}
        onClose={handleCreateModalClose}
        onSave={handleCreateTask}
      />
    </div>
  )
}
