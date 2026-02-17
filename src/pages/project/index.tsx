import { useState } from 'react'
import { Tabs, Card, Button, Spin } from 'antd'
import {
  ProjectOutlined,
  SettingOutlined,
  TeamOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons'
import { useProject } from '@/services/projectService'
import ConfigPage from '../config'
import MemberManagement from './MemberManagement'

export interface ProjectDetailProps {
  projectId: string
  onBack: () => void
}

export default function ProjectDetail({
  projectId,
  onBack,
}: ProjectDetailProps) {
  const project = useProject(projectId)
  const [activeTab, setActiveTab] = useState('config')

  if (!project) {
    return (
      <div className="flex items-center justify-center size-full">
        <Spin size="large" />
      </div>
    )
  }

  const tabItems = [
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

      {/* 标签页内容 */}
      <Card className="flex-1 overflow-hidden">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          className="h-full"
        />
      </Card>
    </div>
  )
}
