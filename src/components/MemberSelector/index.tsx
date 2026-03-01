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
  // 获取所有用户配置（从 users 表获取别名）
  const userProfiles = useLiveQuery(async () => {
    const profiles = await db.users.toArray()
    return new Map(profiles.map((p) => [p.userId, p.name]))
  }, [])

  // 获取项目成员列表
  const members = useLiveQuery(async () => {
    if (!projectId) return []

    const project = await db.projects.get(projectId)
    if (!project) return []

    // 获取项目成员（只包含已接受且未拒绝的成员）
    const projectMembers = await db.members
      .where('realmId')
      .equals(project.realmId)
      .filter((m) => Boolean(m.accepted) && !m.rejected) // 排除未接受和已拒绝的成员
      .toArray()

    // 查找所有者在成员表中的记录
    const ownerMember = projectMembers.find(
      (m) => m.userId === project.owner || m.email === project.owner
    )

    // 获取显示名称（优先使用 users 表中的别名）
    const getDisplayName = (
      userId: string | undefined,
      fallbackName?: string
    ) => {
      if (userId && userProfiles?.has(userId)) {
        return userProfiles.get(userId)
      }
      return fallbackName
    }

    // 合并成员和所有者
    const allMembers = [
      {
        id: project.owner || '',
        name: getDisplayName(project.owner, ownerMember?.name) || '项目所有者',
        email: ownerMember?.email || project.owner,
        isOwner: true,
        hasUserId: true,
      },
      ...projectMembers
        .filter((m) => m.userId !== project.owner && m.email !== project.owner)
        .map((m) => ({
          // 优先使用 userId，其次 email
          id: m.userId || m.email || '',
          name:
            getDisplayName(m.userId, m.name) ||
            m.email ||
            m.userId ||
            '未命名成员',
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
  }, [projectId, userProfiles])

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
      optionRender={(option) => {
        const member = members.find((m) => m.id === option.value)
        return (
          <div className="flex items-center gap-2">
            <Avatar
              size="small"
              icon={<UserOutlined />}
              style={{
                backgroundColor: member?.isOwner ? '#6253e1' : '#04befe',
              }}
            >
              {member?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <span>{member?.name}</span>
            {member?.isOwner && (
              <span className="text-xs text-purple-500">(所有者)</span>
            )}
          </div>
        )
      }}
      options={members.map((member) => ({
        value: member.id,
        label: member.name,
      }))}
    />
  )
}
