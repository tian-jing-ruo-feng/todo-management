import { Button, Dropdown, message, Spin } from 'antd'
import type { MenuProps } from 'antd'
import { TeamOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons'
import db from '../utils/db'
import { useUser } from '@/hooks/useUser'

export default function UserInfo(props: { login: () => void }) {
  const { login } = props
  const { user, isLoggedIn: userLoggedIn, isLoading } = useUser()

  const handleMenuClick: MenuProps['onClick'] = async (e) => {
    if (e.key === 'logout') {
      try {
        await db.cloud.logout({ force: true })
        message.success('退出成功')
        // 清除本地数据
        await db.delete()
        location.reload()
      } catch (error) {
        console.error('退出登录失败:', error)
        message.error('退出登录失败，请重试')
      }
    }
  }

  const items: MenuProps['items'] = [
    {
      key: 'member',
      label: '成员管理',
      icon: <TeamOutlined />,
    },
    {
      key: 'profile',
      label: '个人中心',
      icon: <UserOutlined />,
    },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      danger: true,
    },
  ]

  // 加载中状态
  if (isLoading) {
    return (
      <div className="flex justify-between items-center h-full leading-none">
        <div className="font-bold text-2xl text-white">统一工作管理系统</div>
        <div className="flex items-center gap-4">
          <Spin size="small" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-between items-center h-full leading-none">
      <div className="font-bold text-2xl text-white">统一工作管理系统</div>
      <div className="flex items-center gap-4">
        {userLoggedIn ? (
          <Dropdown
            menu={{ items, onClick: handleMenuClick }}
            placement="bottomRight"
          >
            <h2 className="font-bold cursor-pointer">
              <span>欢迎，</span>
              {user?.name}
            </h2>
          </Dropdown>
        ) : (
          <Button type="primary" onClick={login}>
            登录
          </Button>
        )}
      </div>
    </div>
  )
}
