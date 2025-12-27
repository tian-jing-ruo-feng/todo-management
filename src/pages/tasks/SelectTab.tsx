import {
  ClockCircleOutlined,
  TableOutlined,
  ToTopOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Button, Card } from 'antd'
import { useEffect, useState } from 'react'

export interface ButtonItem {
  title: string
  key: string
  icon: React.ReactNode
  isActive: boolean
}

export interface SelectTabProps {
  onChange: (item: ButtonItem) => void
}

export default function SelectTab(props: SelectTabProps) {
  const [buttons, setButtons] = useState<ButtonItem[]>([
    // 优先级视图
    // {
    //   title: '优先级视图',
    //   key: 'priority',
    //   icon: <ToTopOutlined />,
    //   isActive: false,
    // },

    {
      title: '看板视图',
      key: 'kanban',
      icon: <TableOutlined />,
      isActive: true,
    },

    // {
    //   title: '时间视图',
    //   key: 'time',
    //   icon: <ClockCircleOutlined />,
    //   isActive: false,
    // },

    // {
    //   title: '负责人视图',
    //   key: 'assignee',
    //   icon: <UserOutlined />,
    //   isActive: false,
    // },
  ])

  const handleClick = (ind: number) => () => {
    buttons.forEach((item, index) => {
      item.isActive = index === ind
    })
    setButtons([...buttons])
    props.onChange(buttons[ind])
  }

  // 初始化时设置第一个按钮为激活状态
  useEffect(() => {
    if (props.onChange) {
      props.onChange(buttons[0])
    }
  }, [])
  return (
    <Card>
      <ul className="flex space-x-4">
        {buttons.map((item, ind) => (
          <li key={item.key} onClick={handleClick(ind)}>
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
