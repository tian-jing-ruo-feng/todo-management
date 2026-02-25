import { Dropdown, Button, Spin } from 'antd'
import type { MenuProps } from 'antd'
import { ProjectOutlined, DownOutlined, PlusOutlined } from '@ant-design/icons'
import { useProjects, ProjectService } from '@/services/projectService'
import { useState, useEffect } from 'react'
import { message } from 'antd'
import { useUser } from '@/hooks/useUser'

export interface ProjectSelectorProps {
  currentProjectId?: string
  onProjectChange?: (projectId: string) => void
}

export default function ProjectSelector({
  currentProjectId,
  onProjectChange,
}: ProjectSelectorProps) {
  const projects = useProjects()
  const [loading, setLoading] = useState(false)
  const { isLoggedIn: userLoggedIn, userId } = useUser()

  // 自动选择第一个项目
  useEffect(() => {
    if (projects && projects.length > 0 && !currentProjectId) {
      onProjectChange?.(projects[0].id)
    }
  }, [projects, currentProjectId, onProjectChange])

  const currentProject = projects?.find((p) => p.id === currentProjectId)

  const handleProjectSelect = (projectId: string) => {
    onProjectChange?.(projectId)
  }

  const handleCreateDefaultProject = async () => {
    setLoading(true)
    try {
      const projectId = await ProjectService.createProject(
        '我的第一个项目',
        '默认项目',
        userId
      )
      onProjectChange?.(projectId)
      message.success('项目创建成功')
    } catch (error) {
      console.error('创建项目失败:', error)
      message.error('创建项目失败')
    } finally {
      setLoading(false)
    }
  }

  const menuItems: MenuProps['items'] = [
    ...(projects?.map((project) => ({
      key: project.id,
      label: (
        <div className="flex items-center gap-2">
          <ProjectOutlined />
          <span>{project.name}</span>
        </div>
      ),
    })) || []),
  ]

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    handleProjectSelect(e.key)
  }

  if (!userLoggedIn) {
    return null
  }

  // 加载中状态
  if (projects === undefined) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
        <Spin size="small" />
        <span className="text-white">加载项目...</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
        <Spin size="small" />
        <span className="text-white">创建中...</span>
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={handleCreateDefaultProject}
        loading={loading}
        className="bg-white/20 border-white/30 hover:bg-white/30"
      >
        创建第一个项目
      </Button>
    )
  }

  return (
    <Dropdown
      menu={{ items: menuItems, onClick: handleMenuClick }}
      placement="bottomLeft"
      trigger={['click']}
    >
      <Button
        className="flex items-center gap-2 px-4 py-2 bg-white/10 border-white/30 hover:bg-white/20 text-white"
        style={{ borderRadius: '8px' }}
      >
        <ProjectOutlined />
        <span className="font-medium">
          {currentProject?.name || '选择项目'}
        </span>
        <DownOutlined className="text-xs" />
      </Button>
    </Dropdown>
  )
}
