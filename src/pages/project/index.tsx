import { useCallback, useState } from 'react'
import { Tabs, Card, Button, Spin } from 'antd'
import {
  ProjectOutlined,
  SettingOutlined,
  TeamOutlined,
  ArrowLeftOutlined,
  TableOutlined,
  OrderedListOutlined,
} from '@ant-design/icons'
import { useProject } from '@/services/projectService'
import ConfigPage from '../config'
import MemberManagement from './MemberManagement'
import TaskFilterForm from '@/components/TaskFilterForm'
import TaskCreateModal from '@/components/TaskCreateModal'
import KanbanPage from '../kanban'
import TaskTable from '../tasks/TaskTable'
import { useFilterOptions } from '../kanban/hooks/useFilterOptions'
import { useTaskFilter } from '../kanban/hooks/useTaskFilter'
import { getAllTasksCount, saveTask } from '@/utils/db'
import type { Task } from '@/types/Task'

export interface ProjectDetailProps {
  projectId: string
  onBack: () => void
}

export default function ProjectDetail({
  projectId,
  onBack,
}: ProjectDetailProps) {
  const project = useProject(projectId)
  const [activeTab, setActiveTab] = useState('kanban')
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

  const handleRefresh = () => {}

  const handleAddTask = useCallback(
    (columnId?: string) => {
      if (!columnId) {
        columnId = statusList?.length ? statusList[0].id : ''
      }
      setDefaultColumnId(columnId)
      setCreateModalVisible(true)
    },
    [statusList]
  )

  const handleCreateModalClose = useCallback(() => {
    setCreateModalVisible(false)
    setDefaultColumnId('')
  }, [])

  const handleCreateTask = async (newTask: Task) => {
    let newTaskWithSort = newTask
    try {
      const taskCount = await getAllTasksCount()
      newTaskWithSort = { ...newTask, sort: taskCount + 1 }
      await saveTask(newTaskWithSort)
    } catch (error) {
      console.error('创建任务失败:', error)
      return
    }
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center size-full">
        <Spin size="large" />
      </div>
    )
  }

  const showFilterForm = activeTab === 'kanban' || activeTab === 'priority'

  const tabItems = [
    {
      key: 'kanban',
      label: (
        <span className="flex items-center gap-2">
          <TableOutlined />
          看板视图
        </span>
      ),
      children: (
        <div className="flex-1 size-full overflow-auto">
          {showFilterForm && (
            <TaskFilterForm
              visible={showFilterForm}
              onFilterChange={handleFilterChange}
              onReset={handleResetFilter}
              onUploadSuccess={handleUploadSuccess}
              onAddTask={handleAddTask}
            />
          )}
          <KanbanPage
            tasks={filteredTasks}
            onRefresh={handleRefresh}
            projectId={projectId}
          />
        </div>
      ),
    },
    {
      key: 'priority',
      label: (
        <span className="flex items-center gap-2">
          <OrderedListOutlined />
          优先级视图
        </span>
      ),
      children: (
        <div className="flex-1 size-full flex flex-col overflow-hidden">
          {showFilterForm && (
            <TaskFilterForm
              visible={showFilterForm}
              onFilterChange={handleFilterChange}
              onReset={handleResetFilter}
              onUploadSuccess={handleUploadSuccess}
              onAddTask={handleAddTask}
            />
          )}
          <TaskTable
            filteredTasks={filteredTasks || []}
            statusList={statusList || []}
            priorityList={priorityList || []}
            groupList={groupList || []}
          />
        </div>
      ),
    },
    {
      key: 'config',
      label: (
        <span className="flex items-center gap-2">
          <SettingOutlined />
          配置管理
        </span>
      ),
      children: <ConfigPage projectId={projectId} />,
    },
    {
      key: 'members',
      label: (
        <span className="flex items-center gap-2">
          <TeamOutlined />
          成员管理
        </span>
      ),
      children: <MemberManagement projectId={projectId} />,
    },
  ]

  return (
    <div className="flex flex-col size-full overflow-hidden">
      {/* 头部信息 */}
      <Card className="mb-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack}>
                返回项目列表
              </Button>
            </div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-linear-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <ProjectOutlined className="text-white text-lg" />
              </div>
              {project.name}
            </h1>
            {project.description && (
              <p className="text-gray-600 mt-2">{project.description}</p>
            )}
          </div>
        </div>
      </Card>

      {/* 任务过滤表单 */}
      {/* {showFilterForm && (
        <TaskFilterForm
          visible={showFilterForm}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilter}
          onUploadSuccess={handleUploadSuccess}
          onAddTask={handleAddTask}
        />
      )} */}

      {/* 标签页内容 */}
      <Card
        className="flex-1 overflow-hidden"
        classNames={{
          body: 'size-full flex flex-col gap-3',
        }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          className="h-full flex flex-col"
          classNames={{
            content: 'size-full flex-1',
          }}
        />
      </Card>

      {/* 创建任务弹窗 */}
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
