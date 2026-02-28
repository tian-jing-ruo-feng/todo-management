import {
  CheckCircleOutlined,
  FlagOutlined,
  AppstoreOutlined,
} from '@ant-design/icons'
import { ConfigType } from '@/types/config'
import { Button, Grid } from 'antd'

export interface ConfigTabsProps {
  activeKey: string
  onChange: (key: string) => void
}

const tabs = [
  {
    key: ConfigType.Status,
    label: '状态管理',
    shortLabel: '状态',
    icon: <CheckCircleOutlined />,
  },
  {
    key: ConfigType.Priority,
    label: '优先级管理',
    shortLabel: '优先级',
    icon: <FlagOutlined />,
  },
  {
    key: ConfigType.Group,
    label: '分组管理',
    shortLabel: '分组',
    icon: <AppstoreOutlined />,
  },
]

export default function ConfigTabs({ activeKey, onChange }: ConfigTabsProps) {
  const screens = Grid.useBreakpoint()
  const isSmallScreen = !screens.md // <768px

  return (
    <div className={`flex gap-2 ${isSmallScreen ? 'flex-wrap' : ''}`}>
      {tabs.map((tab) => (
        <Button
          key={tab.key}
          type={activeKey === tab.key ? 'primary' : 'default'}
          size={isSmallScreen ? 'middle' : 'large'}
          icon={tab.icon}
          onClick={() => onChange(tab.key)}
        >
          {isSmallScreen ? tab.shortLabel : tab.label}
        </Button>
      ))}
    </div>
  )
}
