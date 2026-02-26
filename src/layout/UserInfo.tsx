import { Button, Dropdown, message, Spin } from 'antd'
import type { MenuProps } from 'antd'
import { UserOutlined, LogoutOutlined, PictureOutlined } from '@ant-design/icons'
import db from '../utils/db'
import { useUser } from '@/hooks/useUser'
import { useWallpaper } from '@/contexts/useWallpaper'
import { useState } from 'react'
import ProfileModal from '@/components/ProfileModal'
import WallpaperModal from '@/components/WallpaperModal'
import { useLiveQuery } from 'dexie-react-hooks'

export default function UserInfo(props: { onLogin: () => void }) {
  const { onLogin } = props
  const { user, isLoggedIn: userLoggedIn, isLoading } = useUser()
  const { settings: wallpaperSettings, updateSettings: updateWallpaperSettings, resetSettings: resetWallpaperSettings } = useWallpaper()
  const [profileModalVisible, setProfileModalVisible] = useState(false)
  const [wallpaperModalVisible, setWallpaperModalVisible] = useState(false)

  // 从成员记录中获取用户别名（优先显示）
  const memberName = useLiveQuery(async () => {
    const currentUserId = db.cloud.currentUserId
    if (!currentUserId) return null
    // 获取所有成员，然后过滤匹配当前用户
    const allMembers = await db.members.toArray()
    const member = allMembers.find(
      (m) => m.userId === currentUserId || m.email === currentUserId
    )
    return member?.name || null
  }, [])

  // 优先显示成员记录中的别名，其次显示 currentUser.name
  const displayName = memberName || user?.name

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
            <h2 className="font-bold cursor-pointer">
              <span>欢迎，</span>
              {displayName}
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
