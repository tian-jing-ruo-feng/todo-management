import type { Task } from '@/types/Task'
import { Form, Input, Modal, Select, Switch } from 'antd'
import { useEffect, useState } from 'react'
import { useFilterOptions } from '../../pages/kanban/hooks/useFilterOptions'
import DateTimePicker from '../DateTimePicker'
import MemberSelector from '../MemberSelector'
import RichTextEditor from '../RichTextEditor'

interface TaskCreateModalProps {
  visible: boolean
  defaultStatus?: string
  projectId?: string
  onClose: () => void
  onSave: (task: Task) => void
}

export default function TaskCreateModal({
  visible,
  defaultStatus = '',
  projectId,
  onClose,
  onSave,
}: TaskCreateModalProps) {
  const [form] = Form.useForm<Task>()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const { statusList, priorityList, groupList } = useFilterOptions(projectId)

  // 设置默认值
  useEffect(() => {
    if (
      visible &&
      statusList &&
      statusList.length > 0 &&
      priorityList &&
      priorityList.length > 0
    ) {
      form.setFieldsValue({
        status: defaultStatus || statusList[0].id,
        priority: priorityList[0].id,
      })
    }
  }, [visible, statusList, priorityList, defaultStatus, form])

  const handleOk = async () => {
    try {
      setLoading(true)
      const values = await form.validateFields()

      const newTask: Task = {
        id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        name: values.name,
        projectId: projectId || '',
        status: values.status || defaultStatus,
        priority: values.priority || '',
        group: values.group || [],
        content,
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString(),
        isRemoved: false,
        isTop: values.isTop || false,
        expectStartTime: values.expectStartTime || undefined,
        expectEndTime: values.expectEndTime || undefined,
        sort: 0, // 默认排序值，后续会在KanbanBoard中重新计算
        assignee: values.assignee,
      }

      onSave(newTask)
      form.resetFields()
      setContent('')
      onClose()
    } catch (error) {
      console.error('创建任务失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    setContent('')
    onClose()
  }

  return (
    <Modal
      title="新增任务"
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      width={800}
      okText="创建"
      cancelText="取消"
      confirmLoading={loading}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          status: defaultStatus,
          priority: '',
          isTop: false,
        }}
      >
        <Form.Item
          name="name"
          label="任务名称"
          rules={[{ required: true, message: '请输入任务名称' }]}
        >
          <Input placeholder="输入任务名称" />
        </Form.Item>

        <Form.Item
          name="status"
          label="状态"
          rules={[{ required: true, message: '请选择任务状态' }]}
        >
          <Select placeholder="选择任务状态">
            {statusList?.map((status) => (
              <Select.Option key={status.id} value={status.id}>
                <span style={{ color: status.color }}>●</span> {status.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="priority"
          label="优先级"
          rules={[{ required: true, message: '请选择优先级' }]}
        >
          <Select placeholder="选择优先级">
            {priorityList?.map((priority) => (
              <Select.Option key={priority.id} value={priority.id}>
                <span style={{ color: priority.color }}>●</span> {priority.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="expectStartTime"
          label="期望开始时间"
          rules={[{ required: true, message: '请选择期望开始时间' }]}
        >
          <DateTimePicker placeholder="选择期望开始时间" />
        </Form.Item>

        <Form.Item
          name="expectEndTime"
          label="期望结束时间"
          rules={[{ required: true, message: '请选择期望结束时间' }]}
        >
          <DateTimePicker placeholder="选择期望结束时间" />
        </Form.Item>

        <Form.Item name="group" label="分组">
          <Select mode="multiple" placeholder="选择任务分组" allowClear>
            {groupList?.map((group) => (
              <Select.Option key={group.id} value={group.id}>
                <span style={{ color: group.color }}>●</span> {group.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="assignee" label="负责人">
          <MemberSelector projectId={projectId} />
        </Form.Item>

        <Form.Item name="isTop" label="是否置顶" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item label="任务内容">
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="输入任务详细内容..."
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
