import { Layout } from 'antd'
import Tasks from '../pages/tasks'
const { Header, Footer, Content } = Layout

export default function PageLayout() {
  return (
    <Layout className="flex flex-col size-full">
      <Header>Header</Header>
      <Content className="flex-1 overflow-y-auto">
        <Tasks />
      </Content>
      <Footer className="bg-black!">Footer</Footer>
    </Layout>
  )
}
