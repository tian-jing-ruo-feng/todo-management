import { Button, Dropdown, Grid, message, Spin } from 'antd'
import type { MenuProps } from 'antd'
import {
  UserOutlined,
  LogoutOutlined,
  PictureOutlined,
} from '@ant-design/icons'
import db, { DB_NAME } from '../utils/db'
import { useUser } from '@/hooks/useUser'
import { useWallpaper } from '@/contexts/useWallpaper'
import { useState } from 'react'
import ProfileModal from '@/components/ProfileModal'
import WallpaperModal from '@/components/WallpaperModal'
import { useLiveQuery } from 'dexie-react-hooks'

export default function UserInfo(props: { onLogin: () => void }) {
  const { onLogin } = props
  const { user, isLoggedIn: userLoggedIn, isLoading } = useUser()
  const {
    settings: wallpaperSettings,
    updateSettings: updateWallpaperSettings,
    resetSettings: resetWallpaperSettings,
  } = useWallpaper()
  const [profileModalVisible, setProfileModalVisible] = useState(false)
  const [wallpaperModalVisible, setWallpaperModalVisible] = useState(false)

  // 从 users 表获取用户别名（优先显示，会同步到云端）
  const userDisplayName = useLiveQuery(async () => {
    // 确保用户已登录再查询
    if (!userLoggedIn) return null

    const currentUserId = db.cloud.currentUserId

    // 过滤无效的用户 ID（如 'unauthorized'）
    if (!currentUserId || currentUserId === 'unauthorized') return null

    // 从 users 表获取全局用户配置
    const user = await db.users
      .where('userId')
      .equals(currentUserId)
      .first()

    return user?.name || null
  }, [userLoggedIn])

  // 优先显示 users 表中的别名，其次显示 currentUser.name
  const displayName = userDisplayName || user?.name

  // 响应式检测
  const screens = Grid.useBreakpoint()
  const isSmallScreen = !screens.md // <768px

  const handleMenuClick: MenuProps['onClick'] = async (e) => {
    if (e.key === 'logout') {
      try {
        // 先退出登录（清理云端会话）
        await db.cloud.logout({ force: true })

        message.success('退出成功')
        location.reload()
      } catch (error) {
        console.error('退出登录失败:', error)
        message.error('退出登录失败，请重试')
      }
    } else if (e.key === 'profile') {
      setProfileModalVisible(true)
    } else if (e.key === 'wallpaper') {
      setWallpaperModalVisible(true)
    }
  }

  const items: MenuProps['items'] = [
    {
      key: 'profile',
      label: '个人中心',
      icon: <UserOutlined />,
    },
    {
      key: 'wallpaper',
      label: '壁纸设置',
      icon: <PictureOutlined />,
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
        <div className="flex items-center gap-4">
          <Spin size="small" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-between items-center h-full leading-none">
      <div className="flex items-center gap-4">
        {userLoggedIn ? (
          <Dropdown
            menu={{ items, onClick: handleMenuClick }}
            placement="bottomRight"
          >
            <h2 className="font-bold cursor-pointer whitespace-nowrap flex items-center gap-1">
              {!isSmallScreen && <span>欢迎，</span>}
              <span
                className="overflow-hidden text-ellipsis inline-block"
                style={{ maxWidth: isSmallScreen ? '70px' : '120px' }}
                title={displayName}
              >
                {displayName}
              </span>
            </h2>
          </Dropdown>
        ) : (
          <Button type="primary" onClick={onLogin}>
            登录
          </Button>
        )}
      </div>

      <ProfileModal
        visible={profileModalVisible}
        onClose={() => setProfileModalVisible(false)}
      />

      <WallpaperModal
        visible={wallpaperModalVisible}
        onClose={() => setWallpaperModalVisible(false)}
        settings={wallpaperSettings}
        onUpdateSettings={updateWallpaperSettings}
        onResetSettings={resetWallpaperSettings}
      />
    </div>
  )
}
