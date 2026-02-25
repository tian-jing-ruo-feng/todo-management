import { Layout, message } from 'antd'
import { useEffect, useState } from 'react'
import { initConfigData } from '@/utils/initConfigData'
import { useUser } from '@/hooks/useUser'
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
    <Layout className="flex flex-col size-full">
      <Header className="bg-linear-[135deg,#6253e1,#04befe]!">
        <div className="flex justify-between items-center h-full leading-none">
          <div className="font-bold text-2xl text-white">TaskFlow</div>
          <div className="flex-1 flex justify-end">
            <div className="flex items-center gap-4">
              {userLoggedIn && currentView === 'project-detail' && (
                <ProjectSelector
                  currentProjectId={currentProjectId}
                  onProjectChange={setCurrentProjectId}
                />
              )}
            </div>
            <div className="flex items-center gap-3">
              {userLoggedIn && <InviteNotification />}
              <UserInfo onLogin={handleLogin} />
            </div>
          </div>
        </div>
      </Header>
      <Content className="flex-1 overflow-y-auto">{renderContent()}</Content>
      {/* <Footer className="text-center bg-black!">Footer</Footer> */}
      <MyLoginGUI
        isLogin={shouldShowLogin}
        onLoginSuccess={handleClose}
        onClose={handleClose}
      />
    </Layout>
  )
}
