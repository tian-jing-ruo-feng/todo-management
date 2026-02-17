import { Layout, message } from 'antd'
import { useEffect, useState } from 'react'
import { runMigrationIfNeeded } from '@/utils/migration'
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
  const [isLogin, setIsLogin] = useState(false)
  const [migrationComplete, setMigrationComplete] = useState(false)
  const [currentProjectId, setCurrentProjectId] = useState<string>()
  const [currentView, setCurrentView] = useState<ViewType>('tasks')
  const { isLoggedIn: userLoggedIn } = useUser()

  const login = () => {
    setIsLogin(true)
  }

  const handleClose = () => {
    setIsLogin(false)
  }

  // 用户登录后执行数据迁移
  useEffect(() => {
    if (userLoggedIn && !migrationComplete) {
      runMigrationIfNeeded()
        .then(() => {
          setMigrationComplete(true)
        })
        .catch((error) => {
          console.error('数据迁移失败:', error)
          message.error('数据迁移失败，请刷新页面重试')
        })
    }
  }, [userLoggedIn, migrationComplete])

  const handleTabChange = (item: ButtonItem) => {
    if (item.key === 'projects') {
      setCurrentView('projects')
    } else {
      setCurrentView('tasks')
    }
  }

  const handleManageProjects = () => {
    setCurrentView('projects')
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
          <div className="flex items-center gap-4">
            {userLoggedIn && currentView === 'tasks' && (
              <ProjectSelector
                currentProjectId={currentProjectId}
                onProjectChange={setCurrentProjectId}
                onManageProjects={handleManageProjects}
              />
            )}
            {userLoggedIn && currentView === 'project-detail' && (
              <div className="text-white font-bold text-lg">项目详情</div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {userLoggedIn && <InviteNotification />}
            <UserInfo login={login} />
          </div>
        </div>
      </Header>
      <Content className="flex-1 overflow-y-auto">{renderContent()}</Content>
      {/* <Footer className="text-center bg-black!">Footer</Footer> */}
      <MyLoginGUI
        isLogin={isLogin}
        onLoginSuccess={handleClose}
        onClose={handleClose}
      />
    </Layout>
  )
}
