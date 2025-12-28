import {
  CheckCircleOutlined,
  FlagOutlined,
  AppstoreOutlined,
} from '@ant-design/icons'
import { ConfigType } from '@/types/config'
import { Button } from 'antd'

export interface ConfigTabsProps {
  activeKey: string
  onChange: (key: string) => void
}

const tabs = [
  {
    key: ConfigType.Status,
    label: '状态管理',
    icon: <CheckCircleOutlined />,
  },
  {
    key: ConfigType.Priority,
    label: '优先级管理',
    icon: <FlagOutlined />,
  },
  {
    key: ConfigType.Group,
    label: '分组管理',
    icon: <AppstoreOutlined />,
  },
]

export default function ConfigTabs({ activeKey, onChange }: ConfigTabsProps) {
  return (
    <div className="mb-4 flex gap-2">
      {tabs.map((tab) => (
        <Button
          key={tab.key}
          type={activeKey === tab.key ? 'primary' : 'default'}
          size="large"
          icon={tab.icon}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </Button>
      ))}
    </div>
  )
}
