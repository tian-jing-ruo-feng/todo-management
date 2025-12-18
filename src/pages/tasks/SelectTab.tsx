import {
  ClockCircleOutlined,
  TableOutlined,
  ToTopOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Button, Card } from 'antd'

const buttons = [
  // 优先级视图

  {
    title: '优先级视图',
    key: 'priority',
    icon: <ToTopOutlined />,
    isActive: true,
  },

  {
    title: '看板视图',
    key: 'kanban',
    icon: <TableOutlined />,
    isActive: false,
  },

  {
    title: '时间视图',
    key: 'time',
    icon: <ClockCircleOutlined />,
    isActive: false,
  },

  {
    title: '负责人视图',
    key: 'assignee',
    icon: <UserOutlined />,
    isActive: false,
  },
]
export default function SelectTab() {
  return (
    <Card>
      <ul className="flex space-x-4">
        {buttons.map((item) => (
          <li key={item.key}>
            <Button
              size="large"
              type={item.isActive ? 'primary' : 'default'}
              icon={item.icon}
            >
              {item.title}
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  )
}
