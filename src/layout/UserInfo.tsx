import { Button, Dropdown, message } from 'antd'
import type { MenuProps } from 'antd'
import { TeamOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons'
import { useObservable } from 'dexie-react-hooks'
import db from '../utils/db'

export default function UserInfo(props: { login: () => void }) {
  const { login } = props
  const user = useObservable(db.cloud.currentUser)

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    if (e.key === 'logout') {
      db.cloud.logout({ force: true }).then(() => {
        message.success('退出成功')
        location.reload()
      })
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

  return (
    <div className="flex justify-between items-center h-full leading-none">
      <div className="font-bold text-2xl text-white">统一工作管理系统</div>
      <div className="flex items-center gap-4">
        {user?.isLoggedIn ? (
          <Dropdown
            menu={{ items, onClick: handleMenuClick }}
            placement="bottomRight"
          >
            <h2 className="font-bold cursor-pointer">
              <span>欢迎，</span>
              {user.name}
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
