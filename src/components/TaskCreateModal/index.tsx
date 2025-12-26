import type { Task } from '@/types/Task'
import { Form, Input, Modal, Select } from 'antd'
import { useState } from 'react'
import RichTextEditor from '../RichTextEditor'

interface TaskCreateModalProps {
  visible: boolean
  defaultStatus?: string
  onClose: () => void
  onSave: (task: Task) => void
}

export default function TaskCreateModal({
  visible,
  defaultStatus = 'todo',
  onClose,
  onSave,
}: TaskCreateModalProps) {
  const [form] = Form.useForm()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const handleOk = async () => {
    try {
      setLoading(true)
      const values = await form.validateFields()

      const newTask: Task = {
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: values.name,
        status: values.status || defaultStatus,
        priority: values.priority || 'medium',
        content,
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString(),
        isRemoved: false,
        isTop: false,
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
          priority: 'medium',
        }}
      >
        <Form.Item
          name="name"
          label="任务名称"
          rules={[{ required: true, message: '请输入任务名称' }]}
        >
          <Input placeholder="输入任务名称" />
        </Form.Item>

        <Form.Item name="status" label="状态">
          <Select placeholder="选择任务状态">
            <Select.Option value="todo">待办</Select.Option>
            <Select.Option value="in-progress">进行中</Select.Option>
            <Select.Option value="review">待审核</Select.Option>
            <Select.Option value="done">已完成</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="priority" label="优先级">
          <Select placeholder="选择优先级">
            <Select.Option value="low">低</Select.Option>
            <Select.Option value="medium">中</Select.Option>
            <Select.Option value="high">高</Select.Option>
            <Select.Option value="urgent">紧急</Select.Option>
          </Select>
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
