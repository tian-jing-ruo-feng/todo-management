import { Grid, Layout, message } from 'antd'
import { useEffect, useState } from 'react'
import { initConfigData } from '@/utils/initConfigData'
import { useUser } from '@/hooks/useUser'
import { useWallpaper } from '@/contexts/useWallpaper'
import Tasks from '../pages/tasks'
import ProjectsPage from '../pages/projects'
import ProjectDetail from '../pages/project'
import { MyLoginGUI } from './Login'
import UserInfo from './UserInfo'
import ProjectSelector from '@/components/ProjectSelector'
import InviteNotification from '@/components/InviteNotification'
import type { ButtonItem } from '@/pages/tasks/SelectTab'

const {
  Header,
  // Footer,
  Content,
} = Layout

type ViewType = 'tasks' | 'projects' | 'project-detail'

export default function PageLayout() {
  const [initComplete, setInitComplete] = useState(false)
  const [currentProjectId, setCurrentProjectId] = useState<string>()
  const [currentView, setCurrentView] = useState<ViewType>('tasks')
  const [manualLogin, setManualLogin] = useState(false)
  const { isLoggedIn: userLoggedIn, isLoading, isRestoring } = useUser()
  const { settings: wallpaperSettings } = useWallpaper()

  // 响应式检测
  const screens = Grid.useBreakpoint()
  const isSmallScreen = !screens.md // <768px

  // 派生状态：判断是否应该显示登录框
  // 条件1：用户手动点击登录按钮
  // 条件2：未登录且不在加载/恢复状态（自动触发）
  const shouldShowLogin =
    manualLogin || (!isLoading && !isRestoring && !userLoggedIn)

  const handleLogin = () => {
    setManualLogin(true)
  }

  const handleClose = () => {
    setManualLogin(false)
  }

  // 用户登录后初始化配置数据
  useEffect(() => {
    if (userLoggedIn && !initComplete) {
      initConfigData()
        .then(() => setInitComplete(true))
        .catch((error) => {
          console.error('数据初始化失败:', error)
          message.error('数据初始化失败，请刷新页面重试')
        })
    }
  }, [userLoggedIn, initComplete])

  const handleTabChange = (item: ButtonItem) => {
    if (item.key === 'projects') {
      setCurrentView('projects')
    } else {
      setCurrentView('tasks')
    }
  }

  const handleProjectSelect = (projectId: string) => {
    setCurrentProjectId(projectId)
    setCurrentView('tasks')
  }

  const handleProjectDetail = (projectId: string) => {
    setCurrentProjectId(projectId)
    setCurrentView('project-detail')
  }

  const handleBackFromProjectDetail = () => {
    setCurrentView('projects')
  }

  const renderContent = () => {
    switch (currentView) {
      case 'projects':
        return (
          <ProjectsPage
            onProjectSelect={handleProjectSelect}
            onProjectDetail={handleProjectDetail}
          />
        )
      case 'project-detail':
        return currentProjectId ? (
          <ProjectDetail
            projectId={currentProjectId}
            onBack={handleBackFromProjectDetail}
          />
        ) : null
      case 'tasks':
      default:
        return (
          <Tasks projectId={currentProjectId} onTabChange={handleTabChange} />
        )
    }
  }

  return (
    <>
      {/* 背景壁纸层 */}
      {wallpaperSettings.enabled && wallpaperSettings.currentUrl && (
        <div
          className="fixed inset-0 z-0"
          style={{
            backgroundImage: `url(${wallpaperSettings.currentUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: `blur(${wallpaperSettings.blur}px) brightness(${wallpaperSettings.brightness})`,
            transform: 'scale(1.1)', // 放大以避免边缘模糊出现白边
          }}
        />
      )}

      <Layout className="relative z-10 flex flex-col size-full bg-transparent!">
        <Header className="bg-linear-[135deg,#6253e1,#04befe]!">
          <div className="flex justify-between items-center h-full leading-none">
            <div
              className={`font-bold text-white ${isSmallScreen ? 'text-lg' : 'text-2xl'}`}
            >
              TaskFlow
            </div>
            <div className="flex-1 flex justify-end gap-3">
              {/* 项目选择器：大屏模式显示在中间，小屏模式显示在右侧 */}
              {userLoggedIn && currentView === 'project-detail' && (
                <div className="flex items-center">
                  <ProjectSelector
                    currentProjectId={currentProjectId}
                    onProjectChange={setCurrentProjectId}
                  />
                </div>
              )}
              {/* 用户信息和通知 */}
              <div className="flex items-center gap-3">
                {userLoggedIn && <InviteNotification />}
                <UserInfo onLogin={handleLogin} />
              </div>
            </div>
          </div>
        </Header>
        <Content className="flex-1 overflow-y-auto bg-transparent!">
          {renderContent()}
        </Content>
        {/* <Footer className="text-center bg-black!">Footer</Footer> */}
        <MyLoginGUI
          isLogin={shouldShowLogin}
          onLoginSuccess={handleClose}
          onClose={handleClose}
        />
      </Layout>
    </>
  )
}
