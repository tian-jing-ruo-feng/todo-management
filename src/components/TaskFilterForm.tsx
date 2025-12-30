import { Form, Select, Input, Button } from 'antd'
import { useEffect, useState } from 'react'
import {
  statusRepository,
  priorityRepository,
  groupRepository,
} from '@/utils/repositories'
import type { Status } from '@/types/Status'
import type { Priority } from '@/types/Priority'
import type { Group } from '@/types/Group'

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

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <Form
        form={form}
        layout="inline"
        onValuesChange={handleValuesChange}
        className="flex-wrap gap-2"
      >
        <Form.Item name="status" label="状态">
          <Select
            allowClear
            placeholder="全部状态"
            style={{ width: 150 }}
            options={statusList.map((s) => ({ label: s.name, value: s.id }))}
          />
        </Form.Item>
        <Form.Item name="priority" label="优先级">
          <Select
            allowClear
            placeholder="全部优先级"
            style={{ width: 120 }}
            options={priorityList.map((p) => ({ label: p.name, value: p.id }))}
          />
        </Form.Item>
        <Form.Item name="group" label="分组">
          <Select
            allowClear
            placeholder="全部分组"
            style={{ width: 150 }}
            options={groupList.map((g) => ({ label: g.name, value: g.id }))}
          />
        </Form.Item>
        <Form.Item name="keyword" label="任务名称">
          <Input allowClear placeholder="搜索任务" style={{ width: 200 }} />
        </Form.Item>
        <Form.Item>
          <Button onClick={handleReset}>重置</Button>
        </Form.Item>
      </Form>
    </div>
  )
}
