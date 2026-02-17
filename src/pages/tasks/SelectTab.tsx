import {
  SettingOutlined,
  TableOutlined,
  ProjectOutlined,
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
  showProjectTab?: boolean
}

export default function SelectTab({
  onChange,
  showProjectTab = false,
}: SelectTabProps) {
  const baseButtons: ButtonItem[] = [
    {
      title: '看板视图',
      key: 'kanban',
      icon: <TableOutlined />,
      isActive: true,
    },
    {
      title: '优先级视图',
      key: 'priority',
      icon: <TableOutlined />,
      isActive: false,
    },
    {
      title: '配置管理',
      key: 'config',
      icon: <SettingOutlined />,
      isActive: false,
    },
  ]

  const projectButton: ButtonItem = {
    title: '项目管理',
    key: 'projects',
    icon: <ProjectOutlined />,
    isActive: false,
  }

  const [buttons, setButtons] = useState<ButtonItem[]>(
    showProjectTab ? [projectButton, ...baseButtons] : baseButtons
  )

  const handleClick = (ind: number) => () => {
    const newButtons = buttons.map((item, index) => ({
      ...item,
      isActive: index === ind,
    }))
    setButtons(newButtons)
    onChange(newButtons[ind])
  }

  // 初始化时设置第一个按钮为激活状态
  useEffect(() => {
    if (onChange && buttons.length > 0) {
      const initialButtons = buttons.map((item, index) => ({
        ...item,
        isActive: index === 0,
      }))
      setButtons(initialButtons)
      onChange(initialButtons[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <Card classNames={{ body: 'p-3!' }}>
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
