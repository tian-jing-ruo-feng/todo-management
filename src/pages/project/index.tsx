import { useCallback, useState } from 'react'
import { Tabs, Card, Button, Spin, message } from 'antd'
import {
  ProjectOutlined,
  SettingOutlined,
  TeamOutlined,
  ArrowLeftOutlined,
  TableOutlined,
  OrderedListOutlined,
  EditOutlined,
} from '@ant-design/icons'
import { useProject, useProjectPermission } from '@/services/projectService'
import { ProjectService } from '@/services/projectService'
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
import EditProjectModal from '../projects/EditProjectModal'
import './index.css'

export interface ProjectDetailProps {
  projectId: string
  onBack: () => void
}

export default function ProjectDetail({
  projectId,
  onBack,
}: ProjectDetailProps) {
  const project = useProject(projectId)
  const projectPermission = useProjectPermission(projectId)
  const [activeTab, setActiveTab] = useState('kanban')
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [defaultColumnId, setDefaultColumnId] = useState<string>('')

  const { statusList, priorityList, groupList } = useFilterOptions(projectId)

  // 只有项目所有者可以编辑
  const canEditProject = projectPermission?.isOwner ?? false

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

  const handleEditProject = async (name: string, description?: string) => {
    if (!project) return

    setEditLoading(true)
    try {
      await ProjectService.updateProject(projectId, { name, description })
      message.success('项目更新成功')
      setEditModalVisible(false)
    } catch (error) {
      console.error('更新项目失败:', error)
      message.error('更新项目失败')
    } finally {
      setEditLoading(false)
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
        <div className="p-2 flex-1 size-full overflow-auto flex flex-col gap-3">
          {showFilterForm && (
            <TaskFilterForm
              visible={showFilterForm}
              projectId={projectId}
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
        <div className="flex-1 size-full flex flex-col overflow-hidden gap-3 p-2">
          {showFilterForm && (
            <TaskFilterForm
              visible={showFilterForm}
              projectId={projectId}
              onFilterChange={handleFilterChange}
              onReset={handleResetFilter}
              onUploadSuccess={handleUploadSuccess}
              onAddTask={handleAddTask}
            />
          )}
          <TaskTable
            projectId={projectId}
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
          {canEditProject && (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => setEditModalVisible(true)}
            >
              编辑项目
            </Button>
          )}
        </div>
      </Card>

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
          className="size-full flex flex-col"
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

      {/* 编辑项目弹窗 */}
      <EditProjectModal
        visible={editModalVisible}
        project={project}
        loading={editLoading}
        onClose={() => setEditModalVisible(false)}
        onUpdate={handleEditProject}
      />
    </div>
  )
}
