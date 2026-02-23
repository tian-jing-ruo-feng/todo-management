import { useState } from 'react'
import {
  Table,
  Button,
  Tag,
  Avatar,
  Empty,
  Modal,
  message,
  Dropdown,
} from 'antd'
import type { MenuProps } from 'antd'
import { UserOutlined, TeamOutlined, MailOutlined } from '@ant-design/icons'
import { useProjectMembers, MemberService } from '@/services/memberService'
import { useProjectPermission, useProject } from '@/services/projectService'
import InviteModal from './InviteModal'
import type { DBRealmMember } from 'dexie-cloud-addon'
import db from '@/utils/db'
import { useObservable } from 'dexie-react-hooks'

export interface MemberManagementProps {
  projectId: string
}

export default function MemberManagement({ projectId }: MemberManagementProps) {
  const members = useProjectMembers(projectId)
  const permission = useProjectPermission(projectId)
  const [inviteModalVisible, setInviteModalVisible] = useState(false)
  const user = useObservable(db.cloud.currentUser)

  // 获取项目信息
  const project = useProject(projectId)

  const handleRemoveMember = async (memberId: string) => {
    Modal.confirm({
      title: '移除成员',
      content: '确定要移除该成员吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await MemberService.removeMember(memberId)
          message.success('成员已移除')
        } catch (error) {
          console.error('移除成员失败:', error)
          message.error('移除成员失败')
        }
      },
    })
  }

  const handleRoleChange = async (memberId: string, role: string) => {
    try {
      await MemberService.updateMemberRole(memberId, role)
      message.success('角色已更新')
    } catch (error) {
      console.error('更新角色失败:', error)
      message.error('更新角色失败')
    }
  }

  const getRoleMenu = (member: DBRealmMember): MenuProps['items'] => [
    {
      key: 'admin',
      label: '管理员',
      onClick: () => handleRoleChange(member.id!, 'admin'),
    },
    {
      key: 'member',
      label: '成员',
      onClick: () => handleRoleChange(member.id!, 'member'),
    },
    {
      key: 'guest',
      label: '访客',
      onClick: () => handleRoleChange(member.id!, 'guest'),
    },
  ]

  const getRoleTag = (role: string) => {
    const roleConfig: Record<string, { color: string; text: string }> = {
      admin: { color: 'purple', text: '管理员' },
      member: { color: 'blue', text: '成员' },
      guest: { color: 'default', text: '访客' },
    }
    const config = roleConfig[role] || roleConfig.guest
    return <Tag color={config.color}>{config.text}</Tag>
  }

  const columns = [
    {
      title: '成员',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: DBRealmMember) => (
        <div className="flex items-center gap-3">
          <Avatar
            size={40}
            icon={<UserOutlined />}
            style={{
              backgroundColor:
                record.userId === project?.owner ? '#6253e1' : '#04befe',
            }}
          >
            {name?.charAt(0).toUpperCase() ||
              record.email?.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <div className="font-medium">
              {name || record.email}
              {record.userId === project?.owner && (
                <Tag color="purple" className="ml-2">
                  所有者
                </Tag>
              )}
            </div>
            <div className="text-gray-500 text-sm">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: '角色',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles: string[], record: DBRealmMember) => {
        if (record.userId === project?.owner) {
          return getRoleTag('admin')
        }

        if (!permission?.canManageMembers) {
          return getRoleTag(roles?.[0] || 'guest')
        }

        return (
          <Dropdown menu={{ items: getRoleMenu(record) }} trigger={['click']}>
            <Button type="text" className="p-0">
              {getRoleTag(roles?.[0] || 'guest')}
            </Button>
          </Dropdown>
        )
      },
    },
    {
      title: '状态',
      dataIndex: 'invite',
      key: 'invite',
      render: (invite: DBRealmMember['invite'], record: DBRealmMember) => {
        // 如果有 accepted 字段或 userId 存在且没有 invite 标记，表示已加入
        if (record.accepted || (record.userId && !invite)) {
          return <Tag color="green">已加入</Tag>
        }
        // 如果有 invite 标记但没有 accepted，表示待接受
        if (invite) {
          return <Tag color="orange">待接受</Tag>
        }
        return <Tag color="green">已加入</Tag>
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: DBRealmMember) => {
        if (record.userId === project?.owner) {
          return null
        }

        if (!permission?.canManageMembers) {
          return null
        }

        return (
          <Button
            type="link"
            danger
            onClick={() => handleRemoveMember(record.id!)}
          >
            移除
          </Button>
        )
      },
    },
  ]

  if (!members || members.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        {permission?.canManageMembers && (
          <div className="flex justify-end">
            <Button
              type="primary"
              icon={<UserOutlined />}
              onClick={() => setInviteModalVisible(true)}
            >
              邀请成员
            </Button>
          </div>
        )}
        <Empty description="暂无成员" />
        <InviteModal
          visible={inviteModalVisible}
          projectId={projectId}
          onClose={() => setInviteModalVisible(false)}
        />
      </div>
    )
  }

  // 过滤掉项目所有者，避免重复显示
  const filteredMembers = members?.filter(
    (member) => member.userId !== project?.owner
  )

  return (
    <div className="flex flex-col gap-4">
      {permission?.canManageMembers && (
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-gray-600">
            <TeamOutlined />
            <span>共 {(filteredMembers?.length || 0) + 1} 人</span>
          </div>
          <Button
            type="primary"
            icon={<MailOutlined />}
            onClick={() => setInviteModalVisible(true)}
            className="bg-linear-to-r from-purple-500 to-blue-500"
          >
            邀请成员
          </Button>
        </div>
      )}

      <Table
        dataSource={[
          {
            id: project?.owner || 'owner',
            userId: project?.owner,
            name: user?.name || '项目所有者',
            email: user?.email || '',
            roles: ['admin'],
            invite: undefined,
            realmId: project?.realmId || '',
            owner: project?.owner || '',
          },
          ...(filteredMembers || []),
        ]}
        columns={columns}
        rowKey="id"
        pagination={false}
      />

      <InviteModal
        visible={inviteModalVisible}
        projectId={projectId}
        onClose={() => setInviteModalVisible(false)}
      />
    </div>
  )
}
