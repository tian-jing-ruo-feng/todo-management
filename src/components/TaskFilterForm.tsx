import type { Group } from '@/types/Group'
import type { Priority } from '@/types/Priority'
import type { Status } from '@/types/Status'
import {
  groupRepository,
  priorityRepository,
  statusRepository,
} from '@/utils/repositories'
import { DownloadOutlined } from '@ant-design/icons'
import { Button, Form, Input, Select } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { getAllTasks } from '../utils/db'

interface TaskFilterFormProps {
  onFilterChange: (filters: TaskFilterValues) => void
  onReset: () => void
}

export interface TaskFilterValues {
  status?: string
  priority?: string
  group?: string
  keyword?: string
}

export default function TaskFilterForm({
  onFilterChange,
  onReset,
}: TaskFilterFormProps) {
  const [form] = Form.useForm()
  const [statusList, setStatusList] = useState<Status[]>([])
  const [priorityList, setPriorityList] = useState<Priority[]>([])
  const [groupList, setGroupList] = useState<Group[]>([])
  const [isExporting, setIsExporting] = useState(false)

  // 加载状态数据
  useEffect(() => {
    const loadStatusData = async () => {
      try {
        const statuses = await statusRepository.getAll()
        setStatusList(statuses)
      } catch (error) {
        console.error('加载状态数据失败:', error)
      }
    }
    loadStatusData()
  }, [])

  // 加载优先级数据
  useEffect(() => {
    const loadPriorityData = async () => {
      try {
        const priorities = await priorityRepository.getAll()
        setPriorityList(priorities)
      } catch (error) {
        console.error('加载优先级数据失败:', error)
      }
    }
    loadPriorityData()
  }, [])

  // 加载分组数据
  useEffect(() => {
    const loadGroupData = async () => {
      try {
        const groups = await groupRepository.getAll()
        setGroupList(groups)
      } catch (error) {
        console.error('加载分组数据失败:', error)
      }
    }
    loadGroupData()
  }, [])

  // 处理过滤变化
  const handleValuesChange = () => {
    const values = form.getFieldsValue()
    console.log(values, 'form values')
    onFilterChange(values)
  }

  // 重置过滤
  const handleReset = () => {
    form.resetFields()
    onReset()
  }

  const handleExport = async () => {
    setIsExporting(true)
    // 导出任务列表
    const allTasks = await getAllTasks()
    // 实现导出json文件功能
    // 导出文件命名：任务列表-YYYY-MM-DD-HH-mm-ss.json
    const fileName = `任务列表-${dayjs().format('YYYY-MM-DD-HH-mm-ss')}.json`
    const blob = new Blob([JSON.stringify(allTasks)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)
    // 移除link
    link.remove()
    setIsExporting(false)
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <Form
        form={form}
        layout="inline"
        onValuesChange={handleValuesChange}
        className="flex-wrap gap-2"
      >
        <Form.Item name="status" label="状态">
          <Select allowClear placeholder="全部状态" style={{ width: 150 }}>
            {statusList.map((status) => (
              <Select.Option key={status.id} value={status.id}>
                <span style={{ color: status.color }}>●</span> {status.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="priority" label="优先级">
          <Select allowClear placeholder="全部优先级" style={{ width: 120 }}>
            {priorityList.map((priority) => (
              <Select.Option key={priority.id} value={priority.id}>
                <span style={{ color: priority.color }}>●</span> {priority.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="group" label="分组">
          <Select allowClear placeholder="全部分组" style={{ width: 150 }}>
            {groupList.map((group) => (
              <Select.Option key={group.id} value={group.id}>
                <span style={{ color: group.color }}>●</span> {group.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="keyword" label="任务名称">
          <Input allowClear placeholder="搜索任务" style={{ width: 200 }} />
        </Form.Item>
        <Form.Item>
          <Button onClick={handleReset}>重置</Button>
        </Form.Item>
        <Form.Item>
          {/* 导出按钮 */}
          <Button
            loading={isExporting}
            type="primary"
            onClick={handleExport}
            icon={<DownloadOutlined />}
          >
            导出
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}
