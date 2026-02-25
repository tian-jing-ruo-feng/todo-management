import { useState } from 'react'
import { Button, Card, Empty, Modal, message } from 'antd'
import { PlusOutlined, ProjectOutlined } from '@ant-design/icons'
import { useProjects, ProjectService } from '@/services/projectService'
import ProjectCard from './ProjectCard'
import CreateProjectModal from './CreateProjectModal'
import { useUser } from '@/hooks/useUser'

export interface ProjectsPageProps {
  onProjectSelect?: (projectId: string) => void
  onProjectDetail?: (projectId: string) => void
}

export default function ProjectsPage({
  onProjectSelect,
  onProjectDetail,
}: ProjectsPageProps) {
  const projects = useProjects()
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string>()
  const [loading, setLoading] = useState(false)
  const { isLoggedIn: userLoggedIn, userId } = useUser()

  const handleCreateProject = async (name: string, description?: string) => {
    setLoading(true)
    try {
      const projectId = await ProjectService.createProject(
        name,
        description,
        userId
      )
      message.success('项目创建成功')
      setCreateModalVisible(false)
      // 创建成功后自动切换到新项目
      onProjectSelect?.(projectId)
    } catch (error) {
      console.error('创建项目失败:', error)
      message.error('创建项目失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProject = async () => {
    if (!selectedProjectId) return

    setLoading(true)
    try {
      await ProjectService.deleteProject(selectedProjectId)
      message.success('项目删除成功')
      setDeleteModalVisible(false)
      setSelectedProjectId(undefined)
    } catch (error) {
      console.error('删除项目失败:', error)
      message.error(error instanceof Error ? error.message : '删除项目失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (projectId: string) => {
    setSelectedProjectId(projectId)
    setDeleteModalVisible(true)
  }

  if (!userLoggedIn) {
    return (
      <div className="flex items-center justify-center size-full">
        <Empty description="请先登录" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-6 size-full overflow-auto">
      {/* 头部 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ProjectOutlined className="text-purple-500" />
            我的项目
          </h1>
          <p className="text-gray-500 mt-1">管理您的所有项目</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateModalVisible(true)}
          size="large"
          className="bg-linear-to-r from-purple-500 to-blue-500 border-none"
        >
          创建项目
        </Button>
      </div>

      {/* 项目列表 */}
      {!projects || projects.length === 0 ? (
        <Card className="flex-1">
          <Empty
            description="暂无项目"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            className="py-20"
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
            >
              创建第一个项目
            </Button>
          </Empty>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={() => handleDeleteClick(project.id)}
              onEnterTasks={() => onProjectSelect?.(project.id)}
              onEnterDetail={() => onProjectDetail?.(project.id)}
            />
          ))}
        </div>
      )}

      {/* 创建项目弹窗 */}
      <CreateProjectModal
        visible={createModalVisible}
        loading={loading}
        onClose={() => setCreateModalVisible(false)}
        onCreate={handleCreateProject}
      />

      {/* 删除确认弹窗 */}
      <Modal
        title="删除项目"
        open={deleteModalVisible}
        onOk={handleDeleteProject}
        onCancel={() => {
          setDeleteModalVisible(false)
          setSelectedProjectId(undefined)
        }}
        confirmLoading={loading}
        okText="确认删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <p className="text-gray-600">
          确定要删除这个项目吗？删除后将同时删除项目下的所有任务、配置和成员数据，此操作不可恢复。
        </p>
        <p className="text-orange-500 text-sm mt-2">
          注意：删除操作需要同步到云端，请稍候片刻。
        </p>
      </Modal>
    </div>
  )
}
