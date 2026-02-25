import { Card, Button, Popconfirm, Tag } from 'antd'
import {
  ProjectOutlined,
  TeamOutlined,
  FileTextOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import type { Project } from '@/types/Project'
import db from '@/utils/db'
import { useLiveQuery } from 'dexie-react-hooks'
import { useUser } from '@/hooks/useUser'

export interface ProjectCardProps {
  project: Project
  onDelete?: () => void
  onEnterTasks?: () => void
  onEnterDetail?: () => void
}

export default function ProjectCard({
  project,
  onDelete,
  onEnterTasks,
  onEnterDetail,
}: ProjectCardProps) {
  const { userId } = useUser()

  // 获取项目成员数量
  const memberCount = useLiveQuery(async () => {
    const members = await db.members
      .where('realmId')
      .equals(project.realmId)
      .toArray()

    // 检查 owner 是否已在成员列表中
    const ownerInMembers = members.some(
      (m) => m.userId === project.owner || m.email === project.owner
    )

    // 如果 owner 不在成员列表中，需要额外计数
    return ownerInMembers ? members.length : members.length + 1
  }, [project.realmId, project.owner])

  // 获取项目任务数量
  const taskCount = useLiveQuery(async () => {
    return db.tasks.where('projectId').equals(project.id).count()
  }, [project.id])

  const isOwner = project.owner === userId

  const handleCardClick = () => {
    onEnterTasks?.()
  }

  const handleDetailClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEnterDetail?.()
  }

  return (
    <Card
      hoverable
      className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
      onClick={handleCardClick}
      styles={{ body: { padding: '20px' } }}
    >
      <div className="space-y-3">
        {/* 项目名称和标识 */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="shrink-0 w-10 h-10 rounded-lg bg-linear-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <ProjectOutlined className="text-white text-lg" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-800 text-base truncate">
                {project.name}
              </h3>
              {isOwner && (
                <Tag color="purple" className="mt-1">
                  所有者
                </Tag>
              )}
            </div>
          </div>
        </div>

        {/* 项目描述 */}
        {project.description && (
          <p className="text-gray-600 text-sm line-clamp-2">
            {project.description}
          </p>
        )}

        {/* 项目统计 */}
        <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-gray-500 text-sm">
            <TeamOutlined className="text-blue-500" />
            <span>{memberCount || 0} 成员</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-500 text-sm">
            <FileTextOutlined className="text-green-500" />
            <span>{taskCount || 0} 任务</span>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="link" size="small" onClick={handleDetailClick}>
            项目详情
          </Button>
          {isOwner && (
            <Popconfirm
              title="删除项目"
              description="确定要删除这个项目吗？"
              onConfirm={(e) => {
                e?.stopPropagation()
                onDelete?.()
              }}
              onCancel={(e) => e?.stopPropagation()}
              okText="确认"
              cancelText="取消"
              okButtonProps={{ danger: true }}
            >
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={(e) => e.stopPropagation()}
              >
                删除
              </Button>
            </Popconfirm>
          )}
        </div>
      </div>
    </Card>
  )
}
