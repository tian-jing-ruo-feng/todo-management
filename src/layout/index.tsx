import { Layout } from 'antd'
const { Header, Footer, Content } = Layout
import Tasks from '../pages/tasks'

export default function PageLayout() {
  return (
    <Layout className="flex flex-col size-full">
      <Header>Header</Header>
      <Content className="flex-1 overflow-y-auto">
        <Tasks />
      </Content>
      <Footer>Footer</Footer>
    </Layout>
  )
}
