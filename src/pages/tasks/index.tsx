import type { Task } from '@/types/Task'
import { useCallback, useState } from 'react'
import TaskCreateModal from '../../components/TaskCreateModal'
import TaskFilterForm from '../../components/TaskFilterForm'
import { getAllTasksCount, saveTask } from '../../utils/db'
import ConfigPage from '../config'
import KanbanPage from '../kanban'
import { useFilterOptions } from '../kanban/hooks/useFilterOptions'
import { useTaskFilter } from '../kanban/hooks/useTaskFilter'
import SelectTab, { type ButtonItem } from './SelectTab'
import TaskTable from './TaskTable'

export interface TasksProps {
  projectId?: string
  onTabChange?: (item: ButtonItem) => void
}

export default function Tasks({ projectId, onTabChange }: TasksProps) {
  const [selectTab, setSelectTab] = useState<ButtonItem>()
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [defaultColumnId, setDefaultColumnId] = useState<string>('')
  const { statusList, priorityList, groupList } = useFilterOptions(projectId)

  const beforeCreateTask = () => {}
  const {
    filteredTasks,
    handleFilterChange,
    handleResetFilter,
    handleUploadSuccess,
  } = useTaskFilter({
    statusList: statusList ?? [],
    beforeCreateTask,
    projectId,
  })

  const handleSelectTabChange = (item: ButtonItem) => {
    setSelectTab(item)
    onTabChange?.(item)
  }

  const handleRefresh = () => {}

  // 打开新增任务弹窗
  const handleAddTask = useCallback(
    (columnId?: string) => {
      if (!columnId) {
        columnId = statusList?.length ? statusList[0].id : ''
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
  const handleCreateTask = async (newTask: Task) => {
    let newTaskWithSort = newTask
    // 保存到数据库
    try {
      // 获取任务总数
      const taskCount = await getAllTasksCount()
      // 为新任务设置sort字段
      newTaskWithSort = { ...newTask, sort: taskCount + 1 }
      await saveTask(newTaskWithSort)
    } catch (error) {
      console.error('创建任务失败:', error)

      return // 如果保存失败，直接返回
    }
  }

  return (
    <div className="flex flex-col gap-3 p-3 size-full overflow-hidden">
      {/* <TaskStatistc></TaskStatistc> */}
      <SelectTab onChange={handleSelectTabChange} showProjectTab></SelectTab>
      {/* 任务过滤表单 */}
      <TaskFilterForm
        visible={selectTab?.key === 'kanban' || selectTab?.key === 'priority'}
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
            projectId={projectId}
          ></KanbanPage>
        </div>
      )}

      {selectTab?.key === 'config' && <ConfigPage projectId={projectId} />}

      {selectTab?.key === 'priority' && (
        <div className="flex-1 size-full flex flex-col overflow-hidden">
          <TaskTable
            filteredTasks={filteredTasks || []}
            statusList={statusList || []}
            priorityList={priorityList || []}
            groupList={groupList || []}
          ></TaskTable>
        </div>
      )}
      <TaskCreateModal
        visible={createModalVisible}
        defaultStatus={defaultColumnId}
        projectId={projectId}
        onClose={handleCreateModalClose}
        onSave={handleCreateTask}
      />
    </div>
  )
}
