import type { Task } from '@/types/Task'
import { Form, Input, Modal, Select } from 'antd'
import { useState } from 'react'
import RichTextEditor from '../RichTextEditor'

interface TaskDetailModalProps {
  visible: boolean
  task: Task | null
  onClose: () => void
  onSave: (task: Task) => void
}

export default function TaskDetailModal({
  visible,
  task,
  onClose,
  onSave,
}: TaskDetailModalProps) {
  const [form] = Form.useForm()
  const [content, setContent] = useState(task?.content || '')

  const handleOk = () => {
    form.validateFields().then((values) => {
      if (task) {
        const updatedTask: Task = {
          ...task,
          ...values,
          content,
          updateTime: new Date().toISOString(),
        }
        onSave(updatedTask)
        onClose()
      }
    })
  }

  const handleCancel = () => {
    form.resetFields()
    setContent(task?.content || '')
    onClose()
  }

  return (
    <Modal
      title="编辑任务详情"
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      width={800}
      okText="保存"
      cancelText="取消"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          ...task,
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
          <Select>
            <Select.Option value="todo">待办</Select.Option>
            <Select.Option value="in-progress">进行中</Select.Option>
            <Select.Option value="review">待审核</Select.Option>
            <Select.Option value="done">已完成</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="priority" label="优先级">
          <Select>
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
