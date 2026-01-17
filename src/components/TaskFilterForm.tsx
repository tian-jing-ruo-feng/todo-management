import type { Group } from '@/types/Group'
import type { Priority } from '@/types/Priority'
import type { Status } from '@/types/Status'
import {
  groupRepository,
  priorityRepository,
  statusRepository,
} from '@/utils/repositories'
import {
  DownloadOutlined,
  PlusOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import { Button, Form, Input, Select, Upload, message } from 'antd'
import dayjs from 'dayjs'
import { useCallback, useEffect, useState } from 'react'
import type { Task } from '../types/Task'
import { downloadFile } from '../utils/common'
import { getAllTasks, getTaskById, saveTask } from '../utils/db'

interface TaskFilterFormProps {
  visible: boolean
  onFilterChange: (filters: TaskFilterValues) => void
  onReset: () => void
  onUploadSuccess: () => void
  onAddTask?: (columnId?: string) => void
}

export interface TaskFilterValues {
  status?: string
  priority?: string
  group?: string
  keyword?: string
}

export default function TaskFilterForm({
  visible,
  onFilterChange,
  onReset,
  onUploadSuccess,
  onAddTask,
}: TaskFilterFormProps) {
  const [form] = Form.useForm()
  const [statusList, setStatusList] = useState<Status[]>([])
  const [priorityList, setPriorityList] = useState<Priority[]>([])
  const [groupList, setGroupList] = useState<Group[]>([])
  const [isExporting, setIsExporting] = useState(false)
  // 导入相关
  const [uploading, setUploading] = useState(false)

  // 加载状态数据
  const loadStatusData = async () => {
    try {
      const statuses = await statusRepository.getAll()
      setStatusList(statuses)
    } catch (error) {
      console.error('加载状态数据失败:', error)
    }
  }

  // 加载优先级数据
  const loadPriorityData = async () => {
    try {
      const priorities = await priorityRepository.getAll()
      setPriorityList(priorities)
    } catch (error) {
      console.error('加载优先级数据失败:', error)
    }
  }

  // 加载分组数据
  const loadGroupData = async () => {
    try {
      const groups = await groupRepository.getAll()
      setGroupList(groups)
    } catch (error) {
      console.error('加载分组数据失败:', error)
    }
  }
  // 处理过滤变化
  const handleValuesChange = useCallback(() => {
    const values = form.getFieldsValue()
    onFilterChange(values)
  }, [form, onFilterChange])

  const loadFilterOptions = useCallback(async () => {
    try {
      // 预加载过滤选项数据
      await Promise.all([loadStatusData(), loadPriorityData(), loadGroupData()])
      handleValuesChange()
    } catch (error) {
      console.error('预加载过滤选项数据失败:', error)
    }
  }, [handleValuesChange])

  useEffect(() => {
    if (visible) {
      loadFilterOptions()
    }
  }, [visible, loadFilterOptions])

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
    downloadFile(url, fileName)
    setIsExporting(false)
  }

  // 上传前验证
  const beforeUpload = (file: File) => {
    const isJson =
      file.type === 'application/json' || file.name.endsWith('.json')
    if (!isJson) {
      message.error('只能上传JSON文件')
      return Upload.LIST_IGNORE
    }
    const isLt10M = file.size / 1024 / 1024 < 10
    if (!isLt10M) {
      message.error('文件大小不能超过10MB')
      return Upload.LIST_IGNORE
    }
    return true
  }

  const handleImport = async (file: File) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const content = e.target?.result
      if (typeof content === 'string') {
        try {
          setUploading(true)
          const tasks = JSON.parse(content)
          // 处理导入的任务数据
          console.log(tasks, '<<<<< tasks')
          // 可以在这里添加导入逻辑
          let successCount = 0
          for (const task of tasks) {
            const taskItem = task as unknown as Task
            if (
              taskItem &&
              typeof taskItem.id === 'string' &&
              taskItem.id.startsWith('task_')
            ) {
              // 检查是否已存在
              const exists = await getTaskById(taskItem.id)
              if (!exists) {
                await saveTask(taskItem)
                successCount++
              }
            }
          }

          if (successCount > 0) {
            message.success(`成功导入 ${successCount} 条数据`)
            onUploadSuccess()
          } else {
            message.warning('没有导入新数据，可能数据已存在或格式不正确')
          }
        } catch (error) {
          console.error('文件解析失败', error)
          message.error('JSON文件解析失败，请检查文件格式')
        } finally {
          setUploading(false)
        }
      }
    }
    reader.readAsText(file)
  }
  return (
    visible && (
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
                  <span style={{ color: priority.color }}>●</span>{' '}
                  {priority.name}
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
            <div className="flex gap-2">
              {/* 导出按钮 */}
              <Button
                loading={isExporting}
                type="primary"
                onClick={handleExport}
                icon={<DownloadOutlined />}
              >
                导出
              </Button>
              {/* 导入按钮 */}
              <Upload
                accept=".json"
                showUploadList={false}
                beforeUpload={beforeUpload}
                customRequest={({ file }) => handleImport(file as File)}
                disabled={uploading}
                maxCount={1}
              >
                <Button icon={<UploadOutlined />} loading={uploading}>
                  导入JSON
                </Button>
              </Upload>
              <Button
                type="primary"
                disabled={!statusList || statusList.length === 0}
                icon={<PlusOutlined />}
                onClick={() => onAddTask?.()}
                className="w-full shadow-md hover:shadow-lg transition-all duration-300"
              >
                添加任务
              </Button>
            </div>
          </Form.Item>
        </Form>
      </div>
    )
  )
}
