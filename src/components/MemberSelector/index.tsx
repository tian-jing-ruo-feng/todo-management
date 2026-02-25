import { Select, Avatar, Spin } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { useLiveQuery } from 'dexie-react-hooks'
import db from '@/utils/db'

export interface MemberSelectorProps {
  projectId?: string
  value?: string
  onChange?: (value: string | undefined) => void
  placeholder?: string
  allowClear?: boolean
  disabled?: boolean
}

export default function MemberSelector({
  projectId,
  value,
  onChange,
  placeholder = '选择负责人',
  allowClear = true,
  disabled = false,
}: MemberSelectorProps) {
  // 获取项目成员列表
  const members = useLiveQuery(async () => {
    if (!projectId) return []

    const project = await db.projects.get(projectId)
    if (!project) return []

    // 获取项目成员
    const projectMembers = await db.members
      .where('realmId')
      .equals(project.realmId)
      .toArray()

    // 获取项目所有者
    const owner = await db.projects.get(projectId)

    // 合并成员和所有者
    const allMembers = [
      {
        id: owner?.owner || '',
        name: '项目所有者',
        email: owner?.owner,
        isOwner: true,
        hasUserId: true,
      },
      ...projectMembers.map((m) => ({
        // 优先使用 userId，其次 email
        id: m.userId || m.email || '',
        name: m.name || m.email || m.userId || '未命名成员',
        email: m.email,
        isOwner: false,
        hasUserId: !!m.userId,
      })),
    ]

    // 去重
    const uniqueMembers = Array.from(
      new Map(allMembers.map((m) => [m.id, m])).values()
    )

    return uniqueMembers
  }, [projectId])

  if (!projectId) {
    return (
      <Select placeholder="请先选择项目" disabled style={{ width: '100%' }} />
    )
  }

  if (!members) {
    return (
      <Select
        placeholder="加载中..."
        disabled
        style={{ width: '100%' }}
        suffixIcon={<Spin size="small" />}
      />
    )
  }

  return (
    <Select
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      allowClear={allowClear}
      disabled={disabled}
      style={{ width: '100%' }}
      showSearch
      filterOption={(input, option) =>
        (option?.label?.toString() ?? '')
          .toLowerCase()
          .includes(input.toLowerCase())
      }
      options={members.map((member) => ({
        value: member.id,
        label: (
          <div className="flex items-center gap-2">
            <Avatar
              size="small"
              icon={<UserOutlined />}
              style={{
                backgroundColor: member.isOwner ? '#6253e1' : '#04befe',
              }}
            >
              {member.name?.charAt(0).toUpperCase()}
            </Avatar>
            <span>{member.name}</span>
            {member.isOwner && (
              <span className="text-xs text-purple-500">(所有者)</span>
            )}
          </div>
        ),
      }))}
    />
  )
}
