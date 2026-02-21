import { useState } from 'react'
import {
  Badge,
  Dropdown,
  List,
  Button,
  Avatar,
  Empty,
  Spin,
  Modal,
  message,
} from 'antd'
import {
  BellOutlined,
  CheckOutlined,
  CloseOutlined,
  ProjectOutlined,
} from '@ant-design/icons'
import { useUserInvites, MemberService } from '@/services/memberService'
import { useLiveQuery } from 'dexie-react-hooks'
import { useUser } from '@/hooks/useUser'

export default function InviteNotification() {
  const invites = useUserInvites()
  const { userId, isLoggedIn: userLoggedIn } = useUser()
  const [loading, setLoading] = useState<string>()

  // 获取邀请详情（包含项目信息）
  const inviteDetails = useLiveQuery(async () => {
    if (!invites || invites.length === 0) return []

    const details = await Promise.all(
      invites.map(async (invite) => {
        const detail = await MemberService.getInviteDetails(invite.id!)
        return {
          invite,
          project: detail?.project,
        }
      })
    )

    return details.filter((d) => d.project)
  }, [invites])

  const handleAccept = async (inviteId: string) => {
    if (!userId) return

    setLoading(inviteId)
    try {
      await MemberService.acceptInvite(inviteId, userId)
      message.success('已接受邀请')
    } catch (error) {
      console.error('接受邀请失败:', error)
      message.error('接受邀请失败')
    } finally {
      setLoading(undefined)
    }
  }

  const handleReject = async (inviteId: string) => {
    Modal.confirm({
      title: '拒绝邀请',
      content: '确定要拒绝这个邀请吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        setLoading(inviteId)
        try {
          await MemberService.rejectInvite(inviteId)
          message.success('已拒绝邀请')
        } catch (error) {
          console.error('拒绝邀请失败:', error)
          message.error('拒绝邀请失败')
        } finally {
          setLoading(undefined)
        }
      },
    })
  }

  if (!userLoggedIn) {
    return null
  }

  const dropdownContent = (
    <div className="w-80 max-h-96 overflow-auto bg-white rounded-lg shadow-lg">
      <div className="p-3 border-b border-gray-200">
        <h3 className="font-bold text-lg">项目邀请</h3>
      </div>

      {!inviteDetails ? (
        <div className="flex justify-center items-center p-8">
          <Spin />
        </div>
      ) : inviteDetails.length === 0 ? (
        <Empty description="暂无邀请" className="py-8" />
      ) : (
        <List
          dataSource={inviteDetails}
          renderItem={({ invite, project }) => (
            <List.Item className="px-4 py-3 hover:bg-gray-50">
              <div className="w-full">
                <div className="flex items-start gap-3 mb-2">
                  <Avatar
                    size={40}
                    icon={<ProjectOutlined />}
                    style={{ backgroundColor: '#6253e1' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-base">{project?.name}</div>
                    <div className="text-sm text-gray-500">
                      角色：
                      {invite.roles?.[0] === 'admin'
                        ? '管理员'
                        : invite.roles?.[0] === 'member'
                          ? '成员'
                          : '访客'}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="primary"
                    size="small"
                    icon={<CheckOutlined />}
                    loading={loading === invite.id}
                    onClick={() => handleAccept(invite.id!)}
                  >
                    接受
                  </Button>
                  <Button
                    size="small"
                    icon={<CloseOutlined />}
                    loading={loading === invite.id}
                    onClick={() => handleReject(invite.id!)}
                  >
                    拒绝
                  </Button>
                </div>
              </div>
            </List.Item>
          )}
        />
      )}
    </div>
  )

  return (
    <Dropdown
      dropdownRender={() => dropdownContent}
      trigger={['click']}
      placement="bottomRight"
    >
      <Badge count={inviteDetails?.length || 0} size="small" offset={[-2, 2]}>
        <Button
          type="text"
          icon={<BellOutlined className="text-white text-xl" />}
          className="hover:bg-white/10"
        />
      </Badge>
    </Dropdown>
  )
}
