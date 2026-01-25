import { Layout } from 'antd'
import { useState } from 'react'
import Tasks from '../pages/tasks'
import { MyLoginGUI } from './Login'
import UserInfo from './UserInfo'
const {
  Header,
  // Footer,
  Content,
} = Layout
export default function PageLayout() {
  const [isLogin, setIsLogin] = useState(false)

  const login = () => {
    setIsLogin(true)
  }

  const handleClose = () => {
    setIsLogin(false)
  }

  return (
    <Layout className="flex flex-col size-full">
      <Header className="bg-linear-[135deg,#6253e1,#04befe]!">
        <UserInfo login={login} />
      </Header>
      <Content className="flex-1 overflow-y-auto">
        <Tasks />
      </Content>
      {/* <Footer className="text-center bg-black!">Footer</Footer> */}
      <MyLoginGUI
        isLogin={isLogin}
        onLoginSuccess={handleClose}
        onClose={handleClose}
      />
    </Layout>
  )
}
