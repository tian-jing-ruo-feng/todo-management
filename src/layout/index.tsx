import { Layout } from 'antd'
import Tasks from '../pages/tasks'
import { MyLoginGUI } from './Login'
import UserInfo from './UserInfo'
const {
  Header,
  // Footer,
  Content,
} = Layout

export default function PageLayout() {
  return (
    <Layout className="flex flex-col size-full">
      <Header className="bg-linear-[135deg,#6253e1,#04befe]!">
        <UserInfo />
      </Header>
      <Content className="flex-1 overflow-y-auto">
        <Tasks />
      </Content>
      {/* <Footer className="text-center bg-black!">Footer</Footer> */}
      <MyLoginGUI />
    </Layout>
  )
}
